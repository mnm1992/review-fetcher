const slackLibrary = require('slack-node');
const slack = new slackLibrary();
const translate = require('google-translate-api');
const async = require('async');

module.exports = class SlackHelper {

	constructor(config, isLocalHost) {
		this.config = config;
		this.isLocalHost = isLocalHost;
	}

	translateReview(reviewTitle, reviewText, from, completion) {
		if (from === 'en') {
			completion(undefined, undefined);
			return;
		}
		const splitChar = '1958745213654789';
		const stringToTranslate = reviewTitle + splitChar + reviewText
		const options = {
			to: 'en'
		};
		if (from) {
			options.from = from;
		}
		translate(stringToTranslate, options).then(res => {
			if (res.from.language.iso === 'en') {
				completion(undefined, undefined);
				return;
			}
			const results = res.text.split(splitChar);
			const translatedTitle = results[0];
			const translatedText = results[1];
			completion(translatedTitle, translatedText);
		}).catch(err => {
			console.error(err);
			completion(undefined, undefined);
		});
	}

	shareOnSlack(reviews, completion) {
		if (this.isLocalHost) {
			console.log('Not posting to Slack since this is localhost');
			completion();
			return;
		}

		if (!this.config.hook || !this.config.channel || !this.config.botName) {
			console.log('No slack hook configured');
			completion();
			return;
		}

		const filteredReviews = reviews.filter((review) => {
			return review.reviewInfo.text;
		});

		if (filteredReviews.length === 0) {
			console.log('There are no new reviews to post to slack');
			completion();
			return;
		}
		console.time('Sharing ' + filteredReviews.length + ' on slack');

		const reviewPostFunctions = [];
		const self = this;
		for (let review of filteredReviews) {
			reviewPostFunctions.push(function (callback) {
				self.translateReview(review.reviewInfo.title, review.reviewInfo.text, review.deviceInfo.languageCode, function (translatedTitle, translatedText) {
					self.postToSlack(self.createReviewSlackText(review, translatedTitle, translatedText), callback);
				});
			});
		}
		async.parallel(reviewPostFunctions, function (err, results) {
			console.timeEnd('Sharing ' + filteredReviews.length + ' on slack');
			completion();
		});
	}

	postToSlack(text, callback) {
		slack.setWebhook(this.config.hook);
		slack.webhook({
			channel: this.config.channel,
			username: this.config.botName,
			text: text
		}, function (err, response) {
			if (err) {
				console.error('Error posting reviews to Slack: ' + err);
			}
			callback();
		});
	}

	createReviewSlackText(review, translatedTitle, translatedText) {
		var slackText = '';
		slackText += review.deviceInfo.platform + ' ';
		slackText += review.getRatingText();
		slackText += ' on ' + review.getFormattedReviewDate() + '\n';
		slackText += review.reviewInfo.title ? '\'' + review.reviewInfo.title + '\' - ' : '';
		slackText += review.reviewInfo.author ? review.reviewInfo.author : '';
		slackText += '\n';
		slackText += review.reviewInfo.text + '\n';
		if (review.appInfo.version && review.appInfo.versionCode) {
			slackText += 'v' + review.appInfo.version + ', ' + review.appInfo.versionCode + ', ' + review.getLocationText() + '\n';
			if (review.deviceInfo.device) {
				slackText += review.getDeviceInfo();
			}
		} else if (review.appInfo.version) {
			slackText += 'v' + review.appInfo.version + ', ' + review.getLocationText();
		} else {
			slackText += review.getLocationText();
		}
		if (translatedText) {
			slackText += '\n\nTranslation:\n';
			if (translatedTitle) {
				slackText += translatedTitle + '\n';
			}
			slackText += translatedText;
			slackText += '\n\n';
		}
		return slackText;
	}
};
