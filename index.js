const express = require('express');
const DataExport = require('./dataExport');
const dataExport = new DataExport();
const ReviewJSONDB = require('./reviewJSONDB');
const reviewDB = new ReviewJSONDB();
const DataMapper = require('./dataMapper');
const dataMapper = new DataMapper();
const GraphDrawer = require('./graphDrawer');
const graphDrawer = new GraphDrawer();
const AndroidFetcher = require('./androidFetcher');
const configs = require('./configs');
const fs = require('fs');
const reviewHelper = require('./reviewHelper');
const compression = require('compression');
const app = express();
app.use(compression());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

function constructVersionPage(config, platform, version, response) {
	console.time('Preparing the version page for ' + version);
	reviewDB.getReviewsForVersion(config, platform, version, function (reviews) {
		reviewDB.getRating(config, function (ratingJSON) {
			reviewHelper.appAverage(reviews, function (totalReviews, averageReviews) {
				const histogram = reviewHelper.calculateHistogram(reviews);
        const title = platform.toLowerCase() === 'android' ? 'Android' : 'iOS';
				response.render('reviews', {
					appName: config.appName,
          tabTitle: config.appName + ' ' + title + ' ' + version + ' Reviews',
					pageTitle: config.appName + ' ' + title + ' ' + version,
          page: 'Versions',
					iosVersions: ratingJSON.iosVersions,
          androidVersions: ratingJSON.androidVersions,
          totalRatings: totalReviews ? totalReviews : 0,
          averageRatings: averageReviews ? averageReviews : 0,
          totalReviews: totalReviews ? totalReviews : 0,
					averageReviews: averageReviews ? averageReviews : 0,
          ratingHistogram: histogram,
          reviewHistogram: histogram,
          reviews: reviews
				});
				console.timeEnd('Preparing the version page for ' + version);
			});
		});
	});
}

function constructAppPage(config, response) {
	console.time('Preparing the ' + config.appName + ' page');
	reviewDB.getAllReviews(config, function (reviews) {
		reviewDB.getRating(config, function (ratingJSON) {
			reviewHelper.appAverage(reviews, function (totalReviews, averageReviews) {
				const totalRatings = ratingJSON.iosTotal + ratingJSON.androidTotal;
				const averageRatings = ((ratingJSON.iosTotal * ratingJSON.iosAverage) + (ratingJSON.androidTotal * ratingJSON.androidAverage)) / totalRatings;
				const reviewHistogram = reviewHelper.calculateHistogram(reviews);
				const ratingHistogram = reviewHelper.mergeHistograms(ratingJSON.androidHistogram, reviewHelper.calculateHistogramForPlatform(reviews, 'ios'));
				response.render('reviews', {
          appName: config.appName,
          tabTitle: config.appName + ' Reviews',
          pageTitle: config.appName,
          page: 'Home',
					iosVersions: ratingJSON.iosVersions,
          androidVersions: ratingJSON.androidVersions,
          totalRatings: totalRatings ? totalRatings : 0,
          averageRatings: averageRatings ? averageRatings : 0,
          totalReviews: totalReviews ? totalReviews : 0,
          averageReviews: averageReviews ? averageReviews : 0,
          ratingHistogram: ratingHistogram,
          reviewHistogram: reviewHistogram,
          reviews: reviews
				});
				console.timeEnd('Preparing the ' + config.appName + ' page');
			});
		});
	});
}

function constructAndroidPage(config, response) {
	console.time('Preparing the Android page');
	reviewDB.getReviews(config, 'Android', function (reviews) {
		reviewDB.getRating(config, function (ratingJSON) {
			reviewHelper.appAverage(reviews, function (totalReviews, averageReviews) {
				const histogram = reviewHelper.calculateHistogram(reviews);
				const ratingHistogram = ratingJSON.androidHistogram ? ratingJSON.androidHistogram : {'1':0, '2':0, '3':0, '4':0, '5':0};
				response.render('reviews', {
          appName: config.appName,
          tabTitle: config.appName + ' Android Reviews',
          pageTitle: config.appName + ' Android',
          page: 'Android',
          iosVersions: ratingJSON.iosVersions,
          androidVersions: ratingJSON.androidVersions,
          totalRatings: ratingJSON.androidTotal ? ratingJSON.androidTotal : 0,
          averageRatings: ratingJSON.androidAverage ? ratingJSON.androidAverage : 0,
          totalReviews: totalReviews ? totalReviews : 0,
          averageReviews: averageReviews ? averageReviews : 0,
          ratingHistogram: ratingHistogram,
          reviewHistogram: histogram,
          reviews: reviews
				});
				console.timeEnd('Preparing the Android page');
			});
		});
	});
}

