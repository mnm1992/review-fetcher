#!/usr/bin/env node

const fetcher = require('./fetchReviews');
fetcher.scrapeReviews().then(() => { }, (error) => {
    console.error(error);
});
