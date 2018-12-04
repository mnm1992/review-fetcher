const HistogramCalculator = require('../common/HistogramCalculator');

module.exports = class IOSPage {
    constructor(configs, dbHelper, responseHelper) {
        this.configs = configs;
        this.dbHelper = dbHelper;
        this.responseHelper = responseHelper;
    }

    async render(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'iOS page: proposition not found');
            return;
        }
        const result = await this.responseHelper.getDefaultParams(config, this.dbHelper);
        result.translate = request.query.translate;
        return this.constructIOSPage(config, result.defaultParams, result.metadata, response);
    }

    async constructIOSPage(config, defaultParams, metadata, response) {
        console.time('Preparing the iOS page');
        const reviews = await this.dbHelper.getReviews(config.androidConfig.id, config.iOSConfig.id, 'iOS');
        const histogramCalculator = new HistogramCalculator();
        const histogram = histogramCalculator.calculateHistogram(reviews);
        const averageDetail = histogramCalculator.averageFromReviews(reviews);
        const iosTotal = metadata.iOSTotal ? metadata.iOSTotal : 0;
        const iosAverage = metadata.iOSAverage ? metadata.iOSAverage : 0;
        const saveRatingDivider = (iosTotal === 0) ? 1 : iosTotal;
        const averageRatings = (iosTotal * iosAverage) / saveRatingDivider;
        const appName = metadata.name ? metadata.name : config.appName;
        const iOSProperties = {
            tabTitle: config.appName + ' iOS Reviews',
            pageTitle: appName + ' iOS',
            page: 'iOS',
            totalReviews: averageDetail.amount,
            averageReviews: averageDetail.average,
            totalRatings: iosTotal,
            averageRatings: averageRatings,
            ratingHistogram: metadata.iOSHistogram,
            reviewHistogram: histogram,
            reviews: reviews
        };
        response.render('reviews', Object.assign(iOSProperties, defaultParams));
        console.timeEnd('Preparing the iOS page');
    }
};
