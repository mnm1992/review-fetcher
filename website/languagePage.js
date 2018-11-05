const HistogramCalculator = require('../common/HistogramCalculator');

module.exports = class LanguagePage {
    constructor(configs, dbHelper, responseHelper) {
        this.configs = configs;
        this.dbHelper = dbHelper;
        this.responseHelper = responseHelper;
    }

    async render(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'Language page: proposition not found');
            return;
        }
        const option = request.params.languageCode.toLowerCase();
        const result = await this.responseHelper.getDefaultParams(config, this.dbHelper);
        result.defaultParams.translate = request.query.translate;
        return this.constructLanguagePage(config, option, result.defaultParams, result.metadata, response);
    }

    async constructLanguagePage(config, language, defaultParams, metadata, response) {
        console.time('Preparing the country page for ' + language);
        const reviews = await this.dbHelper.getReviewsForLanguage(config.androidConfig.id, config.iOSConfig.id, language);
        const countryName = this.findLanguageName(metadata.languages, language);

        const histogramCalculator = new HistogramCalculator();
        const reviewHistogram = histogramCalculator.calculateHistogram(reviews);
        const reviewsDetails = histogramCalculator.averageFromHistogram(reviewHistogram);
        const reviewAverage = reviewsDetails.average;
        const reviewTotal = reviewsDetails.amount;
        const appName = metadata.name ? metadata.name : config.appName;
        const languageProperties = {
            tabTitle: config.appName + ' ' + language + ' Reviews',
            pageTitle: appName + ' ' + countryName,
            hint: 'Rating not available',
            page: 'Countries',
            totalRatings: reviewTotal,
            averageRatings: reviewAverage,
            totalReviews: reviewTotal,
            averageReviews: reviewAverage,
            ratingHistogram: reviewHistogram,
            reviewHistogram: reviewHistogram,
            reviews: reviews
        };
        response.render('reviews', Object.assign(languageProperties, defaultParams));
        console.timeEnd('Preparing the country page for ' + language);
    }

    findLanguageName(languages, code) {
        for (const languageDict of languages) {
            const currentCode = Object.keys(languageDict)[0];
            if (currentCode === code) {
                return languageDict[code];
            }
        }
        return code;
    }
};
