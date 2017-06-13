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

	constructJSONDump: function (config, response) {
		console.time('Exporting JSON');
		exportJSON(config, function (data, fileName) {
			sendFile(data, fileName, 'application/json', response);
			console.timeEnd('Exporting JSON');
		});
	},

	constructXMLDump: function (config, response) {
		console.time('Exporting XML');
		exportXML(config, function (data, fileName) {
			sendFile(data, fileName, 'text/xml', response);
			console.timeEnd('Exporting XML');
		});
	},

	constructCSVDump: function (config, response) {
		console.time('Exporting csv');
		exportCSV(config, function (data, fileName) {
			sendFile(data, fileName, 'text/csv', response);
			console.timeEnd('Exporting csv');
		});
	}
};

function sendFile(data, fileName, content, response) {
	response.writeHead(200, {
		'Content-Type': content + '; charset=utf-8',
		'Content-Disposition': 'attachment;filename=' + fileName
	});
	response.end(data);
}

function exportJSON(config, completion) {
	const reviewArray = [];
	reviewDB.getAllReviews(config, function (reviews) {
		reviews.forEach(function (review) {
			reviewArray.push(review.getJSON());
		});
		completion(JSON.stringify(reviewArray), config.appName + '_reviews.json');
	});
}

function exportXML(config, completion) {
	const reviewArray = [];
	reviewDB.getAllReviews(config, function (reviews) {
		reviews.forEach(function (review) {
			reviewArray.push(review.getJSON());
		});
		//hack needed since the library can't handle dates
		completion(builder.buildObject(JSON.parse(JSON.stringify({
			"review": reviewArray
		}))), config.appName + '_reviews.xml');
	});
}

function exportCSV(config, completion) {
	const reviewArray = [];
	var fields = [];
	var fieldNames = [];
	if (config.androidAuthentication) {
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
		completion(json2csv({
			data: reviewArray,
			fields: fields,
			fieldNames: fieldNames
		}), config.appName + '_reviews.csv');
	});
}
