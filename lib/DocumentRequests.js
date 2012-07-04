var RavenRequest = require('./RavenRequest'),
	utils = require('./utils');

var DocumentRequest = module.exports = function(settings) {
	RavenRequest.call(this, settings);
};

utils.inherits(DocumentRequest, RavenRequest);

DocumentRequest.prototype.get = function(id, callback) {
	var self = this;
	if (!utils.isString(id)) throw new Error ('Expected a valid document id string.');
	if (!utils.isFunction(callback)) throw new Error ('Expected a valid callback function.');

	var path = 'docs/' + id;
	self.get(path, function(error, doc) {
		if (error) callback(error);
		doc['@id'] = id;
		doc['@metadata'] = { };
		if (response.headers.etag) doc['@metadata'].ETag = response.headers.etag;
		if (response.headers['raven-entity-name']) doc['@metadata']['Raven-Entity-Name'] = response.headers['raven-entity-name'];
		if (response.headers['raven-clr-type']) doc['@metadata']['Raven-Clr-Type'] = response.headers['raven-clr-type'];
		callback(undefined, doc);
	});
};

DocumentRequest.prototype.save = function(id, doc, callback) {
	var self = this;
	if (arguments.length < 3) {
		callback = doc;
		doc = id;
		id = undefined;
	}

	var saveImpl = function(id, doc, callback) {
		var doc_id = doc['@id'];
		var metadata = doc['@metadata'];
		delete doc['@id'];
		delete doc['@metadata'];

		var request = {
			path: id,
			data: doc,
			headers: { }
		};

		if (metadata) {
			if (metadata['Raven-Entity-Name']) request.headers['Raven-Entity-Name'] = metadata['Raven-Entity-Name'];
			if (metadata['Raven-Clr-Type']) request.headers['Raven-Clr-Type'] = metadata['Raven-Clr-Type'];
			if (metadata.ETag && self.settings.useOptimisticConcurrency) request.headers['If-None-Match'] = metadata.ETag;
		}

		self.put(request, function(error, response, data) {
			doc['@id'] = doc_id;
			doc['@metadata'] = metadata;

			if (error || !response) return callback(new Error('Failed to save the document to the server. Inner ' + error));
			doc['@metadata'].ETag = response.ETag;
			doc['@metadata']['@id'] = response.Key;
			callback(undefined);
		});
	};

	if (!utils.isObject(doc)) throw new Error('Expected a valid document to save.');
	if (!utils.isFunction(callback)) throw new Error('Expected a valid callback function.');
	if (!id) id = self.settings.idFinder(doc);
	if (!id) {
		self.settings.idGenerator(self.settings, function(error, newid) {
			if (error) return callback (new Error('Failed to save the document. An error occured while trying to assign an id to the document. Inner ' + error));
			saveImpl(newid, doc, callback);
		});
	} else {
		saveImpl(id, doc, callback);
	}
};

DocumentRequest.prototype.remove = function(data, callback) {
	var self = this;
	if (!data) throw new Error('Expected a document id or document instance to remove.');

	var id;
	if (utils.isString(data)) id = data;
	if (utils.isObject(data)) id = self.settings.idFinder(data);
	if (!data) throw new Error('Failed to find a document id to remove.');

	self.del(id, function(error) {
		callback(error);
	});
};

