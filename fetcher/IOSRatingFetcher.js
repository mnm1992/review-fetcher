/*jslint es6:true*/

const storeMap = require('./iOSStores');
const Request = require('request-promise');
const html2json = require('html2json').html2json;
const HistogramCalculator = require('../common/HistogramCalculator');

module.exports = class IOSRatingFetcher {

    constructor() {
        this.emptyResponse ={
            histogram: {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            },
            total: 0,
            average: 0
        };
    }

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
            map[country] = this.jsonToHistogram(json, country);
            return map;
        } catch (error) {
            console.error('Error while fetching ratings for %s: ' + error, country);
            const map = {};
            map[country] = this.emptyResponse;
            return map;
        }
    }

    walkJsonTree(path, json) {
        if(!json || !path) {
            return null;
        }
        const pathComponents = path.split('/');
        let currentView = json;
        for (let i = 0; i < pathComponents.length; i++) {
            if (currentView[pathComponents[i]]) {
                currentView = currentView[pathComponents[i]];
            } else {
                return null;
            }
        }
        return currentView;
    }
    

    jsonToHistogram(json, country) {
        const ratingContainer = this.walkJsonTree('child/1/child/3/child/1/child/1', json) ;
        if(!ratingContainer) {
            return this.emptyResponse;
        }

        const amountOf5Stars = parseInt(this.walkJsonTree('child/5/attr/aria-label/2', ratingContainer));
        const amountOf4Stars = parseInt(this.walkJsonTree('child/7/attr/aria-label/2', ratingContainer));
        const amountOf3Stars = parseInt(this.walkJsonTree('child/9/attr/aria-label/2', ratingContainer));
        const amountOf2Stars = parseInt(this.walkJsonTree('child/11/attr/aria-label/2', ratingContainer));
        const amountOf1Stars = parseInt(this.walkJsonTree('child/13/attr/aria-label/2', ratingContainer));

        if(!amountOf5Stars || !amountOf4Stars || !amountOf3Stars || !amountOf2Stars || !amountOf1Stars || isNaN(amountOf5Stars) || isNaN(amountOf4Stars) || isNaN(amountOf3Stars) || isNaN(amountOf2Stars) || isNaN(amountOf1Stars)) {
            console.error('Not enough ratings for %s or apple changed the page layout', country);
            return this.emptyResponse;
        }
        const histogram = {
            1: amountOf1Stars,
            2: amountOf2Stars,
            3: amountOf3Stars,
            4: amountOf4Stars,
            5: amountOf5Stars
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
