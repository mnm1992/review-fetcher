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
			responseHelper.notFound(response, 'iOS page: proposition not found');
			return;
		}
		responseHelper.getDefaultParams(config, reviewDB, (ratingJSON, defaultParams) => {
			defaultParams.translate = request.query.translate;
			constructIOSPage(config, defaultParams, ratingJSON, response);
		});
	}
};

function constructIOSPage(config, defaultParams, ratingJSON, response) {
	console.time('Preparing the iOS page');
	reviewDB.getReviews(config, 'iOS', function (reviews) {
		const histogram = histogramCalculator.calculateHistogram(reviews);
		const averageDetail = histogramCalculator.averageFromReviews(reviews);
		const iosTotal = ratingJSON.iOSTotal ? ratingJSON.iOSTotal : 0;
		const iosAverage = ratingJSON.iOSAverage ? ratingJSON.iOSAverage : 0;
		const saveRatingDivider = (iosTotal === 0) ? 1 : iosTotal;
		const averageRatings = (iosTotal * iosAverage) / saveRatingDivider;

		const iOSProperties = {
			tabTitle: config.appName + ' iOS Reviews',
			pageTitle: config.appName + ' iOS',
			page: 'iOS',
			totalReviews: averageDetail.amount,
			averageReviews: averageDetail.average,
			totalRatings: iosTotal,
			averageRatings: averageRatings,
			ratingHistogram: ratingJSON.iOSHistogram,
			reviewHistogram: histogram,
			reviews: reviews
		};
		response.render('reviews', Object.assign(iOSProperties, defaultParams));
		console.timeEnd('Preparing the iOS page');
	});
}
