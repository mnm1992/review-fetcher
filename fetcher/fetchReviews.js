const async = require('async');
const configs = require('../common/configs');
const histogramCalculator = require('../common/histogramCalculator');
const reviewHelper = require('../common/reviewHelper');
const IOSFetcher = require('./iosFetcher');
const IOSRatingScraper = require('./iosRatingScraper');
const AndroidScraper = require('./androidScraper');
const AndroidRatingScraper = require('./androidRatingScraper');
const AndroidFetcher = require('./androidFetcher');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();
const SlackHelper = require('./slackHelper');

function checkForNewReviews(config, completion) {
	const iOSFetcher = new IOSFetcher(config.iOSConfig);
	const iOSScraper = new IOSRatingScraper(config.iOSConfig);
	const androidFetcher = new AndroidFetcher(config.androidConfig);
	const androidScraper = new AndroidScraper(config.androidConfig);
	const androidRatingScraper = new AndroidRatingScraper(config.androidConfig);
	async.series({
		iOSFetcher: iOSFetcher.startFetching.bind(iOSFetcher),
		iOSScraper: iOSScraper.startFetching.bind(iOSScraper),
		androidFetcher: androidFetcher.startFetching.bind(androidFetcher),
		androidScraper: androidScraper.startFetching.bind(androidScraper),
		androidRatingScraper: androidRatingScraper.startFetching.bind(androidRatingScraper)
	}, function (err, results) {
		const iOSReviewHistogram = results.iOSFetcher.histogram;
		const iOSCountryyRatingHistogram = results.iOSScraper.histogramPerCountry;
		const ratingJSON = {};
		for (var key in iOSCountryyRatingHistogram) {
			iOSReviewHistogram[key] = iOSCountryyRatingHistogram[key];
		}
		const combinedHistogram = histogramCalculator.addAllHistograms(iOSReviewHistogram);
		const averageDetails = histogramCalculator.averageFromHistogram(combinedHistogram);
		ratingJSON.histogramPerCountry = iOSReviewHistogram;
		ratingJSON.iOSHistogram = combinedHistogram;
		ratingJSON.iOSTotal = averageDetails.amount;
		ratingJSON.iOSAverage = averageDetails.average;
		ratingJSON.androidTotal = results.androidRatingScraper.total;
		ratingJSON.androidAverage = results.androidRatingScraper.average;
		ratingJSON.androidHistogram = results.androidRatingScraper.histogram;
		var reviews = [];
		reviews = reviews.concat(results.iOSFetcher.reviews);
		reviews = reviews.concat(results.androidFetcher);
		reviews = reviews.concat(results.androidScraper);
		completion(reviews, ratingJSON);
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

function startScraping(completion) {
	console.time('Total time');
	const allAppConfigs = configs.allConfigs();
	var checkReviewsForAllConfigs = [];
	allAppConfigs.forEach(function (config) {
		if (config.androidConfig.authentication) {
			checkReviewsForAllConfigs.push(function (callback) {
				console.log(config.appName);
				const androidScraper = new AndroidScraper(config.androidConfig);
				androidScraper.fetchReviews(function (reviews) {
					addReviewsToDB(config, reviews, function (newReviews, countries, androidVersions, iosVersions) {
						callback();
					});
				});
			});
		}
	});
	async.series(checkReviewsForAllConfigs, function (err, results) {
		reviewDB.done();
		console.timeEnd('Total time');
		completion();
	});
}

function start(completion) {
	console.time('Total time');
	const allAppConfigs = configs.allConfigs();
	var checkReviewsForAllConfigs = [];
	allAppConfigs.forEach(function (config) {
		checkReviewsForAllConfigs.push(function (callback) {
			console.time('Finished ' + config.appName);
			checkForNewReviews(config, function (reviews, ratingJSON) {
				addReviewsToDB(config, reviews, function (newReviews, countries, androidVersions, iosVersions) {
					ratingJSON.androidVersions = androidVersions;
					ratingJSON.iosVersions = iosVersions;
					ratingJSON.countries = countries;
					addRatingsToDB(config, ratingJSON, function () {
						const slackHelper = new SlackHelper(config.slackConfig, configs.isLocalHost());
						slackHelper.shareOnSlack(newReviews, function () {
							console.timeEnd('Finished ' + config.appName);
							callback();
						});
					});
				});
			});
		});
	});

	async.series(checkReviewsForAllConfigs, function (err, results) {
		reviewDB.done();
		console.timeEnd('Total time');
		completion();
	});
}

module.exports = {
	fetchReviews: function (completion) {
		start(completion);
	},

	scrapeReviews: function (completion) {
		startScraping(completion);
	}
};
