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
			responseHelper.notFound(response, 'Language page: proposition not found');
			return;
		}
		const option = request.params.languageCode.toLowerCase();
		responseHelper.getDefaultParams(config, reviewDB, (ratingJSON, defaultParams) => {
			defaultParams.translate = request.query.translate;
			constructLanguagePage(config, option, defaultParams, ratingJSON, response);
		});
	},
};

function constructLanguagePage(config, language, defaultParams, ratingJSON, response) {
	console.time('Preparing the country page for ' + language);
	reviewDB.getReviewsForLanguage(config, language, function (reviews) {
		const countryName = findLanguageName(ratingJSON.languages, language);
		const reviewHistogram = histogramCalculator.calculateHistogram(reviews);
		const reviewsDetails = histogramCalculator.averageFromHistogram(reviewHistogram);
		const reviewAverage = reviewsDetails.average;
		const reviewTotal = reviewsDetails.amount;
		const languageProperties = {
			tabTitle: config.appName + ' ' + language + ' Reviews',
			pageTitle: config.appName + ' ' + countryName,
			hint: 'Rating not available',
			page: 'Countries',
			totalRatings: reviewTotal,
			averageRatings: reviewAverage,
			totalReviews: reviewTotal,
			averageReviews: reviewAverage,
			ratingHistogram: reviewHistogram,
			reviewHistogram: reviewHistogram,
			reviews: reviews
		};
		response.render('reviews', Object.assign(languageProperties, defaultParams));
		console.timeEnd('Preparing the country page for ' + language);
	});
}

function findLanguageName(languages, code) {
	for (var i = 0; i < languages.length; i++) {
		const languageDict = languages[i];
		const currentCode = Object.keys(languageDict)[0];
		if (currentCode === code) {
			return languageDict[code];
		}
	}
	return code;
}
