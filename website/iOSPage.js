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
      constructIOSPage(config, defaultParams, ratingJSON, response);
    });
  }
};

function constructIOSPage(config, defaultParams, ratingJSON, response) {
  console.time('Preparing the iOS page');
  reviewDB.getReviews(config, 'iOS', function(reviews) {
    const histogram = histogramCalculator.calculateHistogram(reviews);
    var totalReviews = 0;
    var reviewAverage = 0;
    const averageDetail = histogramCalculator.averageFromReviews(reviews);
    const iOSProperties = {
      tabTitle: config.appName + ' iOS Reviews',
      pageTitle: config.appName + ' iOS',
      page: 'iOS',
      totalReviews: averageDetail.amount,
      averageReviews: averageDetail.average,
      totalRatings: ratingJSON.iOSTotal,
      averageRatings: ratingJSON.iOSAverage,
      ratingHistogram: ratingJSON.iOSHistogram,
      reviewHistogram: histogram,
      reviews: reviews
    };
    response.render('reviews', Object.assign(iOSProperties, defaultParams));
    console.timeEnd('Preparing the iOS page');
  });
}
