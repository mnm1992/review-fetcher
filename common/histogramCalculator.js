module.exports = {
  averageFromHistogram: function(histogram) {
    const amountOfReviews = histogram['1'] + histogram['2'] + histogram['3'] + histogram['4'] + histogram['5'];
    const totalReviewScore = (1 * histogram['1']) + (2 * histogram['2']) + (3 * histogram['3']) + (4 * histogram['4']) + (5 * histogram['5']);
    return {
      amount: amountOfReviews,
      average: (totalReviewScore / amountOfReviews)
    };
  },

  averageFromReviews: function(reviews, platform) {
    const overide = platform ? false : true;
    var reviewCount = 0;
    var totalScore = 0;
    for (var i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
      if (correctPlatform) {
        totalScore += parseInt(review.reviewInfo.rating);
        reviewCount += 1;
      }
    }
    return {
      amount: reviewCount,
      average: (totalScore / reviewCount)
    };
  },

  addAllHistograms: function(histograms) {
    return mergeHistogramArray(Object.values(histograms));
  },

  mergeHistograms: function(histogramA, histogramB) {
    return mergeHistogramArray([histogramA, histogramB]);
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
		for (var i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
      if (correctPlatform) {
        histogram[review.reviewInfo.rating] = histogram[review.reviewInfo.rating] += 1;
      }
    }
    return histogram;
  }
};

function mergeHistogramArray(histogramArray) {
  const histogram = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };
  for (var i = 0; i < histogramArray.length; i++) {
    const currentHistogram = histogramArray[i];
    if (currentHistogram) {
      histogram['1'] += currentHistogram['1'];
      histogram['2'] += currentHistogram['2'];
      histogram['3'] += currentHistogram['3'];
      histogram['4'] += currentHistogram['4'];
      histogram['5'] += currentHistogram['5'];
    }
  }
  return histogram;
}
