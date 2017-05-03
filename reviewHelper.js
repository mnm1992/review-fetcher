function removeDuplicates(input, prioritisedType) {
	var output = [];
	var reviewMap = {};
	input.forEach(function (review) {
		var oldReview = reviewMap[review.reviewInfo.id];
		if (!oldReview || (review.reviewInfo.source === prioritisedType)) {
			reviewMap[review.reviewInfo.id] = review;
		}
	});
	for (var key in reviewMap) {
		output.push(reviewMap[key]);
	}
	return output;
}

function mergeReviews(review1, review2) {
	var laterReview = review1.reviewInfo.dateTime > review2.reviewInfo.dateTime ? review1 : review2;
	var olderReview = laterReview === review1 ? review2 : review1;
	if (laterReview.reviewInfo.dateTime > olderReview.reviewInfo.dateTime) {
		laterReview.oldReviewInfo = {};
		laterReview.oldReviewInfo.reviewInfo = olderReview.reviewInfo;
		laterReview.oldReviewInfo.deviceInfo = olderReview.deviceInfo;
		laterReview.oldReviewInfo.appInfo = olderReview.appInfo;
		laterReview.showOnSlack = true;
		console.log('A review got updated it moved from: ' + olderReview.reviewInfo.dateTime + ' to ' + laterReview.reviewInfo.dateTime);
	} else if (olderReview.reviewInfo.source === 'API') {
		return olderReview;
	}
	return laterReview;
}

module.exports = {

	mergeReviewsFromArrays: function (reviewsFromDB, reviewsFetched) {
		reviewsFetched = removeDuplicates(reviewsFetched, 'API');
		var result = {
			'reviewsToUpdate': [],
			'reviewsToInsert': [],
			'newReviews': []
		};
		var dbReviewMap = {};
		reviewsFromDB.forEach(function (dbReview) {
			dbReviewMap[dbReview.reviewInfo.id] = dbReview;
		});

		var onlyNewReviews = [];
		reviewsFetched.forEach(function (fetchedReview) {
			var foundReview = dbReviewMap[fetchedReview.reviewInfo.id];
			if (!foundReview) {
				result.newReviews.push(fetchedReview);
				result.reviewsToInsert.push(fetchedReview);
			} else {
				var mergedReview = mergeReviews(foundReview, fetchedReview);
				result.reviewsToUpdate.push(mergedReview);
			}
		});
		return result;
	},
};
