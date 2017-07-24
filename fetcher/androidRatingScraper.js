const gplay = require('google-play-scraper');

module.exports = class AndroidRatingScraper {
	constructor(config) {
		this.config = config;
	}

	startFetching(callback) {
		if (this.config && Object.getOwnPropertyNames(this.config).length > 0) {
			console.time('Fetched Android ratings trough Scraping');
			this.fetchRatings(function (total, averageRating, histogram) {
				const ratingMetadata = {};
				ratingMetadata.histogram = histogram;
				ratingMetadata.total = total;
				ratingMetadata.average = averageRating;
				console.timeEnd('Fetched Android ratings trough Scraping');
				callback(null, ratingMetadata);
			});
		} else {
			callback(null, {});
		}
	}

	fetchRatings(callback) {
		gplay.app({
			appId: this.config.id,
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
};
