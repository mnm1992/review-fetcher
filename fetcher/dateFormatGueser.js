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
	'pt': 'D MMMM YYYY',
	'ro': 'D MMMM YYYY',
	'sr': 'D MMMM YYYY',
	'tr': 'D MMMM YYYY',
	'en': 'MMMM D YYYY',
	'hu': 'YYYY MMMM D',
	'ja': 'YYYY年M月D日',
	'zh-cn': 'YYYY年M月D日'
};

String.prototype.replaceAll = function (str1, str2, ignore) {
	return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof (str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);
};

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function splitDatesInComponents(dateString) {
	var year;
	var month;
	var day;
	var longestComponent = '';
	var dateComponents = dateString.split(" ");
	for (var i = 0; i < dateComponents.length; i++) {
		const component = dateComponents[i];
		if (isNumeric(component)) {
			if (component.length == 4) {
				year = parseFloat(component);
			} else {
				day = parseFloat(component);
			}
		} else if (longestComponent.length < component.length) {
			longestComponent = component;
		}
	}
	month = longestComponent;
	return {
		day: day,
		month: month,
		year: year,
		string: day + ' ' + month + ' ' + year,
		casedString: day + ' ' + capitalizeFirstLetter(month) + ' ' + year
	};
}

module.exports = {
	bruteForceDate: function (dateString) {
		var date = this.tryAllOptions(dateString);
		if (date) {
			return date;
		}
		var components = splitDatesInComponents(dateString)
		date = this.tryAllOptions(components.casedString);
		if (date) {
			return date;
		}
		date = this.tryAllOptions(components.string);
		if (date) {
			return date;
		}
		return null;
	},

	tryAllOptions: function (dateString) {
		const allKeys = Object.keys(formatToCodeMap);
		for (var i = 0; i < allKeys.length; i++) {
			const key = allKeys[i];
			var date = this.parseDate(dateString, key);
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

	guesDate: function (dateString, languageCode) {
		var dateStringToParse = dateString.replaceAll('.', '').replaceAll(',', '').replaceAll(' de ', ' ');
		var date = this.parseDate(dateStringToParse, languageCode);
		if (!date) {
			date = this.bruteForceDate(dateStringToParse);
		}
		return date;
	}
};
