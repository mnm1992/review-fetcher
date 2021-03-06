/*jslint es6:true*/

const moment = require('moment');
const formatToCodeMap = {
    'cs': 'D MMMM YYYY',
    'de': 'D MMMM YYYY',
    'el': 'D MMMM YYYY',
    'es': 'D MMMM YYYY',
    'fr': 'D MMMM YYYY',
    'id': 'D MMMM YYYY',
    'it': 'D MMMM YYYY',
    'jv': 'D MMMM YYYY',
    'nl': 'D MMMM YYYY',
    'pl': 'D MMMM YYYY',
    'pt': 'D MMMM YYYY',
    'ro': 'D MMMM YYYY',
    'sr': 'D MMMM YYYY',
    'tr': 'D MMMM YYYY',
    'en': 'MMMM D YYYY',
    'hu': 'YYYY MMMM D',
    'ru': 'D MMMM YYYY',
    'ja': 'YYYY年M月D日',
    'zh-cn': 'YYYY年M月D日'
};

String.prototype.replaceAll = function (str1, str2, ignore) {
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof (str2) === "string") ? str2.replace(/\$/g, "$$$$") : str2);
};

module.exports = class DateFormatGueser {
    bruteForceDate(dateString) {
        let date = this.tryAllOptions(dateString);
        if (date) {
            return date;
        }
        const components = this.splitDatesInComponents(dateString);
        date = this.tryAllOptions(components.casedString);
        if (date) {
            return date;
        }
        date = this.tryAllOptions(components.string);
        if (date) {
            return date;
        }
        return null;
    }

    tryAllOptions(dateString) {
        const allKeys = Object.keys(formatToCodeMap);
        for (const key of allKeys) {
            const date = this.parseDate(dateString, key);
            if (date) {
                return date;
            }
        }
        console.error('Date string could not be parsed: \'' + dateString + '\'');
        return null;
    }

    parseDate(dateString, languageCode) {
        const dateFormat = formatToCodeMap[languageCode];
        if (dateFormat) {
            moment.locale(languageCode);
            const date = moment(dateString, dateFormat, true);
            if (date && date.isValid()) {
                return date.toDate();
            }
        }
        return null;
    }

    isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    guesDate(dateString, languageCode) {
        const dateStringToParse = dateString.replaceAll('.', '').replaceAll(',', '').replaceAll(' de ', ' ');
        let date = this.parseDate(dateStringToParse, languageCode);
        if (!date) {
          let toTry;
          const index = this.isNumeric(2) == ' ' ? (this.isNumeric(4) == ' ' ? 6 : 4) : 3;
          if (dateStringToParse.charAt(index) == dateStringToParse.charAt(index).toLowerCase()) {
            toTry = dateStringToParse.substr(0, index-1) + dateStringToParse.charAt(index).toUpperCase() + dateStringToParse.substr(index+1);
          } else {
            toTry = dateStringToParse.substr(0, index-1) + dateStringToParse.charAt(index).toLowerCase() + dateStringToParse.substr(index+1);
          }
          date = this.parseDate(toTry, languageCode);
        }
        if (!date) {
            date = this.bruteForceDate(dateStringToParse);
        }
        return date;
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    splitDatesInComponents(dateString) {
        let year;
        let day;
        let longestComponent = '';
        const dateComponents = dateString.split(" ");
        for (let i = 0; i < dateComponents.length; i++) {
            const component = dateComponents[i];
            if (this.isNumeric(component)) {
                if (component.length === 4) {
                    year = parseFloat(component);
                } else {
                    day = parseFloat(component);
                }
            } else if (longestComponent.length < component.length) {
                longestComponent = component;
            }
        }
        const month = longestComponent;
        return {
            day: day,
            month: month,
            year: year,
            string: day + ' ' + month + ' ' + year,
            casedString: day + ' ' + this.capitalizeFirstLetter(month) + ' ' + year
        };
    }

};
