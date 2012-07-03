var RavenRequest = require('./RavenRequest'),
	utils = require('./utils');

var DatabaseCommand = module.exports = function(settings) {
	//Remove the database setting before passing it on to RavenRequest.
	if (!utils.isObject(settings)) throw new Error('Expected a valid settings object.');
	var settingsClone = utils.clone(settings);
	if (settingsClone.database) delete settingsClone.database;
	RavenRequest.call(this, settingsClone);
};

utils.inherit(DatabaseCommand, RavenRequest);

DatabaseCommand.prototype.getDatabases = function(error, callback) {

};

DatabaseCommand.prototype.createDatabase = function(error, callback) {

};

DatabaseCommand.prototype.ensureDatabase = function(error, callback) {

};

