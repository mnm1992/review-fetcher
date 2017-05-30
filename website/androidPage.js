const histogramCalculator = require('./histogramCalculator');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {
  constructAndroidPage: function(config, defaultParams, ratingJSON, response) {
    console.time('Preparing the Android page');
    reviewDB.getReviews(config, 'Android', function(reviews) {
      histogramCalculator.appAverage(reviews, undefined, function(totalReviews, averageReviews) {
        const histogram = histogramCalculator.calculateHistogram(reviews);
        const ratingHistogram = ratingJSON.androidHistogram ? ratingJSON.androidHistogram : {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0
        };
        const androidProperties = {
          tabTitle: config.appName + ' Android Reviews',
          pageTitle: config.appName + ' Android',
          page: 'Android',
          totalRatings: ratingJSON.androidTotal ? ratingJSON.androidTotal : 0,
          averageRatings: ratingJSON.androidAverage ? ratingJSON.androidAverage : 0,
          totalReviews: totalReviews ? totalReviews : 0,
          averageReviews: averageReviews ? averageReviews : 0,
          ratingHistogram: ratingHistogram,
          reviewHistogram: histogram,
          reviews: reviews
        };
        response.render('reviews', Object.assign(androidProperties, defaultParams));
        console.timeEnd('Preparing the Android page');
      });
    });
  }
};
