const Configs = require('../common/Configs');
const configs = new Configs();

const Review = require('./Review');
const MigrationReview = require('./MigrationReview.js');
const pgp = require('pg-promise')({
    capSQL: true
});
const db = pgp(configs.databaseConfig());
const Column = pgp.helpers.Column;
const reviewidColumn = new Column('?id');
const appidColumn = new Column('?appid');
const postedDateColumn = new Column('?posteddate');
const reviewColumn = new Column({
    name: 'review',
    cast: 'json'
});
const cs = new pgp.helpers.ColumnSet([reviewidColumn, appidColumn, postedDateColumn, reviewColumn], {
    table: 'reviews'
});

module.exports = class ReviewJSONDB {

    async setUpDB() {
        const reviewsTableResult = await db.any('SELECT to_regclass(\'reviews\')');
        if (!reviewsTableResult[0].to_regclass) {
            await db.none('CREATE TABLE reviews(id TEXT PRIMARY KEY NOT NULL, appid TEXT NOT NULL, posteddate date, review JSON NOT NULL)');
        }
        const metadataTableResult = await db.any('SELECT to_regclass(\'metadata\')');
        if (!metadataTableResult[0].to_regclass) {
            await db.none('CREATE TABLE metadata(id TEXT PRIMARY KEY NOT NULL, metadata JSON NOT NULL)');
        }
        const reviewJSONTableResult = await db.any('SELECT to_regclass(\'reviewjson\')');
        if (reviewJSONTableResult[0].to_regclass) {
            await this.migrateOldReviewsToNew();
        }
        const reviewMetadataTableResult = await db.any('SELECT to_regclass(\'reviewmetadata\')');
        if (reviewMetadataTableResult[0].to_regclass) {
            await this.migrateOldMetadataToNew();
        }
    }

    async migrateOldMetadataToNew() {
        const resultSet = await db.any('SELECT id, json FROM reviewmetadata');
        if (resultSet.length > 0) {
            for (const result of resultSet) {
                if (result) {
                    this.upsertAverageRating(result.id, result.json);
                }
            }
        }
        await db.none('DROP TABLE reviewmetadata');
    }

    async migrateOldReviewsToNew() {
        const reviews = [];
        const resultSet = await db.any('SELECT deviceinfo, appinfo, reviewinfo, oldreviewinfo FROM reviewjson ORDER BY reviewinfo->>\'dateTime\' desc NULLS LAST');
        if (resultSet.length > 0) {
            for (const result of resultSet) {
                if (result) {
                    const createdReview = new MigrationReview(result.deviceinfo, result.appinfo, result.reviewinfo, result.oldreviewinfo);
                    reviews.push(createdReview);
                }
            }
        }
        this.insertReviews(reviews);
        await db.none('DROP TABLE reviewjson');
    }

    async upsertAverageRating(app, ratingJSON) {
        const query = 'INSERT INTO metadata (id, metadata) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET metadata=EXCLUDED.metadata';
        const values = [app, ratingJSON];
        return db.none(query, values);
    }

    async getAllReviewsWithWhere(where, input) {
        const wherePart = where ? 'WHERE ' + where : '';
        const reviews = [];
        const resultSet = await db.any('SELECT review FROM reviews ' + wherePart + ' ORDER BY posteddate desc NULLS LAST', input);
        for (const result of resultSet) {
            if (result) {
                const deviceInfo = result.review.deviceInfo;
                const appInfo = result.review.appInfo;
                const reviewInfo = result.review.reviewInfo;
                let oldReviewInfo;
                if (result.review.oldReviewInfo) {
                    oldReviewInfo = result.review.oldReviewInfo;
                }
                const createdReview = new Review(deviceInfo, appInfo, reviewInfo, oldReviewInfo);
                reviews.push(createdReview);
            }
        }
        return reviews;
    }

    async insertReviews(reviewsToInsert) {
        if (!reviewsToInsert || reviewsToInsert.length === 0) {
            return;
        }
        const values = this.generateValuesForDb(reviewsToInsert);
        const query = pgp.helpers.insert(values, cs);
        return db.none(query);
    }

    async updateReviews(reviewsToUpdate) {
        if (!reviewsToUpdate || reviewsToUpdate.length === 0) {
            return;
        }
        const values = this.generateValuesForDb(reviewsToUpdate);
        const query = pgp.helpers.update(values, cs) + ' WHERE v.id = t.id';
        return db.none(query);
    }

    generateValuesForDb(reviews) {
        const values = [];
        for (const review of reviews) {
            values.push({
                id: review.reviewInfo.id,
                appid: review.appInfo.id,
                posteddate: review.reviewInfo.dateTime ? review.reviewInfo.dateTime : null,
                review: review.getJSON()
            });
        }
        return values;
    }

    async getRatings(appName) {
        const result = await db.any('SELECT metadata FROM metadata WHERE id = $1', [appName]);
        if (result.length > 0 && result[0].metadata) {
            return result[0].metadata;
        }
        return {};
    }

    async updateRating(app, ratingJSON) {
        return this.upsertAverageRating(app, ratingJSON);
    }

    async getReviewsForLanguage(androidId, iosId, languageCode) {
        return this.getAllReviewsWithWhere('(appid = $1 OR appid = $2) AND review->\'deviceInfo\'->>\'languageCode\' = $3', [androidId, iosId, languageCode]);
    }

    async getReviewsForCountry(androidId, iosId, countryCode) {
        return this.getAllReviewsWithWhere('(appid = $1 OR appid = $2) AND review->\'deviceInfo\'->>\'countryCode\' = $3', [androidId, iosId, countryCode]);
    }

    async getReviewsForVersion(androidId, iosId, platform, version) {
        const appId = (platform.toLowerCase() === 'android') ? androidId : iosId;
        return this.getAllReviewsWithWhere('appid = $1 AND review->\'appInfo\'->>\'version\' = $2', [appId, version]);
    }

    async getReviews(androidId, iosId, platform) {
        const appId = (platform.toLowerCase() === 'android') ? androidId : iosId;
        return this.getAllReviewsWithWhere('appid = $1', [appId]);
    }

    async getAllReviews(androidId, iosId) {
        return this.getAllReviewsWithWhere('appid = $1 OR appid = $2', [androidId, iosId]);
    }

    async getAllReviewsGlobal() {
        return this.getAllReviewsWithWhere(null, []);
    }

    async addNewReviews(cleanReviews) {
        await this.insertReviews(cleanReviews.reviewsToInsert);
        return this.updateReviews(cleanReviews.reviewsToUpdate);
    }

    done() {
        pgp.end();
    }
};
