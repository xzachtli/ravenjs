var request = require('./ravenRequest'),
	util = require('util');
	_ = require('underscore');

var HiLoIdGenerator = module.exports = function(settings) {
	if (!settings) throw new Error('Expected a valid settings object.');

	this.settings = settings;
	this.cachePath = '/docs/Raven/HiLo';
	if (settings.database) this.cachePath = '/databases/' + settings.database + this.cachePath;
	if (settings.collection) this.cachePath += '_' + settings.collection;
};

HiLoIdGenerator.prototype.getCurrentMax = function (settings, path, callback) {
	var url = settings.server + path;
	request(settings, { url: url }, function(error, response, body) {
		if (error) return callback(error);
		if (response.statusCode === 404) return callback(undefined, undefined);
		return callback(undefined, JSON.parse(body));
	});
};

HiLoIdGenerator.prototype.setCurrentMax = function (settings, path, max, callback) {
	var url = settings.server + path;
	request(settings, { url: url, method: 'PUT', json: max }, function(error, response, body) {
		if (error) return callback(error);
		if (response.statusCode !== 201) return callback(new Error('Failed to reserve current max range.'));
		callback(undefined);
	});
};

HiLoIdGenerator.prototype.updateCurrentMax = function (settings, path, max, callback) {
	var url = settings.server + path;
	request(settings, { url: url, method: 'PUT', json: max}, function(error, response, body) {
		if (error) return callback(error);
		if (response.statusCode !== 201) return callback(new Error('Failed to update current max range.'));
		callback(undefined);
	});
};

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
		self.getCurrentMax(self.settings, self.cachePath, function(error, max) {
			if (error) return callback(new Error('Unable to get next id for document. Failed to get current max HiLo from server. Inner ' + error));
			if (max) {
				console.log('Found a hilo doc on the server. Update it...');
				max.currentMax = max.currentMax + self.incrementRange;
				self.updateCurrentMax(self.settings, self.cachePath, max, function(error) {
					if (error) return callback(new Error('Unable to get next id for document. Failed to update max HiLo on the server. Inner ' + error));
					cachedRange.currentId = cachedRange.maxRange + 1;
					cachedRange.maxRange = max.currentMax;
					callback(undefined, cachedRange.currentId);
				});
			}
			else {
				//No existing hilo doc on the server. Create it...
				max = { currentMax: cachedRange.maxRange + self.incrementRange };
				self.setCurrentMax(self.settings, self.cachePath, max, function(error) {
					if (error) return callback(new Error('Unable to get next id for document. Failed to set the max HiLo on the server. Inner ' + error));
					cachedRange.maxRange = max.currentMax;
					cachedRange.currentId = nextId;
					callback(undefined, cachedRange.currentId);
				});
			}
		});
	} else {
		cachedRange.currentId = nextId;
		callback(undefined, nextId);
	}
};
