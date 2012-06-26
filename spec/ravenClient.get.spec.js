var RavenClient = require('../lib/ravenClient'),
	nock = require('nock');

describe('raven.get', function() {

	var client;

	beforeEach(function() {
		client = new RavenClient({server: 'http://localhost:80'});
	});

	it('should return error when request fails', function(done) {

		var ravendb = nock('http://localhost:80')
			.get('/docs/foo')
			.reply(404);

		client.get('/docs/foo', function(error, data) {
			expect(error).not.toBeNull();
			done();
		});
	});

	it ('should return error when body is empty', function(done) {
		var ravendb = nock('http://localhost:80')
			.get('/docs/foo')
			.reply(200);

		client.get('/docs/foo', function(error, data) {
			expect(error).not.toBeNull();
			done();
		});
	});


	it('should return json data', function(done) {

		var ravendb = nock('http://localhost:80')
			.get('/docs/foo')
			.reply(200, { foo: 'bar'});

		client.get('/docs/foo', function(error, data) {
			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data.foo).toBeDefined();
			done();
		});
	});

	it ('should get from specified database', function(done) {

		var ravendb = nock('http://localhost:80')
			.get('/databases/bar/docs/foo')
			.reply(200, {foo: 'bar'});

		client.settings.database = 'bar';
		client.get('/docs/foo', function(error, data) {
			expect(error).toBeNull();
			expect(data).not.toBeNull();
			done();
		});
	});

	it ('should return document raven metadata', function(done) {

		var metadata = { };
		metadata['etag'] = '00000-0000-000-0001';
		metadata['raven-entity-name'] = 'FooBar';
		metadata['raven-clr-type'] = 'Foo.Bar.Baz';

		var ravendb = nock('http://localhost:80')
			.defaultReplyHeaders(metadata)
			.get('/docs/foo')
			.reply(200, {foo: 'bar'});

		client.get('/docs/foo', function(error, data) {
			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data.__raven__).toBeDefined();
			expect(data.__raven__.id).toBe('/docs/foo');
			expect(data.__raven__.etag).toBe('00000-0000-000-0001');
			expect(data.__raven__.entityName).toBe('FooBar');
			expect(data.__raven__.clrType).toBe('Foo.Bar.Baz');
			done();
		});
	});
});