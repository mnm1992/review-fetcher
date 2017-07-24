const histogramCalculator = require('../common/histogramCalculator');
const responseHelper = require('./responseHelper');
const configs = require('../common/configs');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {
	render: function (request, response) {
		const config = configs.configForApp(request.params.app.toLowerCase());
		if (config === null) {
			responseHelper.notFound(response, 'proposition not found');
			return;
		}
		responseHelper.getDefaultParams(config, reviewDB, function (ratingJSON, defaultParams) {
			constructAppPage(config, defaultParams, ratingJSON, response);
		});
	}
};

function constructAppPage(config, defaultParams, ratingJSON, response) {
	console.time('Preparing the ' + config.appName + ' page');
	reviewDB.getAllReviews(config, function (reviews) {
		const androidTotal = ratingJSON.androidTotal ? ratingJSON.androidTotal : 0;
		const androidAverage = ratingJSON.androidAverage ? ratingJSON.androidAverage : 0;
		const iosTotal = ratingJSON.iOSTotal ? ratingJSON.iOSTotal : 0;
		const iosAverage = ratingJSON.iOSAverage ? ratingJSON.iOSAverage : 0;
		const totalRatings = (iosTotal + androidTotal);
		const saveRatingDivider = (totalRatings == 0) ? 1 : totalRatings;

		const averageDetail = histogramCalculator.averageFromReviews(reviews);
		const averageRatings = ((iosTotal * iosAverage) + (androidTotal * androidAverage)) / saveRatingDivider;
		const reviewHistogram = histogramCalculator.calculateHistogram(reviews);
		const ratingHistogram = histogramCalculator.mergeHistograms(ratingJSON.androidHistogram, ratingJSON.iOSHistogram);
		const appProperties = {
			tabTitle: config.appName + ' Reviews',
			pageTitle: config.appName,
			page: 'Home',
			totalRatings: totalRatings,
			averageRatings: averageRatings,
			totalReviews: averageDetail.amount,
			averageReviews: averageDetail.average,
			ratingHistogram: ratingHistogram,
			reviewHistogram: reviewHistogram,
			reviews: reviews
		};
		response.render('reviews', Object.assign(appProperties, defaultParams));
		console.timeEnd('Preparing the ' + config.appName + ' page');
	});
}