function constructIOSPage(config, response) {
	console.time('Preparing the iOS page');
	reviewDB.getReviews(config, 'iOS', function (reviews) {
		reviewDB.getRating(config, function (ratingJSON) {
			const histogram = reviewHelper.calculateHistogram(reviews);
			response.render('reviews', {
        appName: config.appName,
        tabTitle: config.appName + ' iOS Reviews',
        pageTitle: config.appName + ' iOS',
        page: 'iOS',
				iosVersions: ratingJSON.iosVersions,
				androidVersions: ratingJSON.androidVersions,
        totalRatings: ratingJSON.iosTotal ? ratingJSON.iosTotal : 0,
        averageRatings: ratingJSON.iosAverage ? ratingJSON.iosAverage : 0,
        totalReviews: ratingJSON.iosTotal ? ratingJSON.iosTotal : 0,
        averageReviews: ratingJSON.iosAverage ? ratingJSON.iosAverage : 0,
        ratingHistogram: histogram,
        reviewHistogram: histogram,
        reviews: reviews
			});
			console.timeEnd('Preparing the iOS page');
		});
	});
}

function constructGraphPage(config, response) {
	console.time('Preparing the graph page');
	dataMapper.fetchReviews(config, function (map) {
		reviewDB.getRating(config, function (ratingJSON) {
			response.render('graphs_page', {
        appName: config.appName,
        tabTitle: config.appName + ' Graph Reviews',
        pageTitle: config.appName + ' Graph',
        page: 'Graph',
        iosVersions: ratingJSON.iosVersions,
        androidVersions: ratingJSON.androidVersions,
        dayAverages: graphDrawer.dayAverageArray(map),
				dayTotals: graphDrawer.dayTotalsArray(map),
				walkingDayAverages: graphDrawer.dayWalkingDayAveragesArray(map)
			});
			console.timeEnd('Preparing the graph page');
		});
	});
}

function constructJSONDump(config, response) {
	console.time('Exporting JSON');
	dataExport.exportJSON(config, function (data, fileName) {
		sendFile(data, fileName, 'application/json', response);
		console.timeEnd('Exporting JSON');
	});
}

function constructXMLDump(config, response) {
	console.time('Exporting XML');
	dataExport.exportXML(config, function (data, fileName) {
		sendFile(data, fileName, 'text/xml', response);
		console.timeEnd('Exporting XML');
	});
}

function constructCSVDump(config, response) {
	console.time('Exporting csv');
	dataExport.exportCSV(config, function (data, fileName) {
		sendFile(data, fileName, 'text/csv', response);
		console.timeEnd('Exporting csv');
	});
}

function notFound(response, errorMessage) {
	response.writeHead(404, {
		'Content-Type': 'text/html'
	});

	console.log(errorMessage);
	response.end(errorMessage);
}

function sendImage(name, response) {
	const filePath = '.' + name;
	fs.readFile(filePath, function (error, content) {
		if (error) {
			const errorMessage = 'Error: ' + error + '\nFile path: ' + filePath;
			notFound(response, errorMessage);
			return;
		}

		response.writeHead(200, {
			'Content-Type': 'image/png'
		});
		response.end(content);
	});
}

function sendFile(data, fileName, content, response) {
	response.writeHead(200, {
		'Content-Type': content + '; charset=utf-8',
		'Content-Disposition': 'attachment;filename=' + fileName
	});
	response.end(data);
}

app.get('/:app/:platform', function (request, response) {
	const config = configs.configForApp(request.params.app.toLowerCase());
	if (config === null) {
		notFound(response, 'proposition not found');
		return;
	}
	const allowedPlatforms = ['logo.png', 'ios', 'android', 'graph'];
	if (!allowedPlatforms.includes(request.params.platform.toLowerCase())) {
		notFound(response, 'platform not found');
		return;
	}
	if (request.params.platform.toLowerCase() === 'logo.png') {
		sendImage("/ugrow/images/logo.png", response);
	} else if (request.params.platform.toLowerCase() === 'ios') {
		constructIOSPage(config, response);
	} else if (request.params.platform.toLowerCase() === 'android') {
		constructAndroidPage(config, response);
	} else {
		constructGraphPage(config, response);
	}
});

app.get('/:app/:platform/version/:version', function (request, response) {
	const config = configs.configForApp(request.params.app.toLowerCase());
	if (config === null) {
		notFound(response, 'proposition not found');
		return;
	}
	const allowedPlatforms = ['ios', 'android'];
	if (!allowedPlatforms.includes(request.params.platform.toLowerCase())) {
		notFound(response, 'platform not found');
		return;
	}

	constructVersionPage(config, request.params.platform.toLowerCase(), request.params.version.toLowerCase(), response);
});

app.get('/:app/export/:option', function (request, response) {
	const config = configs.configForApp(request.params.app.toLowerCase());
	if (config === null) {
		notFound(response, 'proposition not found');
		return;
	}
	const allowedOptions = ['json', 'xml', 'csv'];
	const option = request.params.option.toLowerCase();
	if (!allowedOptions.includes(option)) {
		notFound(response, 'platform not found');
		return;
	}

	if (option === 'json') {
		constructJSONDump(config, response);
	} else if (option === 'xml') {
		constructXMLDump(config, response);
	} else if (option === 'csv') {
		constructCSVDump(config, response);
	}
});


app.get('/:app', function (request, response) {
	const config = configs.configForApp(request.params.app.toLowerCase());
	if (config === null) {
		notFound(response, 'proposition not found');
		return;
	}
	constructAppPage(config, response);
});


app.get('/ugrow/images/favicon.png', function (req, res) {
	sendImage(req.url, res);
});

app.listen(process.env.PORT || 8000, null);
