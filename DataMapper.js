var dateLib = require('date-and-time');
var ReviewJSONDB = require('./ReviewJSONDB');
var reviewDB = new ReviewJSONDB();

Date.prototype.addDays = function (days) {
	var dat = new Date(this.valueOf());
	dat.setDate(dat.getDate() + days);
	return dat;
};

module.exports = class DataMapper {

	sorter(review1, review2) {
		return review1.reviewInfo.dateTime > review2.reviewInfo.dateTime ? 1 : review1.reviewInfo.dateTime < review2.reviewInfo.dateTime ? -1 : 0;
	}

	formatDate(date) {
		dateLib.locale('nl');
		return dateLib.format(new Date(date), 'DD MMM YYYY');
	}

	getDates(startDate, stopDate) {
		var dateArray = [];
		var currentDate = startDate;
		while (currentDate <= stopDate) {
			dateArray.push(new Date(currentDate));
			currentDate = currentDate.addDays(1);
		}
		return dateArray;
	}

	fetchReviews(config, callback) {
		var self = this;
		reviewDB.getReviews(config, 'Android', function (reviewsAndroid) {
			reviewDB.getReviews(config, 'iOS', function (reviewsIos) {
				var reviews = reviewsAndroid.concat(reviewsIos);
				var map = self.createMap(reviews);
				map.dayAverages = self.dayAverages(map.reviewMap);
				map.dayTotals = self.dayTotals(map.reviewMap);
				map.walkingDayAverages = self.walkingDayAverages(map.reviewMap);
				callback(map);
			});
		});
	}

	createEmptyMap(start, stop) {
		start.setHours(0, 0, 0, 0);
		stop.setHours(0, 0, 0, 0);
		var map = {};
		var dates = this.getDates(start, stop);
		dates.forEach(function (date) {
			map[date] = [];
		});
		return map;
	}

	createMap(reviews) {
		reviews.sort(this.sorter);
		var lastDate = reviews[reviews.length - 1].reviewInfo.dateTime;
		var firstDate = reviews[0].reviewInfo.dateTime;
		var map = this.createEmptyMap(firstDate, lastDate);
		reviews.forEach(function (review) {
			var date = review.reviewInfo.dateTime;
			date.setHours(0, 0, 0, 0);
			map[date].push(review);
		});
		return {
			'first': firstDate,
			'last': lastDate,
			'reviewMap': map
		};
	}

	walkingDayAverages(map) {
		var averageMap = {};
		var total = 0;
		var count = 0;
		var iosTotal = 0;
		var iosCount = 0;
		var androidTotal = 0;
		var androidCount = 0;
		for (var key in map) {
			var array = map[key];
			count += array.length;
			array.forEach(function (review) {
				total += review.reviewInfo.rating;
				if (review.deviceInfo.platform === 'iOS') {
					iosTotal += review.reviewInfo.rating;
					iosCount += 1;
				} else {
					androidTotal += review.reviewInfo.rating;
					androidCount += 1;
				}
			});
			averageMap[key] = [key, androidTotal > 0 ? (androidTotal / androidCount) : null, iosTotal > 0 ? (iosTotal / iosCount) : null, total > 0 ? (total / count) : null];
		}
		return averageMap;
	}

	dayAverages(map) {
		var averageMap = {};
		for (var key in map) {
			var array = map[key];
			var total = 0;
			var count = array.length;
			var iosTotal = 0;
			var iosCount = 0;
			var androidTotal = 0;
			var androidCount = 0;
			array.forEach(function (review) {
				total += review.reviewInfo.rating;
				if (review.deviceInfo.platform === 'iOS') {
					iosTotal += review.reviewInfo.rating;
					iosCount += 1;
				} else {
					androidTotal += review.reviewInfo.rating;
					androidCount += 1;
				}
			});
			averageMap[key] = [key, androidTotal > 0 ? (androidTotal / androidCount) : null, iosTotal > 0 ? (iosTotal / iosCount) : null, total > 0 ? (total / count) : null];
		}
		return averageMap;
	}

	dayTotals(map) {
		var totalMap = {};
		for (var key in map) {
			var total = 0;
			var iosTotal = 0;
			var androidTotal = 0;
			var array = map[key];
			var count = array.length;
			array.forEach(function (review) {
				total += 1;
				if (review.deviceInfo.platform === 'iOS') {
					iosTotal += 1;
				} else {
					androidTotal += 1;
				}
			});
			totalMap[key] = [key, (androidTotal), (iosTotal), (total)];
		}
		return totalMap;
	}
};
