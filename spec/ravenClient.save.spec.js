var raven = require('../raven'),
	RavenClient = require('../lib/ravenClient'),
	HiLoIdGenerator = require('../lib/hiloIdGenerator');
	nock = require('nock');

describe('RavenClient.save', function() {

	var client;

	beforeEach(function() {
		client = new RavenClient({
			server: 'http://localhost:80',
			idFinder: raven.defaultIdFinder,
			idGenerator: raven.defaultIdGenerator
		});
	});

	it('should throw when doc to save is null', function() {
		expect(function() { client.save(); }).toThrow();
	});

	it('should throw when callback is null', function() {
		expect(function() { client.save( { } ); }).toThrow();
	});

	it('should throw if specified id has invalid paths', function() {
		expect(function() { client.save( '/foo/bar', { }, function(){ }); }).toThrow();
	});

	it('should save new document with provided id', function(done) {
		var doc = { foo: 'bar' };

		var ravendb = nock('http://localhost:80')
			.put('/docs/foo', doc)
			.reply(201, { Key: 'foo', ETag: '0000-0001'});

		client.save('foo', doc, function(error) {
			expect(error).not.toBeDefined();
			expect(doc['@id']).toBe('foo');
			expect(doc['@metadata']).toBeDefined();
			expect(doc['@metadata'].ETag).toBe('0000-0001');
			ravendb.done();
			done();
		});
	});
 
	it('should save new document to collection with provided id', function(done) {
		var doc = { bar: 'baz' };

		var ravendb = nock('http://localhost:80')
			.put('/docs/foo/bar', doc)
			.reply(201, {Key: '/foo/bar', ETag: '0000-0001'});

		var collection = client.collection('foo');
		collection.save('bar', doc, function(error) {
			expect(error).not.toBeDefined();
			expect(doc['@id']).toBe('/foo/bar');
			expect(doc['@metadata']['Raven-Entity-Name']).toBe('foo');
			expect(doc['@metadata'].ETag).toBe('0000-0001');
			ravendb.done();
			done();
		});
	});

	it('should save new document with default id property', function(done) {
		var doc = { id: 'bar', baz: 'foobar' };
		var ravendb = nock('http://localhost:80')
			.put('/docs/bar', doc)
			.reply(201, { Key: 'bar', ETag: '0000-0001'});
		
		client.save(doc, function(error) {
			expect(error).not.toBeDefined();
			expect(doc['@id']).toBe('bar');
			expect(doc['@metadata'].ETag).toBe('0000-0001');
			ravendb.done();
			done();
		});
	});

	it('should save new document with generated id', function(done) {
		var doc = { baz: 'foobar' };

		var ravendb = nock('http://localhost:80')
			.put('/docs/123', doc)
			.reply(201, { Key: '123', ETag: '0000-0001'});

		spyOn(HiLoIdGenerator.prototype, 'nextId')
			.andCallFake(function(callback) {
				callback(undefined, 123);
			});

		client.save(doc, function(error) {
			expect(error).not.toBeDefined();
			expect(doc['@id']).toBe('123');
			expect(doc['@metadata'].ETag).toBe('0000-0001');
			ravendb.done();
			done();
		});
	});

	it('should update document with assigned id', function(done) {
		var ravendb = nock('http://localhost:80')
			.put('/docs/foo/bar', { baz: 'foobar' })
			.matchHeader('Raven-Entity-Name', 'foo')
			.matchHeader('Raven-Clr-Type', 'Foo.Bar')
			.reply(201, { Key: 'foo/bar', ETag: '0000-0001'});

		var doc = { baz: 'foobar' };
		doc['@id'] = 'foo/bar';
		doc['@metadata'] = { };
		doc['@metadata']['Raven-Entity-Name'] = 'foo';
		doc['@metadata']['Raven-Clr-Type'] = 'Foo.Bar';
		doc['@metadata'].ETag = '0000-0000';

		client.save(doc, function(error) {
			expect(error).not.toBeNull();
			expect(doc['@metadata'].ETag).toBe('0000-0001');
			ravendb.done();
			done();
		});
	});

	it('should send if-none-match header when optimistic concurrencly is enabled', function(done) {
		var ravendb = nock('http://localhost:80')
			.put('/docs/foo', { baz: 'foobar' })
			.matchHeader('If-None-Match', '0001-00001')
			.matchHeader('Raven-Entity-Name', 'foo')
			.matchHeader('Raven-Clr-Type', 'Foo.Bar')
			.reply(201, { Key: 'foo', ETag: '0002-00001'});

		var doc = { baz: 'foobar' };
		doc['@id'] = 'foo';
		doc['@metadata'] = { };
		doc['@metadata']['Raven-Entity-Name'] = 'foo';
		doc['@metadata']['Raven-Clr-Type'] = 'Foo.Bar';
		doc['@metadata'].ETag = '0001-00001';

		client = new RavenClient({
			server: 'http://localhost:80',
			idFinder: raven.defaultIdFinder,
			idGenerator: raven.defaultIdGenerator,
			useOptimisticConcurrency: true
		});

		client.save(doc, function(error) {
			expect(error).not.toBeNull();
			expect(doc['@metadata'].ETag).toBe('0002-00001');
			ravendb.done();
			done();
		});
	});
});