/*jslint es6:true*/

const storeMap = require('./iOSStores');
const Request = require('request-promise');
const html2json = require('html2json').html2json;
const HistogramCalculator = require('../common/HistogramCalculator');

module.exports = class IOSRatingFetcher {

    async fetchRatings(appId, country) {
        const options = {
            url: 'http://itunes.apple.com/WebObjects/MZStore.woa/wa/customerReviews?s=143444&id=' + appId + '&displayable-kind=11&#8217',
            headers: {
                'User-Agent': 'iTunes/9.2.1 (Macintosh; Intel Mac OS X 10.5.8) AppleWebKit/533.16',
                'X-Apple-Store-Front': storeMap[country],
                "Accept-Language": 'en-us, en;q=0.50'
            }
        };
        try {
            const result = await Request(options);

            const json = html2json(result);
            const map = {};
            map[country] = this.jsonToHistogram(json);
            return map;
        } catch (error) {
            console.error('Error while fetching ratings for %s: ' + error, country);
            return {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            };
        }
    }

    jsonToHistogram(json) {
        const ratingContainer = json.child[1].child[3].child[1].child[1];
        const amountOf5Stars = parseInt(ratingContainer.child[5].attr['aria-label'][2]);
        const amountOf4Stars = parseInt(ratingContainer.child[7].attr['aria-label'][2]);
        const amountOf3Stars = parseInt(ratingContainer.child[9].attr['aria-label'][2]);
        const amountOf2Stars = parseInt(ratingContainer.child[11].attr['aria-label'][2]);
        const amountOf1Stars = parseInt(ratingContainer.child[13].attr['aria-label'][2]);
        const histogram = {
            1: amountOf1Stars ? amountOf1Stars : 0,
            2: amountOf2Stars ? amountOf2Stars : 0,
            3: amountOf3Stars ? amountOf3Stars : 0,
            4: amountOf4Stars ? amountOf4Stars : 0,
            5: amountOf5Stars ? amountOf5Stars : 0
        };
        const histogramCalculator = new HistogramCalculator();
        const averageSet = histogramCalculator.averageFromHistogram(histogram);
        return {
            histogram: histogram,
            total: averageSet.amount,
            average: averageSet.average
        };
    }
};
