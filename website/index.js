const dateLib = require('date-and-time');
const express = require('express');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();
const configs = require('../common/configs');
const fs = require('fs');
const statisticsPage = require('./statisticsPage');
const countryPage = require('./countryPage');
const versionPage = require('./versionPage');
const graphPage = require('./graphPage');
const iOSPage = require('./iOSPage');
const androidPage = require('./androidPage');
const appPage = require('./appPage');
const exportPage = require('./exportPage');
const compression = require('compression');
const app = express();
app.use(compression());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

var footer = '';

function getDefaultParams(config, callback) {
  reviewDB.getRating(config, function(ratingJSON) {
    callback(ratingJSON, {
      appName: config.appName,
      footer: footer,
      iosVersions: ratingJSON.iosVersions,
      androidVersions: ratingJSON.androidVersions,
      countries: ratingJSON.countries
    });
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

app.get('/:app/:platform', function(request, response) {
  const config = configs.configForApp(request.params.app.toLowerCase());
  if (config === null) {
    notFound(response, 'proposition not found');
    return;
  }
  const allowedPlatforms = ['logo.png', 'ios', 'android', 'graph', 'statistics'];
  if (!allowedPlatforms.includes(request.params.platform.toLowerCase())) {
    notFound(response, 'platform not found');
    return;
  }

  getDefaultParams(config, function(ratingJSON, defaultParams) {
    if (request.params.platform.toLowerCase() === 'ios') {
      iOSPage.constructIOSPage(config, defaultParams, ratingJSON, response);
    } else if (request.params.platform.toLowerCase() === 'android') {
      androidPage.constructAndroidPage(config, defaultParams, ratingJSON, response);
    } else if (request.params.platform.toLowerCase() === 'graph') {
      graphPage.constructGraphPage(config, defaultParams, response);
    } else {
      statisticsPage.constructStatsPage(config, defaultParams, response);
    }
  });

});

app.get('/:app/:platform/version/:version', function(request, response) {
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
  const platform = request.params.platform.toLowerCase();
  const version = request.params.version.toLowerCase();
  getDefaultParams(config, function(ratingJSON, defaultParams) {
    versionPage.constructVersionPage(config, platform, version, defaultParams, response);
  });
});

app.get('/:app/export/:option', function(request, response) {
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
    exportPage.constructJSONDump(config, response);
  } else if (option === 'xml') {
    exportPage.constructXMLDump(config, response);
  } else if (option === 'csv') {
    exportPage.constructCSVDump(config, response);
  }
});

app.get('/:app/country/:countryCode', function(request, response) {
  const config = configs.configForApp(request.params.app.toLowerCase());
  if (config === null) {
    notFound(response, 'proposition not found');
    return;
  }
  const option = request.params.countryCode.toLowerCase();
  getDefaultParams(config, function(ratingJSON, defaultParams) {
    countryPage.constructCountryPage(config, option, defaultParams, ratingJSON, response);
  });
});

app.get('/:app', function(request, response) {
  const config = configs.configForApp(request.params.app.toLowerCase());
  if (config === null) {
    notFound(response, 'proposition not found');
    return;
  }
  getDefaultParams(config, function(ratingJSON, defaultParams) {
    appPage.constructAppPage(config, defaultParams, ratingJSON, response);
  });
});

app.listen(process.env.PORT || 8000, null);
