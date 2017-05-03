function removeDuplicates(reviewArray, prioritisedType) {
	var reviewMap = {};
	reviewArray.forEach(function (review) {
		var oldReview = reviewMap[review.reviewInfo.id];
		if (!oldReview || (review.reviewInfo.source === prioritisedType)) {
			reviewMap[review.reviewInfo.id] = review;
		}
	});
	for (var key in reviewMap) {
		reviewArray.push(reviewMap[key]);
	}
	return reviewArray;
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
	} else if (olderReview.reviewInfo.source === 'API') {
		return olderReview;
	}
	return laterReview;
}

module.exports = {

	mergeReviewsFromArrays: function (oldReviews, newReviews) {
		newReviews = removeDuplicates(newReviews, 'API');
		var result = {
			'reviewsToUpdate': [],
			'reviewsToInsert': [],
			'newReviews': []
		};
		var oldReviewMap = {};
		oldReviews.forEach(function (oldReview) {
			oldReviewMap[oldReview.reviewInfo.id] = oldReview;
		});

		var onlyNewReviews = [];
		newReviews.forEach(function (newReview) {
			var foundReview = oldReviewMap[newReview.reviewInfo.id];
			if (!foundReview) {
				result.newReviews.push(newReview);
				result.reviewsToInsert.push(newReview);
			} else {
				var mergedReview = mergeReviews(foundReview, newReview);
				result.reviewsToUpdate.push(mergedReview);
			}
		});
		return result;
	},
};
