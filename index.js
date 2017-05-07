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
const compression = require('compression');
const app = express();
app.use(compression());
app.set('view engine', 'ejs');

function constructAppPage(config, response) {
  console.time('Preparing the ' + config.appName + ' page');
  reviewDB.getAllReviews(config, function(reviews) {
    reviewDB.getRating(config, function(ratingJSON) {
      const totalReviews = ratingJSON.iosTotal + ratingJSON.androidTotal;
      const average = ((ratingJSON.iosTotal * ratingJSON.iosAverage) + (ratingJSON.androidTotal * ratingJSON.androidAverage)) / totalReviews;
      response.render('reviews', {
        appName: config.appName,
        platform: '',
        numberOfReviews: totalReviews?totalReviews:0,
        averageScore: average?average:0,
        reviews: reviews
      });
      console.timeEnd('Preparing the ' + config.appName + ' page');
    });
  });
}

function constructAndroidPage(config, response) {
  console.time('Preparing the Android page');
  reviewDB.getReviews(config, 'Android', function(reviews) {
		reviewDB.getRating(config, function(ratingJSON) {
      response.render('reviews', {
        appName: config.appName,
        platform: 'Android',
        numberOfReviews: ratingJSON.androidTotal?ratingJSON.androidTotal:0,
        averageScore: ratingJSON.androidAverage?ratingJSON.androidAverage:0,
        reviews: reviews
      });
      console.timeEnd('Preparing the Android page');
    });
  });
}

function constructIOSPage(config, response) {
  console.time('Preparing the iOS page');
  reviewDB.getReviews(config, 'iOS', function(reviews) {
		reviewDB.getRating(config, function(ratingJSON) {
      response.render('reviews', {
        appName: config.appName,
        platform: 'iOS',
        numberOfReviews: ratingJSON.iosTotal?ratingJSON.iosTotal:0,
        averageScore: ratingJSON.iosAverage?ratingJSON.iosAverage:0,
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
  const androidFetcher = new AndroidFetcher(config);
  androidFetcher.fetchRatings(function(numberOfReviews, averageRating) {
    completion(numberOfReviews, averageRating);
  });
}

function iosAverage(reviews, completion) {
  var reviewCount = 0;
  var totalScore = 0;
  reviews.forEach(function(review) {
    if (review.deviceInfo.platform === 'iOS') {
      totalScore += parseInt(review.reviewInfo.rating);
      reviewCount += 1;
    }
  });
  const averageRating = totalScore / reviewCount;
  completion(reviewCount, averageRating);
}

function constructJSONDump(config, response) {
  console.time('Exporting JSON');
  dataExport.exportJSON(config, function(data, fileName) {
    sendFile(data, fileName, 'application/json', response);
    console.timeEnd('Exporting JSON');
  });
}

function constructXMLDump(config, response) {
  console.time('Exporting XML');
  dataExport.exportXML(config, function(data, fileName) {
    sendFile(data, fileName, 'text/xml', response);
    console.timeEnd('Exporting XML');
  });
}

function constructCSVDump(config, response) {
  console.time('Exporting csv');
  dataExport.exportCSV(config, function(data, fileName) {
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
  fs.readFile(filePath, function(error, content) {
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

app.get('/:app/:platform', function(request, response) {
  const config = configs.configForApp(request.params.app.toLowerCase());
  if (config === null) {
    notFound(response, 'proposition not found');
    return;
  }
  const allowedPlatforms = ['logo.png', 'ios', 'android', 'graph', 'json', 'xml', 'csv'];
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
  const config = configs.configForApp(request.params.app.toLowerCase());
  if (config === null) {
    notFound(response, 'proposition not found');
    return;
  }
  constructAppPage(config, response);
});


app.get('/ugrow/images/favicon.png', function(req, res) {
  sendImage(req.url, res);
});

app.listen(process.env.PORT || 8000, null);
