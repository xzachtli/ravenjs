var request = require('request'),
	utils = require('./utils.js');

var RavenRequest = module.exports = function(settings) {
	if (!utils.isObject(settings)) throw new Error ('Expected a valid settings object.');
	this.settings = settings;
};

RavenRequest.prototype.authenticate = function(response, requestData, callback) {
	var self = this;
	var type = response.headers['www-authenticate'];
	var source = response.headers['oauth-source'];

	if (!type && !source) return callback(new Error('Unsupported authentication mode. Could not authenticate client'));
	if (!self.settings.apiKey && (!self.settings.username || !self.settings.password)) {
		return callback (new Error('Failed to authenticate request. No authentication user or apiKey provided'))
	};

	var authHeaders = {
		'grant_type': 'client_credentials',
		'accept': 'application/json; charset=UTF-8'
	};

	if (self.settings.username && self.settings.password) {
		authHeaders.authorization = 'Basic ' + new Buffer(self.settings.username + ':' + self.settings.password, 'ascii').toString('base64');
	}

	if (self.settings.apiKey) {
		authHeaders['Api-Key'] = self.settings.apiKey;
	}

	self.sendRequest ({url: source, headers: authHeaders}, function(error, response, body) {
		if (error || !body) return callback(new Error("Authentication error."));

		self.settings.authToken = 'Bearer ' + body;
		self.sendRequest (requestData, function(error, response, body) {
			callback(error, response, body);
		});
	});
};

RavenRequest.prototype.sendRequest = function (requestData, callback) {
	var self = this;
	if (!requestData) throw new Error('Expected valid requestData object.');
	if (!callback) throw new Error('Expected valid callback.');

	requestData.headers = requestData.headers || { };
	if (self.settings.authToken) {
		requestData.headers.Authorization = self.settings.authToken;
	}
	if (requestData.json) {
		requestData.body = JSON.stringify(requestData.json);
		delete requestData.json;
		requestData.headers['content-type'] = 'application/json; charset=UTF-8';
		requestData.headers.accept = 'application/json';
	}

	if (self.settings.proxy) requestData.proxy = self.settings.proxy;

	request (requestData, function(error, response, body) {
		if (response && response.statusCode == 401) {
			self.authenticate (response, requestData, function(error, response, body) {
				return callback(error, response, body);
			});
		}
		else {
			return callback (error, response, body);
		}
	});
};

RavenRequest.prototype.get = function (path, callback) {
	if (!utils.isString(path)) throw new Error ('Expected a valid path string.');
	if (!utils.isFunction(callback)) throw new Error ('Expected a valid callback function.');

	var url = this.settings.host;
	if (this.settings.database) url += '/databases/' + this.settings.database;
	if (path.indexOf('/') !== 0) url += '/';
	url += path;

	var requestData = { url: url, method: 'GET' };
	this.sendRequest (this, requestData, function (error, response, data) {
		if (error) callback (error);
		if (response.statusCode !== 200) callback (new Error (utils.format('Error getting %s. Host returned a %d response', path, response.statusCode)));
		if (!data) callback (new Error (utils.format('Error getting %s. No data returned.', path)));

		callback (undefined, response, JSON.parse(data));
	});
};

RavenRequest.prototype.post = function(opts, callback) {
	if (!utils.isObject(opts)) throw new Error ('Expected a valid request options object.');
	if (!utils.isString(opts.path)) throw new Error ('Expected a valid path string.');
	if (!utils.isFunction(callback)) throw new Error ('Expected a valid callback function.');

	var requestData = { url: this.buildUrl(opts.path), method: 'POST' };
	if (utils.isObject(opts.data)) requestData.json = data;
	if (utils.isObject(opts.headers)) requestData.headers = opts.headers;

	this.sendRequest (this, requestData, function (error, response, data) {
		if (error) callback (error);
		if (response.statusCode !== 201) callback (new Error (utils.format('Error posting to %s. Host returned a %d response', path, response.statusCode)));

		var postResponse;
		if (data) postResponse = JSON.parse(data);
		callback (undefined, response, poseResponse);
	});
};

RavenRequest.prototype.put = function(opts, callback) {
	if (!utils.isObject(opts)) throw new Error ('Expected a valid request options object.');
	if (!utils.isString(opts.path)) throw new Error ('Expected a valid path string.');
	if (!utils.isFunction(callback)) throw new Error ('Expected a valid callback function.');
	
	var requestData = { url: this.buildUrl(opts.path), method: 'PUT'};
	if (utils.isObject(opts.data)) requestData.json = data;
	if (utils.isObject(opts.headers)) requestData.headers = opts.headers;

	this.sendRequest (this, requestData, function (error, response, data) {
		if (error) callback (error);
		if (response.statusCode !== 201) callback (new Error (utils.format('Error posting to %s. Host returned a %d response', path, response.statusCode)));

		var putResponse;
		if (data) putResponse = JSON.parse(data);
		callback (undefined, response, putResponse);
	});
};

RavenRequest.prototype.del = function(path, callback) {
	if (!utils.isString(path)) throw new Error ('Expected a valid path string.');
	if (!utils.isFunction(callback)) throw new Error ('Expected a valid callback function.');

	var requestData = { url: this.buildUrl(path), method: 'DELETE' };
	this.sendRequest (this, requestData, function(error, response, data) {
		if (error) callback (error);
		if (response.statusCode != 204) callback (new Error (utils.format('Error deleting %s. Host returned a %d response.', path, response.statusCode)));

		var deleteResponse;
		if (data) deleteResponse = JSON.parse(data);
		callback (undefined, response, deleteResponse);
	});
};

