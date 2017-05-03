#!/usr/bin/env node

var fetcher = require('./fetchReviews');
fetcher.fetchReviews(function () {
	process.exit();
});
