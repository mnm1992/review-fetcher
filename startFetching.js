#!/usr/bin/env node

var fetcher = require('./fetch-reviews');
fetcher.fetchReviews(function () {
	process.exit();
});
