const async = require('async');
const request = require('request');
const XMLParser = require('xml2js');
const Review = require('../common/review');
const LocaleHelper = require('./localeHelper');
const localeHelper = new LocaleHelper();

module.exports = class IOSFetcher {

	constructor(config) {
		this.config = config;
	}

	getLastPage(json) {
		var pageNumber = 1;
		json.forEach(function (dictionary) {
			const type = dictionary.$.rel;
			if (type === 'last') {
				const url = dictionary.$.href;
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
		const fetchActions = [];

		self.config.countries.forEach(function (country) {
			fetchActions.push(function (callback) {
				self.fetchForCountry(country, callback);
			});
		});

		async.parallel(fetchActions, function (err, results) {
			var review_array = [];
			if (results && results.length > 0) {
				results.forEach(function (result) {
					review_array = review_array.concat(result);
				});
			}
			completion(review_array);
		});
	}

	fetchForCountry(country, completion) {
		this.fetchRecursively([], country, 1, function (fetchedReviews) {
			completion(null, fetchedReviews);
		});
	}

	fetchRecursively(allReviews, country, pageNumber, completion) {
		const self = this;

		request(this.getRequestURLForCountry(country, pageNumber), function (error, response, body) {
			if (error || response.statusCode != 200) {
				completion(allReviews);
				return;
			}

			self.parseXMLResponse(body, country, function (parsedReviews, abort, lastPage) {
				allReviews = allReviews.concat(parsedReviews);

				if (pageNumber === lastPage) {
					completion(allReviews);
					return;
				}

				self.fetchRecursively(allReviews, country, pageNumber + 1, completion);
			});
		});
	}

	parseXMLResponse(body, country, completion) {
		const self = this;
		const parsedReviews = [];
		XMLParser.parseString(body, function (err, result) {
			if (err) {
				completion([], true, 0);
				return;
			}

			const entries = result.feed.entry;
			if (!entries) {
				completion([], true, 0);
				return;
			}

			entries.forEach(function (entry) {
				self.parseResponseForCountry(entry, country, function (parsedReview) {
					parsedReviews.push(parsedReview);
				});
			});

			const lastPage = self.getLastPage(result.feed.link);
			completion(parsedReviews, false, lastPage);
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
