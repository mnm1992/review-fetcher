const histogramCalculator = require('../common/histogramCalculator');
const responseHelper = require('./responseHelper');
const configs = require('../common/configs');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {
  render: function(request, response) {
    const config = configs.configForApp(request.params.app.toLowerCase());
    if (config === null) {
      responseHelper.notFound(response, 'proposition not found');
      return;
    }
    responseHelper.getDefaultParams(config, reviewDB, function(ratingJSON, defaultParams) {
      constructAppPage(config, defaultParams, ratingJSON, response);
    });
  }
};

function constructAppPage(config, defaultParams, ratingJSON, response) {
  console.time('Preparing the ' + config.appName + ' page');
  reviewDB.getAllReviews(config, function(reviews) {
    const averageDetail = histogramCalculator.averageFromReviews(reviews);
    const totalRatings = ratingJSON.iOSTotal + ratingJSON.androidTotal;
    const averageRatings = ((ratingJSON.iOSTotal * ratingJSON.iOSAverage) + (ratingJSON.androidTotal * ratingJSON.androidAverage)) / totalRatings;
    const reviewHistogram = histogramCalculator.calculateHistogram(reviews);
    const ratingHistogram = histogramCalculator.mergeHistograms(ratingJSON.androidHistogram, ratingJSON.iOSHistogram);
    const appProperties = {
      tabTitle: config.appName + ' Reviews',
      pageTitle: config.appName,
      page: 'Home',
      totalRatings: totalRatings ? totalRatings : 0,
      averageRatings: averageRatings ? averageRatings : 0,
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
