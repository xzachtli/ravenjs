var RavenRequest = require('./RavenRequest')
	errorCodes = require('./ErrorCodes'),
	inherits = require('util').inherits,
	format = require('util').format,
	_ = require('lodash'),
	Q = require("q");

var DocumentRequests = module.exports = function(settings) {
	RavenRequest.call(this, settings);
};

inherits(DocumentRequests, RavenRequest);

DocumentRequests.prototype.get = function(id, includes, callback) {
	var self = this,
		deferred = null;

	if (!callback && _(includes).isFunction()) {
		callback = includes;
		includes = undefined;
	}

	var isIdArray = _(id).isArray();
	if (isIdArray) id = _.filter(id, function(test) { return _(test).isString() });
	if (!_(id).isString() && (!isIdArray || id.length === 0)) throw new Error ('Expected a valid document id string or array.');
	if (includes && !_(includes).isString() && !_(includes).isArray()) throw new Error ('Expected a valid includes string or array.');
	if (!_(callback).isFunction()) deferred = Q.defer();

	var callFn;
	var argument;
	if (isIdArray) {
		path = 'queries';
		if (includes) {
			if (!_(includes).isArray()) {
				includes = [includes];
			}
			includes = _.filter(includes, function(test) { return _(test).isString() });
			if (includes.length > 0) {
				path += '?include=' + includes.join('&include=') + '&';
			}
		}
		callFn = self.sendPost;
		argument = {
			path: path,
			data: id
		};
	} else {
		callFn = self.sendGet;
		argument = 'docs/' + id;
	}

	callFn.call(self, argument, function(error, response, doc) {
		if (response && response.statusCode === 404) {
		 	error = new Error('Specified document was not found.'); 
		 	error.number = errorCodes.DocumentNotFound;
		}
		else if (response && response.statusCode !== 200) { 
			error = new Error(format('Failed to get the document from the server. Server returned a %s response. Inner: %s', response.statusCode, error)); 
			error.number = errorCodes.ServerError;
			error.statusCode = response.statusCode;
		}

		if (error) {
			if (deferred) return deferred.reject(error);
			return callback(error);
		}

		if (!isIdArray) {
			doc['@metadata'] = { };
			if (response.headers['__document_id']) doc['@metadata']['@id'] = response.headers['__document_id'];
			if (response.headers.etag) doc['@metadata']['@etag'] = response.headers.etag;
			if (response.headers['raven-entity-name']) doc['@metadata']['Raven-Entity-Name'] = response.headers['raven-entity-name'];
			if (response.headers['raven-clr-type']) doc['@metadata']['Raven-Clr-Type'] = response.headers['raven-clr-type'];
			if (response.headers['raven-last-modified']) doc['@metadata']['Raven-Last-Modified'] = response.headers['raven-last-modified'];
		}

		if (deferred) return deferred.resolve(doc);
		return callback(undefined, doc);
	});

	if (deferred) return deferred.promise;
};

DocumentRequests.prototype.save = function(id, doc, callback) {
	var self = this,
		deferred = null;

	if (_(id).isObject() && _(doc).isUndefined() && _(callback).isUndefined()) {
		doc = id;
		callback = undefined;
		id = undefined;
	}
	if (!callback && _(doc).isFunction() && _(id).isObject()) {
		callback = doc;
		doc = id;
		id = undefined;
	}

	if (!_(doc).isObject()) throw new Error('Expected a document to save');
	if (!_(callback).isFunction()) deferred = Q.defer();

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

			if (error || !data) {
				var saveError = new Error('Failed to save document to the server. Inner: ' + error);
				saveError.statusCode = response.statusCode;
				if (response.statusCode === 409) saveError.number = errorCodes.VersionConflict;
				if (deferred) return deferred.reject(saveError);
				return callback(saveError);
			}
			doc['@metadata']['@id'] = data.Key;
			doc['@metadata']['@etag'] = data.ETag;
			
			if (deferred) return deferred.resolve();
			return callback(undefined);
		});
	};
	
	if (!id) id = self.settings.idFinder(doc);
	if (!id) {
		self.settings.idGenerator(doc, self.settings, function(error, newid) {
			if (error) {
				var idError = new Error('Failed to save the document. An error occured while trying to assign an id to the document. Inner ' + error);
				idError.number = errorCodes.DocumentIdGenerationFailure;
				if (deferred) return deferred.reject(idError);
				return callback (idError);
			}
			saveImpl(newid, doc, callback);
		});
	} else {
		saveImpl(id, doc, callback);
	}

	if (deferred) return deferred.promise;
};

DocumentRequests.prototype.remove = function(data, callback) {
	var self = this,
		deferred = null;
	if (!data) throw new Error('Expected a document id or document instance to remove.');
	if (!_(callback).isFunction()) deferred = Q.defer();

	var id;
	if (_(data).isString()) id = data;
	if (_(data).isObject()) id = self.settings.idFinder(data);
	if (!id) {
		var error = new Error('Failed to find a document id to remove.');
		error.number = errorCodes.DocumentIdNotFound;
		throw error;
	}

	self.sendDelete('docs/' + id, function(error, response) {
		if (error) {
			var saveError = new Error('Failed to delete the document. Inner: ' + error);
			saveError.number = errorCodes.ServerError;
			saveError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(saveError);
			return callback(saveError);
		}

		if (deferred) return deferred.resolve();
		return callback(error);
	});

	if (deferred) return deferred.promise;
};

