var _ = require('lodash'),
	filter = require('./filter.js');

var NestedQuery = module.exports = function(that) {
	if (!!that) this.that = that;
}

NestedQuery.prototype.where = function(field) {
	var self = this;
	if (!_(field).isString() && !_(field).isFunction()) throw new Error('Expected a valid field string or nested function to query by.');
	if (!self.conditions) self.conditions = [];
	
	if (_(field).isFunction()) {
		var nested = new NestedQuery();
		field(nested);
		var nestedQuery = nested.toString();
		if (nestedQuery !== '') self.conditions.push(nestedQuery);
		return self;
	} else {
		return filter(self.that || self, field, function(val) {
			self.conditions.push(val);
		});
	}
};

NestedQuery.prototype.and = function(field) {
	var self = this;
	if (!_(field).isString() && !_(field).isFunction()) throw new Error('Expected a valid field string or nested function to query by.');
	if (!self.conditions) throw new Error(
		'Invalid usage. Call where() before calling and(). '+
		' and() operator cannot be used before where operator. ');
		
	if (_(field).isFunction()) {
		var nested = new NestedQuery();
		field(nested);
		var nestedQuery = nested.toString();
		if (nestedQuery !== '') self.conditions.push(nestedQuery);
		return self;
	} else {
		return filter(self.that || self, field, function(val) {
			self.conditions.push(val);
		});
	}
};

NestedQuery.prototype.or = function(field) {
	var self = this;
	if (!_(field).isString() && !_(field).isFunction()) throw new Error('Expected a valid field string or nested function to query by.');
	if (!self.conditions) throw new Error(
		'Invalid usage. Call where() before calling or(). '+
		' or() operator cannot be used before where operator. ');
		
	if (_(field).isFunction()) {
		var nested = new NestedQuery();
		field(nested);
		var nestedQuery = nested.toString();
		if (nestedQuery !== '') self.conditions.push({operator: 'OR', filter: nestedQuery});
		return self;
	} else {
		return filter(self.that || self, field, function(val) {
			self.conditions.push({operator: 'OR', filter: val});
		});
	}
};
	
NestedQuery.prototype.toString = function() {
	var self = this;
	if (!self.conditions) return '';

	var query = '';
	var operator, specification;
	for (var i = 0; i < self.conditions.length; i++) {
		operator = ' AND ';
		specification = self.conditions[i]
		if (_(self.conditions[i]).isObject()) {
			if (specification.operator) { operator = ' ' + specification.operator + ' '; }
			if (specification.filter) { specification = specification.filter; }
		}
		if (i > 0) { query += operator; }
		query += specification;
	}
	return '(' + query + ')';
};