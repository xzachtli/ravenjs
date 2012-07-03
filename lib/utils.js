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
	},
	clone: function(obj) {
		if (!this.isObject(obj) && !util.isArray(obj)) return obj;
		if (util.isArray(obj)) return obj.slice();
		var propNames = Object.getOwnPropertyNames(obj);
		var cloneObj = { };
		propNames.forEach(function(prop) {
			var propDescr = Object.getOwnPropertyDescriptor(obj, prop);
			Object.defineProperty(cloneObj, prop, propDescr);
		});
		return cloneObj;
	}
};

module.exports = (function() {
	var  merged = { };
	for (var attr in utils) {
		merged[attr] = utils[attr];
	}

	for (var attr in util) {
		merged[attr] = util[attr];
	}

	return merged;
})();