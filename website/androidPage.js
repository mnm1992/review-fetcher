const histogramCalculator = require('../common/histogramCalculator');
const responseHelper = require('./responseHelper');
const Configs = require('../common/configs');
const configs = new Configs();
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {
	render: function (request, response) {
		const config = configs.configForApp(request.params.app.toLowerCase());
		if (config === null) {
			responseHelper.notFound(response, 'Android page: proposition not found');
			return;
		}
		responseHelper.getDefaultParams(config, reviewDB, (ratingJSON, defaultParams) => {
			defaultParams.translate = request.query.translate;
			constructAndroidPage(config, defaultParams, ratingJSON, response);
		});
	}
};

function constructAndroidPage(config, defaultParams, ratingJSON, response) {
	console.time('Preparing the Android page');
	reviewDB.getReviews(config, 'Android', function (reviews) {
		const averageDetail = histogramCalculator.averageFromReviews(reviews);
		const histogram = histogramCalculator.calculateHistogram(reviews);
		const ratingHistogram = ratingJSON.androidHistogram ? ratingJSON.androidHistogram : {
			'1': 0,
			'2': 0,
			'3': 0,
			'4': 0,
			'5': 0
		};
		const androidProperties = {
			tabTitle: config.appName + ' Android Reviews',
			pageTitle: config.appName + ' Android',
			page: 'Android',
			totalRatings: ratingJSON.androidTotal ? ratingJSON.androidTotal : 0,
			averageRatings: ratingJSON.androidAverage ? ratingJSON.androidAverage : 0,
			totalReviews: averageDetail.amount,
			averageReviews: averageDetail.average,
			ratingHistogram: ratingHistogram,
			reviewHistogram: histogram,
			reviews: reviews
		};
		response.render('reviews', Object.assign(androidProperties, defaultParams));
		console.timeEnd('Preparing the Android page');
	});
}
