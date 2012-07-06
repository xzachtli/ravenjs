var RavenRequest = require('./RavenRequest'),
	inherits = require('util').inherits,
	format = require('util').format,
	_ = require('underscore');

var AttachmentRequests = module.exports = function(key, settings) {
	if (!_(key).isString()) throw new Error('Expected a valid attachment key.');
	RavenRequest.call(this, settings);
	this.key = key;
};

inherits(AttachmentRequests, RavenRequest);

AttachmentRequests.prototype.get = function(callback) {
	var self = this;
	
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function.');
	var path = '/static/' + self.key;

	self.sendGet(path, function(error, response, data) {
		if (error) callback(error);
		if (response.statusCode !== 200) return callback(new Error('Failed to get attachment with key ' + self.key +
			'. Server returned a response code of ' + response.statusCode));
		return callback(undefined, data);
	});
};

AttachmentRequests.prototype.save = function(opts, callback) {
	var self = this;
	if (!_(opts).isObject()) throw new Error('Expected valid save options.');
	if (_(opts.buffer).isUndefined()) throw new Error('Expected buffer property in save options');
	if (!_(callback).isFunction()) throw new Error('Expeted a valid callback function.');

	var saveData = {
		path: '/static/' + self.key,
		buffer: opts.buffer,
		headers: opts.headers
	};

	self.sendPut(saveData, function(error, response, data) {
		if (error) return callback(error);
		if (response.statusCode !== 201) return callback(new Error('Failed to save attachment on the server. ' +
			'Server returned a response code of ' + response.statusCode));
		return callback(undefined);
	});
};

AttachmentRequests.prototype.remove = function(callback) {
	var self = this;
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function.');
	var path = '/static/' + self.key;

	self.sendDelete(path, function(error, response, data) {
		if (error) callback(error);
		if (response.statusCode !== 204) return callback(new Error('Failed to delete attachment with key ' + self.key +
			'. Server returned a response code of ' + response.statusCode));
		return callback(undefined);
	});
};