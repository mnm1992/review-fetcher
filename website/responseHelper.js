const fs = require('fs');
var footer = '';

module.exports = {
	getDefaultParams: function (config, reviewDB, callback) {
		reviewDB.getRating(config, function (ratingJSON) {
			callback(ratingJSON, {
				appName: config.appName,
				footer: footer,
				iosVersions: ratingJSON.iosVersions,
				androidVersions: ratingJSON.androidVersions,
				countries: ratingJSON.countries
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
				this.notFound(response, errorMessage);
				return;
			}

			response.writeHead(200, {
				'Content-Type': 'image/png'
			});
			response.end(content);
		});
	}
};
