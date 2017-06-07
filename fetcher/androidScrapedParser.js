const Review = require('../common/review');
const dateFormatGueser = require('./dateFormatGueser');
const LocaleHelper = require('./localeHelper');
const localeHelper = new LocaleHelper();

module.exports = {

  parse: function(appId, apps, languageCode, language, completion) {
    const self = this;
    const reviewArray = [];
    var count = apps.length;
    if (count === 0) {
      completion([], true, false);
      return;
    }
    apps.forEach(function(json) {
      const review = self.parseReview(json, appId, languageCode, language);
      reviewArray.push(review);
    });
    const more = reviewArray.length >= 40;
    completion(reviewArray, false, more);
  },

  parseReview: function(json, appId, languageCode, language) {
    const deviceInfo = {};
    const appInfo = {};
    const reviewInfo = {};

    appInfo.id = appId;
    deviceInfo.platform = 'Android';
    deviceInfo.language = language;
    deviceInfo.languageCode = languageCode;
    reviewInfo.id = json.id;
    reviewInfo.text = json.text.replace('Volledige recensie', '').replace('Vollständige Rezension', '');
    reviewInfo.title = json.title;
    reviewInfo.author = json.userName;
    reviewInfo.rating = json.score;
    reviewInfo.source = 'Scraped';
    if (json.replyText) {
      reviewInfo.developerComment = json.replyText;
    }
    if (json.replyDate) {
      const replyDateToParse = json.replyDate;
      reviewInfo.developerCommentDateTime = dateFormatGueser.guesDate(replyDateToParse, languageCode);
    }
    const dateStringToParse = json.date;
    reviewInfo.dateTime = dateFormatGueser.guesDate(dateStringToParse, languageCode);
    return new Review(deviceInfo, appInfo, reviewInfo);
  }
};
