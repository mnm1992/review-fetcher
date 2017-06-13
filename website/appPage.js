const histogramCalculator = require('./histogramCalculator');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {
  constructAppPage: function(config, defaultParams, ratingJSON, response) {
    console.time('Preparing the ' + config.appName + ' page');
    reviewDB.getAllReviews(config, function(reviews) {
      histogramCalculator.appAverage(reviews, undefined, function(totalReviews, averageReviews) {
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
          totalReviews: totalReviews ? totalReviews : 0,
          averageReviews: averageReviews ? averageReviews : 0,
          ratingHistogram: ratingHistogram,
          reviewHistogram: reviewHistogram,
          reviews: reviews
        };
        response.render('reviews', Object.assign(appProperties, defaultParams));
        console.timeEnd('Preparing the ' + config.appName + ' page');
      });
    });
  }
};
