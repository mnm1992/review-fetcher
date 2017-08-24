const slackLibrary = require('slack-node');
const slack = new slackLibrary();
const translate = require('google-translate-api');
const async = require('async');
const request = require('request');

module.exports = class SlackHelper {

	constructor(config, isLocalHost) {
		this.config = config;
		this.isLocalHost = isLocalHost;
	}

	shareOnSlack(reviews, completion) {
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
				if (self.config.token) {
					self.postToSlackAPI(review, review.reviewInfo.translatedTitle, review.reviewInfo.translatedText, callback);
				} else {
					var slackText = self.createReviewSlackText(review, review.reviewInfo.title, review.reviewInfo.text);
					if (review.reviewInfo.translatedText && review.deviceInfo.languageCode !== 'en') {
						slackText += '\n\nTranslation:\n';
						if (review.reviewInfo.translatedTitle) {
							slackText += review.reviewInfo.translatedTitle + '\n';
						}
						slackText += review.reviewInfo.translatedText;
						slackText += '\n\n';
					}
					self.postToSlackViaHook(slackText, callback);
				}
			});
		}
		async.parallel(reviewPostFunctions, function (err, results) {
			console.timeEnd('Sharing ' + filteredReviews.length + ' on slack');
			completion();
		});
	}

	postToSlackViaHook(text, callback) {
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

	postToSlack(config, text, ts, callback) {
		const postBody = {
			token: config.token,
			channel: config.channel,
			text: text,
			username: config.botName,
			icon_url: 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2017-04-24/173574796596_142629a22f10e01a7481_72.png'
		};
		if (ts) {
			postBody.thread_ts = ts;
		}
		request({
			method: "post",
			form: postBody,
			url: "https://slack.com/api/chat.postMessage",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
		}, function (requestError, response, body) {
			if (!requestError) {
				const message = JSON.parse(body).message;
				if (message) {
					callback(message.ts);
				} else {
					callback(undefined);
				}
			} else {
				console.error('Error posting reviews to Slack: ' + requestError);
				callback(undefined);
			}
		});
	}

	postToSlackAPI(review, translatedTitle, translatedText, callback) {
		const config = this.config;
		const self = this;
		var text = self.createReviewSlackText(review, review.reviewInfo.title, review.reviewInfo.text);

		this.postToSlack(config, text, undefined, (ts) => {
			var text = self.createReviewSlackText(review, translatedTitle, translatedText);
			if (ts && translatedText && review.deviceInfo.languageCode !== 'en') {
				this.postToSlack(config, text, ts, (ts) => {
					callback();
				});
			} else {
				callback();
			}
		});
	}

	createReviewSlackText(review, title, text) {
		var slackText = review.updated ? 'Updated: ' : '';
		slackText += review.deviceInfo.platform + ' ';
		slackText += review.getRatingText();
		slackText += ' on ' + review.getFormattedReviewDate() + '\n';
		slackText += title ? '\'' + title + '\' - ' : '';
		slackText += review.reviewInfo.author ? review.reviewInfo.author : '';
		slackText += '\n';
		slackText += text + '\n';
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
		return slackText;
	}
};
