const histogramCalculator = require('./histogramCalculator');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {
  constructIOSPage: function(config, defaultParams, ratingJSON, response) {
    console.time('Preparing the iOS page');
    reviewDB.getReviews(config, 'iOS', function(reviews) {
      const histogram = histogramCalculator.calculateHistogram(reviews);
      var totalReviews = 0;
      var reviewAverage = 0;
      histogramCalculator.appAverage(reviews,'ios', function(reviewCount, averageRating){
        totalReviews= reviewCount;
        reviewAverage= averageRating;
        const iOSProperties = {
          tabTitle: config.appName + ' iOS Reviews',
          pageTitle: config.appName + ' iOS',
          page: 'iOS',
          totalRatings: totalReviews,
          averageRatings: reviewAverage,
          totalReviews: totalReviews,
          averageReviews: reviewAverage,
          ratingHistogram: histogram,
          reviewHistogram: histogram,
          reviews: reviews
        };
        response.render('reviews', Object.assign(iOSProperties, defaultParams));
        console.timeEnd('Preparing the iOS page');
      });
    });
  }
};
