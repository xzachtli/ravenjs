var RavenRequest = require('./RavenRequest'),
	errorCodes = require('./errorCodes'),
	inherits = require('util').inherits,
	format = require('util').format,
	Q = require('q'),
	_ = require('lodash');

var AttachmentRequests = module.exports = function(key, settings) {
	if (!_(key).isString()) throw new Error('Expected a valid attachment key.');
	RavenRequest.call(this, settings);
	this.key = key;
};

inherits(AttachmentRequests, RavenRequest);

AttachmentRequests.prototype.get = function(callback) {
	var self = this,
		deferred = null;
	
	if (!_(callback).isFunction()) deferred = Q.defer();
	var path = '/static/' + self.key;

	self.sendGet(path, function(error, response, data) {
		if (response.statusCode === 404) {
			var notFoundError = new Error(format('Attachment with key %s not found.', self.key));
			notFoundError.number = errorCodes.DocumentNotFound;
			notFoundError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(notFoundError);
			return callback(notFoundError);
		}

		if (error || response.statusCode !== 200) {
			var serverError = new Error('Failed to get attachment. Inner: ' + error);
			serverError.number = errorCodes.ServerError;
			serverError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(serverError);
			return callback(serverError);;
		}

		var result = {data: data, headers: response.headers};
		if (deferred) return deferred.resolve(result);
		return callback(undefined, result);
	});

	if (deferred) return deferred.promise;
};

AttachmentRequests.prototype.save = function(opts, callback) {
	var self = this,
		deferred = null;
	if (!_(opts).isObject()) throw new Error('Expected valid save options.');
	if (_(opts.buffer).isUndefined()) throw new Error('Expected buffer property in save options');
	if (!_(callback).isFunction()) deferred = Q.defer();

	var saveData = {
		path: '/static/' + self.key,
		buffer: opts.buffer,
		headers: opts.headers
	};

	self.sendPut(saveData, function(error, response, data) {
		if (error || response.statusCode !== 201) {
			var serverError = new Error('Failed to save attachment. Inner: ' + error);
			serverError.number = errorCodes.ServerError;
			serverError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(serverError);
			return callback(serverError);
		}

		if (deferred) return deferred.resolve();
		return callback(undefined);
	});

	if (deferred) return deferred.promise;
};

AttachmentRequests.prototype.remove = function(callback) {
	var self = this,
		deferred = null,
		path = '/static/' + self.key;

	if (!_(callback).isFunction()) deferred = Q.defer();

	self.sendDelete(path, function(error, response, data) {
		if (error || response.statusCode !== 204) {
			var serverError = new Error(format('Failed to remove attachment %s. Inner: ', self.key, error));
			serverError.number = errorCodes.ServerError;
			serverError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(serverError);
			return callback(serverError);
		}
		
		if (deferred) return deferred.resolve();
		return callback(undefined);
	});

	if (deferred) return deferred.promise;
};