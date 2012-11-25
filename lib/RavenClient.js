var DocumentRequests = require('./DocumentRequests'),
	IndexRequests = require('./IndexRequests'),
	QueryRequest = require('./QueryRequest'),
	AttachmentRequests = require('./AttachmentRequests');


var RavenClient = module.exports = function(settings) {
	var self = this;
	self.settings = settings;
};

RavenClient.prototype.get = function(id, callback) {
	var self = this;
	var request = new DocumentRequests(self.settings);
	return request.get(id, callback);
};

RavenClient.prototype.save = function(id, doc, callback) {
	var self = this;
	var request = new DocumentRequests(self.settings);
	return request.save(id, doc, callback);
};

RavenClient.prototype.remove = function(data, callback) {
	var self = this;
	var request = new DocumentRequests(self.settings);
	return request.remove(data, callback);
};

RavenClient.prototype.index = function(indexName) {
	var self = this;
	return new IndexRequests(indexName, self.settings);
};

RavenClient.prototype.query = function(indexName) {
	var self = this;
	return new QueryRequest(indexName, self.settings);
};

RavenClient.prototype.attachment = function(key) {
	var self = this;
	return new AttachmentRequests(key, self.settings);
};