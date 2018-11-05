const HistogramCalculator = require('../common/HistogramCalculator');

module.exports = class AppPage {
    constructor(configs, dbHelper, responseHelper) {
        this.configs = configs;
        this.dbHelper = dbHelper;
        this.responseHelper = responseHelper;
    }

    async render(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'App page: proposition not found');
            return;
        }
        const result = await this.responseHelper.getDefaultParams(config, this.dbHelper);
        result.translate = request.query.translate;
        return this.constructAppPage(config, result.defaultParams, result.metadata, response);
    }

    async constructAppPage(config, defaultParams, metadata, response) {
        console.time('Preparing the ' + config.appName + ' page');
        const reviews = await this.dbHelper.getAllReviews(config.androidConfig.id, config.iOSConfig.id);
        const androidTotal = metadata.androidTotal ? metadata.androidTotal : 0;
        const androidAverage = metadata.androidAverage ? metadata.androidAverage : 0;
        const iosTotal = metadata.iOSTotal ? metadata.iOSTotal : 0;
        const iosAverage = metadata.iOSAverage ? metadata.iOSAverage : 0;
        const totalRatings = (iosTotal + androidTotal);
        const saveRatingDivider = (totalRatings === 0) ? 1 : totalRatings;

        const histogramCalculator = new HistogramCalculator();
        const averageDetail = histogramCalculator.averageFromReviews(reviews);
        const averageRatings = ((iosTotal * iosAverage) + (androidTotal * androidAverage)) / saveRatingDivider;
        const reviewHistogram = histogramCalculator.calculateHistogram(reviews);
        const ratingHistogram = histogramCalculator.mergeHistograms(metadata.androidHistogram, metadata.iOSHistogram);
        const appName = metadata.name ? metadata.name : config.appName;
        const appProperties = {
            tabTitle: config.appName + ' Reviews',
            pageTitle: appName,
            page: 'Home',
            totalRatings: totalRatings,
            averageRatings: averageRatings,
            totalReviews: averageDetail.amount,
            averageReviews: averageDetail.average,
            ratingHistogram: ratingHistogram,
            reviewHistogram: reviewHistogram,
            reviews: reviews
        };
        response.render('reviews', Object.assign(appProperties, defaultParams));
        console.timeEnd('Preparing the ' + config.appName + ' page');
    }
};
