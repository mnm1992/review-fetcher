const async = require('async');
const Configs = require('../common/configs');
const configs = new Configs();
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
const ReviewTranslator = require('./reviewTranslator');
const notifyWebsite = require('./NotifyWebsite');

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
	reviewDB.addNewReviews(config, reviews, function (newReviews, countries, androidVersions, iosVersions) {
		callback(newReviews, countries, androidVersions, iosVersions);
	});
}

function addRatingsToDB(config, ratingJSON, callback) {
	reviewDB.updateRating(config.appName, ratingJSON, function () {
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

function mergeNewReviewsAndReviewToInsert(newReviews, toInsert) {
	for (var review of newReviews) {
		var index = toInsert.indexOf(review);
		if (index !== -1) {
			toInsert[index] = review;
		}
	}
	return toInsert;
}

function start(completion) {
	console.time('Total time');
	const allAppConfigs = configs.allConfigs();
	var checkReviewsForAllConfigs = [];
	allAppConfigs.forEach(function (config) {
		checkReviewsForAllConfigs.push(function (callback) {
			console.time('Finished ' + config.appName);
			checkForNewReviews(config, function (reviews, ratingJSON) {
				console.time('Fetched all reviews from db');
				reviewDB.getAllReviews(config, function (reviewsFromDB) {
					console.timeEnd('Fetched all reviews from db');
					const countries = reviewHelper.appCountries(reviewsFromDB);
					const languages = reviewHelper.appLanguages(reviewsFromDB);
					const androidVersions = reviewHelper.appVersions(reviewsFromDB, 'android');
					const iosVersions = reviewHelper.appVersions(reviewsFromDB, 'ios');
					const cleanReviews = reviewHelper.mergeReviewsFromArrays(reviewsFromDB, reviews);
					console.log('Reviews in db: ' + (reviewsFromDB ? reviewsFromDB.length : 0));
					console.log('Reviews fetched: ' + (reviews ? reviews.length : 0));
					console.log('New reviews: ' + cleanReviews.newReviews.length);
					const reviewTranslator = new ReviewTranslator();
					reviewTranslator.translateAllReviews(cleanReviews.newReviews, (translatedNewReviews) => {
						translatedNewReviews = translatedNewReviews ? translatedNewReviews : [];
						cleanReviews.reviewsToInsert = mergeNewReviewsAndReviewToInsert(translatedNewReviews, cleanReviews.reviewsToInsert);
						cleanReviews.reviewsToUpdate = mergeNewReviewsAndReviewToInsert(translatedNewReviews, cleanReviews.reviewsToUpdate);
						cleanReviews.newReviews = translatedNewReviews;
						addReviewsToDB(config, cleanReviews, () => {
							ratingJSON.androidVersions = androidVersions;
							ratingJSON.iosVersions = iosVersions;
							ratingJSON.countries = countries;
							ratingJSON.languages = languages;
							addRatingsToDB(config, ratingJSON, () => {
								const slackHelper = new SlackHelper(config.slackConfig, configs.isLocalHost());
								slackHelper.shareOnSlack(translatedNewReviews, () => {
									if (translatedNewReviews.length > 0) {
										notifyWebsite.notify(config.appName, () => {
											console.timeEnd('Finished ' + config.appName);
											callback();
										});
									} else {
										console.timeEnd('Finished ' + config.appName);
										callback();
									}
								});
							});
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
