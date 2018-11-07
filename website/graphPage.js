const moment = require('moment');

Date.prototype.addDays = function (days) {
    const dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};

module.exports = class GraphPage {
    constructor(configs, dbHelper, responseHelper) {
        this.configs = configs;
        this.dbHelper = dbHelper;
        this.responseHelper = responseHelper;
    }

    async render(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'Graph page: proposition not found');
            return;
        }
        const result = await this.responseHelper.getDefaultParams(config, this.dbHelper);
        return this.constructGraphPage(config, result.defaultParams, result.metadata,  response).then(() => { });
    }

    async constructGraphPage(config, defaultParams, metadata, response) {
        console.time('Preparing the graph page');
        const map = await this.fetchReviews(config);
        const appName = metadata.name ? metadata.name : config.appName;
        const graphProperties = {
            tabTitle: config.appName + ' Graph Reviews',
            pageTitle: appName + ' Graph',
            page: 'Graph',
            dayAverages: this.dayAverageArray(map),
            dayTotals: this.dayTotalsArray(map),
            walkingDayAverages: this.dayWalkingDayAveragesArray(map)
        };
        response.render('graphs_page', Object.assign(graphProperties, defaultParams));
        console.timeEnd('Preparing the graph page');
    }

    async fetchReviews(config, callback) {
        const reviews = await this.dbHelper.getAllReviews(config.androidConfig.id, config.iOSConfig.id);
        const map = this.createMap(reviews);
        map.dayAverages = this.dayAverages(map.reviewMap);
        map.dayTotals = this.dayTotals(map.reviewMap);
        map.walkingDayAverages = this.walkingDayAverages(map.reviewMap);
        return map;
    }

    dayAverageArray(map) {
        const array = [];
        for (const key in map.dayAverages) {
            array.push(map.dayAverages[key]);
        }
        return array;
    }

    dayTotalsArray(map) {
        const array = [];
        for (const key in map.dayTotals) {
            array.push(map.dayTotals[key]);
        }
        return array;
    }

    dayWalkingDayAveragesArray(map) {
        const array = [];
        for (const key in map.walkingDayAverages) {
            array.push(map.walkingDayAverages[key]);
        }
        return array;
    }

    sorter(review1, review2) {
        return review1.reviewInfo.dateTime > review2.reviewInfo.dateTime ? 1 : review1.reviewInfo.dateTime < review2.reviewInfo.dateTime ? -1 : 0;
    }

    formatDate(date) {
        moment.locale('nl');
        return moment(date).format('DD MMM YYYY');
    }

    getDates(startDate, stopDate) {
        const dateArray = [];
        let currentDate = startDate;
        while (currentDate <= stopDate) {
            dateArray.push(new Date(currentDate));
            currentDate = currentDate.addDays(1);
        }
        return dateArray;
    }

    createEmptyMap(start, stop) {
        start.setHours(0, 0, 0, 0);
        stop.setHours(0, 0, 0, 0);
        const map = {};
        const dates = this.getDates(start, stop);
        for (const date of dates) {
            map[date] = [];
        }
        return map;
    }

    removeReviewsWithInvalidDates(reviews) {
        return reviews.filter((review) => {
            return review.reviewInfo.dateTime;
        });
    }

    createMap(reviews) {
        const filteredReviews = this.removeReviewsWithInvalidDates(reviews);
        if (!filteredReviews || filteredReviews.length === 0) {
            return {};
        }
        filteredReviews.sort(this.sorter);
        const lastDate = filteredReviews[filteredReviews.length - 1].reviewInfo.dateTime;
        const firstDate = filteredReviews[0].reviewInfo.dateTime;
        const map = this.createEmptyMap(firstDate, lastDate);
        for (const review of filteredReviews) {
            const date = review.reviewInfo.dateTime;
            date.setHours(0, 0, 0, 0);
            map[date].push(review);
        }
        return {
            'first': firstDate,
            'last': lastDate,
            'reviewMap': map
        };
    }

    walkingDayAverages(map) {
        const averageMap = {};
        let total = 0;
        let count = 0;
        let iosTotal = 0;
        let iosCount = 0;
        let androidTotal = 0;
        let androidCount = 0;
        for (const key in map) {
            const array = map[key];
            count += array.length;
            for (let i = 0; i < array.length; i++) {
                const review = array[i];
                total += review.reviewInfo.rating;
                if (review.deviceInfo.platform === 'iOS') {
                    iosTotal += review.reviewInfo.rating;
                    iosCount += 1;
                } else {
                    androidTotal += review.reviewInfo.rating;
                    androidCount += 1;
                }
            }
            averageMap[key] = [key, androidTotal > 0 ? (androidTotal / androidCount) : null, iosTotal > 0 ? (iosTotal / iosCount) : null, total > 0 ? (total / count) : null];
        }
        return averageMap;
    }

    dayAverages(map) {
        const averageMap = {};
        for (const key in map) {
            const array = map[key];
            let total = 0;
            const count = array.length;
            let iosTotal = 0;
            let iosCount = 0;
            let androidTotal = 0;
            let androidCount = 0;
            for (let i = 0; i < array.length; i++) {
                const review = array[i];
                total += review.reviewInfo.rating;
                if (review.deviceInfo.platform === 'iOS') {
                    iosTotal += review.reviewInfo.rating;
                    iosCount += 1;
                } else {
                    androidTotal += review.reviewInfo.rating;
                    androidCount += 1;
                }
            }
            averageMap[key] = [key, androidTotal > 0 ? (androidTotal / androidCount) : null, iosTotal > 0 ? (iosTotal / iosCount) : null, total > 0 ? (total / count) : null];
        }
        return averageMap;
    }

    dayTotals(map) {
        const totalMap = {};
        for (const key in map) {
            let total = 0;
            let iosTotal = 0;
            let androidTotal = 0;
            const array = map[key];
            const count = array.length;
            for (let i = 0; i < array.length; i++) {
                const review = array[i];
                total += 1;
                if (review.deviceInfo.platform === 'iOS') {
                    iosTotal += 1;
                } else {
                    androidTotal += 1;
                }
            }
            totalMap[key] = [key, (androidTotal), (iosTotal), (total)];
        }
        return totalMap;
    }
};
