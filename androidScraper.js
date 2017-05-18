const dateLib = require('date-and-time');
const gplay = require('google-play-scraper');
const Review = require('./review');
const async = require('async');
const LocaleHelper = require('./localeHelper');
const localeHelper = new LocaleHelper();

function convertDateStringToDate(dateString) {
	dateLib.locale('en');
	var date = dateLib.parse(dateString, 'MMMM D YYYY', true);
	if (Object.prototype.toString.call(date) === '[object Date]') {
		return date;
	}

	dateLib.locale('de');
	date = dateLib.parse(dateString, 'D MMMM YYYY', true);
	if (Object.prototype.toString.call(date) === '[object Date]') {
		return date;
	}

	dateLib.locale('nl');
	date = dateLib.parse(dateString, 'D MMMM YYYY', true);
	if (Object.prototype.toString.call(date) === '[object Date]') {
		return date;
	}

	dateLib.locale('fr');
	date = dateLib.parse(dateString, 'D MMMM YYYY', true);
	if (Object.prototype.toString.call(date) === '[object Date]') {
		return date;
	}

	dateLib.locale('it');
	date = dateLib.parse(dateString, 'D MMMM YYYY', true);
	if (Object.prototype.toString.call(date) === '[object Date]') {
		return date;
	}

	dateLib.locale('sr');
	date = dateLib.parse(dateString, 'D MMMM YYYY', true);
	if (Object.prototype.toString.call(date) === '[object Date]') {
		return date;
	}

	console.error('Date string could not be parsed: ' + dateString);
	return null;
}

function fetchReviewsForLanguage(appId, lang, header, callback) {
	var review_array = [];
	var more = true;
	var page = 0;
	var completion = function (reviews, moreReviews) {
		page += 1;
		more = moreReviews;
		review_array = review_array.concat(reviews);
		if (more) {
			fetchReviewSet(appId, lang, header, page, completion);
		} else {
			callback(null, review_array);
		}
	};
	fetchReviewSet(appId, lang, header, page, completion);
}

function fetchReviewSet(appId, lang, header, page, completion) {
	const review_array = [];
	gplay.reviews({
		appId: appId,
		page: page,
		lang: lang,
		cache: false
	}).then(function (apps) {
		var count = apps.length;
		if (count === 0) {
			completion([], false);
			return;
		}
		apps.forEach(function (json) {
			const review = parseReview(json, appId, header, lang);
			review_array.push(review);
		});
		const more = review_array.length >= 40;
		completion(review_array, more);
	}).catch(function (e) {
		console.error('There was an error fetching the reviews!' + " " + e);
		completion([], false);
	});
}

function parseReview(json, appId, header, lang) {
	const deviceInfo = {};
	const appInfo = {};
	const reviewInfo = {};

	appInfo.id = appId;
	deviceInfo.platform = 'Android';
	deviceInfo.language = header;
	deviceInfo.languageCode = lang;
	reviewInfo.id = json.id;
	reviewInfo.text = json.text.replace('Volledige recensie', '').replace('Vollständige Rezension', '');
	reviewInfo.title = json.title;
	reviewInfo.author = json.userName;
	reviewInfo.rating = json.score;
	reviewInfo.source = 'Scraped';
	if (json.replyText) {
		reviewInfo.developerComment = json.replyText;
	}
	if (json.replyDate) {
		const replyDateToParse = json.replyDate.replace('.', '').replace(',', '');
		reviewInfo.developerCommentDateTime = convertDateStringToDate(replyDateToParse);
	}
	const dateStringToParse = json.date.replace('.', '').replace(',', '');
	reviewInfo.dateTime = convertDateStringToDate(dateStringToParse);
	return new Review(deviceInfo, appInfo, reviewInfo);
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
