const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const IOSRatingScraper = require('./../fetcher/iosRatingScraper');
const loadTestData = require('./loadTestData');
const iOSRatingScraper = new IOSRatingScraper();

describe('iosRatingScraper', function() {
  it('parse() should parse the xml document correctly', function(done) {
    loadTestData.readFile(__dirname + '/itunes.xml', function(xml) {
      iOSRatingScraper.parseHistogram(xml, 'gb', function(_ , histogram) {
        const expectedHistogram = {'1':1,'2':0,'3':1,'4':2,'5':3};
        expect(JSON.stringify(histogram['gb'])).to.equal(JSON.stringify(expectedHistogram));
        done();
      });
    });
  });

  it('parse() should parse the xml document correctly', function(done) {
    loadTestData.readFile(__dirname + '/itunes.xml', function(xml) {
      iOSRatingScraper.parseReviews(xml, 'gb', function(_ , histogram) {
        done();
      });
    });
  });
});
