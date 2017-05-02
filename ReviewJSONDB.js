var pgp = require('pg-promise')({
	capSQL: true
});
var connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL : {
	host: 'localhost',
	port: 5432,
	database: 'postgres',
	user: 'postgres',
	password: 'postgres'
};
var db = pgp(connectionString);

function removeDuplicateKeysFromArray(reviews) {
	var reviewArray = [];
	var reviewMap = {};
	reviews.forEach(function (review) {
		if (!reviewMap[review.reviewInfo.id]) {
			reviewMap[review.reviewInfo.id] = review;
		} else {
			if (reviewMap[review.reviewInfo.id].reviewInfo.source === 'Scraped') {
				reviewMap[review.reviewInfo.id] = review;
			}
		}
	});
	for (var key in reviewMap) {
		reviewArray.push(reviewMap[key]);
	}
	return reviewArray;
}

function removeOldReviewsFromArray(oldReviews, newReviews) {
	newReviews = removeDuplicateKeysFromArray(newReviews);
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
		if (newReview) {
			var foundReview = oldReviewMap[newReview.reviewInfo.id];
			var isNewer = false;
			if (foundReview) {
				isNewer = newReview.reviewInfo.dateTime > foundReview.reviewInfo.dateTime;
				newReview.update = true;
				newReview.responseGiven = true;
				if (isNewer) {
					newReview.responseGiven = false;
					console.log('Found an update for a review');
				}
			}
			if (!foundReview) {
				result.newReviews.push(newReview);
				result.reviewsToInsert.push(newReview);
			} else if (foundReview.reviewInfo.source === 'Scraped' || newReview.reviewInfo.source === 'API') {
				result.reviewsToUpdate.push(newReview);
			}
		}
	});
	return result;
}

function getAllReviewsWithWhere(config, where, input, callback) {
	var reviews = [];
	var Review = require('./review');
	db.any('SELECT deviceinfo, appinfo, reviewinfo FROM reviewjson WHERE ' + where + ' ORDER BY reviewinfo->>\'dateTime\' desc', input)
		.then(function (result) {
			result.forEach(function (review) {
				if (review) {
					var deviceInfo = review.deviceinfo;
					var appInfo = review.appinfo;
					var reviewInfo = review.reviewinfo;
					reviews.push(new Review(deviceInfo, appInfo, reviewInfo));
				}
			});
			callback(reviews);
		})
		.catch(function (error) {
			console.log(error);
			callback([]);
		});
}

function blukInsert(reviewsToInsert, callback) {
	if (!reviewsToInsert || reviewsToInsert.length === 0) {
		console.log('Nothing to insert');
		callback();
		return;
	}
	var values = [];
	console.log('Inserting ' + reviewsToInsert.length + ' into the db');
	reviewsToInsert.forEach(function (review) {
		values.push({
			reviewid: review.reviewInfo.id,
			appid: review.appInfo.id,
			deviceinfo: review.deviceInfo,
			appinfo: review.appInfo,
			reviewinfo: review.reviewInfo
		});
	});
	var Column = pgp.helpers.Column;
	var reviewidColumn = new Column('reviewid');
	var appidColumn = new Column('appid');
	var deviceinfoColumn = new Column({
		name: 'deviceinfo',
		cast: 'json',
	});
	var appinfoColumn = new Column({
		name: 'appinfo',
		cast: 'json',
	});
	var reviewInfoColumn = new Column({
		name: 'reviewinfo',
		cast: 'json',
	});
	var cs = new pgp.helpers.ColumnSet([reviewidColumn, appidColumn, deviceinfoColumn, appinfoColumn, reviewInfoColumn], {
		table: 'reviewjson'
	});
	var query = pgp.helpers.insert(values, cs);
	db.none(query)
		.then(data => {
			callback();
		})
		.catch(error => {
			console.log(error);
			callback();
		});
}

function blukUpdate(reviewsToUpdate, callback) {
	if (!reviewsToUpdate || reviewsToUpdate.length === 0) {
		console.log('Nothing to update');
		callback();
		return;
	}
	console.log('Updating ' + reviewsToUpdate.length + ' reviews');
	var values = [];
	reviewsToUpdate.forEach(function (review) {
		values.push({
			reviewid: review.reviewid,
			deviceinfo: review.deviceInfo,
			appinfo: review.appInfo,
			reviewinfo: review.reviewInfo
		});
	});
	var cs = new pgp.helpers.ColumnSet(['reviewid', 'deviceinfo:json', 'appinfo:json', 'reviewinfo:json'], {
		table: 'reviewjson'
	});

	var query = pgp.helpers.update(values, cs) + ' WHERE v.reviewid = t.reviewid';
	db.none(query)
		.then(data => {
			callback();
		})
		.catch(error => {
			console.log(error);
			callback();
		});
}

module.exports = class ReviewJSONDB {

	getReviews(config, platform, callback) {
		var appId = (platform === 'Android') ? config.androidId : config.iosId;
		getAllReviewsWithWhere(config, 'appid = $1', [appId], callback);
	}

	getAllReviews(config, callback) {
		getAllReviewsWithWhere(config, 'appid = $1 OR appid = $2', [config.androidId, config.iosId], callback);
	}

	addNewReviews(config, newReviews, callback) {
		if (!newReviews) {
			console.log('No new reviews');
			callback([]);
			return;
		}
		console.time('Fetched all reviews');
		this.getAllReviews(config, function (reviews) {
			console.timeEnd('Fetched all reviews');
			console.time('Checking for duplicates');
			var cleanReviews = removeOldReviewsFromArray(reviews, newReviews);
			console.timeEnd('Checking for duplicates');
			console.log('Reviews in db: ' + (reviews ? reviews.length : 0));
			console.log('Reviews fetched: ' + (newReviews ? newReviews.length : 0));
			console.log('New reviews: ' + cleanReviews.newReviews.length);
			console.time('Updated all reviews');
			blukUpdate(cleanReviews.reviewsToUpdate, function () {
				console.timeEnd('Updated all reviews');
				console.time('Inserted all reviews');
				blukInsert(cleanReviews.reviewsToInsert, function () {
					console.timeEnd('Inserted all reviews');
					callback(cleanReviews.newReviews);
				});
			});
		});
	}
};
