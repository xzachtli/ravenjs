var RavenRequest = require('./RavenRequest')
	errorCodes = require('./errorCodes'),
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

	var isIdArray = _(id).isArray();
	var isDocArray = _(doc).isArray();
	if (!_(doc).isObject()) throw new Error('Expected a document or array of documents to save');
	if (isDocArray && !_(id).isUndefined() && (!isIdArray || id.length != doc.length)) throw new Error('Array of ids is not the same length as array of documents')
	if (!_(callback).isFunction()) deferred = Q.defer();

	var saveImpl = function(id, doc, callback) {
		var request = {
			headers: { }
		};

		var callFn;
		var metadata;
		if (!isDocArray) {
			request.path = 'docs/' + id;
			callFn = self.sendPut;

			metadata = doc['@metadata'];
			delete doc['@metadata'];
			request.data = doc;

			if (metadata) {
				if (metadata['Raven-Entity-Name']) request.headers['Raven-Entity-Name'] = metadata['Raven-Entity-Name'];
				if (metadata['Raven-Clr-Type']) request.headers['Raven-Clr-Type'] = metadata['Raven-Clr-Type'];
				if (metadata['@etag'] && self.settings.useOptimisticConcurrency) request.headers['If-None-Match'] = metadata['@etag'];
			}
		} else {
			request.path = 'bulk_docs';
			callFn = self.sendPost;

			metadata = [];
			var operations = [];
			_.forEach(doc, function(document, index) {
				metadata[index] = document['@metadata'];
				delete document['@metadata'];
				var operation = {
					Method: 'PUT',
					Document: document,
					Metadata: metadata[index],
					Key: id[index]
				};
				if (metadata['@etag'] && self.settings.useOptimisticConcurrency) operation.ETag = metadata['@etag'];
				operations.push(operation);
			});
			request.data = operations;
		}

		callFn.call(self, request, function(error, response, data) {
			if (error || !data) {
				var saveError = new Error('Failed to save document to the server. Inner: ' + error);
				saveError.statusCode = response.statusCode;
				if (response.statusCode === 409) saveError.number = errorCodes.VersionConflict;
				if (deferred) return deferred.reject(saveError);
				return callback(saveError);
			}
			if (!isDocArray) {
				doc['@metadata'] = metadata || { };
				doc['@metadata']['@id'] = data.Key;
				doc['@metadata']['@etag'] = data.ETag;
			} else {
				_.forEach(doc, function(document, index) {
					document['@metadata'] = metadata[index] || { };
					_.assign(document['@metadata'], data[index].Metadata);
					document['@metadata']['@id'] = data[index].Key;
					document['@metadata']['@etag'] = data[index].Etag;
				});
			}
			
			if (deferred) return deferred.resolve();
			return callback();
		});
	};

	var getDocId = function(id, doc) {
		var idDeferred = Q.defer();
		if (!id) id = self.settings.idFinder(doc);
		if (!id) {
			self.settings.idGenerator(doc, function(error, newid) {
				if (error) {
					var idError = new Error('Failed to save the document. An error occured while trying to assign an id to the document. Inner ' + error);
					idError.number = errorCodes.DocumentIdGenerationFailure;
					idDeferred.reject(idError);
				}
				idDeferred.resolve(newid);
			});
		} else {
			idDeferred.resolve(id);
		}
		return idDeferred.promise;
	};

	var idPromise;
	if (!isDocArray) {
		idPromise = getDocId(id, doc);
	} else {
		if (!isIdArray) {
			id = [];
			id[doc.length-1] = undefined;
		}
		_.forEach(doc, function(document, index) {
			id[index] = getDocId(id[index], document);
		});
		idPromise = Q.all(id);
	}
	idPromise.then(function(result) {
		saveImpl(result, doc, callback);
	}).fail(function(error) {
		if (deferred) return deferred.reject(error);
		return callback(error);
	});

	if (deferred) return deferred.promise;
};

DocumentRequests.prototype.remove = function(data, callback) {
	var self = this,
		deferred = null;
	if (!data) throw new Error('Expected a document id or document instance to remove.');
	if (!_(callback).isFunction()) deferred = Q.defer();

	var id = [];
	var isDataArray = _(data).isArray();
	if (!isDataArray) {
		data = [data];
	}
	_.forEach(data, function(dataItem, dataIndex) {
		if (_(dataItem).isString()) id[dataIndex] = dataItem;
		if (_(dataItem).isObject()) id[dataIndex] = self.settings.idFinder(dataItem);
		if (!id[dataIndex]) {
			var error = new Error('Failed to find a document id to remove.');
			error.number = errorCodes.DocumentIdNotFound;
			throw error;
		}
	});

	var request;
	if (!isDataArray) {
		request = 'docs/' + id[0];
		callFn = self.sendDelete;
	} else {
		request = { path: 'bulk_docs' };
		callFn = self.sendPost;

		var operations = [];
		_.forEach(id, function(idItem) {
			operations.push({
				Method: 'DELETE',
				Key: idItem
			});
		});
		request.data = operations;
	}

	callFn.call(self, request, function(error, response) {
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

DocumentRequests.prototype.deleteByIndex = function(indexName, callback) {
	var self = this,
		deferred = null;
	if (!indexName) throw new Error('Expected an index name to delete from.');
	if (!_(callback).isFunction()) deferred = Q.defer();

	self.sendDelete('bulk_docs/' + indexName + "?allowStale=false", function(error, response, data) {
		if (error) {
			var saveError = new Error('Failed to delete by index. Inner: ' + error);
			saveError.number = errorCodes.ServerError;
			saveError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(saveError);
			return callback(saveError);
		}

		if (deferred) return deferred.resolve(data);
		return callback(error, data);
	})

	if (deferred) return deferred.promise;
};
