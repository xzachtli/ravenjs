var HiLoIdGenerator = require('../lib/HiLoIdGenerator'),
	RavenRequest = require('../lib/RavenRequest');

describe('HiLoIdGenerator', function() {
	var generator;
	beforeEach(function() {
		generator = new HiLoIdGenerator( {host: 'http://localhost:81 '});
		generator.cache = { }; //Reset the cache before each test run.
	});

	describe('when hilo range is not defined', function() {

		it('should create a new range when range does not exist on server.', function(done) {
			spyOn(HiLoIdGenerator.prototype, 'getCurrentMax')
				.andCallFake(function(settings, path, callback) {
					callback(undefined, undefined);
				});

			spyOn(HiLoIdGenerator.prototype, 'setCurrentMax')
				.andCallFake(function(settings, path, max, callback) {
					callback(undefined);
				});

			generator.nextId(function(error, id){
				expect(id).toBe(1);
				expect(generator.cache.maxRange).toBe(100);
				expect(generator.cache.currentId).toBe(1);
				expect(generator.getCurrentMax).toHaveBeenCalled();
				expect(generator.setCurrentMax).toHaveBeenCalled();
				done();
			});
		});

		it('should increment range on server when range exists on server.', function(done) {
			var currentMax = { currentMax: 100 };

			spyOn(HiLoIdGenerator.prototype, 'getCurrentMax')
				.andCallFake(function(settings, path, callback) {
					callback(undefined, currentMax);
				});

			spyOn(HiLoIdGenerator.prototype, 'setCurrentMax')
				.andCallFake(function(settings, path, max, callback) {
					callback(undefined);
				});

			generator.nextId(function(error, id) {
				expect(error).not.toBeDefined();
				expect(id).toBe(101);
				expect(currentMax.currentMax).toBe(200);
				expect(generator.cache.currentId).toBe(101);
				expect(generator.cache.maxRange).toBe(200);
				expect(generator.getCurrentMax).toHaveBeenCalled();
				expect(generator.setCurrentMax).toHaveBeenCalled();
				done();
			});
		});
	});

	describe('when next id is within current max range', function() {
		beforeEach(function() {
			generator.cache.currentId = 1;
			generator.cache.maxRange = 100;
		});

		it('should return next id from range.', function(done) {
			generator.nextId(function(error, id) {
				expect(error).not.toBeDefined();
				expect(id).toBe(2);
				expect(generator.cache.currentId).toBe(2);
				done();
			});
		});

		it('subsequent calls should increment id', function(done) {
			generator.nextId(function(error, id) {
				expect(error).not.toBeDefined();
				generator.nextId(function(error, id) {
					expect(id).toBe(3);
					expect(generator.cache.currentId).toBe(3);
					done();
				});
			});
		});
	});

	describe('when next id exceeds current max range', function() {

		beforeEach(function() {
			generator.cache.currentId = 100;
			generator.cache.maxRange = 100;
		});

		it ('should increment range and return next id', function(done) {
			var currentMax = { currentMax: 100 };
			spyOn(HiLoIdGenerator.prototype, 'getCurrentMax')
				.andCallFake(function(settings, path, callback) {
					callback (undefined, currentMax);
				});

			spyOn(HiLoIdGenerator.prototype, 'setCurrentMax')
				.andCallFake(function(settings, path, max, callback) {
					callback(undefined);
				});

			generator.nextId(function(error, id) {
				expect(error).not.toBeDefined();
				expect(currentMax.currentMax).toBe(200);
				expect(id).toBe(101);
				expect(generator.cache.currentId).toBe(101);
				expect(generator.cache.maxRange).toBe(200);
				expect(generator.getCurrentMax).toHaveBeenCalled();
				expect(generator.setCurrentMax).toHaveBeenCalled();
				done();
			});
		});

		it('should set new range when range does not exist on the server', function(done) {
			spyOn(HiLoIdGenerator.prototype, 'getCurrentMax')
				.andCallFake(function(settings, path, callback) {
					callback(undefined, undefined);
				});

			spyOn(HiLoIdGenerator.prototype, 'setCurrentMax')
				.andCallFake(function(setings, path, max, callback) {
					callback(undefined);
				});

			generator.nextId(function(error, id) {
				expect(error).not.toBeDefined();
				expect(id).toBe(101);
				expect(generator.cache.maxRange).toBe(200);
				expect(generator.cache.currentId).toBe(101);
				expect(generator.getCurrentMax).toHaveBeenCalled();
				expect(generator.setCurrentMax).toHaveBeenCalled();
				done();
			});
		});

		it('should return error if new range cannot be set', function(done) {
			spyOn(HiLoIdGenerator.prototype, 'getCurrentMax')
				.andCallFake(function(settings, path, callback) {
					callback(undefined, undefined);
				});

			spyOn(HiLoIdGenerator.prototype, 'setCurrentMax')
				.andCallFake(function(setings, path, max, callback) {
					callback(new Error('Failed'));
				});

			generator.nextId(function(error, id) {
				expect(error).toBeDefined();
				expect(id).not.toBeDefined();
				expect(generator.cache.maxRange).toBe(100);
				expect(generator.cache.currentId).toBe(100);
				expect(generator.getCurrentMax).toHaveBeenCalled();
				expect(generator.setCurrentMax).toHaveBeenCalled();
				done();
			});
		});
	});
});