var DocumentRequests = require('../lib/DocumentRequests'),
	errorCodes = require('../lib/errorCodes'),
	nock = require('nock');

describe('DocumentRequests', function() {

	var request;

	beforeEach(function() {
		request = new DocumentRequests({ host: 'http://localhost:81' });
	});

	describe('.get', function() {

		it('should throw when id is undefined', function() {
			expect(function() { request.get(); }).toThrow();
			expect(function() { request.get(null); }).toThrow();
			expect(function() { request.get(undefined); }).toThrow();
		});

		it('should get document from server.', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/foo')
				.reply(200, { foo: 'bar'}, { 'content-type': 'application/json; charset=utf-8' });

			request.get('foo', function(error, data) {
				expect(error).not.toBeDefined();
				expect(data).toBeDefined();
				expect(data['@metadata']['@id']).toBe('foo');
				ravendb.done();
				done();
			});
		});

		it('should get document from server and resolve promise', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/foo')
				.reply(200, { foo: 'bar'}, { 'content-type': 'application/json; charset=utf-8'});

			request.get('foo')
				.then(function(data) {
					expect(data).toBeDefined();
					expect(data['@metadata']['@id']).toBe('foo');
					return data;
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should return not found error if response code is 404', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/foo')
				.reply(404);

			request.get('foo', function(error, data) {
				expect(error).toBeDefined();
				expect(error.message).toBe('Specified document was not found.');
				expect(error.number).toBe(errorCodes.DocumentNotFound);
				ravendb.done();
				done();
			});
		});

		it ('should reject promise with not found error if response code is 404', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/foo')
				.reply(404);

			request.get('foo')
				.fail(function(error) {
					expect(error).toBeDefined();
					expect(error.message).toBe('Specified document was not found.');
					expect(error.number).toBe(errorCodes.DocumentNotFound);	
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should return server error if response code is not 200', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/foo')
				.reply(405);

			request.get('foo', function(error, data) {
				expect(error).toBeDefined();
				expect(error.number).toBe(errorCodes.ServerError);
				ravendb.done();
				done();
			});
		});

		it('should reject promise with server error if response code is not 200', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/foo')
				.reply(405);

			request.get('foo')
				.fail(function(error) {
					expect(error).toBeDefined();
					expect(error.number).toBe(errorCodes.ServerError);
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should return document with raven metadata', function(done) {
			var doc = { foo: 'bar' };
			var headers = {
				etag: '0000-000-001',
				'raven-entity-name': 'foos',
				'raven-clr-type': 'foos.bar',
				'content-type': 'application/json; charset=utf-8'
			};

			var ravendb = nock('http://localhost:81')
				.get('/docs/foo')
				.reply(200, doc, headers);

			request.get('foo', function(error, data) {
				expect(error).not.toBeDefined();
				expect(data).toBeDefined();
				expect(data['@metadata']['@id']).toBe('foo');
				expect(data['@metadata']['@etag']).toBe('0000-000-001');
				expect(data['@metadata']['Raven-Entity-Name']).toBe('foos');
				expect(data['@metadata']['Raven-Clr-Type']).toBe('foos.bar');
				ravendb.done();
				done();
			});
		});

		it('should resolve promise containing document with metadata', function(done) {
			var doc = { foo: 'bar' };
			var headers = {
				etag: '0000-000-001',
				'raven-entity-name': 'foos',
				'raven-clr-type': 'foos.bar',
				'content-type': 'application/json; charset=utf-8'
			};

			var ravendb = nock('http://localhost:81')
				.get('/docs/foo')
				.reply(200, doc, headers);

			request.get('foo')
				.then(function(doc) {
					expect(doc).toBeDefined();
					expect(doc['@metadata']['@id']).toBe('foo');
					expect(doc['@metadata']['@etag']).toBe(headers.etag);
					expect(doc['@metadata']['Raven-Entity-Name']).toBe(headers['raven-entity-name']);
					expect(doc['@metadata']['Raven-Clr-Type']).toBe(headers['raven-clr-type']);
				})
				.fail(function(error) {
					expect(doc).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				});
		});
	});

	describe('.save', function() {

		it('should throw when document is undefined.', function() {
			expect(function() { request.get(); }).toThrow();
			expect(function() { request.get(null); }).toThrow();
			expect(function() { request.get(undefined); }).toThrow();
		});

		it('should save using specified id.', function(done) {
			var doc = { foo: 'bar' };
			var ravendb = nock('http://localhost:81')
				.put('/docs/foo', doc)
				.reply(201, { ETag: '0000-000-0001', Key: '/docs/foo' });

			request.save('foo', doc, function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and save using specified id', function(done) {
			var doc = { foo : 'bar' };
			var ravendb = nock('http://localhost:81')
				.put('/docs/foo', doc)
				.reply(201, { ETag: '0000-000-0001', Key: '/docs/foo' });

			request.save('foo', doc)
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should save using id from default id finder', function(done) {
			request.settings.idFinder = function(doc) { return 'foo'; };
			var doc = { foo: 'bar' };
			var ravendb = nock('http://localhost:81')
				.put('/docs/foo', { foo: 'bar' })
				.reply(201, { ETag: '0000-000-001', Key: '/docs/foo' });

			request.save(doc, function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and save using id from default id finder', function(done) {
			request.settings.idFinder = function(doc) { return 'foo'; };
			var doc = { foo: 'bar' };
			var ravendb = nock('http://localhost:81')
				.put('/docs/foo', {foo: 'bar'})
				.reply(201, { ETag: '0000-000-0001', Key: '/docs/foo' });

			request.save(doc)
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should save using id from default id generator', function(done) {
			request.settings.idFinder = function(doc) { return undefined; };
			request.settings.idGenerator = function(doc, settings, callback) {
				callback(undefined, 101);
			};

			var doc = { foo: 'bar' };
			var ravendb = nock('http://localhost:81')
				.put('/docs/101', doc)
				.reply(201, { ETag: '0000-000-001', Key: '/docs/foo' });

			request.save(doc, function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and save using id from default id generator', function(done) {
			request.settings.idFinder = function(doc) { return undefined; };
			request.settings.idGenerator = function(doc, settings, cb) {
				cb(undefined, 101);
			};

			var doc = {foo : 'bar'};
			var ravendb = nock('http://localhost:81')
				.put('/docs/101', doc)
				.reply(201, { ETag: '0000-000-0001', Key: '/docs/foo'});

			request.save(doc)
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should update document id from response.', function(done) {
			var doc = { foo: 'bar', '@metadata': { } };
			doc['@metadata']['@id'] = 'foo';
			var ravendb = nock('http://localhost:81')
				.put('/docs/101', { foo: 'bar' })
				.reply(201, { ETag: '0000-000-001', Key: '/docs/baz' });

			request.save('101', doc, function(error) {
				expect(error).not.toBeDefined();
				expect(doc['@metadata']['@id']).toBe('/docs/baz');
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and update document id from response', function(done) {
			var doc = { foo: 'bar', '@metadata': { } };
			doc['@metadata']['@id'] = 'foo';
			var ravendb = nock('http://localhost:81')
				.put('/docs/101', {foo: 'bar'})
				.reply(201, {ETag: '0000-000-001', Key: '/docs/baz'});

			request.save('101', doc)
				.then(function() {
					expect(doc['@metadata']['@id']).toBe('/docs/baz');
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should update etag from response', function(done) {
			var doc = {
				foo: 'bar',
				'@metadata': {
					'@id': 'baz',
					'@etag': '0000-000-001'
				}};
			var ravendb = nock('http://localhost:81')
				.put('/docs/baz', { foo: 'bar' })
				.reply(201, { ETag: '0000-000-002', Key: '/docs/baz' });

			request.save('baz', doc, function(error) {
				expect(error).not.toBeDefined();
				expect(doc['@metadata']['@etag']).toBe('0000-000-002');
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and update etag from response', function(done) {
			var doc = {
				foo: 'bar',
				'@metadata': {
					'@id': 'baz',
					'@etag': '0000-000-001'
				}};
			var ravendb = nock('http://localhost:81')
				.put('/docs/baz', { foo: 'bar' })
				.reply(201, { ETag: '0000-000-002', Key: '/docs/baz' });

			request.save('baz', doc)
				.then(function() {
					expect(doc['@metadata']['@etag']).toBe('0000-000-002');
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should send etag header when optimistic concurrency is enabled', function(done) {
			request.settings.useOptimisticConcurrency = true;
			var doc = {
				foo: 'bar',
				'@metadata': {
					'@id': 'baz',
					'@etag': '0000-000-001'
				}};

			var ravendb = nock('http://localhost:81')
				.put('/docs/baz', { foo: 'bar' })
				.matchHeader('If-None-Match', '0000-000-001')
				.reply(201, { ETag: '0000-000-002', Key: '/docs/baz' });

			request.save('baz', doc, function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and send etag header when optimistic concurrency is enabled', function(done) {
			request.settings.useOptimisticConcurrency = true;
			var doc = {
				foo: 'bar',
				'@metadata': {
					'@id': 'baz',
					'@etag': '0000-000-001'
				}};

			var ravendb = nock('http://localhost:81')
				.put('/docs/baz', { foo: 'bar' })
				.matchHeader('If-None-Match', '0000-000-001')
				.reply(201, { ETag: '0000-000-002', Key: '/docs/baz' });

			request.save('baz', doc)
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should return concurrency error when optimistic concurrency is enabled and etag does not match', function(done) {
			request.settings.useOptimisticConcurrency = true;
			var doc = {
				foo: 'bar',
				'@metadata': {
					'@id': 'baz',
					'@etag': '0000-001-001'
				}};

			var ravendb = nock('http://localhost:81')
				.put('/docs/baz', { foo: 'bar' })
				.matchHeader('If-None-Match', '0000-001-001')
				.reply(409);

			request.save('baz', doc, function(error) {
				expect(error).toBeDefined();
				expect(error.number).toBe(errorCodes.VersionConflict);
				ravendb.done();
				done();
			});
		});

		it('should reject promise with concurrency error when optimistic concurrency is enabled and etag does not match', function(done) {
			request.settings.useOptimisticConcurrency = true;
			var doc = {
				foo: 'bar',
				'@metadata': {
					'@id': 'baz',
					'@etag': '0000-001-001'
				}};

			var ravendb = nock('http://localhost:81')
				.put('/docs/baz', { foo: 'bar' })
				.matchHeader('If-None-Match', '0000-001-001')
				.reply(409);

			request.save('baz', doc)
				.fail(function(error) {
					expect(error).toBeDefined();
					expect(error.number).toBe(errorCodes.VersionConflict);
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});
	});

	describe('.remove', function() {
		
		it('should throw if data is undefined', function() {
			expect(function() { request.remove(); }).toThrow();
			expect(function() { request.remove(null); }).toThrow();
			expect(function() { request.remove(undefined); }).toThrow();
		});

		it('should throw if id cannot be determined using id finder', function() {
			request.settings.idFinder = function(doc) { return undefined; };
			var test = function() {
				request.remove({ foo: 'bar'}, function(error) { });
			};
			expect(test).toThrow();
		});

		it('should delete document using specified id', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/docs/foo')
				.reply(204);

			request.remove('foo', function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and delete document using specified id', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/docs/foo')
				.reply(204);

			request.remove('foo')
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});	

		it('should delete document using id returned by id finder', function(done) {
			request.settings.idFinder = function(doc) { return 'foo'; };
			var ravendb = nock('http://localhost:81')
				.delete('/docs/foo')
				.reply(204);

			request.remove({ }, function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and delete document using id returned by id finder', function(done) {
			request.settings.idFinder = function(doc) { return 'foo'; };
			var ravendb = nock('http://localhost:81')
				.delete('/docs/foo')
				.reply(204);

			request.remove({ })
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should return error when deleting document failed.', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/docs/foo')
				.reply(500);

			request.remove('foo', function(error) {
				expect(error).toBeDefined();
				expect(error.number).toBe(errorCodes.ServerError);
				expect(error.statusCode).toBe(500);
				ravendb.done();
				done();
			})
		});

		it('should reject promise when deleting document failed.', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/docs/foo')
				.reply(500);

			request.remove('foo')
				.fail(function(error) {
					expect(error).toBeDefined();
					expect(error.number).toBe(errorCodes.ServerError);
					expect(error.statusCode).toBe(500);
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});
	});
});