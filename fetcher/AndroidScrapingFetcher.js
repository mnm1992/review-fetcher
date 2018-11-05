/*jslint es6:true*/

const Gplay = require('google-play-scraper');
const Review = require('../common/Review');
const LocaleHelper = require('./LocaleHelper');
const DateFormatGueser = require('./DateFormatGueser');

module.exports = class AndroidScrapingFetcher {

    async fetchReviews(appId, languageCode) {
        const reviews = [];
        let page = 0;
        let finished = false;
        while (!finished) {
            const entries = await Gplay.reviews({
                appId: appId,
                page: page,
                lang: languageCode,
                cache: false
            });

            const count = entries.length;
            if (count === 0) {
                finished = true;
            }

            for (const entry of entries) {
                reviews.push(await this.parseReview(appId, entry, languageCode));
            }
            page++;
        }
        return reviews;
    }

    async parseReview(appId, json, languageCode) {
        const dateFormatGueser = new DateFormatGueser();
        const deviceInfo = {};
        const appInfo = {};
        const reviewInfo = {};
        appInfo.id = appId;
        deviceInfo.platform = 'Android';
        const localeHelper = new LocaleHelper();
        deviceInfo.language = await localeHelper.getLanguage(languageCode);
        deviceInfo.languageCode = languageCode;
        reviewInfo.id = json.id;
        const text = json.text;
        if (text) {
            reviewInfo.text = text.replace('Volledige recensie', '').replace('Vollständige Rezension', '');
        }
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
            reviewInfo.developerCommentHasTime = false;
        }
        const dateStringToParse = json.date;
        reviewInfo.dateTime = dateFormatGueser.guesDate(dateStringToParse, languageCode);
        return new Review(deviceInfo, appInfo, reviewInfo);
    }

};
