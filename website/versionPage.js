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
    const allowedPlatforms = ['ios', 'android'];
    if (!allowedPlatforms.includes(request.params.platform.toLowerCase())) {
      responseHelper.notFound(response, 'platform not found');
      return;
    }
    const platform = request.params.platform.toLowerCase();
    const version = request.params.version.toLowerCase();
    responseHelper.getDefaultParams(config, reviewDB, function(ratingJSON, defaultParams) {
      constructVersionPage(config, platform, version, defaultParams, response);
    });
  }
};

function constructVersionPage(config, platform, version, defaultParams, response) {
  console.time('Preparing the version page for ' + version);
  reviewDB.getReviewsForVersion(config, platform, version, function(reviews) {
    const averageDetail = histogramCalculator.averageFromReviews(reviews);
    const histogram = histogramCalculator.calculateHistogram(reviews);
    const title = platform.toLowerCase() === 'android' ? 'Android' : 'iOS';
    const versionProperties = {
      tabTitle: config.appName + ' ' + title + ' ' + version + ' Reviews',
      pageTitle: config.appName + ' ' + title + ' ' + version,
      hint: 'Only reviews',
      page: 'Versions',
      totalRatings: averageDetail.amount,
      averageRatings: averageDetail.average,
      totalReviews: averageDetail.amount,
      averageReviews: averageDetail.average,
      ratingHistogram: histogram,
      reviewHistogram: histogram,
      reviews: reviews
    };
    response.render('reviews', Object.assign(versionProperties, defaultParams));
    console.timeEnd('Preparing the version page for ' + version);
  });
}
