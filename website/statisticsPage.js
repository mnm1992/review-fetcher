const emojiFlags = require('emoji-flags');
const humanizeDuration = require('humanize-duration');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {

	constructStatsPage: function (config, defaultParams, response) {
		console.time('Preparing the stats ' + config.appName + ' page');
		reviewDB.getAllReviews(config, function (reviews) {
			const statisticsProperties = {
				tabTitle: config.appName + ' Statistics',
				pageTitle: config.appName + ' Statistics',
				page: 'Statistics',
				countryStats: constructCountriesMap(reviews),
				androidCountryStats: constructCountriesMap(reviews, 'android'),
				iosCountryStats: constructCountriesMap(reviews, 'ios'),
				versionStats: constructVersionMap(reviews),
				languageStats: constructLanguagesMap(reviews),
				timingStats: generateTimeReviewSummary(reviews)
			};
			response.render('statistics', Object.assign(statisticsProperties, defaultParams));
			console.timeEnd('Preparing the stats ' + config.appName + ' page');
		});
	}
};

function calculateTimeSinceLastReview(reviews, platform) {
	const overide = platform ? false : true;
	for (var i = 0; i < reviews.length; i++) {
		const correctPlatform = overide || (reviews[i].deviceInfo.platform.toLowerCase() === platform.toLowerCase());
		if (correctPlatform) {
			return (Date.now() - reviews[i].reviewInfo.dateTime.getTime());
		}
	}
	return 0;
}

function constructTimeBetweenReviewsMap(reviews, platform) {
	const overide = platform ? false : true;
	var prevReview = null;
	var totalReviews = 0;
	var totalTime = 0;
	reviews.forEach(function (currentReview) {
		const correctPlatform = overide || (currentReview.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
		if (correctPlatform) {
			if (prevReview) {
				totalTime += prevReview.reviewInfo.dateTime.getTime() - currentReview.reviewInfo.dateTime.getTime();
				totalReviews += 1;
			}
			prevReview = currentReview;
		}
	});
	if (totalTime === 0 || totalReviews === 0) {
		return 0;
	}
	return totalTime / totalReviews;
}

function constructLanguagesMap(reviews) {
	const languageCodes = [];
	const appLanguages = {};
	reviews.forEach(function (review) {
		if (review.deviceInfo.languageCode && !languageCodes.includes(review.deviceInfo.languageCode)) {
			const codeLanguageMap = {
				'languageCode': review.deviceInfo.languageCode,
				'language': review.deviceInfo.language,
				'total': 1,
				'average': review.reviewInfo.rating
			};
			appLanguages[review.deviceInfo.languageCode] = codeLanguageMap;
			languageCodes.push(review.deviceInfo.languageCode);
		} else if (review.deviceInfo.languageCode) {
			const oldTotal = appLanguages[review.deviceInfo.languageCode].total;
			const oldAverage = appLanguages[review.deviceInfo.languageCode].average;
			const newTotal = oldTotal + 1;
			const newAverage = ((oldAverage * oldTotal) + review.reviewInfo.rating) / newTotal;
			appLanguages[review.deviceInfo.languageCode].total = newTotal;
			appLanguages[review.deviceInfo.languageCode].average = newAverage;
		}
	});
	return dictionaryToArray(appLanguages);
}

function constructCountriesMap(reviews, platform) {
	const overide = platform ? false : true;
	const countryCodes = [];
	const appCountries = {};
	reviews.forEach(function (review) {
		const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
		if (correctPlatform && review.deviceInfo.countryCode && !countryCodes.includes(review.deviceInfo.countryCode)) {
			const codeCountryMap = {
				'flag': emojiFlags.countryCode(review.deviceInfo.countryCode).emoji,
				'countryCode': review.deviceInfo.countryCode,
				'country': review.deviceInfo.country,
				'total': 1,
				'average': review.reviewInfo.rating
			};
			appCountries[review.deviceInfo.countryCode] = codeCountryMap;
			countryCodes.push(review.deviceInfo.countryCode);
		} else if (correctPlatform && review.deviceInfo.countryCode) {
			const oldTotal = appCountries[review.deviceInfo.countryCode].total;
			const oldAverage = appCountries[review.deviceInfo.countryCode].average;
			const newTotal = oldTotal + 1;
			const newAverage = ((oldAverage * oldTotal) + review.reviewInfo.rating) / newTotal;
			appCountries[review.deviceInfo.countryCode].total = newTotal;
			appCountries[review.deviceInfo.countryCode].average = newAverage;
		}
	});
	return dictionaryToArray(appCountries);
}

function constructVersionMap(reviews) {
	const versions = [];
	const appVersions = {};
	reviews.forEach(function (review) {
		const title = review.deviceInfo.platform + ' ' + review.appInfo.version;
		if (review.appInfo.version && !versions.includes(title)) {
			const versionMap = {
				'platform': review.deviceInfo.platform,
				'version': review.appInfo.version,
				'total': 1,
				'average': review.reviewInfo.rating
			};
			appVersions[title] = versionMap;
			versions.push(title);
		} else if (review.appInfo.version) {
			const oldTotal = appVersions[title].total;
			const oldAverage = appVersions[title].average;
			const newTotal = oldTotal + 1;
			const newAverage = ((oldAverage * oldTotal) + review.reviewInfo.rating) / newTotal;
			appVersions[title].total = newTotal;
			appVersions[title].average = newAverage;
		}
	});
	return appVersions;
}

function generateTimeReviewSummary(reviews) {
	const timeSinceLastReview = humanizeDuration(calculateTimeSinceLastReview(reviews), {
		largest: 1,
		round: true
	});
	const averageTimeBetweenReviews = humanizeDuration(constructTimeBetweenReviewsMap(reviews), {
		largest: 1,
		round: true
	});
	const timeSinceLastAndroidReview = humanizeDuration(calculateTimeSinceLastReview(reviews, 'android'), {
		largest: 1,
		round: true
	});
	const averageTimeBetweenAndroidReviews = humanizeDuration(constructTimeBetweenReviewsMap(reviews, 'android'), {
		largest: 1,
		round: true
	});
	const timeSinceLastIOSReview = humanizeDuration(calculateTimeSinceLastReview(reviews, 'ios'), {
		largest: 1,
		round: true
	});
	const averageTimeBetweenIOSReviews = humanizeDuration(constructTimeBetweenReviewsMap(reviews, 'ios'), {
		largest: 1,
		round: true
	});
	return {
		timeSinceLastReview: timeSinceLastReview,
		averageTimeBetweenReviews: averageTimeBetweenReviews,
		timeSinceLastAndroidReview: timeSinceLastAndroidReview,
		averageTimeBetweenAndroidReviews: averageTimeBetweenAndroidReviews,
		timeSinceLastIOSReview: timeSinceLastIOSReview,
		averageTimeBetweenIOSReviews: averageTimeBetweenIOSReviews,
	};
}

function dictionaryToArray(dictionary) {
	const array = [];
	Object.keys(dictionary).forEach(function (key) {
		array.push(dictionary[key]);
	});
	return array;
}
