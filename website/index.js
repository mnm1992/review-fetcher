
const Configs = require('../common/Configs');
const configs = new Configs();
const ReviewDBHelper = require('../common/ReviewDBHelper');
const reviewDBHelper = new ReviewDBHelper();
reviewDBHelper.setUpDB().then(() => { });
const ResponseHelper = require('./ResponseHelper');
const responseHelper = new ResponseHelper();

const AppPage = require('./AppPage');
const appPage = new AppPage(configs, reviewDBHelper, responseHelper);

const AndroidPage = require('./AndroidPage');
const androidPage = new AndroidPage(configs, reviewDBHelper, responseHelper);

const IOSPage = require('./IOSPage');
const iOSPage = new IOSPage(configs, reviewDBHelper, responseHelper);

const CountryPage = require('./CountryPage');
const countryPage = new CountryPage(configs, reviewDBHelper, responseHelper);

const LanguagePage = require('./LanguagePage');
const languagePage = new LanguagePage(configs, reviewDBHelper, responseHelper);

const VersionPage = require('./VersionPage');
const versionPage = new VersionPage(configs, reviewDBHelper, responseHelper);

const GraphPage = require('./GraphPage');
const graphPage = new GraphPage(configs, reviewDBHelper, responseHelper);

const StatisticsPage = require('./StatisticsPage');
const statisticsPage = new StatisticsPage(configs, reviewDBHelper, responseHelper);

const ExportPage = require('./ExportPage');
const exportPage = new ExportPage(configs, reviewDBHelper, responseHelper);

const express = require('express');
const compression = require('compression');
const app = express();
const wss = require('express-ws')(app);

app.use(compression());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.ws('/', (ws, req) => {
    ws.on('message', (msg) => {
        console.log(msg);
    });
});
app.get('/:app/images/favicon.png', getFavicon);
app.get('/:app/logo.png', getLogo);
app.get('/:app/android', androidPage.render.bind(androidPage));
app.get('/:app/ios', iOSPage.render.bind(iOSPage));
app.get('/:app/graph', graphPage.render.bind(graphPage));
app.get('/:app/statistics', statisticsPage.render.bind(statisticsPage));
app.get('/:app/:platform/version/:version', versionPage.render.bind(versionPage));
app.get('/:app/country/:countryCode', countryPage.render.bind(countryPage));
app.get('/:app/language/:languageCode', languagePage.render.bind(languagePage));
app.get('/:app/export/csv', exportPage.exportCSV.bind(exportPage));
app.get('/:app/export/json', exportPage.exportJSON.bind(exportPage));
app.get('/:app/export/xml', exportPage.exportXML.bind(exportPage));
app.get('/:app', appPage.render.bind(appPage));
app.get('/hooks/updateClients', updateClients.bind(this, wss));


app.listen(configs.port());

function updateClients(wss, request, response) {
    const app = request.query.update;
    wss.getWss().clients.forEach((client) => {
        client.send(app);
        console.log('Client is informed');
    });
    response.send('Success');
}

function getLogo(request, response) {
    responseHelper.sendImage("/images/ugrow/logo.png", response).then(() => { });
}

function getFavicon(request, response) {
    responseHelper.sendImage('/images/' + request.params.app.toLowerCase() + '/favicon.png', response).then(() => { });
}
