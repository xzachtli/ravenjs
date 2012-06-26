var request = require('./ravenRequest'),
	RavenCollection = require('./ravenCollection'),
	_ = require('underscore');

var RavenClient = module.exports = function(settings) {
	var self = this;
	self.settings = {
		server: settings.server,
		database: settings.database,
		username: settings.username,
		password: settings.password,
		apiKey: settings.apiKey,
		keyFinder: settings.keyFinder,
		keyGenerator: settings.keyGenerator,
		collection: settings.collection,
		authToken: undefined
	};
};

function buildUrl (path) {
	var self = this;
	var url = self.settings.server;
	if (self.settings.database) {
		url += '/databases/' + self.settings.database;
	}
	if (self.settings.collection) url += '/' + self.settings.collection;
	if (!~path.indexOf('/')) url += '/';
	return url + path;
}

function parseRavenDocument(id, response, docstr) {
	var doc = JSON.parse(docstr);
	var metadata = { id: id };
	if (response.headers.etag) metadata.etag = response.headers.etag;
	if (response.headers['raven-entity-name']) metadata.entityName = response.headers['raven-entity-name'];
	if (response.headers['raven-clr-type']) metadata.clrType = response.headers['raven-clr-type'];

	doc.__raven__ = metadata;
	return doc;
}


RavenClient.prototype.get = function(id, fn) {
	var self = this;
	request(self.settings, { url: buildUrl.call(self, key) }, function(error, response, body) {
		if (error) return fn(error);
		if (response.statusCode !== 200) return fn(new Error('Error getting document ' + key + '. Server returned status ' + response.statusCode));
		if (!body) return fn(new Error('Error getting document ' + key + '. No data returned by server.'));
		
		return fn(null, parseRavenDocument(key, response, body));
	});
};

RavenClient.prototype.collection = function(name) {
	if (!name || !_(name).isString) throw new Error('Expected a valid collection name.');

	var self = this;
	var collection_settings = _(self.settings).clone();
	collection_settings.collection = name;
	return new RavenClient(collection_settings);
};

RavenClient.prototype.save = function(id, doc, fn) {
	var self = this;
	if (!_(key).isString) {
		fn = doc;
		doc = key;
		key = '';
	}

	if (!doc || !_(doc).isObject) throw new Error('Expected a valid document to save.');
	if (!fn || !_(fn).isFunction) throw new Error('Expected a valid callback function.');

	if (!key) {
		key = self.settings.keyFinder(doc);
		if (!key) key = self.settings.keyGenerator(self, doc);
	}
};
