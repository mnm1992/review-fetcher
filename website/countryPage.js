const HistogramCalculator = require('../common/HistogramCalculator');

module.exports = class CountryPage {
    constructor(configs, dbHelper, responseHelper) {
        this.configs = configs;
        this.dbHelper = dbHelper;
        this.responseHelper = responseHelper;
    }

    async render(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'Country page: proposition not found');
            return;
        }
        const option = request.params.countryCode.toLowerCase();
        const result = await this.responseHelper.getDefaultParams(config, this.dbHelper);
        result.translate = request.query.translate;
        return this.constructCountryPage(config, option, result.defaultParams, result.metadata, response);
    }

    async constructCountryPage(config, country, defaultParams, metadata, response) {
        console.time('Preparing the country page for ' + country);
        const reviews = await this.dbHelper.getReviewsForCountry(config.androidConfig.id, config.iOSConfig.id, country);
        const countryName = this.findCountryName(metadata.countries, country);

        const histogramCalculator = new HistogramCalculator();
        const reviewHistogram = histogramCalculator.calculateHistogram(reviews);
        let ratingHistogram = histogramCalculator.calculateHistogram(reviews, 'android');
        ratingHistogram = histogramCalculator.mergeHistograms(ratingHistogram, this.findIOSHistogramForCountry(country, metadata));
        const ratingDetails = histogramCalculator.averageFromHistogram(ratingHistogram);
        const ratingAverage = ratingDetails.average;
        const ratingTotal = ratingDetails.amount;
        const reviewsDetails = histogramCalculator.averageFromHistogram(reviewHistogram);
        const reviewAverage = reviewsDetails.average;
        const reviewTotal = reviewsDetails.amount;
        const appName = metadata.name ? metadata.name : config.appName;
        const countryProperties = {
            tabTitle: config.appName + ' ' + country + ' Reviews',
            pageTitle: appName + ' ' + countryName,
            hint: 'Android ratings not available',
            page: 'Countries',
            totalRatings: ratingTotal,
            averageRatings: ratingAverage,
            totalReviews: reviewTotal,
            averageReviews: reviewAverage,
            ratingHistogram: ratingHistogram,
            reviewHistogram: reviewHistogram,
            reviews: reviews
        };
        response.render('reviews', Object.assign(countryProperties, defaultParams));
        console.timeEnd('Preparing the country page for ' + country);
    }

    findIOSHistogramForCountry(country, ratingJSON) {
        return ratingJSON.histogramPerCountry[country].histogram;
    }

    findCountryName(countries, code) {
        for (const countryDict of countries) {
            const currentCode = Object.keys(countryDict)[0];
            if (currentCode === code) {
                return countryDict[code];
            }
        }
        return code;
    }
};
