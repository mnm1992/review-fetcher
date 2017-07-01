const responseHelper = require('./responseHelper');
const configs = require('../common/configs');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();
const json2csv = require('json2csv');
const xml2js = require('xml2js');
const builder = new xml2js.Builder({
	rootName: 'reviews',
	explicitRoot: false,
	allowSurrogateChars: true
});

module.exports = {

	exportJSON: function (request, response) {
		const config = configs.configForApp(request.params.app.toLowerCase());
		if (config === null) {
			responseHelper.notFound(response, 'proposition not found');
			return;
		}
		constructJSONDump(config, response);
	},

	exportXML: function (request, response) {
		const config = configs.configForApp(request.params.app.toLowerCase());
		if (config === null) {
			responseHelper.notFound(response, 'proposition not found');
			return;
		}
		constructXMLDump(config, response);
	},

	exportCSV: function (request, response) {
		const config = configs.configForApp(request.params.app.toLowerCase());
		if (config === null) {
			responseHelper.notFound(response, 'proposition not found');
			return;
		}
		constructCSVDump(config, response);
	},
};

function constructJSONDump(config, response) {
	console.time('Exporting JSON');
	const reviewArray = [];
	reviewDB.getAllReviews(config, function (reviews) {
		reviews.forEach(function (review) {
			reviewArray.push(review.getJSON());
		});
		const data = JSON.stringify(reviewArray);
		const fileName = config.appName + '_reviews.json';
		responseHelper.sendFile(data, fileName, 'application/json', response);
		console.timeEnd('Exporting JSON');
	});
}

function constructXMLDump(config, response) {
	console.time('Exporting XML');
	const reviewArray = [];
	reviewDB.getAllReviews(config, function (reviews) {
		reviews.forEach(function (review) {
			reviewArray.push(review.getJSON());
		});
		const data = builder.buildObject(JSON.parse(JSON.stringify({
			"review": reviewArray
		})));
		const fileName = config.appName + '_reviews.xml';
		responseHelper.sendFile(data, fileName, 'text/xml', response);
		console.timeEnd('Exporting XML');
	});
}

function constructCSVDump(config, response) {
	console.time('Exporting csv');
	const reviewArray = [];
	var fields = [];
	var fieldNames = [];
	if (config.androidConfig.authentication) {
		fields = ['reviewInfo.id', 'reviewInfo.dateTime', 'reviewInfo.author', 'reviewInfo.title', 'reviewInfo.text', 'reviewInfo.rating', 'reviewInfo.developerCommentDateTime', 'reviewInfo.developerComment', 'appInfo.id', 'appInfo.version', 'appInfo.versionCode', 'deviceInfo.isoCode', 'deviceInfo.country', 'deviceInfo.language', 'deviceInfo.platform', 'deviceInfo.osVersion', 'deviceInfo.device', 'deviceInfo.deviceMetadata.productName', 'deviceInfo.deviceMetadata.manufacturer', 'deviceInfo.deviceMetadata.deviceClass', 'deviceInfo.deviceMetadata.screenWidthPx', 'deviceInfo.deviceMetadata.screenHeightPx', 'deviceInfo.deviceMetadata.nativePlatform', 'deviceInfo.deviceMetadata.screenDensityDpi', 'deviceInfo.deviceMetadata.glEsVersion', 'deviceInfo.deviceMetadata.cpuModel', 'deviceInfo.deviceMetadata.cpuMake', 'deviceInfo.deviceMetadata.ramMb'];
		fieldNames = ['Id', 'Date', 'Author', 'Title', 'Text', 'Rating', 'Developer comment date', 'Developer comment', 'App id', 'App version', 'App version code', 'Device iso code', 'Device country', 'Device language', 'Device platform', 'Device os version', 'Device name', 'Device product name', 'Device manufactorer', 'Device class', 'Device screen widthin px', 'Device screen height in px', 'Device native platform', 'Device screen density dpi', 'Device glEsVersion', 'Device cpu model', 'Device cpu make', 'device ram in mb'];
	} else {
		fields = ['reviewInfo.id', 'reviewInfo.dateTime', 'reviewInfo.author', 'reviewInfo.title', 'reviewInfo.text', 'reviewInfo.rating', 'appInfo.id', 'appInfo.version', 'deviceInfo.country', 'deviceInfo.language', 'deviceInfo.platform'];
		fieldNames = ['Id', 'Date', 'Author', 'Title', 'Text', 'Rating', 'App id', 'App version', 'Device country', 'Device language', 'Device platform'];
	}
	reviewDB.getAllReviews(config, function (reviews) {
		reviews.forEach(function (review) {
			reviewArray.push(review.getJSON());
		});
		const data = json2csv({
			data: reviewArray,
			fields: fields,
			fieldNames: fieldNames
		});
		const fileName = config.appName + '_reviews.csv';
		responseHelper.sendFile(data, fileName, 'text/csv', response);
		console.timeEnd('Exporting csv');
	});
}
