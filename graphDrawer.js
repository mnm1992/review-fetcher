module.exports = class GraphDrawer {

	dayAverageArray(map) {
		var array = [];
		for (var key in map.dayAverages) {
			array.push(map.dayAverages[key]);
		}
		return array;
	}

	dayTotalsArray(map) {
		var array = [];
		for (var key in map.dayTotals) {
			array.push(map.dayTotals[key]);
		}
		return array;
	}
	dayWalkingDayAveragesArray(map) {
		var array = [];
		for (var key in map.walkingDayAverages) {
			array.push(map.walkingDayAverages[key]);
		}
		return array;
	}
};
