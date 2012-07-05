var RavenRequest = require('./RavenRequest'),
	querystring = require('querystring'),
	inherits = require('util').inherits,
	format = require('util').format,
	_ = require('underscore');

var QueryRequest = module.exports = function(indexName, settings) {
	if (arguments.length < 2) {
		settings = indexName;
		indexName = undefined;
	}

	RavenRequest.call(this, settings);
	this.indexName = indexName;
};

inherits(QueryRequest, RavenRequest);

function parseQuery() {
	if (!this.where) return undefined;
	return querystring.stringify(this.where, ' AND ', ':');
}

QueryRequest.prototype.collection = function(collectionName) {
	var self = this;
	if (_(indexName).isString()) throw new Error('Cannot specify both an index and collection to query.');
	self.collection = collectionName;
	return this;
};

QueryRequest.prototype.where = function(field, value) {
	var self = this;
	if (!_(field).isString()) throw new Error('Expected a valid field string to query by.');
	if (!_(value).isString()) throw new Error('Expected a valid value string.');

	if (!self.where) self.where = { };
	where[field] = value;
	return this;
};

QueryRequest.prototype.select = function() {
	var self = this;
	if (arguments.length === 0) throw new Error ('Expected at least one string argument to select.');
	self.select = [];
	for (var i = arguments.length - 1; i >= 0; i--) {
		if (!_(arguments[i]).isString()) throw new Error (format('Invalid arguments. Expected a string array but found %s', toString.call(arguments[i])));
		self.select.push(arguments[i]);
	}
	return this;
};

QueryRequest.prototype.orderBy = function(field) {
	var self = this;
	if (!_(field).isString()) throw new Error('Expected a valid field string to sort by');
	self.orderBy = field;
	return this;
};

QueryRequest.prototype.orderByDescending = function(field) {
	var self = this;
	if (!_(field).isString()) throw new Error('Expected a valid field string to sorty by');
	self.orderBy = '-' + field;
	return this;
};

QueryRequest.prototype.skip = function(count) {
	var self = this;
	if (!_(count).isNumber()) throw new Error('Expected a valid number for total records to skip.');
	self.skip = count;
	return this;
};

QueryRequest.prototype.take = function(count) {
	var self = this;
	if (!_(count).isNumber()) throw new Error('Expected a valid number for total records to take.');
	self.take = count;
	return this;
};

QueryRequest.prototype.results = function(callback) {
	var self = this;
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function.');
	var queryStrObj = {
		query: parseQuery.call(this),
		fetch: self.select,
		sort: self.orderBy,
		start: self.skip,
		pageSize: self.take
	};

	if (!queryStrObj.query) delete queryStrObj.query;
	if (!queryStrObj.fetch) delete queryStrObj.fetch;
	if (!queryStrObj.sort) delete queryStrObj.sort;
	if (!queryStrObj.start) delete queryStrObj.start;
	if (!queryStrObj.pageSize) delete queryStrObj.pageSize;

	var query = querystring.stringify(queryStrObj);
	var path = 'indexes/';
	if (self.indexName) {
		path += self.indexName;
	} else {
		path += 'dynamic';
	}
	if (query) path += '?' + query;

	//TODO Parse results
	self.sendGet(path, callback);
};