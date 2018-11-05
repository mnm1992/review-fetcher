const HistogramCalculator = require('../common/HistogramCalculator');

module.exports = class VersionPage {
    constructor(configs, dbHelper, responseHelper) {
        this.configs = configs;
        this.dbHelper = dbHelper;
        this.responseHelper = responseHelper;
    }

    async render(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'Version page: proposition not found');
            return;
        }
        const allowedPlatforms = ['ios', 'android'];
        if (!allowedPlatforms.includes(request.params.platform.toLowerCase())) {
            this.responseHelper.notFound(response, 'platform not found');
            return;
        }
        const platform = request.params.platform.toLowerCase();
        const version = request.params.version.toLowerCase();
        const result = await this.responseHelper.getDefaultParams(config, this.dbHelper);
        result.defaultParams.translate = request.query.translate;
        return this.constructVersionPage(config, platform, version, result.defaultParams, result.metadata, response);
    }

    async constructVersionPage(config, platform, version, defaultParams, metadata, response) {
        console.time('Preparing the version page for ' + version);
        const reviews = await this.dbHelper.getReviewsForVersion(config.androidConfig.id, config.iOSConfig.id, platform, version);

        const histogramCalculator = new HistogramCalculator();
        const averageDetail = histogramCalculator.averageFromReviews(reviews);
        const histogram = histogramCalculator.calculateHistogram(reviews);
        const title = platform.toLowerCase() === 'android' ? 'Android' : 'iOS';
        const appName = metadata.name ? metadata.name : config.appName;
        const versionProperties = {
            tabTitle: config.appName + ' ' + title + ' ' + version + ' Reviews',
            pageTitle: appName + ' ' + title + ' ' + version,
            hint: 'Only reviews',
            page: 'Versions',
            totalRatings: averageDetail.amount,
            averageRatings: averageDetail.average,
            totalReviews: averageDetail.amount,
            averageReviews: averageDetail.average,
            ratingHistogram: histogram,
            reviewHistogram: histogram,
            reviews: reviews
        };
        response.render('reviews', Object.assign(versionProperties, defaultParams));
        console.timeEnd('Preparing the version page for ' + version);
    }
};
