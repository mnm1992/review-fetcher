const slackLibrary = require('slack-node');
const slack = new slackLibrary();

module.exports = class SlackHelper {

  constructor(config) {
    this.config = config;
  }

  shareOnSlack(reviews, callback) {
    if (process.env.PORT === undefined) {
      console.log('Not posting to Slack since this is localhost');
      callback();
      return;
    }

    if (!this.config.hook || !this.config.channel || !this.config.botName) {
      console.log('No slack hook configured');
      callback();
      return;
    }

    if (reviews.length === 0) {
      console.log('There are no new reviews to post to slack');
      callback();
      return;
    }

    slack.setWebhook(this.config.hook);

    console.log('Sharing ' + reviews.length + ' on slack');
    reviews.forEach(function(entry) {
      var text = '';
      text += entry.createReviewSlackText();
      if (!text) {
        console.log('Nothing to post to Slack: ');
        return;
      }
      slack.webhook({
        channel: this.config.channel,
        username: this.config.botName,
        text: text
      }, function(err, response) {
        if (err) {
          console.error('Error posting reviews to Slack: ' + err);
        } else {
          console.log('Succesfully posted reviews to slack');
        }
      });

    });
    callback();
  }
};
