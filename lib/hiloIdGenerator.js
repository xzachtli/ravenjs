var request = require('./ravenRequest'),
	url = require('url'),
	_ = require('underscore');

var HiLoIdGenerator = module.exports = function(settings) {
	if (!settings) throw new Error('Expected a valid settings object.');

	this.settings = settings;
	this.cachePath = '/Raven/HiLo';
	if (settings.database) this.cachePath = '/databases/' + settings.database + this.cachePath;
	if (settings.collection) this.cachePath += '_' + settings.collection;
};

function getCurrentMax(settings, path, callback) {
	var url = url.format({host: settings.server, pathname: path});
	request(settings, { url: url }, function(error, response, body) {
		if (error) return callback(error);
		if (response.statusCode === 404) return callback(undefined, undefined);
		return callback(undefined, JSON.parse(body));
	});
}

function setCurrentMax(settings, path, max, callback) {
	var url = url.format({host: settings.server, pathname: path});
	request(settings, { url: url, method: 'POST', json: max }, function(error, response, body) {
		if (error) return callback(error);
		if (response.statusCode !== 200) return callback(new Error('Failed to reserve current max range.'));
		callback(undefined);
	});
}

function updateCurrentMax(settings, path, max, callback) {
	var url = url.format({host: settings.server, pathname: path});
	request(settings, { url: url, method: 'PUT', json: max}, function(error, response, body) {
		if (error) return callback(error);
		if (response.statusCode !== 200) return callback(new Error('Failed to update current max range.'));
		callback(undefined);
	});
}

HiLoIdGenerator.prototype.cache = { };

HiLoIdGenerator.prototype.incrementRange = 100;

HiLoIdGenerator.prototype.nextId = function(callback) {
	if (!callback || !_(callback).isFunction) throw new Error('Exepected a valid callback function.');

	var self = this,
		cachedRange,
		nextId;

	if (!self.cache[self.cachePath]) self.cache[self.cachePath] = { maxRange: 0, currentId: 0};
	cachedRange = self.cache[self.cachePath];
	nextId = cachedRange.currentId + 1;
	if (nextId > cachedRange.maxRange) {
		
	} else {
		cachedRange.currentId = nextId;
		callback(undefined, nextId);
	}
};
