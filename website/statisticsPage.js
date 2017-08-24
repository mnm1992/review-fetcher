const emojiFlags = require('emoji-flags');
const responseHelper = require('./responseHelper');
const Configs = require('../common/configs');
const configs = new Configs();
const humanizeDuration = require('humanize-duration');
const histogramCalculator = require('../common/histogramCalculator');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {

	render: function (request, response) {
		const config = configs.configForApp(request.params.app.toLowerCase());
		if (config === null) {
			responseHelper.notFound(response, 'Statistics page: proposition not found');
			return;
		}
		responseHelper.getDefaultParams(config, reviewDB, function (ratingJSON, defaultParams) {
			constructStatsPage(config, ratingJSON, defaultParams, response);
		});
	}
};

function constructStatsPage(config, ratingJSON, defaultParams, response) {
	console.time('Preparing the stats ' + config.appName + ' page');
	reviewDB.getAllReviews(config, function (reviews) {
		const statisticsProperties = {
			tabTitle: config.appName + ' Statistics',
			pageTitle: config.appName + ' Statistics',
			page: 'Statistics',
			countryStats: constructCountriesMap(reviews),
			androidCountryStats: constructCountriesMap(reviews, ratingJSON, 'android'),
			iosCountryStats: constructCountriesMap(reviews, ratingJSON, 'ios'),
			versionStats: constructVersionMap(reviews),
			languageStats: constructLanguagesMap(reviews),
			androidLanguageStats: constructLanguagesMap(reviews, 'android'),
			iOSLanguageStats: constructLanguagesMap(reviews, 'ios'),
			timingStats: generateTimeReviewSummary(reviews)
		};
		response.render('statistics', Object.assign(statisticsProperties, defaultParams));
		console.timeEnd('Preparing the stats ' + config.appName + ' page');
	});
}

function removeReviewsWithInvalidDates(reviews) {
	return reviews.filter((review) => {
		return review.reviewInfo.dateTime;
	});
}

function calculateTimeSinceLastReview(reviews, platform) {
	const filteredReviews = removeReviewsWithInvalidDates(reviews);
	const overide = platform ? false : true;
	for (let review of filteredReviews) {
		const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
		if (correctPlatform) {
			return (Date.now() - review.reviewInfo.dateTime.getTime());
		}
	}
	return 0;
}

function constructTimeBetweenReviewsMap(reviews, platform) {
	const filteredReviews = removeReviewsWithInvalidDates(reviews);
	const overide = platform ? false : true;
	var prevReview = null;
	var totalReviews = 0;
	var totalTime = 0;
	for (let currentReview of filteredReviews) {
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

function calculateAverageMap(reviews, codeParentKey, codeKey, nameParentKey, nameKey, platform) {
	const overide = platform ? false : true;
	const averageArray = [];
	const averageDictionary = {};
	for (var i = 0; i < reviews.length; i++) {
		const review = reviews[i];
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

function constructLanguagesMap(reviews, platform) {
	return Object.values(calculateAverageMap(reviews, 'deviceInfo', 'languageCode', 'deviceInfo', 'language', platform));
}

function constructCountriesMap(reviews, ratingJSON, platform) {
	var countryAverageMap = calculateAverageMap(reviews, 'deviceInfo', 'countryCode', 'deviceInfo', 'country', platform);
	if (platform === 'ios') {
		for (var country in countryAverageMap) {
			const dict = histogramCalculator.averageFromHistogram(ratingJSON.histogramPerCountry[countryAverageMap[country].countryCode]);
			countryAverageMap[country].total = dict.amount;
			countryAverageMap[country].average = dict.average;
		}
	}
	Object.keys(countryAverageMap).forEach(function (key) {
		countryAverageMap[key].flag = emojiFlags.countryCode(countryAverageMap[key].countryCode).emoji;
	});
	return Object.values(countryAverageMap);
}

function constructVersionMap(reviews) {
	return calculateAverageMap(reviews, 'deviceInfo', 'platform', 'appInfo', 'version');
}

function generateTimeReviewSummary(reviews) {
	const options = {
		largest: 1,
		round: true
	};
	const timeSinceLastReview = humanizeDuration(calculateTimeSinceLastReview(reviews), options);
	const averageTimeBetweenReviews = humanizeDuration(constructTimeBetweenReviewsMap(reviews), options);
	const timeSinceLastAndroidReview = humanizeDuration(calculateTimeSinceLastReview(reviews, 'android'), options);
	const averageTimeBetweenAndroidReviews = humanizeDuration(constructTimeBetweenReviewsMap(reviews, 'android'), options);
	const timeSinceLastIOSReview = humanizeDuration(calculateTimeSinceLastReview(reviews, 'ios'), options);
	const averageTimeBetweenIOSReviews = humanizeDuration(constructTimeBetweenReviewsMap(reviews, 'ios'), options);
	return {
		timeSinceLastReview: timeSinceLastReview,
		averageTimeBetweenReviews: averageTimeBetweenReviews,
		timeSinceLastAndroidReview: timeSinceLastAndroidReview,
		averageTimeBetweenAndroidReviews: averageTimeBetweenAndroidReviews,
		timeSinceLastIOSReview: timeSinceLastIOSReview,
		averageTimeBetweenIOSReviews: averageTimeBetweenIOSReviews,
	};
}
