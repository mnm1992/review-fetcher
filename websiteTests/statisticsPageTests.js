const chai = require('chai');
const expect = chai.expect; 
const statisticsPage = require('./../website/statisticsPage');
const Review = require('../common/review');

describe('statisticsPage', function() {
  it('constructTimeBetweenReviewsMap() should return 0 if the input array is empty', function() {
    const timeAverage = statisticsPage.constructTimeBetweenReviewsMap([]);
    expect(timeAverage).to.equal(0);
  });

  it('constructTimeBetweenReviewsMap() should return the average time between reviews', function() {
    const date1 = new Date(2017, 05, 32, 11, 10, 9, 0);
    const date2 = new Date(2017, 05, 32, 11, 10, 9, 2);
    const date3 = new Date(2017, 05, 32, 11, 10, 9, 6);

    const review1 = new Review({},{},{dateTime: date1});
    const review2 = new Review({},{},{dateTime: date2});
    const review3 = new Review({},{},{dateTime: date3});

    const timeAverage = statisticsPage.constructTimeBetweenReviewsMap([review3, review2, review1]);
    expect(timeAverage).to.equal(3);
  });

  it('constructTimeBetweenReviewsMap() should ignore reviews from the wrong platform', function() {
    const date1 = new Date(2017, 05, 32, 11, 10, 9, 0);
    const date2 = new Date(2017, 05, 32, 11, 10, 9, 2);
    const date3 = new Date(2017, 05, 32, 11, 10, 9, 6);

    const review1 = new Review({platform: 'x'},{},{dateTime: date1});
    const review2 = new Review({platform: 'y'},{},{dateTime: date2});
    const review3 = new Review({platform: 'x'},{},{dateTime: date3});

    const timeAverage = statisticsPage.constructTimeBetweenReviewsMap([review3, review2, review1],'x');
    expect(timeAverage).to.equal(6);
  });

  it('constructLanguagesMap() should return the correct average per country', function() {
    const review1 = new Review({languageCode: 'x',language: 'xyz'},{},{rating: 2});
    const review2 = new Review({languageCode: 'y',language: 'yz1'},{},{rating: 1});
    const review3 = new Review({languageCode: 'x',language: 'xyz'},{},{rating: 4});
    const languageMapArray = statisticsPage.constructLanguagesMap([review3, review2, review1]);
    const languageX = languageMapArray[0].languageCode === 'x'?languageMapArray[0]:languageMapArray[1];
    const languageY = languageMapArray[0].languageCode === 'y'?languageMapArray[0]:languageMapArray[1];
    expect(languageX.total).to.equal(2);
    expect(languageX.average).to.equal(3);
    expect(languageY.total).to.equal(1);
    expect(languageY.average).to.equal(1);
  });

  it('constructCountriesMap() should return the correct average per country', function() {
    const review1 = new Review({countryCode: 'nl',country: 'xyz'},{},{rating: 2});
    const review2 = new Review({countryCode: 'de',country: 'yz1'},{},{rating: 1});
    const review3 = new Review({countryCode: 'nl',country: 'xyz'},{},{rating: 4});
    const countryMapArray = statisticsPage.constructCountriesMap([review3, review2, review1]);
    const countryNL = countryMapArray[0].countryCode === 'nl'?countryMapArray[0]:countryMapArray[1];
    const countryDE = countryMapArray[0].countryCode === 'de'?countryMapArray[0]:countryMapArray[1];
    expect(countryNL.total).to.equal(2);
    expect(countryNL.average).to.equal(3);
    expect(countryDE.total).to.equal(1);
    expect(countryDE.average).to.equal(1);
  });

  it('constructCountriesMap() should ignore reviews from the wrong platform', function() {
    const review1 = new Review({countryCode: 'nl',country: 'xyz',platform: 'x'},{},{rating: 2});
    const review2 = new Review({countryCode: 'de',country: 'yz1',platform: 'x'},{},{rating: 1});
    const review3 = new Review({countryCode: 'nl',country: 'xyz',platform: 'y'},{},{rating: 4});
    const countryMapArray = statisticsPage.constructCountriesMap([review3, review2, review1],'x');
    const countryNL = countryMapArray[0].countryCode === 'nl'?countryMapArray[0]:countryMapArray[1];
    const countryDE = countryMapArray[0].countryCode === 'de'?countryMapArray[0]:countryMapArray[1];
    expect(countryNL.total).to.equal(1);
    expect(countryNL.average).to.equal(2);
    expect(countryDE.total).to.equal(1);
    expect(countryDE.average).to.equal(1);
  });

  it('constructVersionMap() should return the correct average per version', function() {
    const review1 = new Review({platform: 'x'},{version: '1'},{rating: 2});
    const review2 = new Review({platform: 'x'},{version: '1'},{rating: 2});
    const review3 = new Review({platform: 'x'},{version: '2'},{rating: 1});
    const review4 = new Review({platform: 'y'},{version: '2'},{rating: 4});
    const versionMap = statisticsPage.constructVersionMap([review4, review3, review2, review1],'x');
    const keyx1 = versionMap['x 1'];
    const keyx2 = versionMap['x 2'];
    const keyy2 = versionMap['y 2'];
    expect(keyx1.total).to.equal(2);
    expect(keyx1.average).to.equal(2);
    expect(keyx2.total).to.equal(1);
    expect(keyx2.average).to.equal(1);
    expect(keyy2.total).to.equal(1);
    expect(keyy2.average).to.equal(4);
  });
});
