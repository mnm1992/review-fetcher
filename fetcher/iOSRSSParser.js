const Review = require('../common/review');
const XMLParser = require('xml2js');
const LocaleHelper = require('./localeHelper');
const localeHelper = new LocaleHelper();

module.exports = {

  parse(appId, body, country, completion) {
    const self = this;
    const parsedReviews = [];
    XMLParser.parseString(body, function (err, result) {
      if (err) {
        console.error(err);
        completion([], true, 0);
        return;
      }

      const entries = result.feed.entry;
      if (!entries) {
        completion([], true, 0);
        return;
      }

      entries.forEach(function (entry) {
        self.parseReview(appId, entry, country, function(review){
          parsedReviews.push(review);
        });
      });

      const lastPage = self.getLastPage(result.feed.link);
      completion(parsedReviews, false, lastPage);
    });
  },

  parseReview: function(appId, review, country, completion) {
		const rating = parseFloat(review['im:rating']);
		if (!rating) {
			return;
		}
		const deviceInfo = {};
		const appInfo = {};
		const reviewInfo = {};

		reviewInfo.id = review.id[0];
		reviewInfo.text = review.content[0]._;
		reviewInfo.title = review.title[0];
		reviewInfo.author = review.author ? review.author[0].name[0] : false;
		reviewInfo.dateTime = new Date(review.updated);
		reviewInfo.hasTime = true;
		reviewInfo.rating = rating;
		reviewInfo.source = 'RSS';
		appInfo.id = appId;
		appInfo.version = review['im:version'][0];
		deviceInfo.platform = 'iOS';
		deviceInfo.countryCode = country;

		localeHelper.getCountry(country, function (countryHeader) {
			deviceInfo.country = countryHeader;
      completion(new Review(deviceInfo, appInfo, reviewInfo));
		});
	},

  getLastPage: function(json) {
    var pageNumber = 1;
    json.forEach(function (dictionary) {
      const type = dictionary.$.rel;
      if (type === 'last') {
        const url = dictionary.$.href;
        const nextPageUrl = url.split('?');
        const urlParts = nextPageUrl[0].split('/');
        urlParts.forEach(function (urlPart) {
          if (urlPart.includes('page')) {
            pageNumber = urlPart.split('=')[1];
          }
        });
      }
    });
    return pageNumber;
  }
};
