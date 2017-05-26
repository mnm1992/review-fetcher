const gplay = require('google-play-scraper');
const google = require('googleapis');
const Review = require('./review');
const LocaleHelper = require('./localeHelper');
const localeHelper = new LocaleHelper();

module.exports = class AndroidFetcher {
	constructor(config) {
		this.config = config;
		if (this.config.androidAuthentication) {
			this.androidAuthentication = require(this.config.androidAuthentication);
		}
	}

	fetchRatings(callback) {
		gplay.app({
			appId: this.config.androidId,
			cache: false
		}).then(function (app) {
			var numberOfReviews = parseInt(app.reviews);
			var averageRating = parseFloat(app.score);
			callback(numberOfReviews, averageRating);
		}).catch(function (error) {
			console.error(error);
			callback(0, 0);
		});
	}

	fetchNextSetOfReviews(options, completion) {
		const self = this;
		const androidpublisher = google.androidpublisher('v2');
		androidpublisher.reviews.list(options, function (err, resp) {
			if (err) {
				console.log(err);
				completion([]);
				return;
			}
			if (Object.keys(resp).length === 0) {
				console.log('The response from the playstore was empty');
				completion([]);
				return;
			}

			const review_array = [];
			resp.reviews.forEach(function (json) {
				self.parseReviewJSON(json, function (review) {
					review_array.push(review);
				});
			});
			if (resp.tokenPagination) {
				completion(review_array, resp.tokenPagination.nextPageToken);
			} else {
				completion(review_array);
			}
		});
	}


	fetchReviews(completion) {
		const self = this;
		var response_list = [];
		const options = {
			auth: self.getAuth(),
			packageName: self.config.androidId,
			maxResults: 100,
		};
		const reviews_received = function (review_array, next_token) {
			response_list = response_list.concat(review_array);
			if (next_token && review_array.length > 0) {
				options.token = next_token;
				self.fetchNextSetOfReviews(options, reviews_received);
			} else {
				completion(review_array);
			}
		};
		self.fetchNextSetOfReviews(options, reviews_received);
	}

	getAuth() {
		const jwtClient = new google.auth.JWT(
			this.androidAuthentication.client_email,
			null,
			this.androidAuthentication.private_key, ['https://www.googleapis.com/auth/androidpublisher'],
			null
		);
		return jwtClient;
	}

	parseReviewJSON(json, completion) {
		const self = this;
		const deviceInfo = {};
		const appInfo = {};
		const reviewInfo = {};

		appInfo.id = self.config.androidId;
		appInfo.version = json.comments[0].userComment.appVersionName;
		appInfo.versionCode = json.comments[0].userComment.appVersionCode;

		const reviewText = json.comments[0].userComment.text.split('\t');
		reviewInfo.id = json.reviewId;
		reviewInfo.title = reviewText[0];
		reviewInfo.text = reviewText[1];
		reviewInfo.author = json.authorName;
		reviewInfo.rating = json.comments[0].userComment.starRating;
		reviewInfo.dateTime = new Date(json.comments[0].userComment.lastModified.seconds * 1000);
		reviewInfo.hasTime = true;
		reviewInfo.source = 'API';
		if (json.comments.length > 1) {
			reviewInfo.developerComment = json.comments[1].developerComment.text;
			reviewInfo.developerCommentDateTime = new Date(json.comments[1].developerComment.lastModified.seconds * 1000);
		}

		deviceInfo.platform = 'Android';
		deviceInfo.device = json.comments[0].userComment.device;
		deviceInfo.osVersion = json.comments[0].userComment.androidOsVersion;
		deviceInfo.isoCode = json.comments[0].userComment.reviewerLanguage;
		deviceInfo.deviceMetadata = json.comments[0].userComment.deviceMetadata;

		localeHelper.getCountryAndLanguage(deviceInfo.isoCode, function (country, language) {
			deviceInfo.country = country;
			deviceInfo.language = language;
			const splitIsoArray = deviceInfo.isoCode.split('_');
			deviceInfo.languageCode = splitIsoArray[0].toLowerCase();
			deviceInfo.countryCode = splitIsoArray[1].toLowerCase();
			completion(new Review(deviceInfo, appInfo, reviewInfo));
		});
	}
};
