var RavenRequest = require('./RavenRequest'),
	utils = require('./utils');

var IndexRequest = module.exports = function(indexName, settings) {
	RavenRequest.call(this, settings);
	this.indexName = indexName;
};

utils.inherits(IndexRequest, RavenRequest);

IndexRequest.prototype.remove = function(callback) {
	var self = this;
	if (!utils.isString(indexName)) throw new Error ('Expected a valid index name to remove.');

	var path = 'indexes/' + self.indexName;
	self.del(path, function(error) {
		callback(error);
	});
};

IndexRequest.prototype.map = function(map) {
	var self = this;
	self.map = map;
	return this;
};

IndexRequest.prototype.reduce = function(reduce) {
	var self = this;
	self.reduce = reduce;
	return this;
};

IndexRequest.prototype.create = function(callback) {
	var self = this;
	if (!utils.isString(indexName)) throw new Error('Expected a valid index name to create.');
	if (!utils.isString(self.map)) throw new Error('Expected at least map expression. Use map() function to define a map.');

	var path = 'indexes/' + self.indexName;
	var data = { map: self.map };
	if (utils.isString(self.reduce)) data.reduce = self.reduce;
	self.put(path, data, function(error, response, data) {
		callback(error);
	});
};