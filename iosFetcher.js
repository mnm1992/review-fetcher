const async = require('async');
const request = require('request');
const XMLParser = require('xml2js');
const Review = require('./review');
const LocaleHelper = require('./localeHelper');
const localeHelper = new LocaleHelper();

module.exports = class IOSFetcher {

	constructor(config) {
		this.config = config;
	}

	getLastPage(json) {
		var pageNumber = 1;
		json.forEach(function (dictionary) {
			const type = dictionary['$']['rel'];
			if (type === 'last') {
				const url = dictionary['$']['href'];
				const nextPageUrl = url.split('?');
				const urlParts = nextPageUrl[0].split('/');
				urlParts.forEach(function (urlPart) {
					if (urlPart.includes('page')) {
						pageNumber = urlPart.split('=')[1];
					}
				});
			}
		});
		return pageNumber;
	}

	fetchReviews(completion) {
		const self = this;

		self.review_array = [];
		const fetchActions = [];

		self.config.countries.forEach(function (country) {
			fetchActions.push(function (callback) {
				self.fetchReviewsForCountry(country, callback);
			});
		});

		async.parallel(fetchActions, function (err, results) {
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

	fetchReviewsForCountry(country, completion) {
		const self = this;
		const review_array = [];
		const responseHandler = function (error, page, response, body) {
			if (error || response.statusCode != 200) {
				completion(null, review_array);
				return;
			}
			XMLParser.parseString(body, function (err, result) {
				const last = self.getLastPage(result.feed.link);
				const entries = result.feed.entry;
				if (entries === undefined) {
					completion(null, review_array);
					return;
				}
				entries.forEach(function (reviewJS) {
					self.parseResponseForCountry(reviewJS, country, function (review) {
						review_array.push(review);
					});
				});
				if (page === last) {
					completion(null, review_array);
				} else {
					request(self.getRequestURLForCountry(country, page + 1), function (error, response, body) {
						responseHandler(error, page + 1, response, body);
					});
				}
			});
		}
		request(self.getRequestURLForCountry(country, 1), function (error, response, body) {
			responseHandler(error, 1, response, body)
		});
	}

	parseResponseForCountry(review, country, completion) {
		const self = this;
		const rating = parseFloat(review['im:rating']);
		if (!rating) {
			return;
		}
		const deviceInfo = {};
		const appInfo = {};
		const reviewInfo = {};

		reviewInfo.id = review.id[0];
		reviewInfo.text = review.content[0]._;
		reviewInfo.title = review.title[0];
		reviewInfo.author = review.author ? review.author[0].name[0] : false;
		reviewInfo.dateTime = new Date(review.updated);
		reviewInfo.hasTime = true;
		reviewInfo.rating = rating;
		reviewInfo.source = 'RSS';
		appInfo.id = self.config.iosId;
		appInfo.version = review['im:version'][0];
		deviceInfo.platform = 'iOS';
		deviceInfo.countryCode = country;

		localeHelper.getCountry(country, function (countryHeader) {
			deviceInfo.country = countryHeader;
			completion(new Review(deviceInfo, appInfo, reviewInfo));
		});
	}

	getRequestURLForCountry(country, page) {
		return 'https://itunes.apple.com/' + country + '/rss/customerreviews/page=' + page + '/id=' + this.config.iosId + '/sortby=mostrecent/xml';
	}
};
