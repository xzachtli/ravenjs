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

		describe('when range is cached', function() {

			it('should return next id from range.', function(done) {
				var generator = new HiLoIdGenerator( {server: 'http://localhost:81' });
				generator.cache['/Raven/HiLo'] = { maxRange: 100, currentId: 1};
				generator.nextId(function(error, id) {
					expect(error).not.toBeDefined();
					expect(id).toBe(2);
					expect(generator.cache['/Raven/HiLo'].currentId).toBe(2);
					done();
				});
			});

			it('subsequent calls should increment id', function(done) {
				var generator = new HiLoIdGenerator( {server: 'http://localhost:81' });
				generator.cache['/Raven/HiLo'] = {maxRange: 100, currentId: 1};
				generator.nextId(function(error, id) {
					generator.nextId(function(error, id) {
						expect(id).toBe(3);
						expect(generator.cache['/Raven/HiLo'].currentId).toBe(3);
						done();
					});
				});
			});

			it('should get next id for collection', function(done) {
				var generator = new HiLoIdGenerator( {server: 'http://localhost:81', collection: 'foobar' });
				generator.cache['/Raven/HiLo_foobar'] = { maxRange: 100, currentId: 1 };
				generator.nextId(function(error, id) {
					expect(error).not.toBeDefined();
					expect(id).toBe(2);
					expect(generator.cache['/Raven/HiLo_foobar'].currentId).toBe(2);
					done();
				});
			});

			it ('should get next id for database', function(done) {
				var generator = new HiLoIdGenerator( {server: 'http://localhost:81', database: 'foobar'});
				generator.cache['/databases/foobar/Raven/HiLo'] = { maxRange: 100, currentId: 1};
				generator.nextId(function(error, id) {
					expect(error).not.toBeDefined();
					expect(id).toBe(2);
					expect(generator.cache['/databases/foobar/Raven/HiLo'].currentId).toBe(2);
					done();
				});
			});

			it('should get next id for database and collection', function(done) {
				var generator = new HiLoIdGenerator({
					server: 'http://localhost:81',
					database: 'foobar',
					collection: 'baz'
				});

				generator.cache['/databases/foobar/Raven/HiLo_baz'] = { maxRange: 100, currentId: 1};
				generator.nextId(function(error, id) {
					expect(error).not.toBeDefined();
					expect(id).toBe(2);
					expect(generator.cache['/databases/foobar/Raven/HiLo_baz'].currentId).toBe(2);
					done();
				});
			});
		});

		describe('does not have cached range', function() {

		});

		describe('when reached max range', function() {

		});
	});
});