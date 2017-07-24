const reviewHelper = require('./reviewHelper');
const Review = require('./review');
const pgp = require('pg-promise')({
	capSQL: true
});
const configs = require('../common/configs');
const db = pgp(configs.databaseConfig());
const Column = pgp.helpers.Column;
const reviewidColumn = new Column('?reviewid');
const appidColumn = new Column('?appid');
const deviceinfoColumn = new Column({
	name: 'deviceinfo',
	cast: 'json',
});
const appinfoColumn = new Column({
	name: 'appinfo',
	cast: 'json',
});
const reviewInfoColumn = new Column({
	name: 'reviewinfo',
	cast: 'json',
});
const oldReviewInfoColumn = new Column({
	name: 'oldreviewinfo',
	cast: 'json',
});
const cs = new pgp.helpers.ColumnSet([reviewidColumn, appidColumn, deviceinfoColumn, appinfoColumn, reviewInfoColumn, oldReviewInfoColumn], {
	table: 'reviewjson'
});

function getRatings(config, callback) {
	db.any('SELECT json FROM reviewMetadata WHERE id = $1', [config.appName])
		.then(function (result) {
			if (result.length > 0) {
				callback(result[0].json);
			} else {
				callback({});
			}
		})
		.catch(function (error) {
			console.error(error);
			callback({});
		});
}

function upsertAverageRating(app, ratingJSON, callback) {
	const query = 'INSERT INTO reviewMetadata (id, json) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET json=EXCLUDED.json';
	const values = [app, ratingJSON];
	db.none(query, values)
		.then(function (result) {
			callback();
		})
		.catch(function (error) {
			console.error(error);
			callback();
		});
}

function getAllReviewsWithWhere(where, input, callback) {
	const reviews = [];
	db.any('SELECT deviceinfo, appinfo, reviewinfo, oldreviewinfo FROM reviewjson WHERE ' + where + ' ORDER BY reviewinfo->>\'dateTime\' desc NULLS LAST', input)
		.then(function (result) {
			result.forEach(function (review) {
				if (review) {
					const deviceInfo = review.deviceinfo;
					const appInfo = review.appinfo;
					const reviewInfo = review.reviewinfo;
					const oldReviewInfo = review.oldreviewinfo ? review.oldreviewinfo : {};
					var createdReview = new Review(deviceInfo, appInfo, reviewInfo, oldReviewInfo);
					reviews.push(createdReview);
				}
			});
			callback(reviews);
		})
		.catch(function (error) {
			console.error(error);
			callback([]);
		});
}

function blukInsert(reviewsToInsert, callback) {
	if (!reviewsToInsert || reviewsToInsert.length === 0) {
		console.log('Nothing to insert');
		callback();
		return;
	}
	console.log('Inserting ' + reviewsToInsert.length + ' into the db');
	const values = generateValuesForDb(reviewsToInsert);
	const query = pgp.helpers.insert(values, cs);
	executeNoResultDbQuery(query, callback);
}

function blukUpdate(reviewsToUpdate, callback) {
	if (!reviewsToUpdate || reviewsToUpdate.length === 0) {
		console.log('Nothing to update');
		callback();
		return;
	}
	console.log('Updating ' + reviewsToUpdate.length + ' reviews');
	const values = generateValuesForDb(reviewsToUpdate);
	const query = pgp.helpers.update(values, cs) + ' WHERE v.reviewid = t.reviewid';
	executeNoResultDbQuery(query, callback);
}

function generateValuesForDb(reviews) {
	const values = [];
	reviews.forEach(function (review) {
		values.push({
			reviewid: review.reviewInfo.id,
			appid: review.appInfo.id,
			deviceinfo: review.deviceInfo,
			appinfo: review.appInfo,
			reviewinfo: review.reviewInfo,
			oldreviewinfo: review.oldReviewInfo
		});
	});
	return values;
}

function executeNoResultDbQuery(query, callback) {
	db.none(query)
		.then(function (result) {
			callback();
		})
		.catch(function (error) {
			console.error(error);
			callback();
		});
}

module.exports = class ReviewJSONDB {

	getRating(config, callback) {
		getRatings(config, callback);
	}

	updateRating(app, ratingJSON, callback) {
		upsertAverageRating(app, ratingJSON, callback);
	}

	getReviewsForCountry(config, country, callback) {
		getAllReviewsWithWhere('(appid = $1 OR appid = $2) AND deviceInfo->>\'countryCode\' = $3', [config.androidConfig.id, config.iOSConfig.id, country], callback);
	}

	getReviewsForVersion(config, platform, version, callback) {
		const appId = (platform.toLowerCase() === 'android') ? config.androidConfig.id : config.iOSConfig.id;
		getAllReviewsWithWhere('appid = $1 AND appInfo->>\'version\' = $2', [appId, version], callback);
	}

	getReviews(config, platform, callback) {
		const appId = (platform.toLowerCase() === 'android') ? config.androidConfig.id : config.iOSConfig.id;
		getAllReviewsWithWhere('appid = $1', [appId], callback);
	}

	getAllReviews(config, callback) {
		getAllReviewsWithWhere('appid = $1 OR appid = $2', [config.androidConfig.id, config.iOSConfig.id], callback);
	}

	addNewReviews(config, reviewsFetched, callback) {
		if (!reviewsFetched) {
			console.log('No new reviews');
			callback([]);
			return;
		}
		console.time('Fetched all reviews');
		this.getAllReviews(config, function (reviewsFromDB) {
			console.timeEnd('Fetched all reviews');
			const countries = reviewHelper.appCountries(reviewsFromDB);
			const androidVersions = reviewHelper.appVersions(reviewsFromDB, 'android');
			const iosVersions = reviewHelper.appVersions(reviewsFromDB, 'ios');
			const cleanReviews = reviewHelper.mergeReviewsFromArrays(reviewsFromDB, reviewsFetched);
			console.log('Reviews in db: ' + (reviewsFromDB ? reviewsFromDB.length : 0));
			console.log('Reviews fetched: ' + (reviewsFetched ? reviewsFetched.length : 0));
			console.log('New reviews: ' + cleanReviews.newReviews.length);
			console.time('Inserted all reviews');
			blukInsert(cleanReviews.reviewsToInsert, function () {
				console.timeEnd('Inserted all reviews');
				console.time('Updated all reviews');
				blukUpdate(cleanReviews.reviewsToUpdate, function () {
					console.timeEnd('Updated all reviews');
					callback(cleanReviews.newReviews, countries, androidVersions, iosVersions);
				});
			});
		});
	}

	done() {
		pgp.end();
	}
};
