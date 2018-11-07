module.exports = class HistogramCalculator {
    averageFromHistogram(histogram) {
        if(!histogram || histogram.size < 5) {
            return {
                amount: 0,
                average: 0
            };
        }

        const amountOfReviews = histogram['1'] + histogram['2'] + histogram['3'] + histogram['4'] + histogram['5'];
        const totalReviewScore = (1 * histogram['1']) + (2 * histogram['2']) + (3 * histogram['3']) + (4 * histogram['4']) + (5 * histogram['5']);
        const saveDivider = amountOfReviews === 0 ? 1 : amountOfReviews;
        return {
            amount: amountOfReviews,
            average: (totalReviewScore / saveDivider)
        };
    }

    averageFromReviews(reviews, platform) {
        if(!reviews || reviews.length == 0) {
            return {
                amount: 0,
                average: 0
            };
        }

        const overide = platform ? false : true;
        let reviewCount = 0;
        let totalScore = 0;
        for (const review of reviews) {
            const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
            if (correctPlatform) {
                totalScore += parseInt(review.reviewInfo.rating);
                reviewCount += 1;
            }
        }
        return {
            amount: reviewCount,
            average: (totalScore / reviewCount)
        };
    }

    addAllHistograms(histograms) {
        if (!histograms) {
            return {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            };
        }
        return this.mergeHistogramArray(Object.values(histograms));
    }

    mergeHistograms(histogramA, histogramB) {
        if((!histogramA && !histogramB) || (histogramA.size < 5 && histogramB.size < 5)) {
            return {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            };
        } else if(!histogramA || histogramA.size < 5) {
            return histogramB;
        } else if(!histogramB || histogramB.size < 5) {
            return histogramA;
        }

        return this.mergeHistogramArray([histogramA, histogramB]);
    }

    calculateHistogram(reviews, platform) {
        const histogram = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
        if(!reviews || reviews.length == 0) {
            return histogram;
        }

        const overide = platform ? false : true;
        for (const review of reviews) {
            const correctPlatform = overide || (review.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
            if (correctPlatform) {
                histogram[review.reviewInfo.rating] = histogram[review.reviewInfo.rating] += 1;
            }
        }
        return histogram;
    }

    mergeHistogramArray(histogramArray) {
        const histogram = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
        if(!histogramArray || histogramArray.length == 0) {
            return histogram;
        }

        for (const currentHistogram of histogramArray) {
            if (currentHistogram) {
                histogram['1'] += currentHistogram['1'];
                histogram['2'] += currentHistogram['2'];
                histogram['3'] += currentHistogram['3'];
                histogram['4'] += currentHistogram['4'];
                histogram['5'] += currentHistogram['5'];
            }
        }
        return histogram;
    }
};
