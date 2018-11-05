#!/usr/bin/env node

const fetcher = require('./fetchReviews');
fetcher.fetchReviews().then(() => { }, (error) => {
    console.error(error);
});
