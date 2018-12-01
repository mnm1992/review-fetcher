/*jslint es6:true*/

const Request = require('request-promise');
const XmlToJson = require('xml2js-es6-promise');
const Review = require('../common/Review');
const LocaleHelper = require('./LocaleHelper');

module.exports = class iOSRSSFetcher {

    async fetchReviews(appName, appId, country) {
        const reviews = [];
        let page = 1;
        let finished = false;
        while (!finished) {
            const url = this.getRequestURLForCountry(appId, country, page);
            const result = await Request(url);
            const json = await XmlToJson(result);
            const entries = json.feed.entry;
            if (!entries) {
                break;
            }
            for (const entry of entries) {
                reviews.push(await this.parseReview(appName, appId, entry, country));
            }
            const lastPage = this.getLastPage(json.feed.link);
            if (page !== lastPage) {
                page++;
            } else {
                finished = true;
            }
        }
        return reviews;
    }

    async parseReview(appName, appId, review, country) {
        const deviceInfo = {};
        const appInfo = {};
        const reviewInfo = {};
        const rating = parseFloat(review['im:rating']);
        reviewInfo.id = review.id[0];
        reviewInfo.text = review.content[0]._;
        reviewInfo.title = review.title[0];
        reviewInfo.author = review.author ? review.author[0].name[0] : false;
        reviewInfo.dateTime = new Date(review.updated);
        reviewInfo.hasTime = true;
        reviewInfo.rating = rating;
        reviewInfo.source = 'RSS';
        appInfo.id = appId;
        appInfo.name = appName;
        appInfo.version = review['im:version'][0];
        deviceInfo.platform = 'iOS';
        deviceInfo.countryCode = country;
        const localeHelper = new LocaleHelper();
        deviceInfo.country = await localeHelper.getCountry(country);
        return new Review(deviceInfo, appInfo, reviewInfo);
    }

    getLastPage(json) {
        let page = 1;
        for (const dictionary of json) {
            const type = dictionary.$.rel;
            if (type === 'last') {
                const url = dictionary.$.href;
                const nextPageUrl = url.split('?');
                const urlParts = nextPageUrl[0].split('/');
                for (const urlPart of urlParts) {
                    if (urlPart.includes('page')) {
                        page = parseInt(urlPart.split('=')[1]);
                    }
                }
            }
        }
        return page;
    }

    getRequestURLForCountry(appId, country, page) {
        return 'https://itunes.apple.com/' + country + '/rss/customerreviews/page=' + page + '/id=' + appId + '/sortby=mostrecent/xml';
    }

};
