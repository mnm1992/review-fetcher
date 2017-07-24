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
		if (laterReview === fetchedReview) {
			laterReview.oldReviewInfo = {};
			laterReview.oldReviewInfo.reviewInfo = olderReview.reviewInfo;
			laterReview.oldReviewInfo.deviceInfo = olderReview.deviceInfo;
			laterReview.oldReviewInfo.appInfo = olderReview.appInfo;
			laterReview.showOnSlack = true;
			console.log('A review got updated it moved from: ' + olderReview.reviewInfo.dateTime + ' to ' + laterReview.reviewInfo.dateTime);
		} else if (olderReview.reviewInfo.developerComment && !laterReview.reviewInfo.developerComment) {
			console.log("Found a developer comment I didn't have before at " + olderReview.reviewInfo.dateTime);
			laterReview.reviewInfo.developerCommentHasTime = (olderReview.reviewInfo.source !== 'Scraped');
			laterReview.reviewInfo.developerComment = olderReview.reviewInfo.developerComment;
			laterReview.reviewInfo.developerCommentDateTime = olderReview.reviewInfo.developerCommentDateTime;
		}
	}
	return laterReview;
}

module.exports = {

	appVersions: function (reviews, platform) {
		const overide = platform ? false : true;
		const appVersionArray = [];
		reviews.forEach(function (review) {
			const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
			const hasVersion = review.appInfo.version;
			const versionNotInArrayYet = !appVersionArray.includes(review.appInfo.version);
			if (hasVersion && versionNotInArrayYet && correctPlatform) {
				appVersionArray.push(review.appInfo.version);
			}
		});
		appVersionArray.sort((obj1, obj2) => {
			return obj2 > obj1;
		});
		return appVersionArray;
	},

	appCountries: function (reviews) {
		const countryCodes = [];
		const appCountries = [];
		reviews.forEach(function (review) {
			if (review.deviceInfo.countryCode && !countryCodes.includes(review.deviceInfo.countryCode)) {
				const codeCountryMap = {};
				codeCountryMap[review.deviceInfo.countryCode] = review.deviceInfo.country;
				appCountries.push(codeCountryMap);
				countryCodes.push(review.deviceInfo.countryCode);
			}
		});
		appCountries.sort((obj1, obj2) => {
			return Object.keys(obj1)[0] > Object.keys(obj2)[0];
		});
		return appCountries;
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
