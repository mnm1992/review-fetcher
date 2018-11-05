const slackLibrary = require('slack-node');
const slack = new slackLibrary();
const Request = require('request-promise');

module.exports = class SlackHelper {

    async shareOnSlack(config, filteredReviews, isLocalHost) {
        if (!config.hook || !config.channel || !config.botName) {
            console.error('No slack hook configured');
            return;
        }

        if (filteredReviews.length === 0) {
            console.error('There are no new reviews to post to slack');
            return;
        }

        for (const review of filteredReviews) {
            if (!review.reviewInfo.text) {
                console.error('Cannot post to slack review has no text');
                continue;
            }
            if (config.token) {
                await this.postToSlackAPI(config, review, review.reviewInfo.translatedTitle, review.reviewInfo.translatedText);
            } else {
                let slackText = this.createReviewSlackText(review, review.reviewInfo.title, review.reviewInfo.text);
                if (review.reviewInfo.translatedText && review.deviceInfo.languageCode !== 'en') {
                    slackText += '\n\nTranslation:\n';
                    if (review.reviewInfo.translatedTitle) {
                        slackText += review.reviewInfo.translatedTitle + '\n';
                    }
                    slackText += review.reviewInfo.translatedText;
                    slackText += '\n\n';
                }
                await this.postToSlackViaHook(slackText, callback);
            }
        }
    }

    postToSlackViaHook(text) {
        return new Promise((resolve, reject) => {
            slack.setWebhook(config.hook);
            slack.webhook({
                channel: config.channel,
                username: config.botName,
                text: text
            }, function (err, response) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async postToSlack(config, text, ts) {
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
        try {
            const response = await Request({
                method: "post",
                form: postBody,
                url: "https://slack.com/api/chat.postMessage",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
            const message = JSON.parse(response);
            if (message) {
                return message.ts;
            }
        } catch (error) {
            console.error(error);
        }
        return;
    }

    async postToSlackAPI(config, review, translatedTitle, translatedText) {
        let text = this.createReviewSlackText(review, review.reviewInfo.title, review.reviewInfo.text);
        const ts = await this.postToSlack(config, text, undefined);
        if (ts && translatedText && review.deviceInfo.languageCode !== 'en') {
            text = self.createReviewSlackText(review, translatedTitle, translatedText);
            await this.postToSlack(config, text, ts);
        }
    }

    createReviewSlackText(review, title, text) {
        let slackText = review.updated ? 'Updated: ' : '';
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
