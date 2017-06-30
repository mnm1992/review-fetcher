const dateLib = require('date-and-time');
const responseHelper = require('./responseHelper');
const configs = require('../common/configs');
const ReviewJSONDB = require('../common/reviewJSONDB');
const reviewDB = new ReviewJSONDB();

module.exports = {
	render: function (request, response) {
		const config = configs.configForApp(request.params.app.toLowerCase());
		if (config === null) {
			responseHelper.notFound(response, 'proposition not found');
			return;
		}
		responseHelper.getDefaultParams(config, reviewDB, function (ratingJSON, defaultParams) {
			constructGraphPage(config, defaultParams, response);
		});
	}
};

function constructGraphPage(config, defaultParams, response) {
	console.time('Preparing the graph page');
	fetchReviews(config, function (map) {
		const graphProperties = {
			tabTitle: config.appName + ' Graph Reviews',
			pageTitle: config.appName + ' Graph',
			page: 'Graph',
			dayAverages: dayAverageArray(map),
			dayTotals: dayTotalsArray(map),
			walkingDayAverages: dayWalkingDayAveragesArray(map)
		};
		response.render('graphs_page', Object.assign(graphProperties, defaultParams));
		console.timeEnd('Preparing the graph page');
	});
}

function fetchReviews(config, callback) {
	reviewDB.getAllReviews(config, function (reviews) {
		const map = createMap(reviews);
		map.dayAverages = dayAverages(map.reviewMap);
		map.dayTotals = dayTotals(map.reviewMap);
		map.walkingDayAverages = walkingDayAverages(map.reviewMap);
		callback(map);
	});
}

Date.prototype.addDays = function (days) {
	const dat = new Date(this.valueOf());
	dat.setDate(dat.getDate() + days);
	return dat;
};

function dayAverageArray(map) {
	const array = [];
	for (var key in map.dayAverages) {
		array.push(map.dayAverages[key]);
	}
	return array;
}

function dayTotalsArray(map) {
	const array = [];
	for (var key in map.dayTotals) {
		array.push(map.dayTotals[key]);
	}
	return array;
}

function dayWalkingDayAveragesArray(map) {
	const array = [];
	for (var key in map.walkingDayAverages) {
		array.push(map.walkingDayAverages[key]);
	}
	return array;
}

function sorter(review1, review2) {
	return review1.reviewInfo.dateTime > review2.reviewInfo.dateTime ? 1 : review1.reviewInfo.dateTime < review2.reviewInfo.dateTime ? -1 : 0;
}

function formatDate(date) {
	dateLib.locale('nl');
	return dateLib.format(new Date(date), 'DD MMM YYYY');
}

function getDates(startDate, stopDate) {
	const dateArray = [];
	var currentDate = startDate;
	while (currentDate <= stopDate) {
		dateArray.push(new Date(currentDate));
		currentDate = currentDate.addDays(1);
	}
	return dateArray;
}

function createEmptyMap(start, stop) {
	start.setHours(0, 0, 0, 0);
	stop.setHours(0, 0, 0, 0);
	const map = {};
	const dates = getDates(start, stop);
	dates.forEach(function (date) {
		map[date] = [];
	});
	return map;
}

function createMap(reviews) {
	if (!reviews || reviews.length === 0) {
		return {};
	}
	reviews.sort(sorter);
	const lastDate = reviews[reviews.length - 1].reviewInfo.dateTime;
	const firstDate = reviews[0].reviewInfo.dateTime;
	const map = createEmptyMap(firstDate, lastDate);
	reviews.forEach(function (review) {
		const date = review.reviewInfo.dateTime;
		date.setHours(0, 0, 0, 0);
		map[date].push(review);
	});
	return {
		'first': firstDate,
		'last': lastDate,
		'reviewMap': map
	};
}

function walkingDayAverages(map) {
	const averageMap = {};
	var total = 0;
	var count = 0;
	var iosTotal = 0;
	var iosCount = 0;
	var androidTotal = 0;
	var androidCount = 0;
	for (var key in map) {
		const array = map[key];
		count += array.length;
		for (var i = 0; i < array.length; i++) {
			const review = array[i];
			total += review.reviewInfo.rating;
			if (review.deviceInfo.platform === 'iOS') {
				iosTotal += review.reviewInfo.rating;
				iosCount += 1;
			} else {
				androidTotal += review.reviewInfo.rating;
				androidCount += 1;
			}
		};
		averageMap[key] = [key, androidTotal > 0 ? (androidTotal / androidCount) : null, iosTotal > 0 ? (iosTotal / iosCount) : null, total > 0 ? (total / count) : null];
	}
	return averageMap;
}

function dayAverages(map) {
	const averageMap = {};
	for (var key in map) {
		const array = map[key];
		var total = 0;
		const count = array.length;
		var iosTotal = 0;
		var iosCount = 0;
		var androidTotal = 0;
		var androidCount = 0;
		for (var i = 0; i < array.length; i++) {
			const review = array[i];
			total += review.reviewInfo.rating;
			if (review.deviceInfo.platform === 'iOS') {
				iosTotal += review.reviewInfo.rating;
				iosCount += 1;
			} else {
				androidTotal += review.reviewInfo.rating;
				androidCount += 1;
			}
		};
		averageMap[key] = [key, androidTotal > 0 ? (androidTotal / androidCount) : null, iosTotal > 0 ? (iosTotal / iosCount) : null, total > 0 ? (total / count) : null];
	}
	return averageMap;
}

function dayTotals(map) {
	const totalMap = {};
	for (var key in map) {
		var total = 0;
		var iosTotal = 0;
		var androidTotal = 0;
		const array = map[key];
		const count = array.length;
		for (var i = 0; i < array.length; i++) {
			const review = array[i];
			total += 1;
			if (review.deviceInfo.platform === 'iOS') {
				iosTotal += 1;
			} else {
				androidTotal += 1;
			}
		};
		totalMap[key] = [key, (androidTotal), (iosTotal), (total)];
	}
	return totalMap;
}
