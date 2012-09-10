var _ = require('underscore');

module.exports = function(that, field, cb) {
	if (!that) throw new Error('Expected a valid object for [that] argument.');
	if (!field) throw new Error('Expected a valid field name to [field] argument.');
	if (!_(field).isString()) throw new Error('Expected a valid field name to filter.');
	if (!cb) throw new Error('Expected a valid callback function for [cb] argument.');
	if (!_(cb).isFunction()) throw new Error('Expected a valid callback function for [cb] argument.');

	parseValues = function(vals, operator) {
		var filter = '';
		if (vals.length > 1) filter += '(';
		for (var i = 0; i < vals.length; i++) {
			if (i !== 0) { filter += ' ' + operator + ' '; }
			filter += field + ':' + vals[i];
		}

		if (vals.length > 1) filter += ')';
		return filter;
	};

	this.is = function(val) {
		if (!val) throw new Error('Expected a value to filter by');

		var filter = '';
		if (_(val).isArray()) { filter = parseValues(val ,'AND'); }
		else { filter = field + ":" + val; }

		cb(filter);
		return that;
	};

	this.isEither = function(vals) {
		if (!vals) throw new Error('Expected an array of values to filter by.');
		if (!_(vals).isArray()) throw new Error('Expected an array of values to filter by.');

		cb(parseValues(vals, 'OR'));
		return that;
	};

	return this;
}