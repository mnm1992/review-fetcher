/*jslint es6:true*/

const { google } = require('googleapis');
const path = require('path');
const LocaleHelper = require('./LocaleHelper');
const Review = require('../common/Review');

module.exports = class AndroidApiFetcher {

    async fetchReviews(appId, jwtFileName) {
        const reviews = [];
        const client = await google.auth.getClient({
            keyFile: path.join(__dirname, jwtFileName),
            scopes: 'https://www.googleapis.com/auth/androidpublisher'
        });
        const options = {
            auth: client,
            packageName: appId,
            maxResults: 100
        };
        let finished = false;
        while (!finished) {
            const entries = await this.googleApiWrapper(options);
            const fetchedReviews = entries.data.reviews;
            if (entries.data.tokenPagination && fetchedReviews.length > 0) {
                options.token = entries.data.tokenPagination.nextPageToken;
            } else {
                finished = true;
            }
            for (const entry of fetchedReviews) {
                reviews.push(await this.parseReview(appId, entry));
            }
        }
        return reviews;
    }

    async parseReview(appId, json) {
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
            reviewInfo.developerCommentHasTime = true;
        }

        deviceInfo.platform = 'Android';
        deviceInfo.device = json.comments[0].userComment.device;
        deviceInfo.osVersion = json.comments[0].userComment.androidOsVersion;
        deviceInfo.isoCode = json.comments[0].userComment.reviewerLanguage;
        deviceInfo.deviceMetadata = json.comments[0].userComment.deviceMetadata;

        const splitIsoArray = deviceInfo.isoCode.split('_');
        const langString = splitIsoArray[0];
        const countryString = splitIsoArray[1];
        const localeHelper = new LocaleHelper();
        deviceInfo.country = await localeHelper.getCountry(countryString);
        deviceInfo.language = await localeHelper.getLanguage(langString);
        deviceInfo.languageCode = langString.toLowerCase();
        deviceInfo.countryCode = countryString.toLowerCase();

        return new Review(deviceInfo, appInfo, reviewInfo);
    }

    async googleApiWrapper(options) {
        return new Promise(async (resolve, reject) => {
            const androidpublisher = google.androidpublisher('v2');
            androidpublisher.reviews.list(options, (err, resp) => {
                if (err) {
                    reject(err);
                } else if (resp.size === 0) {
                    reject('The response from the playstore was empty');
                } else {
                    resolve(resp);
                }
            });
        });
    }

};
