const reviewHelper = require('./reviewHelper');
const Review = require('./review');
const pgp = require('pg-promise')({
	capSQL: true
});
const Configs = require('../common/configs');
const configs = new Configs();
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

module.exports = class ReviewJSONDB {

	upsertAverageRating(app, ratingJSON, callback) {
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

	getAllReviewsWithWhere(where, input, callback) {
		const wherePart = where ? 'WHERE ' + where : '';
		const reviews = [];
		db.any('SELECT deviceinfo, appinfo, reviewinfo, oldreviewinfo FROM reviewjson ' + wherePart + ' ORDER BY reviewinfo->>\'dateTime\' desc NULLS LAST', input)
			.then(function (result) {
				result.forEach(function (review) {
					if (review) {
						const deviceInfo = review.deviceinfo;
						const appInfo = review.appinfo;
						const reviewInfo = review.reviewinfo;
						const oldReviewInfo = review.oldreviewinfo ? review.oldreviewinfo.oldreviewinfo : [];
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

	insertReviews(reviewsToInsert, callback) {
		if (!reviewsToInsert || reviewsToInsert.length === 0) {
			console.log('Nothing to insert');
			callback();
			return;
		}
		console.log('Inserting ' + reviewsToInsert.length + ' into the db');
		const values = this.generateValuesForDb(reviewsToInsert);
		const query = pgp.helpers.insert(values, cs);
		this.executeNoResultDbQuery(query, callback);
	}

	updateReviews(reviewsToUpdate, callback) {
		if (!reviewsToUpdate || reviewsToUpdate.length === 0) {
			console.log('Nothing to update');
			callback();
			return;
		}
		console.log('Updating ' + reviewsToUpdate.length + ' reviews');
		const values = this.generateValuesForDb(reviewsToUpdate);
		const query = pgp.helpers.update(values, cs) + ' WHERE v.reviewid = t.reviewid';
		this.executeNoResultDbQuery(query, callback);
	}

	generateValuesForDb(reviews) {
		const values = [];
		reviews.forEach(function (review) {
			values.push({
				reviewid: review.reviewInfo.id,
				appid: review.appInfo.id,
				deviceinfo: review.deviceInfo,
				appinfo: review.appInfo,
				reviewinfo: review.reviewInfo,
				oldreviewinfo: {
					'oldreviewinfo': review.oldReviewInfo
				}
			});
		});
		return values;
	}

	executeNoResultDbQuery(query, callback) {
		db.none(query)
			.then(function (result) {
				callback();
			})
			.catch(function (error) {
				console.error(error);
				callback();
			});
	}

	getRatings(config, callback) {
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

	updateRating(app, ratingJSON, callback) {
		this.upsertAverageRating(app, ratingJSON, callback);
	}

	getReviewsForLanguage(config, languageCode, callback) {
		this.getAllReviewsWithWhere('(appid = $1 OR appid = $2) AND deviceInfo->>\'languageCode\' = $3', [config.androidConfig.id, config.iOSConfig.id, languageCode], callback);
	}

	getReviewsForCountry(config, countryCode, callback) {
		this.getAllReviewsWithWhere('(appid = $1 OR appid = $2) AND deviceInfo->>\'countryCode\' = $3', [config.androidConfig.id, config.iOSConfig.id, countryCode], callback);
	}

	getReviewsForVersion(config, platform, version, callback) {
		const appId = (platform.toLowerCase() === 'android') ? config.androidConfig.id : config.iOSConfig.id;
		this.getAllReviewsWithWhere('appid = $1 AND appInfo->>\'version\' = $2', [appId, version], callback);
	}

	getReviews(config, platform, callback) {
		const appId = (platform.toLowerCase() === 'android') ? config.androidConfig.id : config.iOSConfig.id;
		this.getAllReviewsWithWhere('appid = $1', [appId], callback);
	}

	getAllReviews(config, callback) {
		this.getAllReviewsWithWhere('appid = $1 OR appid = $2', [config.androidConfig.id, config.iOSConfig.id], callback);
	}

	getAllReviewsGlobal(callback) {
		this.getAllReviewsWithWhere(null, [], callback);
	}

	addNewReviews(config, cleanReviews, callback) {
		this.insertReviews(cleanReviews.reviewsToInsert, () => {
			this.updateReviews(cleanReviews.reviewsToUpdate, () => {
				callback();
			});
		});
	}

	done() {
		pgp.end();
	}
};
