const emojiFlags = require('emoji-flags');
const humanizeDuration = require('humanize-duration');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {

  constructStatsPage: function(config, defaultParams, response) {
    const self = this;
    console.time('Preparing the stats ' + config.appName + ' page');
    reviewDB.getAllReviews(config, function(reviews) {
      const statisticsProperties = {
        tabTitle: config.appName + ' Statistics',
        pageTitle: config.appName + ' Statistics',
        page: 'Statistics',
        countryStats: self.constructCountriesMap(reviews),
        androidCountryStats: self.constructCountriesMap(reviews, 'android'),
        iosCountryStats: self.constructCountriesMap(reviews, 'ios'),
        versionStats: self.constructVersionMap(reviews),
        languageStats: self.constructLanguagesMap(reviews),
        timingStats: self.generateTimeReviewSummary(reviews)
      };
      response.render('statistics', Object.assign(statisticsProperties, defaultParams));
      console.timeEnd('Preparing the stats ' + config.appName + ' page');
    });
  },

  calculateTimeSinceLastReview: function(reviews, platform) {
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

  calculateAverageMap: function(reviews, codeParentKey, codeKey, nameParentKey, nameKey, platform) {
    const overide = platform ? false : true;
    const averageArray = [];
    const averageDictionary = {};
    for(var i=0; i<reviews.length;i++){
      const review = reviews[i];
      const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
      const code = review[codeParentKey][codeKey];
      const name = review[nameParentKey][nameKey];
      const key = code + ' ' + name;
      if(!correctPlatform || !code || !name){
        continue;
      }

      if (!averageArray.includes(key)) {
        const codeToAverageMap = {
          'total': 1,
          'average': review.reviewInfo.rating
        };
        codeToAverageMap[codeKey] = code;
        codeToAverageMap[nameKey] = name;
        averageDictionary[key] = codeToAverageMap;
        averageArray.push(key);
      } else {
        const oldTotal = averageDictionary[key].total;
        const oldAverage = averageDictionary[key].average;
        const newTotal = oldTotal + 1;
        const newAverage = ((oldAverage * oldTotal) + review.reviewInfo.rating) / newTotal;
        averageDictionary[key].total = newTotal;
        averageDictionary[key].average = newAverage;
      }
    }
    return averageDictionary;
  },

  constructLanguagesMap: function(reviews) {
    return this.dictionaryToArray(this.calculateAverageMap(reviews,'deviceInfo', 'languageCode','deviceInfo', 'language'));
  },

  constructCountriesMap: function(reviews, platform) {
    const countryAverageMap = this.calculateAverageMap(reviews,'deviceInfo', 'countryCode','deviceInfo', 'country', platform);
    Object.keys(countryAverageMap).forEach(function(key) {
      countryAverageMap[key].flag = emojiFlags.countryCode(countryAverageMap[key].countryCode).emoji;
    });
    return this.dictionaryToArray(countryAverageMap);
  },

  constructVersionMap: function(reviews) {
    return this.calculateAverageMap(reviews,'deviceInfo', 'platform','appInfo', 'version');
  },

  generateTimeReviewSummary: function(reviews) {
    const self = this;
    const timeSinceLastReview = humanizeDuration(self.calculateTimeSinceLastReview(reviews), {
      largest: 1,
      round: true
    });
    const averageTimeBetweenReviews = humanizeDuration(self.constructTimeBetweenReviewsMap(reviews), {
      largest: 1,
      round: true
    });
    const timeSinceLastAndroidReview = humanizeDuration(self.calculateTimeSinceLastReview(reviews, 'android'), {
      largest: 1,
      round: true
    });
    const averageTimeBetweenAndroidReviews = humanizeDuration(self.constructTimeBetweenReviewsMap(reviews, 'android'), {
      largest: 1,
      round: true
    });
    const timeSinceLastIOSReview = humanizeDuration(self.calculateTimeSinceLastReview(reviews, 'ios'), {
      largest: 1,
      round: true
    });
    const averageTimeBetweenIOSReviews = humanizeDuration(self.constructTimeBetweenReviewsMap(reviews, 'ios'), {
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

  dictionaryToArray: function(dictionary) {
    const array = [];
    Object.keys(dictionary).forEach(function(key) {
      array.push(dictionary[key]);
    });
    return array;
  }

};
