const AppConfig = require('./appConfig');
const companyName = 'Example company'; //This is shown when a reply to a review is given. Like: Example company responded with:

module.exports = {

	//The config that is returned when islocalhost is false
	prodConfig: function () {
		const appName = 'uGrow';
		const androidConfig = {
			id: 'com.philips.cl.uGrowDigitalParentingPlatform',
			languages: ['de', 'en', 'nl', 'fr', 'sv', 'it', 'pl', 'ro', 'cs'],
			/*authentication: require('../JWT-token.json') If you have got a JWT token from the pay store you can require it here*/
		};
		const iOSConfig = {
			id: '1063224663',
			countries: ['gb', 'ie', 'us', 'nl', 'de', 'at', 'it', 'se', 'ca', 'pl', 'cz', 'ro', 'es', 'sg', 'be', 'fr', 'lu', 'ch', 'sk', 'hu', 'si', 'dk', 'hr', 'pt']
		};
		const slackConfig = {
			hook: '', //Put the generated slackhook here
			channel: '', //Put the channel you want the reviews to be posted in here
			botName: '', //Put the botName that will post the reviews here
			token: "" //If you suply a slack token the trnaslation of reviews will be posted as a threaded reply else it will be below the review
		};
		return new AppConfig(appName, companyName, androidConfig, iOSConfig, slackConfig);
	},

	//The config that is returned when islocalhost is true
	devConfig: function () {
		const appName = 'uGrow';
		const androidConfig = {
			id: 'com.philips.cl.uGrowDigitalParentingPlatform',
			languages: ['en'],
			/*authentication: require('../JWT-token.json') If you have got a JWT token from the pay store you can require it here*/
		};
		const iOSConfig = {
			id: '1063224663',
			countries: ['gb']
		};
		const slackConfig = {
			hook: '', //Put the generated slackhook here
			channel: '', //Put the channel you want the reviews to be posted in here
			botName: '', //Put the botName that will post the reviews here
			token: "" //If you suply a slack token the trnaslation of reviews will be posted as a threaded reply else it will be below the review
		};
		return new AppConfig(appName, companyName, androidConfig, iOSConfig, slackConfig);
	}
};
