var qs = require('querystring'),	
		_ = require('underscore');


var settings = {
		server: 'http://localhost:80'
};

exports.connectionString = function(connStr) {
	var self = this;
	if (!arguments.length) return settings.server;
	if (!_.isString(connStr)) throw new Error('Expected a valid raven connection string');

	var values = qs.parse(connStr, ';', '=');
	if (!values.Url) throw new Error('Required connection string property "Url" was not specified!');
	 
	self.server(values.Url);
	self.database(values.Database);
	self.username(values.UserName);
	self.password(values.Password);
	self.apiKey(values.ApiKey);
};
 
exports.server = function(server) {
	if (!arguments.length) return settings.server;
	if (!_.isString(server)) throw new Error('Expected a valid raven server name');
	console.log(server.indexOf('http://'));
	if (server.indexOf('http://') === -1 && server.indexOf('https://') === -1) throw new Error('Expected a server address with http:// or https://');
	settings.server = server;
};

exports.database = function(database) {
	if (!arguments.length) return settings.database;
	if (!database) {
		if (settings.database) delete settings.database;
		return;
	}

	if (!_.isString(database)) throw new Error('Expected a string for database name');
	settings.database = database;
};

exports.username = function(username) {
	if (!arguments.length) return settings.username;
	if (!username) {
		if (settings.username) delete settings.username;
		return;
	}

	if (!_.isString(username)) throw new Error('Expected a string for username');
	settings.username = username;
};

exports.password = function(password) {
	if (!arguments.length) return settings.password;
	if (!password) {
		if (settings.password) delete settings.password;
		return;
	}

	if (!_.isString(password)) throw new Error('Expected a string for password');
	settings.password = password;
};

exports.apiKey = function(apiKey) {
	if (!arguments.length) return settings.apiKey;
	if (!apiKey) {
		if(settings.apiKey) delete settings.apiKey;
		return;
	}

	if (!_.isString(apiKey)) throw new Error('Expected a string for apiKey');
	settings.apiKey = apiKey;
}
 
