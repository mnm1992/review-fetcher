const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const iOSRSSParser = require('./../fetcher/iOSRSSParser');
const Review = require('../common/review');
const loadTestData = require('./loadTestData');

function constructReview1() {
  const deviceInfo = {};
  const appInfo = {};
  const reviewInfo = {};
  reviewInfo.id = '1611168505';
  reviewInfo.text = 'Die App funktioniert einwandfrei, einbinden der anderen Avent Sensoren (Babyphone Raumklima & Fieber Thermometer) erfolgt vollkommen problemlos. Das Sharing für meine Frau und mich auf zwei iPhones ist darüber hinaus ein sehr\n\t\t\twertvolles Feature, welches wie der Rest ohne Störungen funktioniert.';
  reviewInfo.title = 'Tut perfekt, was es soll...';
  reviewInfo.author = 'Darthmax78';
  reviewInfo.dateTime = new Date('2017-05-11T08:52:54-07:00');
  reviewInfo.hasTime = true;
  reviewInfo.rating = 5;
  reviewInfo.source = 'RSS';
  appInfo.id = '1063224663';
  appInfo.version = '1.4.1';
  deviceInfo.platform = 'iOS';
  deviceInfo.countryCode = 'at';
  deviceInfo.country = 'Austria';
  return new Review(deviceInfo, appInfo, reviewInfo);
}

function constructReview2() {
  const deviceInfo = {};
  const appInfo = {};
  const reviewInfo = {};
  reviewInfo.id = '1525063420';
  reviewInfo.text = 'Super hilfreich für frisch gebackene Eltern!';
  reviewInfo.title = 'Tolle App';
  reviewInfo.author = 'Hunny0308';
  reviewInfo.dateTime = new Date('2017-01-18T08:04:08-07:00');
  reviewInfo.hasTime = true;
  reviewInfo.rating = 5;
  reviewInfo.source = 'RSS';
  appInfo.id = '1063224663';
  appInfo.version = '1.3.1';
  deviceInfo.platform = 'iOS';
  deviceInfo.countryCode = 'at';
  deviceInfo.country = 'Austria';
  return new Review(deviceInfo, appInfo, reviewInfo);
}

describe('iOSRSSParser', function() {
  it('parse() should parse the xml document correctly', function(done) {
    loadTestData.readFile(__dirname + '/ReviewXMLPage.xml', function(xml) {
      iOSRSSParser.parse('1063224663', xml, 'at', function(parsedReviews, abort, lastPage) {
        expect(parseInt(lastPage)).to.equal(1);
        expect(abort).to.equal(false);
        expect(JSON.stringify(parsedReviews[0])).to.equal(JSON.stringify(constructReview1()));
        expect(JSON.stringify(parsedReviews[1])).to.equal(JSON.stringify(constructReview2()));
        done();
      });
    });
  });

  it('parse() should set the abort flag on error', function(done) {
    loadTestData.readFile(__dirname + '', function(xml) {
      iOSRSSParser.parse('1063224663', xml, 'at', function(parsedReviews, abort, lastPage) {
        expect(parseInt(lastPage)).to.equal(0);
        expect(abort).to.equal(true);
        expect(JSON.stringify(parsedReviews)).to.equal(JSON.stringify([]));
        done();
      });
    });
  });

  it('parse() should set the abort flag on an xml page with no reviews', function(done) {
    loadTestData.readFile(__dirname + '/EmptyReviewXMLPage.xml', function(xml) {
      iOSRSSParser.parse('1063224663', xml, 'at', function(parsedReviews, abort, lastPage) {
        expect(parseInt(lastPage)).to.equal(0);
        expect(abort).to.equal(true);
        expect(JSON.stringify(parsedReviews)).to.equal(JSON.stringify([]));
        done();
      });
    });
  });
});
