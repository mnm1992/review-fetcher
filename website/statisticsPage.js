const emojiFlags = require('emoji-flags');
const humanizeDuration = require('humanize-duration');
const HistogramCalculator = require('../common/HistogramCalculator');

module.exports = class StatisticsPage {
    constructor(configs, dbHelper, responseHelper) {
        this.configs = configs;
        this.dbHelper = dbHelper;
        this.responseHelper = responseHelper;
    }

    async render(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'Statistics page: proposition not found');
            return;
        }
        const result = await this.responseHelper.getDefaultParams(config, this.dbHelper);
        return this.constructStatsPage(config, result.defaultParams, result.metadata, response);
    }

    async constructStatsPage(config, defaultParams, metadata, response) {
        console.time('Preparing the stats ' + config.appName + ' page');
        const reviews = await this.dbHelper.getAllReviews(config.androidConfig.id, config.iOSConfig.id);
        const appName = metadata.name ? metadata.name : config.appName;
        const statisticsProperties = {
            tabTitle: config.appName + ' Statistics',
            pageTitle: appName + ' Statistics',
            page: 'Statistics',
            countryStats: this.constructCountriesMap(reviews, metadata),
            androidCountryStats: this.constructCountriesMap(reviews, metadata, 'android'),
            iosCountryStats: this.constructCountriesMap(reviews, metadata, 'ios'),
            versionStats: this.constructVersionMap(reviews),
            languageStats: this.constructLanguagesMap(reviews),
            androidLanguageStats: this.constructLanguagesMap(reviews, 'android'),
            iOSLanguageStats: this.constructLanguagesMap(reviews, 'ios'),
            timingStats: this.generateTimeReviewSummary(reviews)
        };
        response.render('statistics', Object.assign(statisticsProperties, defaultParams));
        console.timeEnd('Preparing the stats ' + config.appName + ' page');
    }

    removeReviewsWithInvalidDates(reviews) {
        return reviews.filter((review) => {
            return review.reviewInfo.dateTime;
        });
    }

    calculateTimeSinceLastReview(reviews, platform) {
        const filteredReviews = this.removeReviewsWithInvalidDates(reviews);
        const overide = platform ? false : true;
        for (const review of filteredReviews) {
            const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
            if (correctPlatform) {
                return (Date.now() - review.reviewInfo.dateTime.getTime());
            }
        }
        return 0;
    }

    constructTimeBetweenReviewsMap(reviews, platform) {
        const filteredReviews = this.removeReviewsWithInvalidDates(reviews);
        const overide = platform ? false : true;
        let prevReview = null;
        let totalReviews = 0;
        let totalTime = 0;
        for (const currentReview of filteredReviews) {
            const correctPlatform = overide || (currentReview.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
            if (correctPlatform) {
                if (prevReview) {
                    totalTime += prevReview.reviewInfo.dateTime.getTime() - currentReview.reviewInfo.dateTime.getTime();
                    totalReviews += 1;
                }
                prevReview = currentReview;
            }
        }
        if (totalTime === 0 || totalReviews === 0) {
            return 0;
        }
        return totalTime / totalReviews;
    }

    calculateAverageMap(reviews, codeParentKey, codeKey, nameParentKey, nameKey, platform) {
        const overide = platform ? false : true;
        const averageArray = [];
        const averageDictionary = {};
        for (const review of reviews) {
            const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
            const code = review[codeParentKey][codeKey];
            const name = review[nameParentKey][nameKey];
            const key = code + ' ' + name;
            if (!correctPlatform || !code || !name) {
                continue;
            }

            if (!averageArray.includes(key)) {
                const codeToAverageMap = {
                    'total': 1,
                    'average': review.reviewInfo.rating
                };
                codeToAverageMap[codeKey] = code;
                codeToAverageMap[nameKey] = name;
                averageDictionary[key] = codeToAverageMap;
                averageArray.push(key);
            } else {
                const oldTotal = averageDictionary[key].total;
                const oldAverage = averageDictionary[key].average;
                const newTotal = oldTotal + 1;
                const newAverage = ((oldAverage * oldTotal) + review.reviewInfo.rating) / newTotal;
                averageDictionary[key].total = newTotal;
                averageDictionary[key].average = newAverage;
            }
        }
        return averageDictionary;
    }

    constructLanguagesMap(reviews, platform) {
        return Object.values(this.calculateAverageMap(reviews, 'deviceInfo', 'languageCode', 'deviceInfo', 'language', platform)).sort((obj1, obj2) => {
            return obj1.language.localeCompare(obj2.language);
        });
    }

    constructCountriesMap(reviews, ratingJSON, platform) {
        const countryAverageMap = this.calculateAverageMap(reviews, 'deviceInfo', 'countryCode', 'deviceInfo', 'country', platform);
        if (platform === 'ios') {
            const histogramCalculator = new HistogramCalculator();
            for (const country in countryAverageMap) {
                if (ratingJSON.histogramPerCountry) {
                    const dict = histogramCalculator.averageFromHistogram(ratingJSON.histogramPerCountry[countryAverageMap[country].countryCode].histogram);
                    countryAverageMap[country].total = dict.amount;
                    countryAverageMap[country].average = dict.average;
                }
            }
        }
        for (const key in countryAverageMap) {
            countryAverageMap[key].flag = emojiFlags.countryCode(countryAverageMap[key].countryCode).emoji;
        }
        return Object.values(countryAverageMap).sort((obj1, obj2) => {
            return obj1.country.localeCompare(obj2.country);
        });
    }

    constructVersionMap(reviews) {
        return this.calculateAverageMap(reviews, 'deviceInfo', 'platform', 'appInfo', 'version');
    }

    generateTimeReviewSummary(reviews) {
        const options = {
            largest: 1,
            round: true
        };
        const timeSinceLastReview = humanizeDuration(this.calculateTimeSinceLastReview(reviews), options);
        const averageTimeBetweenReviews = humanizeDuration(this.constructTimeBetweenReviewsMap(reviews), options);
        const timeSinceLastAndroidReview = humanizeDuration(this.calculateTimeSinceLastReview(reviews, 'android'), options);
        const averageTimeBetweenAndroidReviews = humanizeDuration(this.constructTimeBetweenReviewsMap(reviews, 'android'), options);
        const timeSinceLastIOSReview = humanizeDuration(this.calculateTimeSinceLastReview(reviews, 'ios'), options);
        const averageTimeBetweenIOSReviews = humanizeDuration(this.constructTimeBetweenReviewsMap(reviews, 'ios'), options);
        return {
            timeSinceLastReview: timeSinceLastReview,
            averageTimeBetweenReviews: averageTimeBetweenReviews,
            timeSinceLastAndroidReview: timeSinceLastAndroidReview,
            averageTimeBetweenAndroidReviews: averageTimeBetweenAndroidReviews,
            timeSinceLastIOSReview: timeSinceLastIOSReview,
            averageTimeBetweenIOSReviews: averageTimeBetweenIOSReviews
        };
    }
};
