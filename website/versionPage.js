const histogramCalculator = require('./histogramCalculator');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {
  constructVersionPage: function(config, platform, version, defaultParams, response) {
    console.time('Preparing the version page for ' + version);
    reviewDB.getReviewsForVersion(config, platform, version, function(reviews) {
      histogramCalculator.appAverage(reviews, undefined, function(totalReviews, averageReviews) {
        const histogram = histogramCalculator.calculateHistogram(reviews);
        const title = platform.toLowerCase() === 'android' ? 'Android' : 'iOS';
        const versionProperties = {
          tabTitle: config.appName + ' ' + title + ' ' + version + ' Reviews',
          pageTitle: config.appName + ' ' + title + ' ' + version,
          page: 'Versions',
          totalRatings: totalReviews ? totalReviews : 0,
          averageRatings: averageReviews ? averageReviews : 0,
          totalReviews: totalReviews ? totalReviews : 0,
          averageReviews: averageReviews ? averageReviews : 0,
          ratingHistogram: histogram,
          reviewHistogram: histogram,
          reviews: reviews
        };
        response.render('reviews', Object.assign(versionProperties, defaultParams));
        console.timeEnd('Preparing the version page for ' + version);
      });
    });
  }
};
