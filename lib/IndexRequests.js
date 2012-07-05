var RavenRequest = require('./RavenRequest'),
	inherits = require('util').inherits,
	_ = require('underscore');

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
	var self = this;
	if (!_(self.indexName).isString()) throw new Error('Expected a valid index name to create.');
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function.');
	if (!_(self.indexDef.map).isString()) throw new Error('Expected at least map expression. Use map() function to define a map.');

	var path = 'indexes/' + self.indexName;
	self.sendPut({ path: path, data: self.indexDef}, function(error, response, data) {
		callback(error);
	});
};

IndexRequests.prototype.remove = function(callback) {
	var self = this;
	if (!_(self.indexName).isString()) throw new Error ('Expected a valid index name to remove.');
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function.');

	var path = 'indexes/' + self.indexName;
	self.sendDelete(path, callback);
};
