const androidDevices = require('android-device-list');
const androidVersions = require('android-versions');

let largestDepth = 0;

module.exports = class MigrationReview {

    constructor(deviceInfo, appInfo, reviewInfo, oldReviewInfo) {
        if (!reviewInfo.author) {
            reviewInfo.author = 'Anonymous';
        }

        if(reviewInfo.developerCommentDateTime && reviewInfo.developerCommentDateTime.getTime() === 0) {
          delete reviewInfo.developerCommentDateTime;
          delete reviewInfo.developerComment;
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

        if(deviceInfo.device && !deviceInfo.brand) {
            const deviceName = androidDevices.getDevicesByDeviceId(deviceInfo.device);
            if (deviceName[0]) {
                deviceInfo.brand = deviceName[0].brand;
                deviceInfo.name = deviceName[0].name;
                deviceInfo.model = deviceName[0].model;
            }
        }

        if (deviceInfo.osVersion && !deviceInfo.osName) {
            const osData = androidVersions.get(deviceInfo.osVersion);
            if (osData) {
                deviceInfo.osName = osData.name;
                deviceInfo.osSemVer = osData.semver;
                deviceInfo.osNdk = osData.ndk;
            }
        }

        this.appInfo = appInfo;
        this.lookupAppName(appInfo.id);
        this.reviewInfo = reviewInfo;
        this.deviceInfo = deviceInfo;
        this.oldReviewInfo = this.findOldReviewInfo(oldReviewInfo);
        this.logDepth();
    }

    lookupAppName(id){
        const Configs = require('./Configs');
        const configs = new Configs();
        this.appInfo.name = configs.configForId(id);
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
                    return new MigrationReview(this.oldReviewInfo.deviceInfo, this.oldReviewInfo.appInfo, this.oldReviewInfo.reviewInfo, oldReview);
                } else if (oldReview.reviewinfo) {
                    return new MigrationReview(this.oldReviewInfo.deviceinfo, this.oldReviewInfo.appinfo, this.oldReviewInfo.reviewinfo, oldReview);
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
