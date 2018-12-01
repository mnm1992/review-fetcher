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
const objectVersionColumn = new Column('?objectversion');
const reviewColumn = new Column({
    name: 'review',
    cast: 'json'
});
const cs = new pgp.helpers.ColumnSet([reviewidColumn, appidColumn, postedDateColumn, reviewColumn, objectVersionColumn], {
    table: 'reviews'
});
const currentObjectVersion = 4;

module.exports = class ReviewJSONDB {

    async setUpDB() {
        const reviewsTableResult = await db.any('SELECT to_regclass(\'reviews\')');
        if (!reviewsTableResult[0].to_regclass) {
            await db.none('CREATE TABLE reviews(id TEXT PRIMARY KEY NOT NULL, appid TEXT NOT NULL, posteddate date, review JSON NOT NULL, objectversion INTEGER NOT NULL)');
        }
        const metadataTableResult = await db.any('SELECT to_regclass(\'metadata\')');
        if (!metadataTableResult[0].to_regclass) {
            await db.none('CREATE TABLE metadata(id TEXT PRIMARY KEY NOT NULL, metadata JSON NOT NULL, objectversion INTEGER NOT NULL)');
        }
        const reviewJSONTableResult = await db.any('SELECT to_regclass(\'reviewjson\')');
        if (reviewJSONTableResult[0].to_regclass) {
            await this.migrateOldReviewsToNew();
        }
        const reviewMetadataTableResult = await db.any('SELECT to_regclass(\'reviewmetadata\')');
        if (reviewMetadataTableResult[0].to_regclass) {
            await this.migrateOldMetadataToNew();
        }
        await this.migrateFromv2Database();
        await this.migrateFromv3Database();
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

    async migrateFromv1Database(){
        const resultSet = await db.any('SELECT deviceinfo, appinfo, reviewinfo, oldreviewinfo FROM reviewjson ORDER BY reviewinfo->>\'dateTime\' desc NULLS LAST');
        const reviews = [];
        if (resultSet.length > 0) {
            for (const result of resultSet) {
                if (result) {
                    const createdReview = new MigrationReview(result.deviceinfo, result.appinfo, result.reviewinfo, result.oldreviewinfo);
                    reviews.push(createdReview);
                }
            }
            this.insertReviews(reviews);
        }
        await db.none('DROP TABLE reviewjson');
    }

    async migrateFromv2Database(){
      return this.migrateDatabase(2);
    }

    async migrateFromv3Database(){
      return this.migrateDatabase(3);
    }

    async migrateDatabase(version){
        const resultSet = await db.any('SELECT review FROM reviews WHERE objectversion = $1 ORDER BY posteddate desc NULLS LAST', [version]);
        const reviews = [];
        if (resultSet.length > 0) {
            for (const result of resultSet) {
                if (result) {
                    if(result.review) {
                        const deviceInfo = result.review.deviceInfo;
                        const appInfo = result.review.appInfo;
                        const reviewInfo = result.review.reviewInfo;
                        let oldReviewInfo;
                        if (result.review.oldReviewInfo) {
                            oldReviewInfo = result.review.oldReviewInfo;
                        }
                        const createdReview = new MigrationReview(deviceInfo, appInfo, reviewInfo, oldReviewInfo);
                        reviews.push(createdReview);
                    } else {
                        console.log('temp' + result);
                    }
                }
            }
            this.updateReviews(reviews);
        }
    }

    async upsertAverageRating(app, ratingJSON, objectVersion=currentObjectVersion) {
        const query = 'INSERT INTO metadata (id, metadata, objectversion) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET metadata=EXCLUDED.metadata, objectversion=EXCLUDED.objectversion';
        const values = [app, ratingJSON, objectVersion];
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

    async insertReviews(reviewsToInsert, objectVersion=currentObjectVersion) {
        if (!reviewsToInsert || reviewsToInsert.length === 0) {
            return;
        }
        const values = this.generateValuesForDb(reviewsToInsert, objectVersion);
        const query = pgp.helpers.insert(values, cs);
        return db.none(query);
    }

    async updateReviews(reviewsToUpdate, objectVersion=currentObjectVersion) {
        if (!reviewsToUpdate || reviewsToUpdate.length === 0) {
            return;
        }
        const values = this.generateValuesForDb(reviewsToUpdate, objectVersion);
        const query = pgp.helpers.update(values, cs) + ' WHERE v.id = t.id';
        return db.none(query);
    }

    generateValuesForDb(reviews, objectVersion) {
        const values = [];
        for (const review of reviews) {
            values.push({
                id: review.reviewInfo.id,
                appid: review.appInfo.id,
                posteddate: review.reviewInfo.dateTime ? review.reviewInfo.dateTime : new Date(0),
                review: review.getJSON(),
                objectversion: objectVersion
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
