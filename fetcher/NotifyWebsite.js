const request = require('request');
const Configs = require('../common/configs');
const configs = new Configs();

module.exports = {
	notify(proposition, callback) {
		console.log('Received a message for uGrow call the seals')
		request('http://localhost:' + configs.port() + '/hooks/updateClients?update=' + proposition, function (error, response, body) {
			if (error) {
				console.error(error);
			} else {}

			callback();
		});
	}
};
