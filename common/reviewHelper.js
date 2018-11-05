module.exports = class ReviewHelper {

    appVersions(reviews, platform) {
        const overide = platform ? false : true;
        const appVersionArray = [];
        for (const review of reviews) {
            const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
            const hasVersion = review.appInfo.version;
            const versionNotInArrayYet = !appVersionArray.includes(review.appInfo.version);
            if (hasVersion && versionNotInArrayYet && correctPlatform) {
                appVersionArray.push(review.appInfo.version);
            }
        }
        appVersionArray.sort((obj1, obj2) => {
            return obj2 > obj1;
        });
        return appVersionArray;
    }

    appCountries(reviews) {
        reviews = this.removeReviewsWithInvalidCountry(reviews);
        const countryCodes = [];
        const appCountries = [];
        for (const review of reviews) {
            if (review.deviceInfo.countryCode && !countryCodes.includes(review.deviceInfo.countryCode)) {
                const codeCountryMap = {
                    name: review.deviceInfo.country,
                    code: review.deviceInfo.countryCode
                };
                appCountries.push(codeCountryMap);
                countryCodes.push(review.deviceInfo.countryCode);
            }
        }
        appCountries.sort((obj1, obj2) => {
            return obj1.name.localeCompare(obj2.name);
        });
        return appCountries;
    }

    appLanguages(reviews) {
        reviews = this.removeReviewsWithInvalidLanguage(reviews);
        const languageCodes = [];
        const appLanguages = [];
        for (const review of reviews) {
            if (review.deviceInfo.languageCode && !languageCodes.includes(review.deviceInfo.languageCode)) {
                const codeLanguageMap = {
                    name: review.deviceInfo.language,
                    code: review.deviceInfo.languageCode
                };
                appLanguages.push(codeLanguageMap);
                languageCodes.push(review.deviceInfo.languageCode);
            }
        }
        appLanguages.sort((obj1, obj2) => {
            return obj1.name.localeCompare(obj2.name);
        });
        return appLanguages;
    }

    mergeReviewsFromArrays(reviewsFromDB, reviewsFetched) {
        reviewsFetched = this.removeDuplicates(reviewsFetched, 'API');
        const result = {
            'reviewsToUpdate': [],
            'reviewsToInsert': [],
            'newReviews': []
        };

        const dbReviewMap = {};
        for (const dbReview of reviewsFromDB) {
            if (dbReview) {
                dbReviewMap[dbReview.reviewInfo.id] = dbReview;
            }
        }

        for (const fetchedReview of reviewsFetched) {
            const foundReview = dbReviewMap[fetchedReview.reviewInfo.id];
            if (!foundReview) {
                result.newReviews.push(fetchedReview);
                result.reviewsToInsert.push(fetchedReview);
            } else {
                const mergedReview = this.mergeReviews(foundReview, fetchedReview);
                if (mergedReview.updated) {
                    result.newReviews.push(mergedReview);
                    result.reviewsToUpdate.push(mergedReview);
                }
            }
        }
        return result;
    }

    removeDuplicates(input, prioritisedType) {
        const output = [];
        const reviewMap = {};
        for (const review of input) {
            if (review) {
                const oldReview = reviewMap[review.reviewInfo.id];
                if (!oldReview || (review.reviewInfo.source === prioritisedType)) {
                    reviewMap[review.reviewInfo.id] = review;
                }
            }
        }
        for (const key in reviewMap) {
            output.push(reviewMap[key]);
        }
        return output;
    }

    mergeReviews(dbReview, fetchedReview) {
        const laterReview = dbReview.reviewInfo.dateTime > fetchedReview.reviewInfo.dateTime ? dbReview : fetchedReview;
        const olderReview = laterReview === dbReview ? fetchedReview : dbReview;
        if (laterReview.reviewInfo.dateTime > olderReview.reviewInfo.dateTime) {
            if (laterReview === fetchedReview) {
                const copiedReview = olderReview.getJSON();
                laterReview.oldReviewInfo = copiedReview;
                laterReview.showOnSlack = true;
                laterReview.updated = true;
                console.log('A review got updated it moved from: ' + olderReview.reviewInfo.dateTime + ' to ' + laterReview.reviewInfo.dateTime);
            } else if (olderReview.reviewInfo.developerComment && !laterReview.reviewInfo.developerComment) {
                console.log("Found a developer comment I didn't have before at " + olderReview.reviewInfo.dateTime);
                laterReview.reviewInfo.developerCommentHasTime = (olderReview.reviewInfo.source !== 'Scraped');
                laterReview.reviewInfo.developerComment = olderReview.reviewInfo.developerComment;
                laterReview.reviewInfo.developerCommentDateTime = olderReview.reviewInfo.developerCommentDateTime;
            }
        }
        return laterReview;
    }

    removeReviewsWithInvalidLanguage(reviews) {
        return reviews.filter((review) => {
            return review.deviceInfo.language;
        });
    }

    removeReviewsWithInvalidCountry(reviews) {
        return reviews.filter((review) => {
            return review.deviceInfo.country;
        });
    }
};
