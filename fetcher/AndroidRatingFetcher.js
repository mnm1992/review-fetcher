/*jslint es6:true*/

const Gplay = require('google-play-scraper');

module.exports = class AndroidRatingFetcher {

    async fetchRatings(appId, languageCode) {
        const entries = await Gplay.app({
            appId: appId,
            lang: languageCode,
            cache: false
        });
        const result = {
            androidHistogram: entries.histogram,
            androidTotal: parseInt(entries.reviews),
            androidAverage: parseFloat(entries.score)
        };
        if(languageCode === 'en'){
            result['name'] = entries.title;
        }
        return result;
    }

};
