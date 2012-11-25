var RavenRequest = require('./RavenRequest'),
	errorCodes = require('./errorCodes'),
	inherits = require('util').inherits,
	format = require('util').format,
	Q = require('q'),
	_ = require('lodash');

var IndexRequests = module.exports = function(indexName, settings) {
	if (!_(indexName).isString()) throw new Error('Expected a valid index name.');

	RavenRequest.call(this, settings);
	this.indexName = indexName;
	this.indexDef = { };
};

inherits(IndexRequests, RavenRequest);

IndexRequests.prototype.map = function(map) {
	var self = this;
	self.indexDef.map = map;
	return this;
};

IndexRequests.prototype.reduce = function(reduce) {
	var self = this;
	self.indexDef.reduce = reduce;
	return this;
};

IndexRequests.prototype.create = function(callback) {
	var self = this,
		deferred = null;
	if (!_(self.indexName).isString()) throw new Error('Expected a valid index name to create.');
	if (!_(self.indexDef.map).isString()) throw new Error('Expected at least map expression. Use map() function to define a map.');
	if (!_(callback).isFunction()) deferred = Q.defer();

	var path = 'indexes/' + self.indexName;
	self.sendPut({ path: path, data: self.indexDef}, function(error, response, data) {
		if (error) {
			var serverError = new Error(format('Failed to create index %s. Inner: %s', self.indexName, error));
			serverError.number = errorCodes.ServerError;
			serverError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(serverError);
			return callback(serverError);
		}
		
		if (deferred) return deferred.resolve();
		callback(undefined);
	});

	if (deferred) return deferred.promise;
};

IndexRequests.prototype.remove = function(callback) {
	var self = this,
		deferred = null;
	if (!_(self.indexName).isString()) throw new Error ('Expected a valid index name to remove.');
	if (!_(callback).isFunction()) deferred = Q.defer();

	var path = 'indexes/' + self.indexName;
	self.sendDelete(path, function(error, response) {
		if (error) {
			var serverError = new Error(format('Failed to remove index %s. Inner: %s', self.indexName, error));
			serverError.number = errorCodes.ServerError;
			serverError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(serverError);
			return callback(serverError);
		}

		if (deferred) return deferred.resolve();
		return callback(undefined);
	});

	if (deferred) return deferred.promise;
};
