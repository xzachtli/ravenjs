var RavenRequest = require('./RavenRequest'),
	inherits = require('util').inherits,
	format = require('util').format,
	_ = require('lodash');

var DocumentRequests = module.exports = function(settings) {
	RavenRequest.call(this, settings);
};

inherits(DocumentRequests, RavenRequest);

DocumentRequests.prototype.get = function(id, callback) {
	var self = this;
	if (!_(id).isString()) throw new Error ('Expected a valid document id string.');
	if (!_(callback).isFunction()) throw new Error ('Expected a valid callback function.');

	var path = 'docs/' + id;
	self.sendGet(path, function(error, response, doc) {
		if (error) return callback(error);
		if (response.statusCode === 404) return callback(new Error('Specified document was not found.'));
		if (response.statusCode !== 200) return callback(new Error(format('Failed to get the document from the server. Server returned a %s response.', response.statusCode)));

		doc['@metadata'] = { };
		doc['@metadata']['@id'] = id;
		if (response.headers.etag) doc['@metadata']['@etag'] = response.headers.etag;
		if (response.headers['raven-entity-name']) doc['@metadata']['Raven-Entity-Name'] = response.headers['raven-entity-name'];
		if (response.headers['raven-clr-type']) doc['@metadata']['Raven-Clr-Type'] = response.headers['raven-clr-type'];
		callback(undefined, doc);
	});
};

DocumentRequests.prototype.save = function(id, doc, callback) {
	var self = this;
	if (!callback && _(doc).isFunction() && _(id).isObject()) {
		callback = doc;
		doc = id;
		id = undefined;
	}

	if (!_(doc).isObject()) throw new Error('Expected a document to save');
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function.');

	var saveImpl = function(id, doc, callback) {
		var metadata = doc['@metadata'];
		delete doc['@metadata'];

		var request = {
			path: 'docs/' + id,
			data: doc,
			headers: { }
		};

		if (metadata) {
			if (metadata['Raven-Entity-Name']) request.headers['Raven-Entity-Name'] = metadata['Raven-Entity-Name'];
			if (metadata['Raven-Clr-Type']) request.headers['Raven-Clr-Type'] = metadata['Raven-Clr-Type'];
			if (metadata['@etag'] && self.settings.useOptimisticConcurrency) request.headers['If-None-Match'] = metadata['@etag'];
		}

		self.sendPut(request, function(error, response, data) {
			doc['@metadata'] = metadata || { };

			if (error || !data) return callback(new Error('Failed to save the document to the server. Inner ' + error));
			doc['@metadata']['@id'] = data.Key;
			doc['@metadata']['@etag'] = data.ETag;
			callback(undefined);
		});
	};
	
	if (!id) id = self.settings.idFinder(doc);
	if (!id) {
		self.settings.idGenerator(doc, self.settings, function(error, newid) {
			if (error) return callback (new Error('Failed to save the document. An error occured while trying to assign an id to the document. Inner ' + error));
			saveImpl(newid, doc, callback);
		});
	} else {
		saveImpl(id, doc, callback);
	}
};

DocumentRequests.prototype.remove = function(data, callback) {
	var self = this;
	if (!data) throw new Error('Expected a document id or document instance to remove.');
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function');

	var id;
	if (_(data).isString()) id = data;
	if (_(data).isObject()) id = self.settings.idFinder(data);
	if (!id) throw new Error('Failed to find a document id to remove.');
	self.sendDelete('docs/' + id, function(error) {
		callback(error);
	});
};

