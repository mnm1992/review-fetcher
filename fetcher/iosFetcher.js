const async = require('async');
const request = require('request');
const rssParser = require('./iOSRSSParser');

module.exports = class IOSFetcher {

	calculateHistogram(reviews, platform) {
		const overide = platform ? false : true;
		const histogram = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0
		};
		reviews.forEach(function (review) {
			const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
			if (correctPlatform) {
				histogram[review.reviewInfo.rating] = histogram[review.reviewInfo.rating] += 1;
			}
		});
		return histogram;
	}

	constructor(config) {
		this.config = config;
	}

	fetchReviews(completion) {
		const self = this;
		const fetchActions = [];
		var histograms = {};

		self.config.countries.forEach(function (country) {
			fetchActions.push(function (callback) {
				self.fetchForCountry(country, callback);
			});
		});

		async.parallel(fetchActions, function (err, results) {
			var review_array = [];
			var histograms = {};
			if (results && results.length > 0) {
				results.forEach(function (result) {
					review_array = review_array.concat(result.reviews);
					histograms = Object.assign(histograms, result.histogram);
				});
			}
			completion(review_array, histograms);
		});
	}

	fetchForCountry(country, completion) {
		const self = this;
		this.fetchRecursively([], country, 1, function (fetchedReviews) {
			const returnValue = {
				reviews: fetchedReviews,
				histogram: {}
			};
			returnValue.histogram[country] = self.calculateHistogram(fetchedReviews, 'ios');
			completion(null, returnValue);
		});
	}

	fetchRecursively(allReviews, country, pageNumber, completion) {
		const self = this;

		request(this.getRequestURLForCountry(country, pageNumber), function (error, response, body) {
			if (error || response.statusCode != 200) {
				const text = error ? error : ('Status code was ' + response.statusCode + ' ' + pageNumber + ' Country is ' + country);
				console.error(text);
				completion(allReviews);
				return;
			}

			rssParser.parse(self.config.iosId, body, country, function (parsedReviews, abort, lastPage) {
				allReviews = allReviews.concat(parsedReviews);
				if (allReviews.length === 0) {
					completion(allReviews);
					return;
				}

				if (pageNumber === parseInt(lastPage)) {
					completion(allReviews);
					return;
				}
				const nextPage = pageNumber + 1;
				self.fetchRecursively(allReviews, country, nextPage, completion);
			});
		});
	}

	getRequestURLForCountry(country, page) {
		return 'https://itunes.apple.com/' + country + '/rss/customerreviews/page=' + page + '/id=' + this.config.iosId + '/sortby=mostrecent/xml';
	}
};
