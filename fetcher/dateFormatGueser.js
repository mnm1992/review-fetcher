const dateLib = require('date-and-time');
const formatToCodeMap = {
  'de': 'D MMMM YYYY',
  'el': 'D MMMM YYYY',
  'es': 'D MMMM YYYY',
  'fr': 'D MMMM YYYY',
  'id': 'D MMMM YYYY',
  'it': 'D MMMM YYYY',
  'jv': 'D MMMM YYYY',
  'nl': 'D MMMM YYYY',
  'pl': 'D MMMM YYYY',
  'ro': 'D MMMM YYYY',
  'sr': 'D MMMM YYYY',
  'tr': 'D MMMM YYYY',
  'en': 'MMMM D YYYY',
  'hu': 'YYYY MMMM D',
  'ja': 'YYYY年M月D日',
  'zh-cn': 'YYYY年M月D日'
};

String.prototype.replaceAll = function(str1, str2, ignore){
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

module.exports = {

  bruteForceDate: function(dateString) {
    const allKeys = Object.keys(formatToCodeMap);
    for (var i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      const date = this.parseDate(dateString, key);
      if (date) {
        return date;
      }
    }
    console.error('Date string could not be parsed: \'' + dateString + '\'');
    return null;
  },

  parseDate(dateString, languageCode) {
    const dateFormat = formatToCodeMap[languageCode];
    if (dateFormat) {
      dateLib.locale(languageCode);
      const date = dateLib.parse(dateString, dateFormat, true);
      if (date) {
        return date;
      }
    }
    return null;
  },

  guesDate: function(dateString, languageCode) {
    var dateStringToParse = dateString.replaceAll('.', '').replaceAll(',', '').replaceAll(' de ', ' ');
    var date = this.parseDate(dateStringToParse, languageCode);
    if (!date) {
      date = this.bruteForceDate(dateStringToParse);
    }
    return date;
  }
};
