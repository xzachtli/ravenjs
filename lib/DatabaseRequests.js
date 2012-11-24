var RavenRequest = require('./RavenRequest'),
	errorCodes = require('./errorCodes'),
	inherits = require('util').inherits,
	format = require('util').format,
	Q = require('q'),
	_ = require('lodash');

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
		if (error) return callback(error, response);
		return callback(undefined, response);
	});
}

DatabaseRequests.prototype.list = function(callback) {
	var deferred = null;
	if (!_(callback).isFunction()) deferred = Q.defer();

	var self = this;
	var path = '/databases';
	self.sendGet(path, function(error, response, data) {
		if (error || response.statusCode != 200) {
			var listError = new Error("Failed to enumerate existing databases. Inner: " + error);
			listError.number = errorCodes.ServerError;
			listError.statusCode = response.statusCode;
			if (deferred) return deferred.reject(listError);
			return callback(listError);
		}

		if (!_(data).isArray()) {
			var dataError = new Error('Failed to enumerate existing databases on the host.');
			dataError.number = errorCodes.ServerError;
			if (deferred) return deferred.reject(dataError);
			return callback(dataError);
		}

		var databases = _(data).map(function(result) {
			return { 
				id: result['@metadata']['@id'],
				etag: result['@metadata']['@etag'],
				name: result['@metadata']['@id'].replace('Raven/Databases/', ''),
				lastModified: result['Last-Modified'],
				dataDirectory: result.Settings['Raven/DataDir']
			};
		});

		if (deferred) return deferred.resolve(databases);
		return callback(undefined, databases);
	});

	if (deferred) return deferred.promise;
};

DatabaseRequests.prototype.exists = function(dbname, callback) {
	var deferred = null;
	if (!_(dbname).isString()) throw new Error('Expected a valid database name.');
	if (!_(callback).isFunction()) deferred = Q.defer();

	var self = this;
	var path = '/docs/Raven/Databases/' + dbname;
	self.sendGet(path, function(error, response, data) {
		if (error) {
			var serverError = new Error('Failed to check if database exists: Inner: ' + error);
			serverError.number = errorCodes.ServerError;
			serverError.statusCode = response.statusCode;
			
			if (deferred) return deferred.reject(serverError);
			return callback(serverError);
		}

		var result = response.statusCode === 200;
		if (deferred) return deferred.resolve(result);
		return callback(undefined, result);
	});

	if (deferred) return deferred.promise;
};

DatabaseRequests.prototype.create = function(dbname, callback) {
	var deferred = null;
	if (!_(dbname).isString()) throw new Error('Expected a valid database name.');
	if (!_(callback).isFunction()) deferred = Q.defer();

	var self = this;
	
	self.exists(dbname, function(error, result) {
		if (error) {
			var serverError = new Error('Failed to create database. Inner: ' + error);
			serverError.number = errorCodes.ServerError;
			serverError.statusCode = result.statusCode;

			if (deferred) return deferred.reject(serverError);
			return callback(serverError);
		}
		if (result) {
			var duplicateError = new Error(format('Database %s already exists.', dbname));
			duplicateError.number = errorCodes.DuplicateError;
			if (deferred) return deferred.reject(duplicateError);
			return callback(duplicateError);
		}
		createInternal.call(self, dbname, function(error, response, result) {
			if (error) {
				var serverError = new Error('Failed to create database. Inner: ' + error);
				serverError.number = errorCodes.ServerError;
				serverError.statusCode = response.statusCode;
				if (deferred) return deferred.reject(serverError);
				return callback(serverError);
			}

			if (deferred) return deferred.resolve();
			return callback();
		});
	});

	if (deferred) return deferred.promise;
};

DatabaseRequests.prototype.remove = function(dbname, callback) {
	var deferred = null;
	if (!_(dbname).isString()) throw new Error('Expected a valid database name.');
	if (!_(callback).isFunction()) deferred = Q.defer();

	var self = this;
	var path = '/docs/Raven/Databases/' + dbname;
	self.sendDelete(path, function(error, response) {
		if (error) {
			var serverError = new Error(format('Failed to remove database %s', dbname));
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

DatabaseRequests.prototype.ensureExists = function(dbname, callback) {
	var deferred = null;
	if (!_(dbname).isString()) throw new Error('Expected a valid database name.');
	if (!_(callback).isFunction()) deferred = Q.defer();

	var self = this;
	self.exists(dbname, function(error, result) {
		if (error) {
			var serverError = new Error('Failed to check if database exists. Inner: ' + error);
			serverError.number = errorCodes.ServerError;
			if (deferred) return deferred.reject(serverError);
			return callback(serverError);
		}
		if (result) {
			if (deferred) return deferred.resolve();
			return callback(undefined);
		}

		createInternal.call(self, dbname, function(error, response) {
			if (error) {
				var serverError = new Error('Failed to create the database. The database does not exist. Inner: ', error);
				serverError.number = errorCodes.ServerError;
				serverError.statusCode = response.statusCode;
				if (deferred) return deferred.reject(serverError);
				return callback(serverError);
			}

			if (deferred) return deferred.resolve();
			return callback(undefined);
		});

	});

	if (deferred) return deferred.promise;
};

