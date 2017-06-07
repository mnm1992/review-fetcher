const gplay = require('google-play-scraper');
const async = require('async');
const androidScrapedParser = require('./androidScrapedParser');
const LocaleHelper = require('./localeHelper');
const localeHelper = new LocaleHelper();

function fetchReviewsForLanguage(appId, languageCode, language, callback) {
	var review_array = [];
	var more = true;
	var page = 0;
	var completion = function (reviews, moreReviews) {
		page += 1;
		more = moreReviews;
		review_array = review_array.concat(reviews);
		if (more) {
			fetchReviewSet(appId, languageCode, language, page, completion);
		} else {
			callback(null, review_array);
		}
	};
	fetchReviewSet(appId, languageCode, language, page, completion);
}

function fetchReviewSet(appId, languageCode, language, page, completion) {
	gplay.reviews({
		appId: appId,
		page: page,
		lang: languageCode,
		cache: false
	}).then(function (apps) {
		var count = apps.length;
		if (count === 0) {
			completion([], false);
			return;
		}
		androidScrapedParser.parse(appId, apps, languageCode, language, function(reviewArray, abort, more){
			completion(reviewArray, (!abort && more));
		});
	}).catch(function (e) {
		console.error('There was an error fetching the reviews!' + " " + e);
		completion([], false);
	});
}

module.exports = class AndroidScraper {
	constructor(config) {
		this.config = config;
	}

	fetchRatings(callback) {
		gplay.app({
			appId: this.config.androidId,
			cache: false
		}).then(function (app) {
			const numberOfReviews = parseInt(app.reviews);
			const averageRating = parseFloat(app.score);
			callback(numberOfReviews, averageRating, app.histogram);
		}).catch(function (error) {
			console.log(error);
			callback(0, 0);
		});
	}

	fetchReviews(completion) {
		const self = this;
		var review_array = [];
		const functions = [];
		this.config.languages.forEach(function (language) {
			functions.push(function (callback) {
				localeHelper.getLanguage(language, function (languageHeader) {
					fetchReviewsForLanguage(self.config.androidId, language, languageHeader, callback);
				});
			});
		});
		async.parallel(functions, function (err, results) {
			var review_array = [];
			if (results && results.length > 0) {
				results.forEach(function (result) {
					review_array = review_array.concat(result);
				});
				completion(review_array);
			} else {
				completion([]);
			}
		});
	}
};
