var util = require('util');

var utils = {
	isString: function(obj) {
		if (!obj) return false;
		return toString.call(obj) == '[object String]';
	},
	isNumber: function (obj) {
		if (!obj) return false;
		return toString.call(obj) == '[object Number]';
	},
	isFunction: function(obj) {
		if (!obj) return false;
		return toString.call(obj) == '[object Function]';
	},
	isObject: function(obj) {
		if (!obj) return false;
		return toString.call(obj) == '[object Object]';
	}
}

module.exports = (function() {
	var merged = { };
	for (var attr in utils) { 
		merged[attr] = utils[attr]; 
	}

	for (var attr in util) { 
		merged[attr] = util[attr]; 
	}

	return merged;
})();