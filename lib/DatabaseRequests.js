var RavenRequest = require('./RavenRequest'),
	utils = require('./utils');

var DatabaseCommand = module.exports = function(settings) {
	if (!utils.isObject(settings)) throw new Error('Expected a valid settings object.');
	var settingsClone = utils.clone(settings);
	if (settingsClone.database) delete settingsClone.database;
	RavenRequest.call(this, settingsClone);
};

utils.inherit(DatabaseCommand, RavenRequest);

DatabaseCommand.prototype.getDatabases = function(callback) {
		
};

DatabaseCommand.prototype.createDatabase = function(dbname, callback) {

};

DatabaseCommand.prototype.ensureDatabase = function(dbname, callback) {

};

