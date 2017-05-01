var hash = require('object-hash');
var dateLib = require('date-and-time');
var androidDevices = require('android-device-list');
var androidVersions = require('android-versions');

module.exports = class Review {

	constructor(deviceInfo, appInfo, reviewInfo) {
		this.appInfo = appInfo;
		this.reviewInfo = reviewInfo;
		this.deviceInfo = deviceInfo;

		if (!reviewInfo.author) {
			reviewInfo.author = 'Anonymous';
		}

		if (typeof reviewInfo.dateTime === 'string') {
			reviewInfo.dateTime = new Date(reviewInfo.dateTime);
		}

		if (typeof reviewInfo.developerCommentDateTime === 'string') {
			reviewInfo.developerCommentDateTime = new Date(reviewInfo.developerCommentDateTime);
		}

		if (!reviewInfo.id) {
			reviewInfo.id = hash([this.appInfo.id, this.reviewInfo.text, this.reviewInfo.title, this.reviewInfo.author, this.reviewInfo.dateTime, this.reviewInfo.rating, this.deviceInfo.language]);
		}
	}

	getHumanFriendlyDeviceMetaData() {
		if (this.deviceInfo.deviceMetadata) {
			var text = "";
			var metadata = this.deviceInfo.deviceMetadata;
			for (var key in metadata) {
				if (metadata.hasOwnProperty(key)) {
					text += (key + ": " + metadata[key] + "\n");
				}
			}
			return text;
		}
		return "";
	}

	getFormattedDeveloperReviewDate() {
		return this.getFormattedDate(this.reviewInfo.developerCommentDateTime, true);
	}

	getFormattedReviewDate() {
		return this.getFormattedDate(this.reviewInfo.dateTime, this.reviewInfo.hasTime);
	}

	getFormattedDate(date, hastime) {
		dateLib.locale('nl');
		if (date) {
			if (hastime) {
				return dateLib.format(date, 'DD MMM YYYY HH:mm:ss');
			}
			return dateLib.format(date, 'DD MMM YYYY');
		}
		return '';
	}

	getRatingText() {
		var ratingText = this.reviewInfo.rating == 1 ? 'star' : 'stars';
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
		var deviceName = androidDevices.getDevicesByDeviceId(this.deviceInfo.device);
		if (deviceName[0]) {
			return deviceName[0].brand + ', ' + deviceName[0].name + '(' + this.deviceInfo.device + ')';
		}
		return 'Unknown: ' + this.deviceInfo.device;
	}

	getDeviceVersionInfo() {
		if (this.deviceInfo.osVersion) {
			var osData = androidVersions.get(this.deviceInfo.osVersion);
			var osName = this.deviceInfo.osVersion;
			if (osData) {
				osName = osData.name;
				var osNumber = osData.semver;
				return osName + '(' + osNumber + ')';
			}
		}
		return 'Unknown API: ' + this.deviceInfo.osVersion;
	}

	getDeviceInfo() {
		return this.getDeviceModelInfo() + ', ' + this.getDeviceVersionInfo();
	}

	getJSON() {
		return {
			'deviceInfo': this.deviceInfo,
			'appInfo': this.appInfo,
			'reviewInfo': this.reviewInfo
		};
	}

	createReviewSlackText() {
		var slackText = '';
		slackText += this.deviceInfo.platform + ' ';
		slackText += this.getRatingText();
		slackText += ' on ' + this.getFormattedReviewDate() + '\n';
		slackText += this.reviewInfo.title ? '\'' + this.reviewInfo.title + '\' - ' : '';
		slackText += this.reviewInfo.author ? this.reviewInfo.author : '';
		slackText += '\n';
		slackText += this.reviewInfo.text + '\n';
		if (this.appInfo.version && this.appInfo.versionCode) {
			slackText += 'v' + this.appInfo.version + ', ' + this.appInfo.versionCode + ', ' + this.getLocationText() + '\n';
			slackText += this.getDeviceInfo();
		} else if (this.appInfo.version) {
			slackText += 'v' + this.appInfo.version + ', ' + this.getLocationText();
		} else {
			slackText += this.getLocationText();
		}
		slackText += '\n\n';
		return slackText;
	}
};
