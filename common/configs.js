const demoConfig = require('../Configs/demoConfig');

const configToNameMap = {
	'demoConfig': demoConfig
};

module.exports = class Configs {
	isLocalHost() {
		return !(process.env.PORT);
	}

	databaseConfig() {
		if (this.isLocalHost()) {
			return {
				host: 'localhost',
				port: 5432,
				database: 'postgres',
				user: 'postgres',
				password: 'postgres'
			};
		}
		return process.env.DATABASE_URL;
	}

	herokuToken() {
		if (this.isLocalHost()) {
			return '';
		}
		return '';
	}

	port() {
		if (this.isLocalHost()) {
			return 8000;
		}
		return process.env.PORT;
	}

	configForApp(app) {
		let config = configToNameMap[app];
		if (config && this.isLocalHost()) {
			return config.devConfig();
		} else if (config) {
			return config.prodConfig();
		}
		return null;
	}

	allConfigs() {
		const configs = Object.values(configToNameMap);
		const configsToReturn = [];
		if (this.isLocalHost()) {
			for (let config of configs) {
				configsToReturn.push(config.devConfig());
			}
		} else {
			for (let config of configs) {
				configsToReturn.push(config.prodConfig());
			}
		}
		return configsToReturn;
	}
};
