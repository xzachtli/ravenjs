var request = require('./ravenRequest'),
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
		authToken: undefined
	};
};



function buildUrl (path) {
	var self = this;
	var url = self.settings.server;
	if (self.settings.database) {
		url += '/databases/' + self.settings.database;
	}

	if (!~path.indexOf('/')) url += '/';
	return url + path;
}

function parseRavenDocument(response, docstr) {
	var doc = JSON.parse(docstr);
	var metadata = { };
	if (response.headers.etag) metadata.etag = response.headers.etag;
	if (response.headers['raven-entity-name']) metadata.entityName = response.headers['raven-entity-name'];
	if (response.headers['raven-clr-type']) metadata.clrType = response.headers['raven-clr-type'];

	doc.__raven__ = metadata;
	return doc;
}


RavenClient.prototype.get = function(key, fn) {
	var self = this;
	request(self.settings, { url: buildUrl.call(self, key) }, function(error, response, body) {
		if (error) return fn(error);
		if (response.statusCode !== 200) return fn(new Error('Error getting document ' + key + '. Server returned status ' + response.statusCode));
		if (!body) return fn(new Error('Error getting document ' + key + '. No data returned by server.'));
		
		return fn(null, parseRavenDocument(response, body));
	});
};