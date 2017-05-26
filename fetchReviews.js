const async = require('async');
const configs = require('./configs');
const reviewHelper = require('./reviewHelper');
const IOSFetcher = require('./iosFetcher');
const AndroidScraper = require('./androidScraper');
const AndroidFetcher = require('./androidFetcher');
const ReviewJSONDB = require('./reviewJSONDB');
const reviewDB = new ReviewJSONDB();
const slackLibrary = require('slack-node');
const slack = new slackLibrary();

function checkForNewReviews(config, completion) {
	var allReviews = [];
	const ratingJSON = {};
	const androidReviewCompletion = function (androidReviews) {
		if (androidReviews.length > 0) {
			allReviews = allReviews.concat(androidReviews);
		}
	};
	async.series([function (callback) {
			console.time('Fetched iOS reviews');
			fetchIOSReviews(config, function (iOSReviews) {
				if (iOSReviews.length > 0) {
					allReviews = allReviews.concat(iOSReviews);
				}
				console.timeEnd('Fetched iOS reviews');
				console.time('Calculating iOS ratings');
				reviewHelper.appAverage(iOSReviews, function (total, averageRating) {
					console.timeEnd('Calculating iOS ratings');
					ratingJSON.iosTotal = total;
					ratingJSON.iosAverage = averageRating;
				});
				callback();
			});
		},
		function (callback) {
			console.time('Fetched Android reviews trough API');
			if (config.androidAuthentication) {
				fetchAndroidReviews(config, function (reviews) {
					console.timeEnd('Fetched Android reviews trough API');
					androidReviewCompletion(reviews);
					callback();
				});
			} else {
				console.timeEnd('Fetched Android reviews trough API');
				callback();
			}
		},
		function (callback) {
			console.time('Fetched Android reviews trough Scraping');
			scrapeAndroidReviews(config, function (reviews) {
				console.timeEnd('Fetched Android reviews trough Scraping');
				androidReviewCompletion(reviews);
				callback();
			});
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

function iosAverage(reviews, completion) {
	var reviewCount = 0;
	var totalScore = 0;
	reviews.forEach(function (review) {
		if (review.deviceInfo.platform === 'iOS') {
			totalScore += parseInt(review.reviewInfo.rating);
			reviewCount += 1;
		}
	});
	const averageRating = totalScore / reviewCount;
	completion(reviewCount, averageRating);
}

function fetchIOSReviews(config, callback) {
	const fetcher = new IOSFetcher(config);
	console.log('Fetching iOS reviews');
	fetcher.fetchReviews(function (reviews) {
		console.log('Fetched: ' + reviews.length + ' iOS reviews');
		callback(reviews);
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
        console.time('Posting to slack');
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
            console.timeEnd('Posting to slack');
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
