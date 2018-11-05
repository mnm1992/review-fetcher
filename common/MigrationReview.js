const hash = require('object-hash');
const dateLib = require('date-and-time');
const androidDevices = require('android-device-list');
const androidVersions = require('android-versions');

let largestDepth = 0;

module.exports = class Review {

    constructor(deviceInfo, appInfo, reviewInfo, oldReviewInfo) {
        if (!reviewInfo.author) {
            reviewInfo.author = 'Anonymous';
        }

        if (typeof reviewInfo.dateTime === 'string') {
            reviewInfo.dateTime = new Date(reviewInfo.dateTime);
        }

        if (typeof reviewInfo.developerCommentDateTime === 'string') {
            reviewInfo.developerCommentDateTime = new Date(reviewInfo.developerCommentDateTime);
        }

        if (!reviewInfo.source && deviceInfo.platform === 'Android') {
            reviewInfo.source = 'Scraped';
        } else if (!reviewInfo.source && deviceInfo.platform === 'iOS') {
            reviewInfo.source = 'RSS';
        }

        this.appInfo = appInfo;
        this.reviewInfo = reviewInfo;
        this.deviceInfo = deviceInfo;
        this.oldReviewInfo = this.findOldReviewInfo(oldReviewInfo);
        this.logDepth();
    }

    findOldReviewInfo(oldReviewInfo, ignore) {
        let oldReview;
        if(oldReviewInfo) {
            if(Array.isArray(oldReviewInfo)) {
                if(oldReviewInfo[0]) {
                    oldReview = oldReviewInfo[0];
                } else {
                    oldReview = undefined;
                }
            } else if(oldReviewInfo.reviewInfo && !ignore) {
                oldReview = oldReviewInfo;
            } else if(oldReviewInfo.oldReview) {
                oldReview = oldReviewInfo.oldReview;
            } else if(oldReviewInfo.oldreview) {
                oldReview = oldReviewInfo.oldreview;
            } else if(oldReviewInfo.oldReviewInfo){
                oldReview = oldReviewInfo.oldReviewInfo;
            } else if(oldReviewInfo.oldreviewinfo){
                oldReview = oldReviewInfo.oldreviewinfo;
            }
            if(Array.isArray(oldReview)) {
                if(oldReview[0]) {
                    oldReview = oldReview[0];
                } else {
                    oldReview = undefined;
                }
            }
        }
        return oldReview;
    }

    isEnglish() {
        return this.deviceInfo.languageCode === 'en';
    }

    getOldReview() {
        if (this.oldReviewInfo) {
            const oldReview = this.findOldReviewInfo(this.oldReviewInfo, true);
            if(oldReview) {
                if(oldReview.reviewInfo) {
                    return new Review(this.oldReviewInfo.deviceInfo, this.oldReviewInfo.appInfo, this.oldReviewInfo.reviewInfo, oldReview);
                } else if (oldReview.reviewinfo) {
                    return new Review(this.oldReviewInfo.deviceinfo, this.oldReviewInfo.appinfo, this.oldReviewInfo.reviewinfo, oldReview);
                }
            }
        }
        return null;
    }

    logDepth(){
        let depth = 0;
        let review = this.getOldReview();
        while(review){
            depth++;
            review = review.getOldReview();
        }
        if(depth > largestDepth) {
            largestDepth = depth;
            console.log(depth);
        }
    }

    getJSON() {
        const json = {
            'deviceInfo': this.deviceInfo,
            'appInfo': this.appInfo,
            'reviewInfo': this.reviewInfo
        };
        if (this.findOldReviewInfo(this.oldReviewInfo, true)) {
            json['oldReviewInfo'] = this.getOldReview().getJSON();
        }
        return json;
    }
};
