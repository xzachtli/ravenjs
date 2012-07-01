var qs = require('querystring'),
	_ = require('underscore'),
	RavenClient = require('./lib/ravenClient'),
	HiLoIdGenerator = require('./lib/hiloIdGenerator');


var settings = {
		server: 'http://localhost:80',
		idFinder: defaultIdFinder,
		idGenerator: defaultIdGenerator,
		useOptimisticConcurrency: false
};

function defaultIdFinder(doc) {
	if (!doc) return undefined;
	if (doc['@id']) return doc['@id'];
	if (doc.hasOwnProperty('id')) return doc.id;
	if (doc.hasOwnProperty('Id')) return doc.Id;
}

function defaultIdGenerator(settings, callback) {
	
	if (!settings) throw Error('Expected a valid setings object.');
	if (!settings.server) throw Error('Invalid settings. Expected server property.');
	if (!callback || !_(callback).isFunction) throw Error('Exepected a valid callback function.');

	var generator = new HiLoIdGenerator(settings);
	generator.nextId(function(error, id) {
		if (error) return callback(error);
		return callback(undefined, id.toString());
	});
}

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
	if (!~server.indexOf('http://') && !~server.indexOf('https://')) throw new Error('Expected a server address with http:// or https://');
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
};

exports.idFinder = function(fn) {
	if (!fn) return settings.idFinder = defaultidFinder;
	if (!_(fn).isFunction()) throw new Error('Expected a valid function to use as the default key finder.');
	settings.idFinder = fn;
};

exports.idGenerator = function(fn) {
	if (!fn) return settings.idGenerator = defaultIdGenerator;
	if (!_(fn).isFunction()) throw new Error('Expected a valid function to use as the default key generator.');
	settings.idGenerator = fn;
};

exports.useOptimisticConcurrency= function(val) {
	if (!val) return settings.useOptimisticConcurrency;
	if (!_(val).isBoolean()) throw new Error('Expected a boolean value when setting useOptimisticConcurrency');
	settings.useOptimisticConcurrency = val;
};

exports.proxy = function(val) {
	if(!val) return settings.proxy;
	if (!_.isString(val)) throw new Error('Expected a valid proxy server address.');
	if (!~val.indexOf('http://') && !~val.indexOf('https://')) throw new Error("Invaid proxy address scheme. Expected http or https scheme.");
	settings.proxy = val;
};

exports.configure = function(env, fn) {
	if (_(env).isFunction()) {
		fn = env;
		env = 'all';
	}

	var currentEnv = process.env.NODE_ENV || 'development';
	if ('all' === env || ~env.indexOf(currentEnv)) fn.call(this);
};

//exposing default key finder and generator.
exports.defaultIdFinder = defaultIdFinder;

exports.defaultIdGenerator = defaultIdGenerator;

exports.connect = function(options) {
	if (!arguments.length) return new RavenClient(settings);
	return new RavenClient({
		server: options.server || settings.server,
		database: options.database || settings.database,
		username: options.username || settings.username,
		password: options.password || settings.password,
		apiKey: options.apiKey || settings.apiKey,
		idFinder: options.idFinder || settings.idFinder,
		idGenerator: options.idGenerator || settings.idGenerator,
		useOptimisticConcurrency: options.useOptimisticConcurrency || settings.useOptimisticConcurrency
	});
};