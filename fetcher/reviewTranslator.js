const translate = require('google-translate-api');
const async = require('async');
const request = require('request');
const LocaleHelper = require('./localeHelper');
const localeHelper = new LocaleHelper();

module.exports = class ReviewTranslator {

	translateReview(reviewTitle, reviewText, from, completion) {
		if (from === 'en') {
			completion(undefined, undefined);
			return;
		}
		const splitChar = '1958745213654789';
		const stringToTranslate = reviewTitle + splitChar + reviewText;
		const options = {
			to: 'en'
		};
		const self = this;
		translate(stringToTranslate, options).then(res => {
			if (res.from.language.iso === 'en') {
				completion(from ? from : res.from.language.iso, reviewTitle, reviewText);
				return;
			}
			const results = res.text.split(splitChar);
			const translatedTitle = results[0];
			const translatedText = results[1];
			completion(from ? from : res.from.language.iso, translatedTitle, translatedText);
		}).catch(err => {
			console.error(err);
			completion(undefined, undefined);
		});
	}

	translateAllReviews(reviews, completion) {
		const filteredReviews = reviews.filter((review) => {
			return review.reviewInfo.text && (review.deviceInfo.languageCode !== 'en') && (!review.reviewInfo.translatedText);
		});

		if (filteredReviews.length === 0) {
			console.log('There are no new reviews to translate');
			completion();
			return;
		}
		console.time('Translating ' + filteredReviews.length + ' Reviews');

		const reviewTranslateFunctions = [];
		const self = this;
		for (let filteredReview of filteredReviews) {
			reviewTranslateFunctions.push((callback) => {
				const review = filteredReview;
				self.translateReview(review.reviewInfo.title, review.reviewInfo.text, review.deviceInfo.languageCode, (languageCode, translatedTitle, translatedText) => {
					if (translatedText) {
						review.reviewInfo.translatedText = translatedText;
					}
					if (translatedTitle) {
						review.reviewInfo.translatedTitle = translatedTitle;
					}
					if (!review.deviceInfo.languageCode && languageCode) {
						review.deviceInfo.languageCode = languageCode;
						if (review.deviceInfo.languageCode === 'zh-CN') {
							review.deviceInfo.language = 'Chinese (Traditional)';
							callback(null, review);
						} else if (review.deviceInfo.languageCode === 'zh-TW' || review.deviceInfo.languageCode === 'zh-CHT' || review.deviceInfo.languageCode === 'zh-CHS') {
							review.deviceInfo.language = 'Chinese (Simplified)';
							callback(null, review);
						} else {
							localeHelper.getLanguage(languageCode, (language) => {
								review.deviceInfo.language = language;
								callback(null, review);
							});
						}
					} else {
						callback(null, review);
					}
				});
			});
		}
		async.parallel(reviewTranslateFunctions, (err, results) => {
			console.timeEnd('Translating ' + filteredReviews.length + ' Reviews');
			completion(results);
		});
	}
};
