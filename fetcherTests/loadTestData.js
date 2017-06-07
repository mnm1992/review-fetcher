var fs = require('fs');
module.exports = {

	readFile: function (path, callback) {
		fs.readFile(path, 'utf8', function read(err, data) {
			if (err) {
				console.error(err);
			}
			callback(data);
		});
	}

};
