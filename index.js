var express = require('express');
var app = express();
var DataExport = require('./dataExport');
var dataExport = new DataExport();
var ReviewJSONDB = require('./reviewJSONDB');
var reviewDB = new ReviewJSONDB();
var DataMapper = require('./dataMapper');
var dataMapper = new DataMapper();
var GraphDrawer = require('./graphDrawer');
var graphDrawer = new GraphDrawer();
var AndroidFetcher = require('./androidFetcher');
var configs = require('./configs');
var fs = require('fs');

function constructAppPage(config, response) {
  console.time('Preparing the ' + config.appName +' page');
  reviewDB.getAllReviews(config, function(reviews) {
    androidAverage(config, function(numberOfAndroidReviews, averageAndroidRating) {
      iosAverage(reviews, function(numberOfiOSReviews, averageiOSRating) {
        var totalReviews = numberOfiOSReviews + numberOfAndroidReviews;
        var average = ((numberOfiOSReviews * averageiOSRating) + (numberOfAndroidReviews * averageAndroidRating)) / totalReviews;
        response.render('reviews', {
          appName: config.appName,
          platform: '',
          numberOfReviews: totalReviews,
          averageScore: average,
          reviews: reviews
        });
        console.timeEnd('Preparing the ' + config.appName +' page');
      });
    });
  });
}

function constructAndroidPage(config, response) {
  console.time('Preparing the Android page');
  reviewDB.getReviews(config, 'Android', function(reviews) {
    androidAverage(config, function(numberOfReviews, averageRating) {
      response.render('reviews', {
        appName: config.appName,
        platform: 'Android',
        numberOfReviews: numberOfReviews,
        averageScore: averageRating,
        reviews: reviews
      });
      console.timeEnd('Preparing the Android page');
    });
  });
}

function constructIOSPage(config, response) {
  console.time('Preparing the iOS page');
  reviewDB.getReviews(config, 'iOS', function(reviews) {
    iosAverage(reviews, function(numberOfReviews, averageRating) {
      response.render('reviews', {
        appName: config.appName,
        platform: 'iOS',
        numberOfReviews: numberOfReviews,
        averageScore: averageRating,
        reviews: reviews
      });
      console.timeEnd('Preparing the iOS page');
    });
  });
}

function constructGraphPage(config, response) {
  console.time('Preparing the graph page');
  dataMapper.fetchReviews(config, function(map) {
    response.render('graphs_page', {
      platform: 'Graph',
      appName: config.appName,
      dayAverages: graphDrawer.dayAverageArray(map),
      dayTotals: graphDrawer.dayTotalsArray(map),
      walkingDayAverages: graphDrawer.dayWalkingDayAveragesArray(map)
    });
    console.timeEnd('Preparing the graph page');
  });
}

function androidAverage(config, completion) {
  var androidFetcher = new AndroidFetcher(config);
  androidFetcher.fetchRatings(function(numberOfReviews, averageRating) {
    completion(numberOfReviews, averageRating);
  });
}

function iosAverage(reviews, completion) {
	var reviewCount = 0;
  var totalScore = 0;
  reviews.forEach(function(review) {
		if(review.deviceInfo.platform === 'iOS'){
    	totalScore += parseInt(review.reviewInfo.rating);
			reviewCount += 1;
		}
  });
  var averageRating = totalScore / reviewCount;
  completion(reviewCount, averageRating);
}

function constructJSONDump(config, response) {
  console.time('Exporting JSON');
  dataExport.exportJSON(config, function(data, fileName) {
    sendFile(data, fileName, 'application/json', response)
    console.timeEnd('Exporting JSON');
  });
}

function constructXMLDump(config, response) {
  console.time('Exporting XML');
  dataExport.exportXML(config, function(data, fileName) {
    sendFile(data, fileName, 'text/xml', response)
    console.timeEnd('Exporting XML');
  });
}

function constructCSVDump(config, response) {
  console.time('Exporting csv');
  dataExport.exportCSV(config, function(data, fileName) {
    sendFile(data, fileName, 'text/csv', response)
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
  var filePath = '.' + name;
  fs.readFile(filePath, function(error, content) {
    if (error) {
      var errorMessage = 'Error: ' + error + '\nFile path: ' + filePath;
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

app.get('/:app/:platform', function(request, response) {
  var config = configs.configForApp(request.params.app.toLowerCase());
  if (config === null) {
    notFound(response, 'proposition not found');
    return;
  }
  var allowedPlatforms = ['logo.png', 'ios', 'android', 'graph', 'json', 'xml', 'csv'];
  if (!allowedPlatforms.includes(request.params.platform.toLowerCase())) {
    notFound(response, 'platform not found');
    return;
  }
  if (request.params.platform.toLowerCase() === 'logo.png') {
    sendImage("/ugrow/images/logo.png", response);
  } else if (request.params.platform.toLowerCase() === 'json') {
    constructJSONDump(config, response);
  } else if (request.params.platform.toLowerCase() === 'xml') {
    constructXMLDump(config, response);
  } else if (request.params.platform.toLowerCase() === 'csv') {
    constructCSVDump(config, response);
  } else if (request.params.platform.toLowerCase() === 'ios') {
    constructIOSPage(config, response);
  } else if (request.params.platform.toLowerCase() === 'android') {
    constructAndroidPage(config, response);
  } else {
    constructGraphPage(config, response);
  }
});

app.get('/:app', function(request, response) {
  var config = configs.configForApp(request.params.app.toLowerCase());
  if (config === null) {
    notFound(response, 'proposition not found');
    return;
  }
  constructAppPage(config, response);
});


app.get('/ugrow/images/favicon.png', function(req, res) {
  sendImage(req.url, res);
});

app.set('view engine', 'ejs');
app.listen(process.env.PORT || 8000, null);
