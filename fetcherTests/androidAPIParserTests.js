const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const androidAPIParser = require('./../fetcher/androidAPIParser');
const Review = require('../common/review');
const loadTestData = require('./loadTestData');

function constructReview1() {
  const deviceInfo = {};
  const appInfo = {};
  const reviewInfo = {};
  reviewInfo.id = 'gp:AOqpTOEFUWYS-7S2Ib7LOvXT4MpnNl_T7zMQE-_ly3PZmIxRwGbqjgWKX_TvfIWs_hFxbMKU6VYGxJT12Ip8E_k';
  reviewInfo.title = '';
  reviewInfo.text = 'Noticed that when the app is running simultaneously on two phones and one bottle feed entry is put in, the app registers two feeds as opposed to one.';
  reviewInfo.author = 'Rocky Vyas';
  reviewInfo.rating = 2;
  reviewInfo.dateTime = new Date(1496262654000);
  reviewInfo.hasTime = true;
  reviewInfo.source = 'API';
  appInfo.id = 'com.philips.cl.uGrowDigitalParentingPlatform';
  appInfo.version = '1.2.2';
  appInfo.versionCode = 67;
  deviceInfo.platform = 'Android';
  deviceInfo.device = 'noblelte';
  deviceInfo.osVersion = 24;
  deviceInfo.isoCode = 'en_GB';
  deviceInfo.deviceMetadata = {};
  deviceInfo.deviceMetadata.productName = "noblelte (Galaxy Note5)";
  deviceInfo.deviceMetadata.manufacturer = "Samsung";
  deviceInfo.deviceMetadata.deviceClass = "phone";
  deviceInfo.deviceMetadata.screenWidthPx = 1440;
  deviceInfo.deviceMetadata.screenHeightPx = 2560;
  deviceInfo.deviceMetadata.nativePlatform = "armeabi-v7a,armeabi,arm64-v8a";
  deviceInfo.deviceMetadata.screenDensityDpi = 560;
  deviceInfo.deviceMetadata.glEsVersion = 196609;
  deviceInfo.deviceMetadata.cpuModel = "Exynos 7420";
  deviceInfo.deviceMetadata.cpuMake = "Samsung";
  deviceInfo.deviceMetadata.ramMb = 4096;
  deviceInfo.country = 'United Kingdom';
  deviceInfo.language = 'English';
  deviceInfo.languageCode = 'en';
  deviceInfo.countryCode = 'gb';
  return new Review(deviceInfo, appInfo, reviewInfo);
}

function constructReview2() {
  const deviceInfo = {};
  const appInfo = {};
  const reviewInfo = {};
  reviewInfo.id = 'gp:AOqpTOEt5gKUwoUOs1eELcwgm60IdM7eBknwEz25_KiIpVgrc6T1TrLYVED12rlETl8ndrqX3Bf7yXitfW_BwTQ';
  reviewInfo.title = '';
  reviewInfo.text = 'Brilliant but just wish there was an option to add a second child as I have twins!';
  reviewInfo.author = 'Samantha Iasi';
  reviewInfo.rating = 4;
  reviewInfo.dateTime = new Date(1495936960000);
  reviewInfo.hasTime = true;
  reviewInfo.source = 'API';
  reviewInfo.developerComment = "Hi there, Samantha. Thanks for your feedback and we can understand that it's a bummer you cannot use the app if you have twins. Please know that we always want to improve our products and app, so this would be a good improvement. :)";
  reviewInfo.developerCommentDateTime = new Date(1496322652000);
  appInfo.id = 'com.philips.cl.uGrowDigitalParentingPlatform';
  appInfo.version = '1.2.2';
  appInfo.versionCode = 67;
  deviceInfo.platform = 'Android';
  deviceInfo.device = 'zerolte';
  deviceInfo.osVersion = 24;
  deviceInfo.isoCode = 'en_GB';
  deviceInfo.deviceMetadata = {};
  deviceInfo.deviceMetadata.productName = "zerolte (Galaxy S6 Edge)";
  deviceInfo.deviceMetadata.manufacturer = "Samsung";
  deviceInfo.deviceMetadata.deviceClass = "phone";
  deviceInfo.deviceMetadata.screenWidthPx = 1440;
  deviceInfo.deviceMetadata.screenHeightPx = 2560;
  deviceInfo.deviceMetadata.nativePlatform = "armeabi-v7a,armeabi,arm64-v8a";
  deviceInfo.deviceMetadata.screenDensityDpi = 640;
  deviceInfo.deviceMetadata.glEsVersion = 196609;
  deviceInfo.deviceMetadata.cpuModel = "Exynos 7420";
  deviceInfo.deviceMetadata.cpuMake = "Samsung";
  deviceInfo.deviceMetadata.ramMb = 3072;
  deviceInfo.country = 'United Kingdom';
  deviceInfo.language = 'English';
  deviceInfo.languageCode = 'en';
  deviceInfo.countryCode = 'gb';
  return new Review(deviceInfo, appInfo, reviewInfo);
}


describe('androidAPIParser', function() {
  it('parse() should parse the json correctly', function(done) {
    loadTestData.readFile(__dirname + '/AndroidAPIOutput.json', function(json) {
      androidAPIParser.parse('com.philips.cl.uGrowDigitalParentingPlatform', JSON.parse(json), function(parsedReviews) {
        expect(JSON.stringify(parsedReviews[0])).to.equal(JSON.stringify(constructReview1()));
        expect(JSON.stringify(parsedReviews[1])).to.equal(JSON.stringify(constructReview2()));
        done();
      });
    });
  });
});
