var AppConfig = require('./appConfig');

// First we need to create an config object see example below
// The AppCOnfig constructer takes a bunch of parameters
// AppName: the name of the app shown on the webpage
// AndroidAppId: the id of you app in the playStore
// IosAppId: the id of you app in the appStore
// Countries: an array of countries for which you want to fetch reviews used for ios
// Languages: an array of languages for which you want to fetch reviews used for android
// SlackHook (optional): The hook used to post reviews on slack see: https://api.slack.com/incoming-webhooks
// SlackChannel (optional): The slack channel in which the reviews need to be posted
// SlackBot (optional): The name of the slack bot you want to use
// JWTFile (optional): Path to the jwt file containg google api tokens. Needed if you want the google api for fetching reviews. See https://developers.google.com/identity/protocols/OAuth2ServiceAccount
/*function uGrowConfig() {
	var slackHook = '<Slack hook url>';
	var countries = ['gb', 'ir', 'nl', 'de'];
	var languages = ['de', 'en', 'nl'];
	return new AppConfig('uGrow', 'com.philips.cl.uGrowDigitalParentingPlatform', '1063224663', countries, languages, slackHook, '#storereviews', 'ReviewBot', '');
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
