module.exports = class AppConfig {
  constructor(appName, androidId, iosId, countries, languages, slackHook, slackChannel, slackBot, androidAuthentication) {
    this.appName = appName;
    this.androidId = androidId;
    this.iosId = iosId;
    this.countries = countries;
    this.languages = languages;
    this.slackHook = slackHook;
    this.slackChannel = slackChannel;
    this.slackBot = slackBot;
    this.androidAuthentication = androidAuthentication;
  }
};
