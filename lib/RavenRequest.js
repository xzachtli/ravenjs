var request = require('request'),
	format = require('util').format;
	_ = require('lodash');

var RavenRequest = module.exports = function(settings) {
	if (!_(settings).isObject()) throw new Error ('Expected a valid settings object.');
	this.settings = settings;
};

function buildUrl(path) {
	var url = this.settings.host;
	if (this.settings.database) url += '/databases/' + this.settings.database;
	if (path.indexOf('/') !== 0) url += '/';
	return url + path;
}

RavenRequest.prototype.authenticate = function (response, requestData, callback) {
	var self = this;
	var type = response.headers['www-authenticate'];
	var source = response.headers['oauth-source'];

	if (!type && !source) return callback(new Error('Unsupported authentication mode. Could not authenticate client'));
	if (!self.settings.apiKey && (!self.settings.username || !self.settings.password)) {
		return callback (new Error('Failed to authenticate request. No authentication user or apiKey provided'));
	}

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

	self.sendRequest({url: source, headers: authHeaders}, function(error, response, body) {
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

RavenRequest.prototype.sendGet = function (path, callback) {
	if (!_(path).isString()) throw new Error ('Expected a valid path string.');
	if (!_(callback).isFunction()) throw new Error ('Expected a valid callback function.');

	var self = this;
	var requestData = { url: buildUrl.call(self, path), method: 'GET' };
	self.sendRequest(requestData, function (error, response, data) {
		if (error) return callback (error, response);

		var results;
		
		if (data) {
			if (response.headers['content-type'] === 'application/json; charset=utf-8'){
				results = JSON.parse(data);
			} else {
				results = data;
			}
		}
		return callback(undefined, response, results);
	});
};

RavenRequest.prototype.sendPost = function(opts, callback) {
	if (!_(opts).isObject()) throw new Error ('Expected a valid request options object.');
	if (!_(opts.path).isString()) throw new Error ('Expected a valid path string.');
	if (!_(callback).isFunction()) throw new Error ('Expected a valid callback function.');
	if (opts.data && opts.buffer) throw new Error('Invalid operation. POST data cannot have both json data and buffer data specified. Pick one!');

	var self = this;
	var requestData = { url: buildUrl.call(self, opts.path), method: 'POST' };
	if (_(opts.data).isObject()) requestData.json = opts.data;
	if (opts.buffer) requestData.body = otps.stream;
	if (_(opts.headers).isObject()) requestData.headers = opts.headers;

	self.sendRequest(requestData, function (error, response, data) {
		if (error) return callback (error);
		if (response.statusCode !== 201) return callback (
			new Error (format('Error posting to %s. Host returned a %d response', opts.path, response.statusCode)), response);

		var results;
		if (data) results = JSON.parse(data);
		callback (undefined, response, results);
	});
};

RavenRequest.prototype.sendPut = function(opts, callback) {
	if (!_(opts).isObject()) throw new Error ('Expected a valid request options object.');
	if (!_(opts.path).isString()) throw new Error ('Expected a valid path string.');
	if (!_(callback).isFunction()) throw new Error ('Expected a valid callback function.');
	if (opts.data && opts.buffer) throw new Error('Invalid operation. PUT data cannot have both json data and buffer data specified. Pick one!');
	
	var self = this;
	var requestData = { url: buildUrl.call(self, opts.path), method: 'PUT'};
	if (_(opts.data).isObject()) requestData.json = opts.data;
	if (opts.buffer) requestData.body = opts.stream;
	if (_(opts.headers).isObject()) requestData.headers = opts.headers;


	self.sendRequest(requestData, function (error, response, data) {
		if (error) return callback (error);
		if (response.statusCode !== 201) return callback (
			new Error (format('Error posting to %s. Host returned a %d response', opts.path, response.statusCode)), response);

		var results;
		if (data) results = JSON.parse(data);
		callback (undefined, response, results);
	});
};

RavenRequest.prototype.sendDelete = function(path, callback) {
	if (!_(path).isString()) throw new Error ('Expected a valid path string.');
	if (!_(callback).isFunction()) throw new Error ('Expected a valid callback function.');

	var self = this;
	var requestData = { url: buildUrl.call(self, path), method: 'DELETE' };
	self.sendRequest(requestData, function(error, response, data) {
		if (error) return callback (error);
		if (response.statusCode !== 204) return callback (
			new Error (format('Error deleting %s. Host returned a %d response.', path, response.statusCode)), response);
		callback (undefined, response);
	});
};

