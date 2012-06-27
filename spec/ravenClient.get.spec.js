var RavenClient = require('../lib/ravenClient'),
	nock = require('nock');

describe('RavenClient.get', function() {

	var client;
 
	beforeEach(function() {
		client = new RavenClient({server: 'http://localhost:80'}); 
	});

	it('should throw if id is null', function() {
		expect(function() { client.get(); }).toThrow();
	});

	it('should throw if id contains invalid paths', function() {
		expect(function() { client.get( '/foo/bar', function() { }); }).toThrow();
	});

	it('should throw if callback function is null', function() {
		expect(function() { client.get('foo'); }).toThrow();
	});
 
	it('should return error when request fails', function(done) {

		var ravendb = nock('http://localhost:80')
			.get('/docs/foo')
			.reply(404);

		client.get('foo', function(error, data) {
			expect(error).not.toBeNull();
			done();
		});
	});

	it ('should return error when body is empty', function(done) {
		var ravendb = nock('http://localhost:80')
			.get('/docs/foo')
			.reply(200);

		client.get('foo', function(error, data) {
			expect(error).not.toBeNull();
			done(); 
		});
	});


	it('should return json data', function(done) {

		var ravendb = nock('http://localhost:80')
			.get('/docs/foo')
			.reply(200, { foo: 'bar'});

		client.get('foo', function(error, data) {
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
		client.get('foo', function(error, data) {
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

		client.get('foo', function(error, data) {
			expect(error).toBeNull();
			expect(data).not.toBeNull(); 
			expect(data['@id']).toBe('foo');
			expect(data['@metadata']).toBeDefined();
			expect(data['@metadata'].ETag).toBe('00000-0000-000-0001');
			expect(data['@metadata']['Raven-Entity-Name']).toBe('FooBar');
			expect(data['@metadata']['Raven-Clr-Type']).toBe('Foo.Bar.Baz');
			done();
		});
	});
});