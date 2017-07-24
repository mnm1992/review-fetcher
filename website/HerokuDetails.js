const dateLib = require('date-and-time');
const request = require('request');
const configs = require('../common/configs');
const token = configs.herokuToken();
const options = {
  url: 'https://api.heroku.com/apps/review-fetcher/releases',
  headers: {
    'Accept': 'application/vnd.heroku+json; version=3',
    'Authorization': 'Bearer ' + token,
    'Range': 'version ..; order=desc, max=1'
  }
};

module.exports = {

  fetchHerokuDetails: function(callback) {
    if(!token){
      callback('');
      return;
    }
    request(options, function(error, response, body) {
      if (!error && response.statusCode == 206) {
        const info = JSON.parse(body)[0];
        const date = dateLib.format(new Date(info.created_at), 'DD MMM YYYY HH:mm:ss', true);
        const commit = info.description.split(' ')[1];
        const footer = 'Review fetcher v' + info.version + '(' + commit + ') ' + date;
        console.log(footer);
        callback(footer);
      } else {
        console.error(error);
        callback('');
      }
    });
  }

};
