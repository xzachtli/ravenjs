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
		keyGenerator: settings.keyGenerator
	};
};

RavenClient.prototype = {
	get: function(key) {

	}
};
