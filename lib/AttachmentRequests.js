var RavenRequest = require('./RavenRequest'),
	inherits = require('util').inherits,
	format = require('util').format,
	_ = require('underscore');

var AttachmentRequests = module.exports = function(settings) {
	RavenRequest.call(this, settings);
};

inherits(AttachmentRequests, RavenRequest);

AttachmentRequests.prototype.get = function(key, callback) {
	if (!_(key).isString()) throw new Error('Expected a valid attachment key to get.');
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function.');

};

AttachmentRequests.prototype.save = function(key, opts, callback) {

};

AttachmentRequests.prototype.remove = function(key, callback) {

};