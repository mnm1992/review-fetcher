const emojiFlags = require('emoji-flags');
const humanizeDuration = require('humanize-duration')

function removeDuplicates(input, prioritisedType) {
  const output = [];
  const reviewMap = {};
  input.forEach(function(review) {
    const oldReview = reviewMap[review.reviewInfo.id];
    if (!oldReview || (review.reviewInfo.source === prioritisedType)) {
      reviewMap[review.reviewInfo.id] = review;
    }
  });
  for (var key in reviewMap) {
    output.push(reviewMap[key]);
  }
  return output;
}

function mergeReviews(dbReview, fetchedReview) {
  const laterReview = dbReview.reviewInfo.dateTime > fetchedReview.reviewInfo.dateTime ? dbReview : fetchedReview;
  const olderReview = (laterReview === dbReview) ? fetchedReview : dbReview;
  if (laterReview.reviewInfo.dateTime > olderReview.reviewInfo.dateTime) {
    if (laterReview === fetchedReview) { //Since scraped copmponent don't have time, this check prevents the db one from winning
      laterReview.oldReviewInfo = {};
      laterReview.oldReviewInfo.reviewInfo = olderReview.reviewInfo;
      laterReview.oldReviewInfo.deviceInfo = olderReview.deviceInfo;
      laterReview.oldReviewInfo.appInfo = olderReview.appInfo;
      laterReview.showOnSlack = true;
      console.log('A review got updated it moved from: ' + olderReview.reviewInfo.dateTime + ' to ' + laterReview.reviewInfo.dateTime);
    }
  }
  return laterReview;
}

function dictionaryToArray(dictionary) {
  const array = [];
  Object.keys(dictionary).forEach(function(key) {
    array.push(dictionary[key]);
  });
  return array;
}

