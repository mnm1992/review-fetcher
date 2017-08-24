const responseHelper = require('./responseHelper');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();
const fetcher = require('../fetcher/fetchReviews');
const ReviewTranslator = require('../fetcher/reviewTranslator');

module.exports = {

	startFetching: function (request, response) {
		fetcher.fetchReviews(() => {
			response.send('fetcher.fetchReviews completed');
		});
	},

	startScraping: function (request, response) {
		fetcher.scrapeReviews(() => {
			response.send('fetcher.startScraping completed');
		});
	},

	translate: function (request, response) {
		const reviewTranslator = new ReviewTranslator();
		var translateFunctions = [];
		reviewDB.getAllReviewsGlobal((reviewsFromDB) => {
			const filteredReviews = reviewsFromDB.filter((review) => {
				return !review.reviewInfo.translatedText;
			});
			reviewTranslator.translateAllReviews(filteredReviews, (translatedReviews) => {
				reviewDB.updateReviews(translatedReviews, () => {
					response.send('reviewTranslator.translateAllReviews completed');
				});
			});
		});
	},

	updateClients: function (wss, request, response) {
		const app = request.query.update;
		wss.getWss().clients.forEach((client) => {
			client.send(app);
			console.log('Client is informed');
		});
		response.send('Success');
	},

};
