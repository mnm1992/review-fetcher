const fs = require('fs');
const herokuDetails = require('./HerokuDetails');
var footer = '';

herokuDetails.fetchHerokuDetails(function (herokuDetails) {
	footer = herokuDetails;
});

module.exports = {
	getDefaultParams: function (config, reviewDB, callback) {
		reviewDB.getRatings(config, function (ratingJSON) {
			callback(ratingJSON, {
				appName: config.appName,
				companyName: config.companyName,
				footer: footer,
				iosVersions: ratingJSON.iosVersions,
				androidVersions: ratingJSON.androidVersions,
				countries: ratingJSON.countries,
				languages: ratingJSON.languages
			});
		});
	},

	notFound: function (response, errorMessage) {
		response.writeHead(404, {
			'Content-Type': 'text/html'
		});

		console.log(errorMessage);
		response.end(errorMessage);
	},

	sendFile: function (data, fileName, content, response) {
		response.writeHead(200, {
			'Content-Type': content + '; charset=utf-8',
			'Content-Disposition': 'attachment;filename=' + fileName
		});
		response.end(data);
	},

	sendImage: function (name, response) {
		const filePath = '.' + name;
		fs.readFile(filePath, function (error, content) {
			if (error) {
				const errorMessage = 'Error: ' + error + '\nFile path: ' + filePath;
				response.writeHead(404, {
					'Content-Type': 'text/html'
				});
				console.log(errorMessage);
				response.end(errorMessage);
				return;
			}

			response.writeHead(200, {
				'Content-Type': 'image/png'
			});
			response.end(content);
		});
	}
};
