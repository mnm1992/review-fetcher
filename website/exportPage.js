const Json2csvParser = require('json2csv').Parser;
const xml2js = require('xml2js');

const builder = new xml2js.Builder({
    rootName: 'reviews',
    explicitRoot: false,
    allowSurrogateChars: true
});

module.exports = class ExportPage {
    constructor(configs, dbHelper, responseHelper) {
        this.configs = configs;
        this.dbHelper = dbHelper;
        this.responseHelper = responseHelper;
    }

    async exportJSON(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'Export JSON: proposition not found');
            return;
        }
        return this.constructJSONDump(config, response);
    }

    async exportXML(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'Export xml: proposition not found');
            return;
        }
        return this.constructXMLDump(config, response);
    }

    async exportCSV(request, response) {
        const config = this.configs.configForApp(request.params.app.toLowerCase());
        if (config === null) {
            this.responseHelper.notFound(response, 'Export CSV: proposition not found');
            return;
        }
        return this.constructCSVDump(config, response).then(() => { });
    }

    async constructJSONDump(config, response) {
        console.time('Exporting JSON');
        const reviewArray = [];
        const ratings = await this.dbHelper.getRatings(config.appName);
        const reviews = await this.dbHelper.getAllReviews(config.androidConfig.id, config.iOSConfig.id);
        for (const review of reviews) {
            reviewArray.push(review.getJSON());
        }
        const data = JSON.stringify({
            ratings: ratings,
            reviews: reviewArray
        });
        const fileName = config.appName + '_reviews.json';
        this.responseHelper.sendFile(data, fileName, 'application/json', response);
        console.timeEnd('Exporting JSON');
    }

    async constructXMLDump(config, response) {
        console.time('Exporting XML');
        const reviewArray = [];
        const reviews = await this.dbHelper.getAllReviews(config.androidConfig.id, config.iOSConfig.id);
        for (const review of reviews) {
            reviewArray.push(review.getJSON());
        }
        const data = builder.buildObject(JSON.parse(JSON.stringify({
            "review": reviewArray
        })));
        const fileName = config.appName + '_reviews.xml';
        this.responseHelper.sendFile(data, fileName, 'text/xml', response);
        console.timeEnd('Exporting XML');
    }

    async constructCSVDump(config, response) {
        console.time('Exporting csv');
        const reviewArray = [];
        let fields = [];
        if (config.androidConfig.authentication) {
            fields = require('./ReviewJSONToCSVMapExtended.json');
        } else {
            fields = require('./ReviewJSONToCSVMapNormal.json');
        }
        const reviews = await this.dbHelper.getAllReviews(config.androidConfig.id, config.iOSConfig.id);
        for (const review of reviews) {
            reviewArray.push(review.getJSON());
        }
        const json2csvParser = new Json2csvParser({ fields });
        const data = json2csvParser.parse(reviewArray);
        const fileName = config.appName + '_reviews.csv';
        this.responseHelper.sendFile(data, fileName, 'text/csv', response);
        console.timeEnd('Exporting csv');
    }
};
