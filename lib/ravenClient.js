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
		idFinder: settings.idFinder,
		idGenerator: settings.idGenerator,
		collection: settings.collection,
		useOptimisticConcurrency: settings.useOptimisticConcurrency,
		authToken: undefined
	};
};

function buildDocsUrl (path) {
	var self = this;
	var url = self.settings.server;
	if (self.settings.database) {
		url += '/databases/' + self.settings.database;
	}
	if (self.settings.collection && !~path.indexOf('/')) {
		url += '/docs/' + self.settings.collection;	
	} else {
		url += '/docs';
	}
	if (path.indexOf('/') !== 0) url += '/';
	console.log(url + path);
	return url + path;
}

function hasInvalidPaths(id) {
	if (~id.indexOf('/') || ~id.indexOf('\\')) return true;
	return false;
}



//Raven Collection [Entity-Name].
RavenClient.prototype.collection = function(name) {
	if (!name || !_(name).isString) throw new Error('Expected a valid collection name.');
	if (hasInvalidPaths(name)) throw new Error('Collection names cannot have invalid path characters "\\" and "/"');

	var self = this;
	var collection_settings = _(self.settings).clone();
	collection_settings.collection = name;
	return new RavenClient(collection_settings);
};

//Get
RavenClient.prototype.get = function(id, callback) {
	var self = this;
	if(!id) throw new Error('Expected a valid document id strng');
	if (hasInvalidPaths(id)) throw new Error('Document id cannot contain invalid path charcters "\\" and "/"');
	if (!callback || !_(callback).isFunction()) throw new Error('Expected a valid callback function.');

	request(self.settings, { url: buildDocsUrl.call(self, id) }, function(error, response, body) {
		if (error) return callback(error);
		if (response.statusCode !== 200) return callback(new Error('Error getting document ' + id + '. Server returned status ' + response.statusCode));
		if (!body) return callback(new Error('Error getting document ' + id + '. No data returned by server.'));
		
		var doc = JSON.parse(body);

		doc['@id'] = id;
		if (self.settings.collection) doc['@id'] = self.settings.collection + '/' + id;

		var metadata = { };
		if (response.headers.etag) metadata.ETag = response.headers.etag;
		if (response.headers['raven-entity-name']) metadata['Raven-Entity-Name'] = response.headers['raven-entity-name'];
		if (response.headers['raven-clr-type']) metadata['Raven-Clr-Type'] = response.headers['raven-clr-type'];
		if (response.headers['last-modified']) metadata['Last-Modified'] = response.headers['last-modified'];
		doc['@metadata'] = metadata;

		return callback(null, doc);
	});
};

//Save
RavenClient.prototype.save = function(id, doc, callback) {
	var self = this;
	if (!_(id).isString()) {
		callback = doc;
		doc = id;
		id = undefined;
	}

	var saveFn = function(id, doc, callback) {
		var metadata = { };
		var requestData = {
			url: buildDocsUrl.call(self, id),
			method: 'PUT',
			headers: { },
			json: doc
		};

		if (doc['@metadata']) {
			//Document has raven metadata. Assign it to request headers and remove it from the document before sending request.
			metadata = doc['@metadata'];
			if (metadata['Raven-Entity-Name']) requestData.headers['Raven-Entity-Name'] = metadata['Raven-Entity-Name'];
			if (metadata['Raven-Clr-Type']) requestData.headers['Raven-Clr-Type'] = metadata['Raven-Clr-Type'];

			if (metadata.ETag && self.settings.useOptimisticConcurrency) {
				requestData.headers['If-None-Match'] = metadata.ETag;
			}

			delete doc['@metadata'];
		} else {
			if (self.settings.collection) {
				metadata['Raven-Entity-Name'] = self.settings.collection;
				requestData.headers['Raven-Entity-Name'] = self.settings.collection;
			}
		}

		request(self.settings, requestData, function(error, response, body) {
			if (error || !response) return callback(new Error('Failed to save document to the server. Inner ' + error));
			if (response.statusCode !== 201) return callback(new Error('Error saving document to the server. Server returned a response code of ' + response.statusCode));

			var result = JSON.parse(body);
			metadata.ETag = result.ETag;
			doc['@id'] = result.Key;
			doc['@metadata'] = metadata;
			callback(undefined);
		});
	};

	if (id && hasInvalidPaths(id)) throw new Error('Document id cannot contain invalid path charcters "\\" and "/"');

	if (!doc || !_(doc).isObject) throw new Error('Expected a valid document to save.');
	if (!callback || !_(callback).isFunction) throw new Error('Expected a valid callback function.');

	if (!id) id = self.settings.idFinder(doc);
	if (!id) {
		self.settings.idGenerator(self.settings, function(error, newid) {
			if (error) return callback(new Error('Failed to save document. An error occured while trying to assign an id to the document. Inner ' + error));
			id = newid;
			saveFn(id, doc, callback);
		});
	} else {
		saveFn(id, doc, callback);
	}
};

RavenClient.prototype.delete = function(id, callback) {

};
