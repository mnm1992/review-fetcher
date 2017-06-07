const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const dateFormatGueser = require('./../fetcher/dateFormatGueser');

const mapToTest = {
  'de': '21. Mai 2017',
  'el': '20 Μαΐου 2017',
  'en': 'June 2, 2017',
  'es': '2 de junio de 2017',
  'fr': '1 juin 2017',
  'hu': '2017. május 25.',
  'id': '18 Mei 2017',
  'it': '2 giugno 2017',
  'ja': '2017年6月2日',
  'jv': '18 Mei 2017',
  'nl': '31 mei 2017',
  'pl': '22 maja 2017',
  'ro': '21 mai 2017',
  'sv': '15 december 2016',
  'tr': '31 Mayıs 2017',
  'zh-cn': '2017年5月30日'
};

const expectedResults = {
  'de': '2017-05-21',
  'el': '2017-05-20',
  'en': '2017-06-02',
  'es': '2017-06-02',
  'fr': '2017-06-01',
  'hu': '2017-05-25',
  'id': '2017-05-18',
  'it': '2017-06-02',
  'ja': '2017-06-02',
  'jv': '2017-05-18',
  'nl': '2017-05-31',
  'pl': '2017-05-22',
  'pt': '2017-06-02',
  'ro': '2017-05-21',
  'sr': '2017-05-22.',
  'sv': '2016-12-15',
  'tr': '2017-05-31',
  'zh-cn': '2017-05-30'
};

describe('dateFormatGueser', function() {
  it('guesDate() should parse the date correctly', function(done) {
    const keys = Object.keys(mapToTest);
    for(var i=0;i<keys.length;i++){
      const result = JSON.stringify(dateFormatGueser.guesDate(mapToTest[keys[i]]));
      const expectedResult = JSON.stringify(new Date(expectedResults[keys[i]]));
      expect(result).to.equal(expectedResult);
    }
    done();
  });
});
