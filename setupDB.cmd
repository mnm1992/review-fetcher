psql -c "DROP TABLE IF EXISTS reviewJSON;"
psql -c "CREATE TABLE reviewJSON(reviewId TEXT PRIMARY KEY NOT NULL, appid TEXT NOT NULL, deviceInfo JSON NOT NULL, appInfo JSON NOT NULL, reviewInfo JSON NOT NULL, oldreviewInfo JSON NOT NULL);"
psql -c "DROP TABLE IF EXISTS reviewmetadata;"
psql -c "CREATE TABLE reviewmetadata(id TEXT PRIMARY KEY NOT NULL, json JSON NOT NULL);"
node startFetching.js
