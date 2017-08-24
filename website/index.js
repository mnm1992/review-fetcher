const androidPage = require('./androidPage');
const iOSPage = require('./iOSPage');
const graphPage = require('./graphPage');
const statisticsPage = require('./statisticsPage');
const versionPage = require('./versionPage');
const countryPage = require('./countryPage');
const exportPage = require('./exportPage');
const languagePage = require('./languagePage');
const appPage = require('./appPage');
const secretHooks = require('./secretHooks');
const responseHelper = require('./responseHelper');
const express = require('express');
const compression = require('compression');
const Configs = require('../common/configs');
const configs = new Configs();
const http = require('http');
const app = express();
const wss = require('express-ws')(app);

app.use(compression());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.get('/:app/images/favicon.png', getFavicon);
app.get('/:app/logo.png', getLogo);
app.get('/:app/android', androidPage.render);
app.get('/:app/ios', iOSPage.render);
app.get('/:app/graph', graphPage.render);
app.get('/:app/statistics', statisticsPage.render);
app.get('/:app/:platform/version/:version', versionPage.render);
app.get('/:app/country/:countryCode', countryPage.render);
app.get('/:app/language/:languageCode', languagePage.render);
app.get('/:app/export/csv', exportPage.exportCSV);
app.get('/:app/export/json', exportPage.exportJSON);
app.get('/:app/export/xml', exportPage.exportXML);
app.get('/hooks/startFetching', secretHooks.startFetching);
app.get('/hooks/startScraping', secretHooks.startScraping);
app.get('/hooks/translate', secretHooks.translate);
app.get('/hooks/updateClients', secretHooks.updateClients.bind(secretHooks, wss));
app.ws('/', function (ws, req) {
	ws.on('message', function (msg) {
		console.log(msg);
	});
});
app.get('/:app', appPage.render);
app.listen(configs.port());

function getLogo(request, response) {
	responseHelper.sendImage("/images/ugrow/logo.png", response);
}

function getFavicon(request, response) {
	responseHelper.sendImage('/images/' + request.params.app.toLowerCase() + '/favicon.png', response);
}