module.exports = {
  generateTimeReviewSummary: function(reviews) {
    const timeSinceLastReview = humanizeDuration(this.timeSinceLastReview(reviews), {
      largest: 1,
      round: true
    });
    const averageTimeBetweenReviews = humanizeDuration(this.constructTimeBetweenReviewsMap(reviews), {
      largest: 1,
      round: true
    });
    const timeSinceLastAndroidReview = humanizeDuration(this.timeSinceLastReview(reviews, 'android'), {
      largest: 1,
      round: true
    });
    const averageTimeBetweenAndroidReviews = humanizeDuration(this.constructTimeBetweenReviewsMap(reviews, 'android'), {
      largest: 1,
      round: true
    });
    const timeSinceLastIOSReview = humanizeDuration(this.timeSinceLastReview(reviews, 'ios'), {
      largest: 1,
      round: true
    });
    const averageTimeBetweenIOSReviews = humanizeDuration(this.constructTimeBetweenReviewsMap(reviews, 'ios'), {
      largest: 1,
      round: true
    });
		return {
			timeSinceLastReview: timeSinceLastReview,
			averageTimeBetweenReviews: averageTimeBetweenReviews,
			timeSinceLastAndroidReview: timeSinceLastAndroidReview,
			averageTimeBetweenAndroidReviews: averageTimeBetweenAndroidReviews,
			timeSinceLastIOSReview: timeSinceLastIOSReview,
			averageTimeBetweenIOSReviews: averageTimeBetweenIOSReviews,
		};
  },

  timeSinceLastReview: function(reviews, platform) {
    const overide = platform ? false : true;
    for (var i = 0; i < reviews.length; i++) {
      const correctPlatform = overide || (reviews[i].deviceInfo.platform.toLowerCase() === platform.toLowerCase());
      if (correctPlatform) {
        return (Date.now() - reviews[i].reviewInfo.dateTime.getTime());
      }
    }
    return 0;
  },

  constructTimeBetweenReviewsMap: function(reviews, platform) {
    const overide = platform ? false : true;
    var prevReview = null;
    var totalReviews = 0;
    var totalTime = 0;
    reviews.forEach(function(currentReview) {
      const correctPlatform = overide || (currentReview.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
      if (correctPlatform) {
        if (prevReview) {
          totalTime += prevReview.reviewInfo.dateTime.getTime() - currentReview.reviewInfo.dateTime.getTime();
          totalReviews += 1;
        }
        prevReview = currentReview;
      }
    });
    if (totalTime === 0 || totalReviews === 0) {
      return 0;
    }
    return totalTime / totalReviews;
  },

  constructLanguagesMap: function(reviews) {
    const languageCodes = [];
    const appLanguages = {};
    reviews.forEach(function(review) {
      if (review.deviceInfo.languageCode && !languageCodes.includes(review.deviceInfo.languageCode)) {
        const codeLanguageMap = {
          'languageCode': review.deviceInfo.languageCode,
          'language': review.deviceInfo.language,
          'total': 1,
          'average': review.reviewInfo.rating
        };
        appLanguages[review.deviceInfo.languageCode] = codeLanguageMap
        languageCodes.push(review.deviceInfo.languageCode);
      } else if (review.deviceInfo.languageCode) {
        const oldTotal = appLanguages[review.deviceInfo.languageCode].total;
        const oldAverage = appLanguages[review.deviceInfo.languageCode].average;
        const newTotal = oldTotal + 1;
        const newAverage = ((oldAverage * oldTotal) + review.reviewInfo.rating) / newTotal;
        appLanguages[review.deviceInfo.languageCode].total = newTotal;
        appLanguages[review.deviceInfo.languageCode].average = newAverage;
      }
    });
    return dictionaryToArray(appLanguages);
  },

  constructCountriesMap: function(reviews, platform) {
    const overide = platform ? false : true;
    const countryCodes = [];
    const appCountries = {};
    reviews.forEach(function(review) {
      const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
      if (correctPlatform && review.deviceInfo.countryCode && !countryCodes.includes(review.deviceInfo.countryCode)) {
        const codeCountryMap = {
          'flag': emojiFlags.countryCode(review.deviceInfo.countryCode).emoji,
          'countryCode': review.deviceInfo.countryCode,
          'country': review.deviceInfo.country,
          'total': 1,
          'average': review.reviewInfo.rating
        };
        appCountries[review.deviceInfo.countryCode] = codeCountryMap
        countryCodes.push(review.deviceInfo.countryCode);
      } else if (correctPlatform && review.deviceInfo.countryCode) {
        const oldTotal = appCountries[review.deviceInfo.countryCode].total;
        const oldAverage = appCountries[review.deviceInfo.countryCode].average;
        const newTotal = oldTotal + 1;
        const newAverage = ((oldAverage * oldTotal) + review.reviewInfo.rating) / newTotal;
        appCountries[review.deviceInfo.countryCode].total = newTotal;
        appCountries[review.deviceInfo.countryCode].average = newAverage;
      }
    });
    return dictionaryToArray(appCountries);
  },

  constructVersionMap: function(reviews) {
    const versions = [];
    const appVersions = {};
    reviews.forEach(function(review) {
      const title = review.deviceInfo.platform + ' ' + review.appInfo.version;
      if (review.appInfo.version && !versions.includes(title)) {
        const versionMap = {
          'platform': review.deviceInfo.platform,
          'version': review.appInfo.version,
          'total': 1,
          'average': review.reviewInfo.rating
        };
        appVersions[title] = versionMap;
        versions.push(title);
      } else if (review.appInfo.version) {
        const oldTotal = appVersions[title].total;
        const oldAverage = appVersions[title].average;
        const newTotal = oldTotal + 1;
        const newAverage = ((oldAverage * oldTotal) + review.reviewInfo.rating) / newTotal;
        appVersions[title].total = newTotal;
        appVersions[title].average = newAverage;
      }
    });
    return appVersions;
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
  },

  appAverage: function(reviews, completion) {
    var reviewCount = 0;
    var totalScore = 0;
    reviews.forEach(function(review) {
      totalScore += parseInt(review.reviewInfo.rating);
      reviewCount += 1;
    });
    const averageRating = totalScore / reviewCount;
    completion(reviewCount, averageRating);
  },

  appVersions: function(reviews, platform) {
    const overide = platform ? false : true;
    const appVersionArray = [];
    reviews.forEach(function(review) {
      const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
      const hasVersion = review.appInfo.version;
      const versionNotInArrayYet = !appVersionArray.includes(review.appInfo.version);
      if (hasVersion && versionNotInArrayYet && correctPlatform) {
        appVersionArray.push(review.appInfo.version);
      }
    });
    appVersionArray.sort((obj1, obj2) => {
      return obj2 > obj1
    });
    return appVersionArray;
  },

  appCountries: function(reviews) {
    const countryCodes = [];
    const appCountries = [];
    reviews.forEach(function(review) {
      if (review.deviceInfo.countryCode && !countryCodes.includes(review.deviceInfo.countryCode)) {
        const codeCountryMap = {};
        codeCountryMap[review.deviceInfo.countryCode] = review.deviceInfo.country;
        appCountries.push(codeCountryMap);
        countryCodes.push(review.deviceInfo.countryCode);
      }
    });
    appCountries.sort((obj1, obj2) => {
      return Object.keys(obj1)[0] > Object.keys(obj2)[0]
    });
    return appCountries;
  },

  mergeReviewsFromArrays: function(reviewsFromDB, reviewsFetched) {
    reviewsFetched = removeDuplicates(reviewsFetched, 'API');
    const result = {
      'reviewsToUpdate': [],
      'reviewsToInsert': [],
      'newReviews': []
    };
    const dbReviewMap = {};
    reviewsFromDB.forEach(function(dbReview) {
      dbReviewMap[dbReview.reviewInfo.id] = dbReview;
    });

    reviewsFetched.forEach(function(fetchedReview) {
      const foundReview = dbReviewMap[fetchedReview.reviewInfo.id];
      if (!foundReview) {
        result.newReviews.push(fetchedReview);
        result.reviewsToInsert.push(fetchedReview);
      } else {
        const mergedReview = mergeReviews(foundReview, fetchedReview);
        if (mergedReview.showOnSlack) {
          result.newReviews.push(mergedReview);
        }
        result.reviewsToUpdate.push(mergedReview);
      }
    });
    return result;
  },
};
