//TODO: Remove @metadat and add optimistic concurrency functionality

var request = require('request');

function onAuthenticate (settings, response, requestData, callback) {
	var type = response.headers['www-authenticate'];
	var source = response.headers['oauth-source'];

	if (!type && !source) return callback(new Error('Unsupported authentication mode. Could not authenticate client'));
	if (!settings.apiKey && (!settings.username || !settings.password)) return callback(new Error('Failed to authenticate request. No authentication user or apiKey provided'));

	var authHeaders = {
		'grant_type': 'client_credentials',
		'accept': 'application/json; charset=UTF-8'
	};

	if (settings.username && settings.password) {
		authHeaders.authorization = 'Basic ' + new Buffer(settings.username + ':' + settings.password, 'ascii').toString('base64');
	}
	if (settings.apiKey) {
		authHeaders['Api-Key'] = settings.apiKey;
	}

	makeRequest(settings, {url: source, headers: authHeaders}, function(error, response, body) {
		if (error || !body) return callback(new Error("Authentication error."));

		settings.authToken = 'Bearer ' + body;
		makeRequest(settings, requestData, function(error, response, body) {
			callback(error, response, body);
		});
	});
}

function makeRequest(settings, requestData, callback) {
	if (!settings) throw new Error('Expected valid settings object.');
	if (!requestData) throw new Error('Expected valid requestData object.');
	if (!callback) throw new Error('Expected valid callback.');

	requestData.headers = requestData.headers || { };
	if (settings.authToken) {
		requestData.headers.Authorization = settings.authToken;
	}
	if (requestData.json) {
		requestData.body = JSON.stringify(requestData.json);
		delete requestData.json;
		requestData.headers['content-type'] = 'application/json; charset=UTF-8';
		requestData.headers.accept = 'application/json';
	}
	requestData.proxy = "http://127.0.0.1:8888";
	request(requestData, function(error, response, body) {
		if (response && response.statusCode == 401) {
			onAuthenticate(settings, response, requestData, function(error, response, body) {
				return callback(error, response, body);
			});
		}
		else {
			return callback(error, response, body);
		}
	});
}


module.exports = makeRequest;