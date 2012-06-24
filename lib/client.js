var request = require('request'),
	_ = require('underscore');

//RavenClient class definition
var RavenClient = module.exports = function(settings) {
	var self = this;
	self.settings = {
		server: settings.server,
		database: settings.database,
		username: settings.username,
		password: settings.password,
		apiKey: settings.apiKey,
		keyFinder: settings.keyFinder,
		keyGenerator: settings.keyGenerator,
		authToken: undefined
	};
};

RavenClient.prototype.onAuthenticate = function(response, requestData, callback) {
	var self = this;
	var type = response.headers['www-authenticate'];
	var source = response.headers['oauth-source'];

	if (!type && !source) return callback(new Error('Unsupported authentication mode. Could not authenticate client'));
	if (!self.settings.apiKey && (!self.settings.username || !self.settings.password)) return callback(new Error('Failed to authenticate request. No authentication user or apiKey provided'));

	var authHeaders = {
		'grant_type': 'client_credentials',
		'accept': 'application/json;charset=UTF-8'
	};

	if (self.settings.user && self.settings.password) {
		authHeaders.authorization = 'Basic ' + new Buffer(self.settings.user + ':' + self.settings.password, 'ascii').toString('base64');
	}
	if (self.settings.apiKey) {
		authHeaders['Api-Key'] = self.settings.apiKey;
	}

	self.request({uri: source, headers: authHeaders}, function(error, response, body) {
		if (error || !body) return callback(new Error("Authentication error. " + error.message));
		self.settings.authToken = 'Bearer ' + body;
		self.request(requestData, function(error, response, body) {
			callback(error, response, body);
		});
	});
};

RavenClient.prototype.request = function(requestData, callback) {
	if (!requestData) throw new Error('Expected valid requestData object.');
	if (!callback) throw new Error('Expected valid callback.');

	var self = this;
	if (self.settings.authToken) requestData.headers.Authorization = authToken;
	if (requestData.json) {
		requestData.body = JSON.stringify(requestData.json);
		requestData.headers['content-type'] = 'application/json; charset=UTF-8';
		requestData.headers.accept = 'application/json';
	}

	request(requestData, function(error, response, body) {
		if (response && response.statsuCode == 401) {
			self.onAuthenticate(response, requestData, function(error, response, body) {
				return callback(error, response, body);
			});
		}

		return callback(error, response, body);
	});
};

RavenClient.prototype.get = function(key, fn) {

};
