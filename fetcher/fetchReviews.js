const Configs = require('../common/Configs');
const ReviewFetcher = require('./ReviewFetcher');
const ReviewDBHelper = require('../common/ReviewDBHelper');
const ReviewHelper = require('../common/ReviewHelper');
const SlackHelper = require('./SlackHelper');
const Request = require('request-promise');

async function checkAndStoreNewReviews(configs, dbHelper) {
    const reviews = {};
    const ratings = {};
    const reviewFetcher = new ReviewFetcher();
    const reviewHelper = new ReviewHelper();
    for (const app of configs.allConfigs()) {
        console.time("Fetching reviews for: " + app.appName);
        const result = await reviewFetcher.checkForNewReviews(app.appName, app.androidConfig.id, app.androidConfig.authentication, app.androidConfig.languages, app.iOSConfig.id, app.iOSConfig.countries);
        const reviewsFromDb = await dbHelper.getAllReviews(app.androidConfig.id, app.iOSConfig.id);
        const cleanReviews = reviewHelper.mergeReviewsFromArrays(reviewsFromDb, result.reviews);
        cleanReviews.reviewsToInsert = mergeNewReviewsAndReviewToInsert(cleanReviews.newReviews, cleanReviews.reviewsToInsert);
        cleanReviews.reviewsToUpdate = mergeNewReviewsAndReviewToInsert(cleanReviews.newReviews, cleanReviews.reviewsToUpdate);
        await dbHelper.addNewReviews(cleanReviews);
        result.ratings = await updateMetadata(app, dbHelper, reviewHelper, result.ratings);
        await dbHelper.updateRating(app.appName, result.ratings);
        reviews[app.appName] = cleanReviews.newReviews;
        ratings[app.appName] = result.ratings;
        reviews[app.appName]['hasUpdate'] = ((cleanReviews.newReviews.length > 0));
        console.timeEnd("Fetching reviews for: " + app.appName);
    }
    return {
        reviews: reviews,
        ratings: ratings
    };
}

async function startScraping() {
    console.time('Updating history');
    const configs = new Configs();
    const reviewFetcher = new ReviewFetcher();
    const dbHelper = new ReviewDBHelper();
    const reviewHelper = new ReviewHelper();
    for (const app of configs.allConfigs()) {
        if (app.androidConfig.authentication) {
            console.time("Scraping android reviews for: " + app.appName);
            const result = await reviewFetcher.fetchAndroidScrapedReviews(app.androidConfig.id, app.androidConfig.languages);
            const reviewsFromDb = await dbHelper.getAllReviews(app.androidConfig.id, app.iOSConfig.id);
            const cleanReviews = reviewHelper.mergeReviewsFromArrays(reviewsFromDb, result);
            cleanReviews.reviewsToInsert = mergeNewReviewsAndReviewToInsert(cleanReviews.newReviews, cleanReviews.reviewsToInsert);
            cleanReviews.reviewsToUpdate = mergeNewReviewsAndReviewToInsert(cleanReviews.newReviews, cleanReviews.reviewsToUpdate);
            await dbHelper.addNewReviews(cleanReviews);
            let ratings = await dbHelper.getRatings(app.appName);
            ratings = await updateMetadata(app, dbHelper, reviewHelper, ratings);
            await dbHelper.updateRating(app.appName, ratings);
            console.timeEnd("Scraping android reviews for: " + app.appName);
        }
    }
    dbHelper.done();
    console.timeEnd('Updating history');
}

function mergeNewReviewsAndReviewToInsert(newReviews, toInsert) {
    for (const review of newReviews) {
        const index = toInsert.indexOf(review);
        if (index !== -1) {
            toInsert[index] = review;
        }
    }
    return toInsert;
}

async function updateMetadata(app, dbHelper, reviewHelper, fetchedRatings) {
    console.time("Updating metadata for: " + app.appName);
    const reviewsForApp = await dbHelper.getAllReviews(app.androidConfig.id, app.iOSConfig.id);
    fetchedRatings['androidVersions'] = reviewHelper.appVersions(reviewsForApp, 'android');
    fetchedRatings['iosVersions'] = reviewHelper.appVersions(reviewsForApp, 'ios');
    fetchedRatings['countries'] = reviewHelper.appCountries(reviewsForApp);
    fetchedRatings['languages'] = reviewHelper.appLanguages(reviewsForApp);
    console.timeEnd("Updating metadata for: " + app.appName);
    return fetchedRatings;
}

async function startFetching() {
    console.time('Checking for new reviews');
    const dbHelper = new ReviewDBHelper();
    const configs = new Configs();
    const fetchedReviews = await checkAndStoreNewReviews(configs, dbHelper);
    for (const app of configs.allConfigs()) {
        const reviews = fetchedReviews.reviews[app.appName];
        if (reviews.length > 0) {
            //const slackHelper = new SlackHelper();
            //await slackHelper.shareOnSlack(app.slackConfig, reviews, configs.isLocalHost());
            await notify(configs.port(), app.appName);
        }
    }
    dbHelper.done();
    console.timeEnd('Checking for new reviews');
}

async function notify(port, proposition) {
    try {
        await Request('http://localhost:' + port + '/hooks/updateClients?update=' + proposition);
    } catch(error) {
        console.error(error);
    }
}

module.exports = {
    fetchReviews: async function () {
        return startFetching();
    },

    scrapeReviews: async function () {
        return startScraping();
    }
};
