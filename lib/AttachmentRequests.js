var RavenRequest = require('./RavenRequest'),
	utils = require('./utils');

var AttachmentCommand = module.exports = function(settings) {
	RavenRequest.call(this, settings);
}

utils.inherit(AttachmentCommand, RavenRequest);

AttachmentCommand.prototype.get = function(key, callback) {

};

AttachmentCommand.prototype.save = function(key, data, callback) {

};