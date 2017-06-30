const async = require('async');
const configs = require('../common/configs');
const histogramCalculator = require('../common/histogramCalculator');
const reviewHelper = require('../common/reviewHelper');
const IOSFetcher = require('./iosFetcher');
const IOSRatingScraper = require('./iosRatingScraper');
const AndroidScraper = require('./androidScraper');
const AndroidFetcher = require('./androidFetcher');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();
const slackLibrary = require('slack-node');
const slack = new slackLibrary();

function checkForNewReviews(config, completion) {
	var allReviews = [];
	const ratingJSON = {};
	var histograms = {};

	const androidReviewCompletion = function (androidReviews) {
		if (androidReviews.length > 0) {
			allReviews = allReviews.concat(androidReviews);
		}
	};
	async.series([function (callback) {
			console.time('Fetched iOS reviews');
			fetchIOSReviews(config, function (iOSReviews, calculatedHistograms) {
				histograms = calculatedHistograms;
				if (iOSReviews.length > 0) {
					allReviews = allReviews.concat(iOSReviews);
				}
				console.timeEnd('Fetched iOS reviews');
				callback();
			});
		}, function (callback) {
			console.time('Fetched iOS ratings');
			fetchIOSRatings(config, function (scrapedhistograms) {
				for (var key in scrapedhistograms) {
					histograms[key] = scrapedhistograms[key];
				}
				const combinedHistogram = histogramCalculator.addAllHistograms(histograms);
				const averageDetails = histogramCalculator.averageFromHistogram(combinedHistogram);
				ratingJSON.histogramPerCountry = histograms;
				ratingJSON.iOSHistogram = combinedHistogram;
				ratingJSON.iOSTotal = averageDetails.amount;
				ratingJSON.iOSAverage = averageDetails.average;
				console.timeEnd('Fetched iOS ratings');
				callback();
			});
		},
		function (callback) {
			if (config.androidAuthentication) {
				console.time('Fetched Android reviews trough API');
				fetchAndroidReviews(config, function (reviews) {
					console.timeEnd('Fetched Android reviews trough API');
					androidReviewCompletion(reviews);
					callback();
				});
			} else {
				callback();
			}
		},
		function (callback) {
			if (!config.androidAuthentication) {
				console.time('Fetched Android reviews trough Scraping');
				scrapeAndroidReviews(config, function (reviews) {
					console.timeEnd('Fetched Android reviews trough Scraping');
					androidReviewCompletion(reviews);
					callback();
				});
			} else {
				callback();
			}
		},
		function (callback) {
			console.time('Fetched Android ratings trough Scraping');
			const androidScraper = new AndroidScraper(config);
			androidScraper.fetchRatings(function (total, averageRating, histogram) {
				console.timeEnd('Fetched Android ratings trough Scraping');
				ratingJSON.androidTotal = total;
				ratingJSON.androidAverage = averageRating;
				ratingJSON.androidHistogram = histogram;
				callback();
			});
		},
		function (callback) {
			addReviewsToDB(config, allReviews, function (newReviews, countries, androidVersions, iosVersions) {
				ratingJSON.androidVersions = androidVersions;
				ratingJSON.iosVersions = iosVersions;
				ratingJSON.countries = countries;
				shareOnSlack(config, newReviews, callback);
			});
		},
		function (callback) {
			addRatingsToDB(config, ratingJSON, callback);
		},
		function (callback) {
			reviewDB.done();
			completion();
			callback();
		}
	]);
}

function fetchIOSRatings(config, callback) {
	const scraper = new IOSRatingScraper(config);
	console.log('Fetching iOS reviews');
	scraper.fetchRatings(function (histogram) {
		callback(histogram);
	});
}

function fetchIOSReviews(config, callback) {
	const fetcher = new IOSFetcher(config);
	console.log('Fetching iOS reviews');
	fetcher.fetchReviews(function (reviews, histogram) {
		console.log('Fetched: ' + reviews.length + ' iOS reviews');
		callback(reviews, histogram);
	});
}

function scrapeAndroidReviews(config, callback) {
	const androidScraper = new AndroidScraper(config);
	console.log('Fetching Android reviews');
	androidScraper.fetchReviews(function (androidReviews) {
		console.log('Fetched: ' + androidReviews.length + ' Android reviews');
		callback(androidReviews);
	});
}

function fetchAndroidReviews(config, callback) {
	const androidFetcher = new AndroidFetcher(config);
	console.log('Fetching Android reviews');
	androidFetcher.fetchReviews(function (androidReviews) {
		console.log('Fetched: ' + androidReviews.length + ' Android reviews');
		callback(androidReviews);
	});
}

function addReviewsToDB(config, reviews, callback) {
	console.time('Storing data in db');
	reviewDB.addNewReviews(config, reviews, function (newReviews, countries, androidVersions, iosVersions) {
		console.timeEnd('Storing data in db');
		callback(newReviews, countries, androidVersions, iosVersions);
	});
}

function addRatingsToDB(config, ratingJSON, callback) {
	console.time('Storing ratings in db');
	reviewDB.updateRating(config.appName, ratingJSON, function () {
		console.timeEnd('Storing ratings in db');
		callback();
	});
}

function shareOnSlack(config, reviews, callback) {
	if (process.env.PORT === undefined) {
		console.log('Not posting to Slack since this is localhost');
		callback();
		return;
	}

	if (!config.slackHook || !config.slackChannel || !config.slackBot) {
		console.log('No slack hook configured for ' + config.appName);
		callback();
		return;
	}

	const webhookUri = config.slackHook;
	if (reviews.length === 0) {
		console.log('There are no new reviews to post to slack');
		callback();
		return;
	}

	slack.setWebhook(webhookUri);

	console.log('Sharing ' + reviews.length + ' on slack');
	reviews.forEach(function (entry) {
		var text = '';
		text += entry.createReviewSlackText();
		if (!text) {
			console.log('Nothing to post to Slack: ');
			return;
		}
		slack.webhook({
			channel: config.slackChannel,
			username: config.slackBot,
			text: text
		}, function (err, response) {
			if (err) {
				console.error('Error posting reviews to Slack: ' + err);
			} else {
				console.log('Succesfully posted reviews to slack');
			}
		});

	});
	callback();
}

function start(completion) {
	console.time('Total time');
	const allAppConfigs = configs.allConfigs();
	var checkReviewsForAllConfigs = [];
	allAppConfigs.forEach(function (config) {
		checkReviewsForAllConfigs.push(function (callback) {
			console.time('Finished ' + config.appName);
			checkForNewReviews(config, function () {
				console.timeEnd('Finished ' + config.appName);
				callback();
			});
		});
	});

	checkReviewsForAllConfigs.push(function (callback) {
		console.timeEnd('Total time');
		completion();
		callback();
	});

	async.series(checkReviewsForAllConfigs);
}

module.exports = {
	fetchReviews: function (completion) {
		start(completion);
	}
};
