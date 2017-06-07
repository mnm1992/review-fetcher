const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const androidScrapedParser = require('./../fetcher/androidScrapedParser');
const Review = require('../common/review');
const loadTestData = require('./loadTestData');

function constructReview1() {
  const deviceInfo = {};
  const appInfo = {};
  const reviewInfo = {};
  appInfo.id = 'com.philips.cl.uGrowDigitalParentingPlatform';
  deviceInfo.platform = 'Android';
  deviceInfo.language = 'Swedish';
  deviceInfo.languageCode = 'sv';
  reviewInfo.id = "gp:AOqpTOHZRZybbB5PUupXYMUDG7yN57X0tdrD7AGNjUTuiTtFVSi4bQorAoeZPjs4GAn7tvkt24zm-6t5eXM0JxE";
  reviewInfo.text = 'Enkel att använda och perfekt till de uppkopplade produkterna. Skönt att kunna få överblick över mönster på amningen i början. Alla artiklar innehåller bra info och är lagom långa. Tack Philips avent, bra jobbat!  Hela recensionen';
  reviewInfo.title = '';
  reviewInfo.author = 'Linda Hjorth';
  reviewInfo.rating = 5;
  reviewInfo.source = 'Scraped';
  reviewInfo.developerComment = 'Test text';
  reviewInfo.developerCommentDateTime = new Date('2017-05-06');
  reviewInfo.dateTime =  new Date('2017-05-05');
  return new Review(deviceInfo, appInfo, reviewInfo);
}

function constructReview2() {
  const deviceInfo = {};
  const appInfo = {};
  const reviewInfo = {};
  appInfo.id = 'com.philips.cl.uGrowDigitalParentingPlatform';
  deviceInfo.platform = 'Android';
  deviceInfo.language = 'Swedish';
  deviceInfo.languageCode = 'sv';
  reviewInfo.id = "gp:AOqpTOHtOT4J1kvGJ-Svx8y9qpuf_3ti5koPSRbtF1sLN39_-4wZzJ5XUmQjrWAsN1on4ecPgeBHOoW_fFmj_48";
  reviewInfo.text = 'Men ingen möjlighet att lägga till mer än ett barn  Hela recensionen';
  reviewInfo.title = 'Ok';
  reviewInfo.author = 'Melisa Dervisevic';
  reviewInfo.rating = 2;
  reviewInfo.source = 'Scraped';
  reviewInfo.dateTime =  new Date('2016-12-15');
  return new Review(deviceInfo, appInfo, reviewInfo);
}

function createTestData(){
  const array = [];
  for(var i=0; i<40;i++){
    array.push({
        "id": "",
        "userName": "",
        "date": "5 maj 2017",
        "score": 5,
        "title": "",
        "text": "",
      });
  }
  return array;
}

describe('androidScrapedParser', function() {
  it('parse() should parse the json correctly', function(done) {
    loadTestData.readFile(__dirname + '/AndroidScrapedOutput.json', function(json) {
      androidScrapedParser.parse('com.philips.cl.uGrowDigitalParentingPlatform', JSON.parse(json), 'sv', 'Swedish', function(parsedReviews, abort, more) {
        expect(more).to.equal(false);
        expect(abort).to.equal(false);
        expect(JSON.stringify(parsedReviews[0])).to.equal(JSON.stringify(constructReview1()));
        expect(JSON.stringify(parsedReviews[1])).to.equal(JSON.stringify(constructReview2()));
        done();
      });
    });
  });

  it('parse() should parse an empty array correctly', function(done) {
      androidScrapedParser.parse('com.philips.cl.uGrowDigitalParentingPlatform', [], 'sv', 'Swedish', function(parsedReviews, abort, more) {
        expect(more).to.equal(false);
        expect(abort).to.equal(true);
        expect(parsedReviews.length).to.equal(0);
        done();
      });
  });

  it('parse() should set the next page flag if there are mote then 40 comments', function(done) {
      androidScrapedParser.parse('com.philips.cl.uGrowDigitalParentingPlatform', createTestData(), 'sv', 'Swedish', function(parsedReviews, abort, more) {
        expect(more).to.equal(true);
        expect(abort).to.equal(false);
        expect(parsedReviews.length).to.equal(40);
        done();
      });
  });
});
