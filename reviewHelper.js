function removeDuplicates(input, prioritisedType) {
	const output = [];
	const reviewMap = {};
	input.forEach(function (review) {
		const oldReview = reviewMap[review.reviewInfo.id];
		if (!oldReview || (review.reviewInfo.source === prioritisedType)) {
			reviewMap[review.reviewInfo.id] = review;
		}
	});
	for (var key in reviewMap) {
		output.push(reviewMap[key]);
	}
	return output;
}

function mergeReviews(dbReview, fetchedReview) {
	const laterReview = dbReview.reviewInfo.dateTime > fetchedReview.reviewInfo.dateTime ? dbReview : fetchedReview;
	const olderReview = (laterReview === dbReview) ? fetchedReview : dbReview;
	if (laterReview.reviewInfo.dateTime > olderReview.reviewInfo.dateTime) {
		if (laterReview === fetchedReview) { //Since scraped copmponent don't have time, this check prevents the db one from winning
			laterReview.oldReviewInfo = {};
			laterReview.oldReviewInfo.reviewInfo = olderReview.reviewInfo;
			laterReview.oldReviewInfo.deviceInfo = olderReview.deviceInfo;
			laterReview.oldReviewInfo.appInfo = olderReview.appInfo;
			laterReview.showOnSlack = true;
			console.log('A review got updated it moved from: ' + olderReview.reviewInfo.dateTime + ' to ' + laterReview.reviewInfo.dateTime);
		}
	}
	return laterReview;
}

module.exports = {

	mergeHistograms: function (histogramA, histogramB) {
		if (!histogramA && !histogramB) {
			return {
				'1': 0,
				'2': 0,
				'3': 0,
				'4': 0,
				'5': 0
			};
		}
		if (!histogramA) {
			return histogramB;
		}
		if (!histogramB) {
			return histogramA;
		}
		histogramA['1'] += histogramB['1'];
		histogramA['2'] += histogramB['2'];
		histogramA['3'] += histogramB['3'];
		histogramA['4'] += histogramB['4'];
		histogramA['5'] += histogramB['5'];
		return histogramA;
	},

	calculateHistogram: function (reviews) {
		const histogram = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0
		};
		reviews.forEach(function (review) {
			histogram[review.reviewInfo.rating] = histogram[review.reviewInfo.rating] += 1;
		});
		return histogram;
	},

	calculateHistogramForPlatform: function (reviews, platform) {
		const histogram = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0
		};
		reviews.forEach(function (review) {
			if (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase()) {
				histogram[review.reviewInfo.rating] = histogram[review.reviewInfo.rating] += 1;
			}
		});
		return histogram;
	},

	appAverage: function (reviews, completion) {
		var reviewCount = 0;
		var totalScore = 0;
		reviews.forEach(function (review) {
			totalScore += parseInt(review.reviewInfo.rating);
			reviewCount += 1;
		});
		const averageRating = totalScore / reviewCount;
		completion(reviewCount, averageRating);
	},

	appVersionsForPlatform: function (reviews, platform) {
		const appVersionArray = [];
		reviews.forEach(function (review) {
			const correctPlatform = review.deviceInfo.platform.toLowerCase() === platform.toLowerCase();
			const hasVersion = review.appInfo.version;
			const versionNotInArrayYet = !appVersionArray.includes(review.appInfo.version);
			if (hasVersion && versionNotInArrayYet && correctPlatform) {
				appVersionArray.push(review.appInfo.version);
			}
		});
		appVersionArray.sort((obj1, obj2) => {
			return obj2 > obj1
		});
		return appVersionArray;
	},

	appVersions: function (reviews) {
		const appVersionArray = [];
		reviews.forEach(function (review) {
			if (review.appInfo.version && !appVersionArray.includes(review.appInfo.version)) {
				appVersionArray.push(review.appInfo.version);
			}
		});
		appVersionArray.sort((obj1, obj2) => {
			return obj2 > obj1
		});
		return appVersionArray;
	},

	mergeReviewsFromArrays: function (reviewsFromDB, reviewsFetched) {
		reviewsFetched = removeDuplicates(reviewsFetched, 'API');
		const result = {
			'reviewsToUpdate': [],
			'reviewsToInsert': [],
			'newReviews': []
		};
		const dbReviewMap = {};
		reviewsFromDB.forEach(function (dbReview) {
			dbReviewMap[dbReview.reviewInfo.id] = dbReview;
		});

		reviewsFetched.forEach(function (fetchedReview) {
			const foundReview = dbReviewMap[fetchedReview.reviewInfo.id];
			if (!foundReview) {
				result.newReviews.push(fetchedReview);
				result.reviewsToInsert.push(fetchedReview);
			} else {
				const mergedReview = mergeReviews(foundReview, fetchedReview);
				if (mergedReview.showOnSlack) {
					result.newReviews.push(mergedReview);
				}
				result.reviewsToUpdate.push(mergedReview);
			}
		});
		return result;
	},
};
