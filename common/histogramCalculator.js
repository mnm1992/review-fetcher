module.exports = class HistogramCalculator {
    averageFromHistogram(histogram) {
        const amountOfReviews = histogram['1'] + histogram['2'] + histogram['3'] + histogram['4'] + histogram['5'];
        const totalReviewScore = (1 * histogram['1']) + (2 * histogram['2']) + (3 * histogram['3']) + (4 * histogram['4']) + (5 * histogram['5']);
        const saveDivider = amountOfReviews === 0 ? 1 : amountOfReviews;
        return {
            amount: amountOfReviews,
            average: (totalReviewScore / saveDivider)
        };
    }

    averageFromReviews(reviews, platform) {
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
        const saveDivider = reviewCount === 0 ? 1 : reviewCount;
        return {
            amount: reviewCount,
            average: (totalScore / saveDivider)
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
        return this.mergeHistogramArray([histogramA, histogramB]);
    }

    calculateHistogram(reviews, platform) {
        const overide = platform ? false : true;
        const histogram = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
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
