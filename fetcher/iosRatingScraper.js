const storeMap = require('./iOSStores');
const async = require('async');
const request = require('request');
const xml2js = require('xml2js');

module.exports = class IOSRatingFetcher {

	constructor(config) {
		this.config = config;
	}

	fetchRatings(completion) {
		const self = this;
		const fetchActions = [];

		self.config.countries.forEach(function (country) {
			fetchActions.push(function (callback) {
				fetchRatingsForCountry(country, self.config.iosId, callback);
			});
		});
		var histograms = {};
		async.parallel(fetchActions, function (err, results) {
			if (results && results.length > 0) {
				results.forEach(function (result) {
					histograms = Object.assign(histograms, result);
				});
			}
			completion(histograms);
		});
	}
};

function constructOptions(country, appId) {
	return {
		url: 'http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=' + appId + '&pageNumber=0&sortOrdering=2&type=Purple+Software',
		headers: {
			'User-Agent': 'iTunes/9.1.1',
			'X-Apple-Store-Front': storeMap[country],
		}
	};
}

function findNumber(ignore, string) {
	const numberPattern = /\d+/g;
	const foundNumbers = (string.match(numberPattern));
	for (var i = 0; i < foundNumbers.length; i++) {
		const foundNumber = parseFloat(foundNumbers[i]);
		if (foundNumber !== ignore) {
			return foundNumber;
		}
	}
	return ignore;
}

function walkJsonTree(path, json) {
	const pathComponents = path.split('/');
	var currentView = json;
	for (var i = 0; i < pathComponents.length; i++) {
		if (currentView[pathComponents[i]]) {
			currentView = currentView[pathComponents[i]];
		} else {
			return null;
		}
	}
	return currentView;
}

function fetchRatingsForCountry(country, appId, callback) {
	request(constructOptions(country, appId), function (requestError, response, body) {
		if(requestError){
			console.error(requestError);
			callback(null, {});
			return;
		}
		xml2js.parseString(body,
			function (xmlParsingError, json) {
				if(xmlParsingError){
					console.error(xmlParsingError);
					callback(null, {});
					return;
				}
				const histogram = {
					1: 0,
					2: 0,
					3: 0,
					4: 0,
					5: 0
				};

				const histogramWebObjectContainer = walkJsonTree('Document/View/0/ScrollView/0/VBoxView/0/View/0/MatrixView/0/VBoxView/0/HBoxView/0/VBoxView/1/VBoxView/0/View/0/View/0/View/0/VBoxView/0/Test/0/VBoxView/1/MatrixView/0/VBoxView/0/HBoxView', json);
				if (!histogramWebObjectContainer) {
					callback(null, {});
					return;
				}

				for (var i = 0; i < histogramWebObjectContainer.length; i++) {
					const stars = 5 - i;
					const foundText = histogramWebObjectContainer[i].$.alt;
					histogram[stars + ''] = findNumber(stars, foundText);
				}

				const returnValue = {};
				returnValue[country] = histogram;
				callback(null, returnValue);
			});
	});
}
