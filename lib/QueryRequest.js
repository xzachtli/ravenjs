var RavenRequest = require('./RavenRequest'),
	querystring = require('querystring'),
	utils = require('./utils');

var QueryRequest = module.exports = function(indexName, settings) {
	if (arguments.length < 2) {
		settings = indexName;
		indexName = undefined;
	}

	RavenRequest.call(this, settings);
	this.indexName = indexName;
};

utils.inerhtis(QueryRequest, RavenRequest);

function parseQuery() {
	if (!this.where) return undefined;
	var query = querystring.stringify(this.where, ' AND ', ':');
	if ()
	return query;
}

QueryRequest.prototype.collection = function(collectionName) {
	var self = this;
	if (utils.isString(indexName)) throw new Error('Cannot specify both an index and collection to query.');
	self.collection = collectionName;
	return this;
};

QueryRequest.prototype.where = function(field, value) {
	var self = this;
	if (!utils.isString(field)) throw new Error('Expected a valid field string to query by.');
	if (!utils.isString(value)) throw new Error('Expected a valid value string.');

	if (!self.where) self.where = { };
	where[field] = value;
	return this;
};

QueryRequest.prototype.select = function() {
	var self = this;
	if (arguments.length == 0) throw new Error ('Expected at least one string argument to select.');
	self.select = [];
	for (var i = arguments.length - 1; i >= 0; i--) {
		if (!utils.isString(arguments[i])) throw new Error (utils.format('Invalid arguments. Expected a string array but found %s', toString.call(arguments[i])));
		self.select.push(arguments[i]);
	};
	return this;
};

QueryRequest.prototype.orderBy = function(field) {
	var self = this;
	if (!utils.isString(field)) throw new Error('Expected a valid field string to sort by');
	self.orderBy = field;
	return this;
};

QueryRequest.prototype.orderByDescending = function(field) {
	var self = this;
	if (!utils.isString(field)) throw new Error('Expected a valid field string to sorty by');
	self.orderBy = '-' + field;
	return this;
};

QueryRequest.prototype.skip = function(count) {
	var self = this;
	if (!utils.isNumber(count)) throw new Error('Expected a valid number for total records to skip.');
	self.skip = count;
	return this;
};

QueryRequest.prototype.take = function(count) {
	var self = this;
	if (!utils.isNumber(count)) throw new Error('Expected a valid number for total records to take.');
	self.take = count;
	return this;
};

QueryRequest.prototype.results = function(callback) {
	var self = this;
	if (!utils.isFunction(callback)) throw new Error('Expected a valid callback function.');
	var queryStrObj = {
		query = parseQuery.call(this),
		fetch = self.select,
		sort = self.orderBy,
		start = self.skip,
		pageSize = self.take
	};

	if (!queryStrObj.query) delete queryStrObj.query;
	if (!queryStrObj.fetch) delete queryStrObj.fetch;
	if (!queryStrObj.sort) delete queryStrObj.sort;
	if (!queryStrObj.start) delete queryStrObj.start;
	if (!queryStrObj.pageSize) delete queryStrObj.pageSize;

	var query = querystring.stringify(queryStrObj);
	var path = 'indexes/';
	if (self.indexName) path += self.indexName else path += 'dynamic';
	if (query) path += '?' + query;


};