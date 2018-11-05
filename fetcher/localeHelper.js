const CountryLanguage = require('country-language');

module.exports = class LocaleHelper {

    async getCountry(isoCode) {
        return new Promise((resolve, reject) => {
            CountryLanguage.getCountry(isoCode, (err, country) => {
                if (err) {
                    console.error("Country with code: %s does not exist", isoCode);
                    resolve(undefined);
                } else {
                    resolve(country.name);
                }
            });
        });
    }

    async getLanguage(isoCode) {
        return new Promise((resolve, reject) => {
            CountryLanguage.getLanguage(isoCode, (err, language) => {
                if (err) {
                    console.error("Language with code: %s does not exist", isoCode);
                    resolve(undefined);
                } else {
                    resolve(language.name[0]);
                }
            });
        });
    }

};
