var RavenRequest = require('./RavenRequest'),
	_ = require('underscore');

var HiLoIdGenerator = module.exports = function(settings) {
	if (!settings) throw new Error('Expected a valid settings object.');

	this.settings = settings;
	this.hiloDocPath = '/docs/Raven/HiLo';
};

var cache = { };

HiLoIdGenerator.prototype.getCurrentMax = function (settings, path, callback) {
	var request = new RavenRequest(settings);
	request.sendGet(path, function(error, response, data) {
		if (error) return callback(error);
		if (response.statusCode == 404) return callback(undefined, undefined);
		return callback(undefined, data);
	});
};

HiLoIdGenerator.prototype.setCurrentMax = function (settings, path, max, callback) {
	var request = new RavenRequest(settings);
	var opts = {
		path: path,
		data: max
	};

	request.sendPut(opts, function(error, response, data) {
		if (error) return callback(error);
		callback(undefined);
	});
};

HiLoIdGenerator.prototype.cache = cache;

HiLoIdGenerator.prototype.incrementRange = 100;

HiLoIdGenerator.prototype.nextId = function(callback) {
	if (!callback || !_(callback).isFunction()) throw new Error('Exepected a valid callback function.');

	var self = this,
		nextId;

	if (!self.cache.maxRange || !self.cache.currentId) {
		self.cache.maxRange = 0;
		self.cache.currentId = 0;
	}

	nextId = self.cache.currentId + 1;
	if (nextId > self.cache.maxRange) {
		self.getCurrentMax(self.settings, self.hiloDocPath, function(error, max) {
			if (error) return callback(new Error('Unable to get next id for document. Failed to get current max HiLo from server. Inner ' + error));
			if (max) {
				//Found a hilo doc on the server. Update it...
				nextId = max.currentMax + 1;
				max.currentMax = max.currentMax + self.incrementRange;
				self.setCurrentMax(self.settings, self.hiloDocPath, max, function(error) {
					if (error) return callback(new Error('Unable to get next id for document. Failed to update max HiLo on the server. Inner ' + error));
					self.cache.currentId = nextId;
					self.cache.maxRange = max.currentMax;
					callback(undefined, self.cache.currentId);
				});
			}
			else {
				//No existing hilo doc on the server. Create it...
				max = { currentMax: self.cache.maxRange + self.incrementRange };
				self.setCurrentMax(self.settings, self.hiloDocPath, max, function(error) {
					if (error) return callback(new Error('Unable to get next id for document. Failed to set the max HiLo on the server. Inner ' + error));
					self.cache.maxRange = max.currentMax;
					self.cache.currentId = nextId;
					callback(undefined, self.cache.currentId);
				});
			}
		});
	} else {
		self.cache.currentId = nextId;
		callback(undefined, nextId);
	}
};
