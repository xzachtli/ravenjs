var DocumentRequests = require('./DocumentRequests'),
	IndexRequests = require('./IndexRequests'),
	QueryRequest = require('./QueryRequest');


var RavenClient = module.exports = function(settings) {
	var self = this;
	self.settings = {
		server: settings.server,
		database: settings.database,
		username: settings.username,
		password: settings.password,
		apiKey: settings.apiKey,
		idFinder: settings.idFinder,
		idGenerator: settings.idGenerator,
		collection: settings.collection,
		useOptimisticConcurrency: settings.useOptimisticConcurrency,
		authToken: undefined
	};
};

RavenClient.prototype.get = function(id, callback) {
	var self = this;
	var request = new DocumentRequests(self.settings);
	request.get(id, callback);
};

RavenClient.prototype.save = function(id, doc, callback) {
	var self = this;
	var request = new DocumentRequests(self.settings);
	request.save(id, doc, callback);
};

RavenClient.prototype.remove = function(data, callback) {
	var self = this;
	var request = new DocumentRequests(self.settings);
	request.remove(data, callback);
};

RavenClient.prototype.index = function(indexName) {
	var self = this;
	return new IndexRequests(indexName, self.settings);
};

RavenClient.prototype.query = function(indexName) {
	var self = this;
	return new QueryRequests(indexName, self.settings);
};