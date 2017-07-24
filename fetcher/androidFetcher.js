const google = require('googleapis');
const androidAPIParser = require('./androidAPIParser');

module.exports = class AndroidFetcher {
	constructor(config) {
		this.config = config;
	}

	startFetching(callback) {
		if (this.config && Object.getOwnPropertyNames(this.config).length > 0 && this.config.authentication) {
			console.time('Fetched Android reviews trough API');
			this.fetchReviews(function (androidReviews) {
				console.timeEnd('Fetched Android reviews trough API');
				console.log('Fetched: ' + androidReviews.length + ' Android reviews');
				callback(null, androidReviews);
			});
		} else {
			callback(null, []);
		}
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

			androidAPIParser.parse(self.config.id, resp, function (reviewArray) {
				if (resp.tokenPagination) {
					completion(reviewArray, resp.tokenPagination.nextPageToken);
				} else {
					completion(reviewArray);
				}
			});
		});
	}


	fetchReviews(completion) {
		const self = this;
		var response_list = [];
		const options = {
			auth: self.getAuth(),
			packageName: self.config.id,
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
			this.config.authentication.client_email,
			null,
			this.config.authentication.private_key, ['https://www.googleapis.com/auth/androidpublisher'],
			null
		);
		return jwtClient;
	}

};
