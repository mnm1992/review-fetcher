const dateLib = require('date-and-time');
const Request = require('request-promise');
const Configs = require('../common/Configs');

module.exports = class HerokuDetails {

    async fetchHerokuDetails() {
        const configs = new Configs();
        const token = configs.herokuToken();
        const options = {
            url: 'https://api.heroku.com/apps/review-fetcher/releases',
            headers: {
                'Accept': 'application/vnd.heroku+json; version=3',
                'Authorization': 'Bearer ' + token,
                'Range': 'version ..; order=desc, max=1'
            }
        };
        if (!token) {
            console.error("No heroku token configured");
            return;
        }
        const result = await Request(options);
        const info = JSON.parse(result)[0];
        const date = dateLib.format(new Date(info.created_at), 'DD MMM YYYY HH:mm:ss', true);
        const commit = info.description.split(' ')[1];
        const footer = 'Review fetcher v' + info.version + '(' + commit + ') ' + date;
        return footer;
    }

};
