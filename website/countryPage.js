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
			responseHelper.notFound(response, 'COuntry page: proposition not found');
			return;
		}
		const option = request.params.countryCode.toLowerCase();
		responseHelper.getDefaultParams(config, reviewDB, (ratingJSON, defaultParams) => {
			defaultParams.translate = request.query.translate;
			constructCountryPage(config, option, defaultParams, ratingJSON, response);
		});
	},
};

function constructCountryPage(config, country, defaultParams, ratingJSON, response) {
	console.time('Preparing the country page for ' + country);
	reviewDB.getReviewsForCountry(config, country, function (reviews) {
		const countryName = findCountryName(ratingJSON.countries, country);
		const reviewHistogram = histogramCalculator.calculateHistogram(reviews);
		var ratingHistogram = histogramCalculator.calculateHistogram(reviews, 'android');
		ratingHistogram = histogramCalculator.mergeHistograms(ratingHistogram, findIOSHitogramForCountry(country, ratingJSON));
		const ratingDetails = histogramCalculator.averageFromHistogram(ratingHistogram);
		const ratingAverage = ratingDetails.average;
		const ratingTotal = ratingDetails.amount;
		const reviewsDetails = histogramCalculator.averageFromHistogram(reviewHistogram);
		const reviewAverage = reviewsDetails.average;
		const reviewTotal = reviewsDetails.amount;
		const countryProperties = {
			tabTitle: config.appName + ' ' + country + ' Reviews',
			pageTitle: config.appName + ' ' + countryName,
			hint: 'Android ratings not available',
			page: 'Countries',
			totalRatings: ratingTotal,
			averageRatings: ratingAverage,
			totalReviews: reviewTotal,
			averageReviews: reviewAverage,
			ratingHistogram: ratingHistogram,
			reviewHistogram: reviewHistogram,
			reviews: reviews
		};
		response.render('reviews', Object.assign(countryProperties, defaultParams));
		console.timeEnd('Preparing the country page for ' + country);
	});
}

function findIOSHitogramForCountry(country, ratingJSON) {
	return ratingJSON.histogramPerCountry[country];
}

function findCountryName(countries, code) {
	for (var i = 0; i < countries.length; i++) {
		const countryDict = countries[i];
		const currentCode = Object.keys(countryDict)[0];
		if (currentCode === code) {
			return countryDict[code];
		}
	}
	return code;
}
