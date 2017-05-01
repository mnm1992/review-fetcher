var ReviewJSONDB = require('./ReviewJSONDB');
var reviewDB = new ReviewJSONDB();
var X2JS = require('x2js');
var x2js = new X2JS();
var json2csv = require('json2csv');

module.exports = class DataExport {

  exportJSON(config, completion) {
    var reviewArray = [];
    reviewDB.getAllReviews(config, function(reviews) {
      reviews.forEach(function(review) {
        reviewArray.push(review.getJSON());
      });
      completion(JSON.stringify(reviewArray), config.appName + '_reviews.json');
    });
  }

  exportXML(config, completion) {
    var reviewArray = [];
    reviewDB.getAllReviews(config, function(reviews) {
      reviews.forEach(function(review) {
        reviewArray.push(review.getJSON());
      });
      completion(x2js.js2xml({
        "reviews": {
          "review": reviewArray
        }
      }), config.appName + '_reviews.xml');
    });
  }

  exportCSV(config, completion) {
    var reviewArray = [];
    var fields = [];
    var fieldNames = [];
    if (config.androidAuthentication) {
      fields = ['reviewInfo.id', 'reviewInfo.dateTime', 'reviewInfo.author', 'reviewInfo.title', 'reviewInfo.text', 'reviewInfo.rating', 'reviewInfo.developerCommentDateTime', 'reviewInfo.developerComment', 'appInfo.id', 'appInfo.version', 'appInfo.versionCode', 'deviceInfo.isoCode', 'deviceInfo.country', 'deviceInfo.language', 'deviceInfo.platform', 'deviceInfo.osVersion', 'deviceInfo.device', 'deviceInfo.deviceMetadata.productName', 'deviceInfo.deviceMetadata.manufacturer', 'deviceInfo.deviceMetadata.deviceClass', 'deviceInfo.deviceMetadata.screenWidthPx', 'deviceInfo.deviceMetadata.screenHeightPx', 'deviceInfo.deviceMetadata.nativePlatform', 'deviceInfo.deviceMetadata.screenDensityDpi', 'deviceInfo.deviceMetadata.glEsVersion', 'deviceInfo.deviceMetadata.cpuModel', 'deviceInfo.deviceMetadata.cpuMake', 'deviceInfo.deviceMetadata.ramMb'];
      fieldNames = ['Id', 'Date', 'Author', 'Title', 'Text', 'Rating', 'Developer comment date', 'Developer comment', 'App id', 'App version', 'App version code', 'Device iso code', 'Device country', 'Device language', 'Device platform', 'Device os version', 'Device name', 'Device product name', 'Device manufactorer', 'Device class', 'Device screen widthin px', 'Device screen height in px', 'Device native platform', 'Device screen density dpi', 'Device glEsVersion', 'Device cpu model', 'Device cpu make', 'device ram in mb'];
    } else {
      fields = ['reviewInfo.id', 'reviewInfo.dateTime', 'reviewInfo.author', 'reviewInfo.title', 'reviewInfo.text', 'reviewInfo.rating', 'appInfo.id', 'appInfo.version', 'deviceInfo.country', 'deviceInfo.language', 'deviceInfo.platform'];
      fieldNames = ['Id', 'Date', 'Author', 'Title', 'Text', 'Rating', 'App id', 'App version', 'Device country', 'Device language', 'Device platform'];
    }
    reviewDB.getAllReviews(config, function(reviews) {
      reviews.forEach(function(review) {
        reviewArray.push(review.getJSON());
      });
			completion(json2csv({
        data: reviewArray,
        fields: fields,
        fieldNames: fieldNames
      }), config.appName + '_reviews.csv');
    });
  }
};
