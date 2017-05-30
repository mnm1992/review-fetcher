const CountryLanguage = require('country-language');

function languageArrayToString(languages) {
  var text = '';
  languages.forEach(function(language) {
    text += language + ', ';
  });
  return text.slice(0, -2);
}

module.exports = class LocaleHelper {

  getCountryAndLanguage(isoCode, callback) {
    const splitIsoArray = isoCode.split('_');
    const langString = splitIsoArray[0];
    const countryString = splitIsoArray[1];
    const self = this;
    self.getCountry(countryString, function(country) {
      self.getLanguage(langString, function(language) {
        callback(country, language);
      });
    });
  }

  getLanguage(isoCode, callback) {
    CountryLanguage.getLanguage(isoCode, function(err, language) {
      if (err) {
        console.log(err);
        callback('');
      } else {
        callback(languageArrayToString(language.name));
      }
    });
  }


  getCountry(isoCode, callback) {
    CountryLanguage.getCountry(isoCode, function(err, country) {
      if (err) {
        console.log(err);
        callback('');
      } else {
        callback(country.name);
      }
    });
  }
};
