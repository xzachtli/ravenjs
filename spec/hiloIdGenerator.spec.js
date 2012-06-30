var HiLoIdGenerator = require('../lib/hiloIdGenerator');

describe('HiLoGenerator', function() {

	it('should throw when created with null settings', function() {
		expect(function() { new HiLoIdGenerator(); }).toThrow();
	});

	describe('nextId', function() {

		it('should throw when callback is null', function() {
			var generator = new HiLoIdGenerator({ server: 'http://localhost:80' });
			expect(function() { generator.nextId(); }).toThrow();
		});

		it('should get next id for collection', function(done) {
			var generator = new HiLoIdGenerator( {server: 'http://localhost:81', collection: 'foobar' });
			generator.cache['/docs/Raven/HiLo_foobar'] = { maxRange: 100, currentId: 1 };
			generator.nextId(function(error, id) {
				expect(error).not.toBeDefined();
				expect(id).toBe(2);
				expect(generator.cache['/docs/Raven/HiLo_foobar'].currentId).toBe(2);

				done();
			});
		});

		it ('should get next id for database', function(done) {
			var generator = new HiLoIdGenerator( {server: 'http://localhost:81', database: 'foobar'});
			generator.cache['/databases/foobar/docs/Raven/HiLo'] = { maxRange: 100, currentId: 1};
			generator.nextId(function(error, id) {
				expect(error).not.toBeDefined();
				expect(id).toBe(2);
				expect(generator.cache['/databases/foobar/docs/Raven/HiLo'].currentId).toBe(2);
				done();
			});
		});

		it('should get next id for database and collection', function(done) {
			var generator = new HiLoIdGenerator({
				server: 'http://localhost:81',
				database: 'foobar',
				collection: 'baz'
			});

			generator.cache['/databases/foobar/docs/Raven/HiLo_baz'] = { maxRange: 100, currentId: 1};
			generator.nextId(function(error, id) {
				expect(error).not.toBeDefined();
				expect(id).toBe(2);
				expect(generator.cache['/databases/foobar/docs/Raven/HiLo_baz'].currentId).toBe(2);
				done();
			});
		});

		describe('when next id exceeds current max range', function() {

			var generator;
			var cachedRange;
			beforeEach(function() {
				generator = new HiLoIdGenerator({ server: 'http://localhost' });
				cachedRange = { maxRange: 100, currentId: 100 };
				generator.cache['/docs/Raven/HiLo'] = cachedRange;
			});

			it('should return error when getting current hilo range fails', function(done) {
				spyOn(HiLoIdGenerator.prototype, 'getCurrentMax')
					.andCallFake(function(settings, path, callback) { callback(new Error('Failed')); });

				generator.nextId(function(error, id) {
					expect(error).toBeDefined();
					expect(id).not.toBeDefined();
					done();
				});
			});

			describe('and hilo range exists on server', function() {

				it ('should increment range and return next id', function(done) {
					var currentMax = { currentMax: 100 };

					spyOn(HiLoIdGenerator.prototype, 'getCurrentMax')
						.andCallFake(function(settings, path, callback) {
							callback (undefined, currentMax);
						});

					spyOn(HiLoIdGenerator.prototype, 'updateCurrentMax')
						.andCallFake(function(settings, path, max, callback) {
							callback(undefined);
						});

					generator.nextId(function(error, id) {
						expect(error).not.toBeDefined();
						expect(currentMax.currentMax).toBe(200);
						expect(id).toBe(101);
						expect(cachedRange.currentId).toBe(101);
						expect(cachedRange.maxRange).toBe(200);
						expect(generator.getCurrentMax).toHaveBeenCalled();
						expect(generator.updateCurrentMax).toHaveBeenCalled();
						done();
					});
				});

				it('should return error if range cannot be updated', function(done) {

					var currentMax = { currentMax: 100 };
					spyOn(HiLoIdGenerator.prototype, 'getCurrentMax')
						.andCallFake(function(settings, path, callback) {
							callback (undefined, currentMax);
						});

					spyOn(HiLoIdGenerator.prototype, 'updateCurrentMax')
						.andCallFake(function(settings, path, max, callback) {
							callback(new Error('Failed'));
						});

					generator.nextId(function(error, id) {
						expect(error).toBeDefined();
						expect(id).not.toBeDefined();
						expect(cachedRange.maxRange).toBe(100);
						expect(cachedRange.currentId).toBe(100);
						expect(generator.getCurrentMax).toHaveBeenCalled();
						expect(generator.updateCurrentMax).toHaveBeenCalled();
						done();
					});
				});
			});

			describe('and hilo range does not exist on server.', function() {

				it('should set new range and get next id', function(done) {
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
						expect(cachedRange.maxRange).toBe(200);
						expect(cachedRange.currentId).toBe(101);
						expect(generator.getCurrentMax).toHaveBeenCalled();
						expect(generator.setCurrentMax).toHaveBeenCalled();
						done();
					});
				});

				it('should return error if range cannot be set', function(done) {
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
						expect(cachedRange.maxRange).toBe(100);
						expect(cachedRange.currentId).toBe(100);
						expect(generator.getCurrentMax).toHaveBeenCalled();
						expect(generator.setCurrentMax).toHaveBeenCalled();
						done();
					});
				});
			});
		});

		describe('when next id is within current max range', function() {

			it('should return next id from range.', function(done) {
				var generator = new HiLoIdGenerator( {server: 'http://localhost:81' });
				generator.cache['/docs/Raven/HiLo'] = { maxRange: 100, currentId: 1};
				generator.nextId(function(error, id) {
					expect(error).not.toBeDefined();
					expect(id).toBe(2);
					expect(generator.cache['/docs/Raven/HiLo'].currentId).toBe(2);
					done();
				});
			});

			it('subsequent calls should increment id', function(done) {
				var generator = new HiLoIdGenerator( {server: 'http://localhost:81' });
				generator.cache['/docs/Raven/HiLo'] = {maxRange: 100, currentId: 1};
				generator.nextId(function(error, id) {
					generator.nextId(function(error, id) {
						expect(id).toBe(3);
						expect(generator.cache['/docs/Raven/HiLo'].currentId).toBe(3);
						done();
					});
				});
			});
		});
	});
});