var DocumentRequest = require('./DocumentRequest'),
	IndexRequest = require('./IndexRequest'),
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
	var documentRequest = new DocumentRequest(self.settings);
	documentRequest.get(id, callback);
};

RavenClient.prototype.save = function(id, doc, callback) {
	var self = this;
	var documentRequest = new DocumentRequest(self.settings);
	documentRequest.save(id, doc, callback);
};

RavenClient.prototype.remove = function(data, callback) {
	var self = this;
	var documentRequest = new DocumentRequest(self.settings);
	documentRequest.remove(data, callback);
};

RavenClient.prototype.index = function(indexName) {
	var self = this;
	return new IndexRequest(indexName, self.settings);
};

RavenClient.prototype.query = function(indexName) {
	var self = this;
	return new QueryRequest(indexName, self.settings);
};