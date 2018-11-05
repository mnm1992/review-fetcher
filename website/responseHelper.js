const fs = require('fs-extra');
const HerokuDetails = require('./HerokuDetails');

module.exports = class ResponseHelper {
    constructor() {
        const herokuDetails = new HerokuDetails();
        herokuDetails.fetchHerokuDetails().then((footer) => {
            this.footer = footer;
        }, (error) => {
            console.error(error);
        });
    }

    async getDefaultParams(config, dbHelper) {
        const result = await dbHelper.getRatings(config.appName);
        return {
            defaultParams: {
                appName: config.appName,
                companyName: config.companyName,
                footer: this.footer,
                iosVersions: result.iosVersions,
                androidVersions: result.androidVersions,
                countries: result.countries,
                languages: result.languages
            },
            metadata: result
        };
    }

    notFound(response, errorMessage) {
        response.writeHead(404, {
            'Content-Type': 'text/html'
        });

        console.log(errorMessage);
        response.end(errorMessage);
    }

    sendFile(data, fileName, content, response) {
        response.writeHead(200, {
            'Content-Type': content + '; charset=utf-8',
            'Content-Disposition': 'attachment;filename=' + fileName
        });
        response.end(data);
    }

    async sendImage(name, response) {
        const filePath = '.' + name;
        try {
            const content = await fs.readFile(filePath);
            response.writeHead(200, {
                'Content-Type': 'image/png'
            });
            response.end(content);
        } catch (error) {
            const errorMessage = 'Error: ' + error + '\nFile path: ' + filePath;
            response.writeHead(404, {
                'Content-Type': 'text/html'
            });
            console.log(errorMessage);
            response.end(errorMessage);
        }
    }
};
