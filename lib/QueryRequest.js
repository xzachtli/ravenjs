var RavenRequest = require('./RavenRequest'),
	querystring = require('querystring'),
	inherits = require('util').inherits,
	format = require('util').format,
	NestedQuery = require('./NestedQuery'),
	filter = require('./filter.js'),
	errorCodes = require('./errorCodes'),
	Q = require('q'),
	_ = require('lodash'),
	inflect = require('i')();

var QueryRequest = module.exports = function(indexName, settings) {
	if (arguments.length < 2) {
		settings = indexName;
		indexName = undefined;
	}

	RavenRequest.call(this, settings);
	this.indexName = indexName;
	this.queryData = { };
};

inherits(QueryRequest, RavenRequest);

QueryRequest.prototype.collection = function(collectionName, pluralizeTypeName) {
	var self = this;
	if (_(self.indexName).isString()) throw new Error('Cannot specify both an index and collection to query.');
	if (pluralizeTypeName === true) collectionName = inflect.pluralize(collectionName);
	self.queryData.collection = collectionName;
	return this;
};

QueryRequest.prototype.lucene = function(luceneQuery) {
	var self = this;
	if (!_(luceneQuery).isString()) throw new Error('Expected a valid lucene query string.');
	if (!!self.queryData.fluentQuery) throw new Error(
		'Invalid usage. Cannot call query() simultaneously with where()');
	if (!!self.queryData.query) throw new Error(
		'Invalid usage. Cannot call query() multiple times');
	
	self.queryData.query = luceneQuery
	return self;
};

QueryRequest.prototype.where = function(field) {
	var self = this;
	if (!!self.queryData.query) throw new Error(
		'Invalid usage. Cannot call where() simultaneously with query()');
	if (!self.queryData.fluentQuery) self.queryData.fluentQuery = new NestedQuery(self);
	return self.queryData.fluentQuery.where(field);
};

QueryRequest.prototype.and = function(field) {
	var self = this;
	if (!self.queryData.fluentQuery) throw new Error(
		'Invalid usage. Call where() before calling and(). '+
		' and() operator cannot be used before where operator. ');
	return self.queryData.fluentQuery.and(field);
};

QueryRequest.prototype.or = function(field) {
	var self = this;
	if (!self.queryData.fluentQuery) throw new Error(
		'Invalid usage. Call where() before calling or(). '+
		' or() operator cannot be used before where operator. ');
	return self.queryData.fluentQuery.or(field);
};

QueryRequest.prototype.select = function() {
	var self = this;
	if (arguments.length === 0) throw new Error ('Expected at least one string argument to select.');

	var selectFields = [];
	_(arguments).each(function(arg) {
		if (!_(arg).isString() && !_(arg).isNumber()) throw new Error(format('Invalid arguments. Cannot add %j as a select filter', arg));
		if (!_(arg).isString()) return selectFields.push(toString.call(arg));
		return selectFields.push(arg);
	});
	self.queryData.select = selectFields;
	return self;
};

QueryRequest.prototype.orderBy = function(field) {
	var self = this;
	if (!_(field).isString()) throw new Error('Expected a valid field string to sort by');
	self.queryData.orderBy = field;
	return self;
};

QueryRequest.prototype.orderByDescending = function(field) {
	var self = this;
	if (!_(field).isString()) throw new Error('Expected a valid field string to sorty by');
	self.queryData.orderBy = '-' + field;
	return self;
};

QueryRequest.prototype.skip = function(count) {
	var self = this;
	if (!_(count).isNumber()) throw new Error('Expected a valid number for total records to skip.');
	if (count > 0) self.queryData.skip = count;
	return self;
};

QueryRequest.prototype.take = function(count) {
	var self = this;
	if (!_(count).isNumber()) throw new Error('Expected a valid number for total records to take.');
	if (count > 0) self.queryData.take = count;
	return self;
};

QueryRequest.prototype.results = function(callback) {
	var self = this,
		deferred = null,
		queryStrObj = {
		query: self.queryData.query,
		fetch: self.queryData.select,
		sort: self.queryData.orderBy,
		start: self.queryData.skip,
		pageSize: self.queryData.take
	};

	if (!_(callback).isFunction()) deferred = Q.defer();
	if (!self.queryData.query && !!self.queryData.fluentQuery) queryStrObj.query = self.queryData.fluentQuery.toString();

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
		if (!self.queryData.collection && !query) throw new Error('Invalid query operation. ' +
			'When performing a dynamic query either the collection name or query filters using ' +
			'where() and and() operators must be used.');

		if (self.queryData.collection) path += '/' + self.queryData.collection;
	}
	if (query) path += '?' + query;

	self.sendGet(path, function(error, response, data) {
		if (error) {
			var serverError = new Error(format('Failed to execute query. Response: %s. Raw query: %s. Inner: %s', self.toString(), data, error));
			serverError.number = errorCodes.ServerError;
			serverError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(serverError);
			return callback(serverError, data);
		}

		if (response.statusCode !== 200) {
			var serverError = new Error(format('Failed to get results. Response: %s. Raw query: %s. Inner: %s ', self.toString(), data, response.statusCode));
			serverError.number = errorCodes.ServerError;
			serverError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(serverError);
			return callback(serverError, data);
		}

		if (deferred) return deferred.resolve(data);
		return callback(undefined, data);
	});

	if (deferred) return deferred.promise;
};

QueryRequest.prototype.toString = function() {
	return 'QueryRequest';
};