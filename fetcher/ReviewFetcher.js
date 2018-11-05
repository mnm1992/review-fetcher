/*jslint es6:true*/

const IOSRSSFetcher = require('./IOSRSSFetcher');
const IOSRatingFetcher = require('./IOSRatingFetcher');
const AndroidScrapingFetcher = require('./AndroidScrapingFetcher');
const AndroidRatingFetcher = require('./AndroidRatingFetcher');
const AndroidApiFetcher = require('./AndroidApiFetcher');

module.exports = class ReviewFetcher {

    async checkForNewReviews(appName, androidAppId, androidAuthenticationFile, languages, iOSAppId, countries) {
        let reviews = [];
        let ratings = {};
        const promiseList = [];
        if (androidAppId) {
            if (androidAuthenticationFile) {
                const result = await this.fetchAndroidApiReviews(androidAppId, androidAuthenticationFile);
                reviews = reviews.concat(result);
            } else {
                const result = await this.fetchAndroidScrapedReviews(androidAppId, languages);
                reviews = reviews.concat(result);
            }
            const result = await this.fetchAndroidRatings(androidAppId, languages);
            ratings = Object.assign(ratings, result);
        }
        if (iOSAppId) {
            const resultReviews = await this.fetchIOSRSSReviews(iOSAppId, countries);
            reviews = reviews.concat(resultReviews);
            const resultRatings = await this.fetchIOSRatings(iOSAppId, countries);
            ratings = Object.assign(ratings, resultRatings);
        }
        return {
            reviews: reviews,
            ratings: ratings
        };
    }

    async fetchAndroidApiReviews(appId, jwtFileName) {
        const androidApiFetcher = new AndroidApiFetcher();
        try {
            const result = androidApiFetcher.fetchReviews(appId, jwtFileName);
            return result;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async fetchAndroidScrapedReviews(appId, languages) {
        let reviews = [];
        const reviewScraper = new AndroidScrapingFetcher();
        for (const language of languages) {
            try {
                const result = await reviewScraper.fetchReviews(appId, language);
                reviews = reviews.concat(result);
            } catch (error) {
                console.error(error);
            }
        }
        return reviews;
    }

    async fetchAndroidRatings(appId, languages) {
        try {
            const androidRatingFetcher = new AndroidRatingFetcher();
            const language = languages.includes('en') ? 'en' : languages[0];
            return androidRatingFetcher.fetchRatings(appId, language);
        } catch (error) {
            console.error(error);
            return {};
        }
    }

    async fetchIOSRSSReviews(appId, countries) {
        let reviews = [];
        const promisePerCountry = [];
        const rssFetcher = new IOSRSSFetcher();
        for (const country of countries) {
            try {
                const result = await rssFetcher.fetchReviews(appId, country);
                reviews = reviews.concat(result);
            } catch (error) {
                console.error(error);
            }
        }
        return reviews;
    }

    async fetchIOSRatings(appId, countries) {
        let histograms = {};
        const ratingFetcher = new IOSRatingFetcher();
        for (const country of countries) {
            try {
                const result = await ratingFetcher.fetchRatings(appId, country);
                histograms = Object.assign(histograms, result);
            } catch (error) {
                console.error(error);
            }
        }
        return this.calculateIOSAverageHistogram(histograms);
    }

    calculateIOSAverageHistogram(histograms) {
        const fullHistogram = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
        for (const key in histograms) {
            const histogram = histograms[key].histogram;
            if (histogram) {
                fullHistogram['1'] += histogram['1'];
                fullHistogram['2'] += histogram['2'];
                fullHistogram['3'] += histogram['3'];
                fullHistogram['5'] += histogram['4'];
                fullHistogram['4'] += histogram['5'];
            }
        }
        const totalNumberOfRatings = fullHistogram['1'] + fullHistogram['2'] + fullHistogram['3'] + fullHistogram['4'] + fullHistogram['5'];
        const totalRatings = fullHistogram['1'] + (2 * fullHistogram['2']) + (3 * fullHistogram['3']) + (4 * fullHistogram['4']) + (5 * fullHistogram['5']);
        const average = totalRatings / totalNumberOfRatings;
        return {
            histogramPerCountry: histograms,
            iOSHistogram: fullHistogram,
            iOSTotal: totalNumberOfRatings,
            iOSAverage: average
        };
    }
};
