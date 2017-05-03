var async = require('async');
var configs = require('./configs');
var IOSFetcher = require('./iosFetcher');
var AndroidScraper = require('./androidScraper');
var AndroidFetcher = require('./androidFetcher');
var ReviewJSONDB = require('./reviewJSONDB');
var reviewDB = new ReviewJSONDB();
var slackLibrary = require('slack-node');
var slack = new slackLibrary();

function checkForNewReviews(config, completion) {
	var allReviews = [];
	var androidReviewCompletion = function (androidReviews) {
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
			addReviewsToDB(config, allReviews, callback);
		},
		function (callback) {
			completion();
			callback();
		}
	]);
}

function fetchIOSReviews(config, callback) {
	var fetcher = new IOSFetcher(config);
	console.log('Fetching iOS reviews');
	fetcher.fetchReviews(function (reviews) {
		console.log('Fetched: ' + reviews.length + ' iOS reviews');
		callback(reviews);
	});
}

function scrapeAndroidReviews(config, callback) {
	var androidScraper = new AndroidScraper(config);
	console.log('Fetching Android reviews');
	androidScraper.fetchReviews(function (androidReviews) {
		console.log('Fetched: ' + androidReviews.length + ' Android reviews');
		callback(androidReviews);
	});
}

function fetchAndroidReviews(config, callback) {
	var androidFetcher = new AndroidFetcher(config);
	console.log('Fetching Android reviews');
	androidFetcher.fetchReviews(function (androidReviews) {
		console.log('Fetched: ' + androidReviews.length + ' Android reviews');
		callback(androidReviews);
	});
}

function addReviewsToDB(config, reviews, callback) {
	console.time('Storing data in sdb');
	reviewDB.addNewReviews(config, reviews, function (cleanReviews) {
		console.timeEnd('Storing data in sdb');
		shareOnSlack(config, cleanReviews, callback);
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

	var webhookUri = config.slackHook;
	if (reviews.length === 0) {
		console.log('There are no new reviews to post to slack');
		callback();
		return;
	}

	console.log('Sharing ' + reviews.length + ' on slack');
	var text = '';
	reviews.forEach(function (entry) {
		if (!entry.showOnSlack) {
			text += entry.createReviewSlackText();
		}
	});

	if (!text) {
		console.log('Nothing to post to Slack: ');
		callback();
		return;
	}
	console.time('Posting to slack');
	slack.setWebhook(webhookUri);
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
		callback();
	});
}

function start(completion) {
	console.time('Total time');
	var allAppConfigs = configs.allConfigs();
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
