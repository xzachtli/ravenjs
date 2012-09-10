var _ = require('underscore');

module.exports = function(field) {
	if (!field) throw new Error('Expected a valid field name to filter.');
	if (!_(field).isString()) throw new Error('Expected a valid field name to filter.');

	parseValues = function(vals, operator) {
		var filter = '(';

		for (var i = 0; i < vals.length; i++) {
			if (i !== 0) {
				filter += ' ' + operator + ' ';
			}
			filter += field + ':' + vals[i];
		}

		filter += ')';
		return filter;
	};

	this.value = function(val) {
		if (!val) throw new Error('Expected a value to filter by');
		return field + ':' + val;
	};

	this.or = function(vals) {
		if (!vals) throw new Error('Expected an array of values to filter by.');
		if (!_(vals).isArray()) throw new Error('Expected an array of values to filter by.');

		return parseValues(vals, 'OR');
	};

	this.and = function(vals) {
		if (!vals) throw new Error('Expected an array of values to filter by.');
		if (!_(vals).isArray()) throw new Error('Expected an array of values to filter by.');

		return parseValues(vals, 'AND');
	};

	return this;
};