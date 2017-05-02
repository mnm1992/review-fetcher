psql -c "DROP TABLE IF EXISTS reviewJSON;"
psql -c "CREATE TABLE reviewJSON(reviewId TEXT PRIMARY KEY NOT NULL, appid TEXT NOT NULL, deviceInfo JSON NOT NULL, appInfo JSON NOT NULL, reviewInfo JSON NOT NULL);"
node startFetching.js
