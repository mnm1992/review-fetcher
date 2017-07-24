#!/usr/bin/env node

const fetcher = require('./fetchReviews');
fetcher.scrapeReviews(function() {});
