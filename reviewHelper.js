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

function mergeReviews(dbReview, fetchedReview) {
	var laterReview = dbReview.reviewInfo.dateTime > fetchedReview.reviewInfo.dateTime ? dbReview : fetchedReview;
	var olderReview = laterReview === dbReview ? fetchedReview : dbReview;
	if (laterReview.reviewInfo.dateTime > olderReview.reviewInfo.dateTime) {
		if(laterReview === fetchedReview){//Since scraped copmponent don't have time, this check prevents the db one from winning
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
				if(mergedReview.showOnSlack){
					result.newReviews.push(mergedReview);
				}
				result.reviewsToUpdate.push(mergedReview);
			}
		});
		return result;
	},
};
