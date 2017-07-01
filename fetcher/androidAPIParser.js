const Review = require('../common/review');
const LocaleHelper = require('./localeHelper');
const localeHelper = new LocaleHelper();

module.exports = {

  parse: function(appId, resp, completion) {
    const self = this;
    const reviewArray = [];
    resp.reviews.forEach(function (json) {
      self.parseReview(appId, json, function (review) {
        reviewArray.push(review);
      });
    });
    completion(reviewArray);
  },
  
  parseReview: function(appId, json, completion) {
    const deviceInfo = {};
    const appInfo = {};
    const reviewInfo = {};

    appInfo.id = appId;
    appInfo.version = json.comments[0].userComment.appVersionName;
    appInfo.versionCode = json.comments[0].userComment.appVersionCode;

    const reviewText = json.comments[0].userComment.text.split('\t');
    reviewInfo.id = json.reviewId;
    reviewInfo.title = reviewText[0];
    reviewInfo.text = reviewText[1];
    reviewInfo.author = json.authorName;
    reviewInfo.rating = json.comments[0].userComment.starRating;
    reviewInfo.dateTime = new Date(json.comments[0].userComment.lastModified.seconds * 1000);
    reviewInfo.hasTime = true;
    reviewInfo.source = 'API';
    if (json.comments.length > 1) {
      reviewInfo.developerComment = json.comments[1].developerComment.text;
      reviewInfo.developerCommentDateTime = new Date(json.comments[1].developerComment.lastModified.seconds * 1000);
    }

    deviceInfo.platform = 'Android';
    deviceInfo.device = json.comments[0].userComment.device;
    deviceInfo.osVersion = json.comments[0].userComment.androidOsVersion;
    deviceInfo.isoCode = json.comments[0].userComment.reviewerLanguage;
    deviceInfo.deviceMetadata = json.comments[0].userComment.deviceMetadata;

    localeHelper.getCountryAndLanguage(deviceInfo.isoCode, function(country, language) {
      deviceInfo.country = country;
      deviceInfo.language = language;
      const splitIsoArray = deviceInfo.isoCode.split('_');
      deviceInfo.languageCode = splitIsoArray[0].toLowerCase();
      deviceInfo.countryCode = splitIsoArray[1].toLowerCase();
      completion(new Review(deviceInfo, appInfo, reviewInfo));
    });
  }
};
