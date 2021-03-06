const moment = require('moment');
const androidDevices = require('android-device-list');
const androidVersions = require('android-versions');

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

        this.appInfo = appInfo;
        this.reviewInfo = reviewInfo;
        this.deviceInfo = deviceInfo;
        this.oldReviewInfo = oldReviewInfo;
    }

    isEnglish() {
        return this.deviceInfo.languageCode === 'en';
    }

    getOldReview() {
        if (this.oldReviewInfo) {
            return new Review(this.oldReviewInfo.deviceInfo, this.oldReviewInfo.appInfo, this.oldReviewInfo.reviewInfo, this.oldReviewInfo.oldReviewInfo);
        }
        return null;
    }

    getJSON() {
        const json = {
            'deviceInfo': this.deviceInfo,
            'appInfo': this.appInfo,
            'reviewInfo': this.reviewInfo
        };
        if (this.oldReviewInfo) {
            json['oldReviewInfo'] = this.oldReviewInfo;
        }
        return json;
    }

    getHumanFriendlyDeviceMetaData() {
        if (this.deviceInfo.deviceMetadata) {
            let text = "";
            const metadata = this.deviceInfo.deviceMetadata;
            for (const key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    text += (key + ": " + metadata[key] + "\n");
                }
            }
            return text;
        }
        return "";
    }

    getFormattedDeveloperReviewDate() {
        return this.getFormattedDate(this.reviewInfo.developerCommentDateTime, this.reviewInfo.developerCommentHasTime);
    }

    getFormattedReviewDate() {
        return this.getFormattedDate(this.reviewInfo.dateTime, this.reviewInfo.hasTime);
    }

    getFormattedDate(date, hastime) {
        moment.locale('en');
        if (date) {
            if (hastime) {
                return moment(date).format('DD MMM YYYY HH:mm:ss');
            }
            return moment(date).format('DD MMM YYYY');
        }
        return '';
    }

    getRatingText() {
        const ratingText = this.reviewInfo.rating === 1 ? 'star' : 'stars';
        return this.reviewInfo.rating + ' ' + ratingText;
    }

    getLocationText() {
        if (this.deviceInfo.country && this.deviceInfo.language) {
            return this.deviceInfo.country + ', ' + this.deviceInfo.language;
        }
        if (this.deviceInfo.country) {
            return this.deviceInfo.country;
        }
        return this.deviceInfo.language;
    }

    getDeviceModelInfo() {
        if(this.deviceInfo.device && !this.deviceInfo.brand) {
            const deviceName = androidDevices.getDevicesByDeviceId(this.deviceInfo.device);
            if (deviceName[0]) {
                this.deviceInfo.brand = deviceName[0].brand;
                this.deviceInfo.name = deviceName[0].name;
                this.deviceInfo.model = deviceName[0].model;
            }
        }

        if (this.deviceInfo.brand) {
            return this.deviceInfo.brand + ', ' + this.deviceInfo.name + '(' + this.deviceInfo.device + ')';
        }
        return 'Unknown: ' + this.deviceInfo.device;
    }

    getDeviceVersionInfo() {
        if (this.deviceInfo.osVersion && !this.deviceInfo.osName) {
            const osData = androidVersions.get(this.deviceInfo.osVersion);
            if (osData) {
                this.deviceInfo.osName = osData.name;
                this.deviceInfo.osSemVer = osData.semver;
                this.deviceInfo.osNdk = osData.ndk;
            }
        }
        if (this.deviceInfo.osName) {
            return this.deviceInfo.osName + '(' + this.deviceInfo.osSemVer + ')';
        }
        return 'Unknown API: ' + this.deviceInfo.osVersion;
    }

    getDeviceInfo() {
        return this.getDeviceModelInfo() + ', ' + this.getDeviceVersionInfo();
    }

    getHistory() {
        let text = "";
        let currentReview = this;
        while (currentReview) {
            text += currentReview.getHTML();
            currentReview = currentReview.getOldReview();
        }
        return text;
    }

    getHTML(translate) {
        const platformIcon = this.deviceInfo.platform === 'Android' ? 'fa-android' : 'fa-apple';
        let htmlText = "<h5>" + this.getRatingText() + " on " + this.getFormattedReviewDate() + "</h5>";
        htmlText += "<p>";
        const title = (typeof translate !== 'undefined') ? this.reviewInfo.translatedTitle : this.reviewInfo.title;
        const text = (typeof translate !== 'undefined') ? this.reviewInfo.translatedText : this.reviewInfo.text;
        const titleHTML = title ? "<em>\"" + title + "\"</em> - " : "";
        htmlText += titleHTML + this.reviewInfo.author + "<br>";
        htmlText += text + "<br>";
        htmlText += "<small><i class=\"fa " + platformIcon + "\" aria-hidden=\"true\"></i> </small>";
        if (this.appInfo.version && this.appInfo.versionCode) {
            htmlText += "<small>v" + this.appInfo.version + ", " + this.appInfo.versionCode + ", " + this.getLocationText() + "</small><br>";
            if (this.deviceInfo.device) {
                htmlText += "<span data-toggle=\"tooltip\" data-placement=\"bottom\" title=\"" + this.getHumanFriendlyDeviceMetaData() + "\">";
                htmlText += ("<small>" + this.getDeviceInfo() + "</small>");
            }
            htmlText += "</span>";
        } else if (this.appInfo.version) {
            htmlText += "<small>v";
            htmlText += this.appInfo.version + ", " + this.getLocationText() + "</small>";
        } else {
            htmlText += "<small>" + this.getLocationText() + "</small>";
        }
        if (this.reviewInfo.developerCommentDateTime) {
            htmlText += "<blockquote><em>";
            htmlText += "Philips" + " responded on " + this.getFormattedDeveloperReviewDate();
            htmlText += "<br>";
            htmlText += this.reviewInfo.developerComment;
            htmlText += "</em></blockquote>";
        }
        htmlText += "</p>";
        return htmlText;
    }
};
