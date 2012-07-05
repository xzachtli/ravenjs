var RavenRequest = require('./RavenRequest'),
	inherits = require('util').inherits,
	format = require('util').format,
	_ = require('underscore');

var DatabaseRequests = module.exports = function(settings) {
	if (!_(settings).isObject()) throw new Error('Expected a valid settings object.');
	var settingsClone = _(settings).clone();
	if (settingsClone.database) delete settingsClone.database;
	RavenRequest.call(this, settingsClone);
};

inherits(DatabaseRequests, RavenRequest);

function createInternal(dbname, callback) {
	var self = this;
	var path = '/docs/Raven/Databases/' + dbname;
	self.sendPut({ path: path }, function(error, response, data) {
		if (error) return callback(error);
		return callback(undefined);
	});
}

DatabaseRequests.prototype.list = function(callback) {
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback');

	var self = this;
	var path = '/databases';
	self.sendGet(path, function(error, response, data) {
		if (error || response.statusCode !== 200) return callback('Failed to enumerate existing databases on the host. Inner ' + error);
		if (!_(data).isArray()) return callback(new Error('Failed to enumerate existing databases on the host.'));
		callback(undefined, _(data).map(function(result) {
			var db = { };
			db.id = result['@metadata']['@id'];
			db.etag = result['@metadata']['@etag'];
			db.name = result['@metadata']['@id'].replace('Raven/Databases/', '');
			db.lastModified = result['Last-Modified'];
			db.dataDirectory = result.Settings['Raven/DataDir'];
			return db;
		}));
	});
};

DatabaseRequests.prototype.exists = function(dbname, callback) {
	if (!_(dbname).isString()) throw new Error('Expected a valid database name.');
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function.');

	var self = this;
	var path = '/docs/Raven/Databases/' + dbname;
	self.sendGet(path, function(error, response, data) {
		if (error) return callback(error);
		if (response.statusCode === 200) return callback(undefined, true);
		callback(undefined, false);
	});
};

DatabaseRequests.prototype.create = function(dbname, callback) {
	if (!_(dbname).isString()) throw new Error('Expected a valid database name.');
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function.');

	var self = this;
	
	self.exists(dbname, function(error, result) {
		if (error) return callback(error);
		if (result) return callback(new Error(format('Database %s already exists.', dbname)));
		createInternal.call(self, dbname, callback);
	});
};

DatabaseRequests.prototype.remove = function(dbname, callback) {
	if (!_(dbname).isString()) throw new Error('Expected a valid database name.');
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function');

	var self = this;
	var path = '/docs/Raven/Databases/' + dbname;
	self.sendDelete(path, callback);
};

DatabaseRequests.prototype.ensureExists = function(dbname, callback) {
	if (!_(dbname).isString()) throw new Error('Expected a valid database name.');
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function');

	var self = this;
	self.exists(dbname, function(error, result) {
		if (error) return callback(error);
		if (result) return callback(undefined);
		createInternal.call(self, dbname, callback);
	});
};

