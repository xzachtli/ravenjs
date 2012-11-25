var IndexRequests = require('../lib/IndexRequests'),
	nock = require('nock');

describe('IndexRequests', function() {

	describe('.create', function() {

		var request;
		beforeEach(function() {
			request = new IndexRequests('foo', { host: 'http://localhost:81' });
		});

		it('should throw when index name is undefined', function() {
			
			expect(function() {
				request.indexName = null;
				request.create();
			}).toThrow();

			expect(function() {
				request.indexName = undefined;
				request.create();
			});
		});

		it('should throw when map expression is not specified.', function() {
			request.indexName = 'foo';
			expect(function() {
				request.create(function() { });
			}).toThrow();
		});

		it('should create an index with map expression', function(done) {
			var ravendb = nock('http://localhost:81')
				.put('/indexes/foo', { map: 'foo' })
				.reply(201);

			request
				.map('foo')
				.create(function(error) {
					expect(error).not.toBeDefined();
					ravendb.done();
					done();
				});
		});

		if('should resolve promise and create an index with map expression', function(done) {
			var ravendb = nock('http://localhost:81')
				.put('/indexes/foo', { map: 'foo' })
				.reply(201);

			request
				.map('foo')
				.create()
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should create an index with map and reduce expression', function(done) {
			var ravendb = nock('http://localhost:81')
				.put('/indexes/foo', {map: 'foo', reduce: 'bar'})
				.reply(201);

			request
				.map('foo')
				.reduce('bar')
				.create(function(error) {
					expect(error).not.toBeDefined();
					ravendb.done();
					done();
				});
		});

		it('should resolve promise and create index with map and reduce expression.', function(done){
			var ravendb = nock('http://localhost:81')
				.put('/indexes/foo', {map: 'foo', reduce: 'bar'})
				.reply(201);

			request
				.map('foo')
				.reduce('bar')
				.create()
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});
	});

	describe('.remove', function() {

		var request;
		beforeEach(function() {
			request = new IndexRequests('foo', { host: 'http://localhost:81' });
		});

		it('should throw when index name is not specified.', function(){
			expect(function() {
				delete request.indexName;
				request.remove();
			}).toThrow();

			expect(function() {
				request.indexName = null;
				request.remove();
			}).toThrow();

			expect(function() {
				request.indexName = undefined;
				request.remove();
			}).toThrow();
		});

		it('should delete the specified index.', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/indexes/foo')
				.reply(204);

			request.remove(function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and delete the specified index', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/indexes/foo')
				.reply(204);

			request.remove()
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});
	});
});