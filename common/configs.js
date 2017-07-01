var AppConfig = require('./appConfig');

// First we need to create an config object see example below
// The AppConfig constructer takes a bunch of parameters
// AppName: the name of the app shown on the webpage
// CompanyName: the name of the app shown on the webpage when a response has been given to a review
// It also has 3 sub object androidConfig, iOSConfig, slackConfig

// androidConfig
// id: the id of you app in the playStore
// languages: an array of languages for which you want to fetch reviews used for android
// authentication (optional): Path to the jwt file containg google api tokens. Needed if you want the google api for fetching reviews. See https://developers.google.com/identity/protocols/OAuth2ServiceAccount

// iOSConfig
// id: the id of you app in the appStore
// countries: an array of countries for which you want to fetch reviews used for ios

// slackConfig (optional)
// hook: The hook used to post reviews on slack see: https://api.slack.com/incoming-webhooks
// channel (optional): The slack channel in which the reviews need to be posted
// botName (optional): The name of the slack bot you want to use

//Example config
/*
function uGrowConfig() {
	const appName = 'uGrow';
  const companyName = 'Philips';
  const androidConfig = {
    id: 'com.philips.cl.uGrowDigitalParentingPlatform',
    languages: ['de', 'en', 'nl', 'fr', 'sv', 'it'],
    authentication: require('../authentication/uGrow-JWT-token.json')
  };
  const iOSConfig = {
    id: '1063224663',
    countries: ['gb', 'ie', 'us', 'nl', 'de', 'at', 'it', 'se', 'ca', 'pl', 'cz', 'ro', 'es', 'sg', 'be', 'fr', 'lu', 'ch', 'sk', 'hu', 'si', 'dk', 'hr', 'pt']
  };
  const slackConfig = {
    hook: 'https://hooks.slack.com/services/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',
    channel: '#storereviews',
    botName: 'emmyHelper'
  };
  return new AppConfig(appName, companyName, androidConfig, iOSConfig, slackConfig);
}
*/

module.exports = {
	// replace the word ugrow below with the appname you defined in the config above
	/*configForApp: function (app) {
		if (app === 'ugrow') {
			return uGrowConfig();
		}
		return null;
	},

	//Replace uGrow config in the array below with the config you just made above
	allConfigs: function () {
		return [uGrowConfig()];
	}*/
};
