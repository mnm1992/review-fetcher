const histogramCalculator = require('./histogramCalculator');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {
  constructCountryPage: function(config, country, defaultParams, ratingJSON, response) {
    console.time('Preparing the country page for ' + country);
    reviewDB.getReviewsForCountry(config, country, function(reviews) {
      histogramCalculator.appAverage(reviews, undefined, function(totalReviews, averageReviews) {
        const countryName = findCountryName(ratingJSON.countries, country);
        const histogram = histogramCalculator.calculateHistogram(reviews);
        const countryProperties = {
          tabTitle: config.appName + ' ' + country + ' Reviews',
          pageTitle: config.appName + ' ' + countryName,
          page: 'Countries',
          totalRatings: totalReviews ? totalReviews : 0,
          averageRatings: averageReviews ? averageReviews : 0,
          totalReviews: totalReviews ? totalReviews : 0,
          averageReviews: averageReviews ? averageReviews : 0,
          ratingHistogram: histogram,
          reviewHistogram: histogram,
          reviews: reviews
        };
        response.render('reviews', Object.assign(countryProperties, defaultParams));
        console.timeEnd('Preparing the country page for ' + country);
      });
    });
  }
};

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
