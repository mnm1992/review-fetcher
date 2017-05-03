var reviewHelper = require('./reviewHelper');
var Review = require('./review');
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
var oldReviewInfoColumn = new Column({
  name: 'oldreviewinfo',
  cast: 'json',
});

function getAllReviewsWithWhere(config, where, input, callback) {
  var reviews = [];
  db.any('SELECT deviceinfo, appinfo, reviewinfo, oldReviewInfo FROM reviewjson WHERE ' + where + ' ORDER BY reviewinfo->>\'dateTime\' desc', input)
    .then(function(result) {
      result.forEach(function(review) {
        if (review) {
          var deviceInfo = review.deviceinfo;
          var appInfo = review.appinfo;
          var reviewInfo = review.reviewinfo;
          var createdReview = new Review(deviceInfo, appInfo, reviewInfo);
          if (review.oldReviewInfo && review.oldReviewInfo.length > 0) {
            createdReview.oldReviewInfo = review.oldReviewInfo;
          }
          reviews.push(createdReview);
        }
      });
      callback(reviews);
    })
    .catch(function(error) {
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
  var values = [];
  console.log('Inserting ' + reviewsToInsert.length + ' into the db');
  reviewsToInsert.forEach(function(review) {
    values.push({
      reviewid: review.reviewInfo.id,
      appid: review.appInfo.id,
      deviceinfo: review.deviceInfo,
      appinfo: review.appInfo,
      reviewinfo: review.reviewInfo
    });
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
      console.error(error);
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
  reviewsToUpdate.forEach(function(review) {
    values.push({
      reviewid: review.reviewid,
      deviceinfo: review.deviceInfo,
      appinfo: review.appInfo,
      reviewinfo: review.reviewInfo,
      oldreviewinfo: review.oldReviewInfo ? review.oldReviewInfo : {}
    });
  });
  var Column = pgp.helpers.Column;
  var whereReviewidColumn = new Column({
    name: 'reviewid',
    cnd: true
  });
  var cs = new pgp.helpers.ColumnSet([whereReviewidColumn, deviceinfoColumn, appinfoColumn, reviewInfoColumn, oldReviewInfoColumn], {
    table: 'reviewjson'
  });

  var query = pgp.helpers.update(values, cs) + ' WHERE v.reviewid = t.reviewid';
  db.none(query)
    .then(data => {
      callback();
    })
    .catch(error => {
      console.error(error);
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

  addNewReviews(config, reviewsFetched, callback) {
    if (!reviewsFetched) {
      console.log('No new reviews');
      callback([]);
      return;
    }
    console.time('Fetched all reviews');
    this.getAllReviews(config, function(reviewsFromDB) {
      console.timeEnd('Fetched all reviews');
      console.time('Checking for duplicates');
      var cleanReviews = reviewHelper.mergeReviewsFromArrays(reviewsFromDB, reviewsFetched);
      console.timeEnd('Checking for duplicates');
      console.log('Reviews in db: ' + (reviewsFromDB ? reviewsFromDB.length : 0));
      console.log('Reviews fetched: ' + (reviewsFetched ? reviewsFetched.length : 0));
      console.log('New reviews: ' + cleanReviews.newReviews.length);
      console.time('Updated all reviews');
      blukInsert(cleanReviews.reviewsToInsert, function() {
        console.timeEnd('Updated all reviews');
        console.time('Inserted all reviews');
        blukUpdate(cleanReviews.reviewsToUpdate, function() {
          console.timeEnd('Inserted all reviews');
          callback(cleanReviews.newReviews);
        });
      });
    });
  }
};
