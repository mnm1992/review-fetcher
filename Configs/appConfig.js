module.exports = class AppConfig {
	constructor(appName, companyName, androidConfig, iOSConfig, slackConfig) {
		this.appName = appName;
		this.companyName = companyName;
		this.androidConfig = androidConfig; //id, languages, authentication
		this.iOSConfig = iOSConfig; //id, countries
		this.slackConfig = slackConfig; //shook, channel, botName
	}
};
