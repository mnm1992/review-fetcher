const async = require('async');
const request = require('request');
const rssParser = require('./iOSRSSParser');

module.exports = class IOSFetcher {

	constructor(config) {
		this.config = config;
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
