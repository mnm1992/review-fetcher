module.exports = {
  appAverage: function(reviews, platform, completion) {
    const overide = platform ? false : true;
    var reviewCount = 0;
    var totalScore = 0;
    reviews.forEach(function(review) {
      const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
      if(correctPlatform){
        totalScore += parseInt(review.reviewInfo.rating);
        reviewCount += 1;
      }
    });
    const averageRating = totalScore / reviewCount;
    completion(reviewCount, averageRating);
  },

  mergeHistograms: function(histogramA, histogramB) {
    if (!histogramA && !histogramB) {
      return {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0
      };
    }
    if (!histogramA) {
      return histogramB;
    }
    if (!histogramB) {
      return histogramA;
    }
    histogramA['1'] += histogramB['1'];
    histogramA['2'] += histogramB['2'];
    histogramA['3'] += histogramB['3'];
    histogramA['4'] += histogramB['4'];
    histogramA['5'] += histogramB['5'];
    return histogramA;
  },

  calculateHistogram: function(reviews, platform) {
    const overide = platform ? false : true;
    const histogram = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    reviews.forEach(function(review) {
      const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
      if (correctPlatform) {
        histogram[review.reviewInfo.rating] = histogram[review.reviewInfo.rating] += 1;
      }
    });
    return histogram;
  }
};
