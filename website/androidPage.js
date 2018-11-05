const HistogramCalculator = require('../common/HistogramCalculator');

module.exports = class AndroidPage {
    constructor(configs, dbHelper, responseHelper) {
        this.configs = configs;
        this.dbHelper = dbHelper;
        this.responseHelper = responseHelper;
    }

    async render(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'Android page: proposition not found');
            return;
        }
        const result = await this.responseHelper.getDefaultParams(config, this.dbHelper);
        result.translate = request.query.translate;
        return this.constructAndroidPage(config, result.defaultParams, result.metadata, response);
    }

    async constructAndroidPage(config, defaultParams, metadata, response) {
        console.time('Preparing the Android page');
        const reviews = await this.dbHelper.getReviews(config.androidConfig.id, config.iOSConfig.id, 'Android');
        const histogramCalculator = new HistogramCalculator();
        const averageDetail = histogramCalculator.averageFromReviews(reviews);
        const histogram = histogramCalculator.calculateHistogram(reviews);
        const ratingHistogram = metadata.androidHistogram ? metadata.androidHistogram : {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
        };
        const appName = metadata.name ? metadata.name : config.appName;
        const androidProperties = {
            tabTitle: config.appName + ' Android Reviews',
            pageTitle: appName + ' Android',
            page: 'Android',
            totalRatings: metadata.androidTotal ? metadata.androidTotal : 0,
            averageRatings: metadata.androidAverage ? metadata.androidAverage : 0,
            totalReviews: averageDetail.amount,
            averageReviews: averageDetail.average,
            ratingHistogram: ratingHistogram,
            reviewHistogram: histogram,
            reviews: reviews
        };
        response.render('reviews', Object.assign(androidProperties, defaultParams));
        console.timeEnd('Preparing the Android page');
    }
};
