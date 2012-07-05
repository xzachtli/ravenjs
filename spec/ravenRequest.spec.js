var RavenRequest = require('../lib/RavenRequest'),
	nock = require('nock');

describe('RavenRequest', function() {

	describe('.ctor', function() {

		it('should throw when settings is null', function() {
			expect(function() { new RavenRequest(); } ).toThrow();
		});

		it('should throw when settings is undefined', function() {
			expect(function() { new RavenRequest(undefined); }).toThrow();
		});
	});

	describe('sendRequest', function() {
		var request;

		beforeEach(function() {
			request = new RavenRequest( {server: 'http://localhost:81' });
		});

		it ('should throw when requestData is null', function() {
			expect(function () { request.sendRequest(); }).toThrow();
		});

		it ('should send request', function(done) {
			var data = { url: 'http://localhost:81/foo', method: 'GET' };
			var ravendb = nock('http://localhost:81')
				.get('/foo')
				.reply(200, {sucess: 'true'});

			request.sendRequest(data, function(error, response, data) {
				expect(error).toBeNull();
				ravendb.done();
				done();
			});
		});

		it('should send request with data', function(done) {
			var data = { foo : 'bar' };
			var requestData = {
				url: 'http://localhost:81/foo',
				method: 'POST',
				json: data
			};

			var ravendb = nock('http://localhost:81')
				.post('/foo', data)
				.matchHeader('content-type', 'application/json; charset=UTF-8')
				.matchHeader('accept', 'application/json')
				.reply(200, {success: 'true'});

			request.sendRequest(requestData, function(error, response, data) {
				expect(error).toBeNull();
				ravendb.done();
				done();
			});
		});

		it('should send request with credentials', function(done) {
			var requestData = {
				url: 'http://localhost:81/foo',
				method: 'GET'
			};

			request.settings.authToken = 'token';
			var ravendb = nock('http://localhost:81')
				.get('/foo')
				.matchHeader('Authorization', 'token')
				.reply(200, {success: 'true'});

			request.sendRequest(requestData, function(error, response, data) {
				expect(error).toBeNull();
				ravendb.done();
				done();
			});
		});

		it ('should authenticate request', function(done) {
			var requestData = {
				url: 'http://localhost:81/foo',
				method: 'GET'
			};

			var ravendb = nock('http://localhost:81')
				.get('/foo')
				.reply(401);

			spyOn(RavenRequest.prototype, 'authenticate')
				.andCallFake(function(response, requestData, callback) {
					callback(null, response, {success: 'true'});
				});

			request.sendRequest(requestData, function(error, response, data) {
				expect(error).toBeNull();
				expect(data).toBeDefined();
				expect(request.authenticate).toHaveBeenCalled();
				ravendb.done();
				done();
			});
		});
	});

	describe('.authenticate', function() {
		var request;

		beforeEach(function() {
			request = new RavenRequest({host: 'http://localhost:81'});
		});

		it('should return error when auth headers are missing', function(done) {
			var response = { headers: { }};
			request.authenticate(response, { }, function(error, response, body) {
				expect(error).toBeDefined();
				done();
			});
		});

		it ('should authenticate using username and password', function(done) {
			var authrequest_headers = { };
			authrequest_headers['www-authenticate'] = true;
			authrequest_headers['oauth-source'] = 'http://localhost:81/auth';

			var authToken = 'Basic ' + new Buffer('foo:bar', 'ascii').toString('base64');

			var ravendb = nock('http://localhost:81')
				.get('/foo')
				.reply(401, '', authrequest_headers)
				.get('/auth')
				.matchHeader('grant_type', 'client_credentials')
				.matchHeader('accept', 'application/json; charset=UTF-8')
				.matchHeader('authorization', authToken)
				.reply(200, 'token')
				.get('/foo')
				.matchHeader('Authorization', 'Bearer token')
				.reply(200, {success: true});

			request.settings.username = 'foo';
			request.settings.password = 'bar';
			request.sendRequest ({ url: 'http://localhost:81/foo' }, function(error, response, body) {
				expect(request.settings.authToken).toBe('Bearer token');
				expect(error).toBeNull();
				ravendb.done();
				done();
			});
		});

		it('should authenticaten using api key', function(done) {
			var authrequest_headers = { };
			authrequest_headers['www-authenticate'] = true;
			authrequest_headers['oauth-source'] = 'http://localhost:81/auth';
			
			request.settings.apiKey = 'apiKey123';
			
			var ravendb = nock('http://localhost:81')
				.get('/foo')
				.reply(401, '', authrequest_headers)
				.get('/auth')
				.matchHeader('grant_type', 'client_credentials')
				.matchHeader('accept', 'application/json; charset=UTF-8')
				.matchHeader('Api-Key', 'apiKey123')
				.reply(200, 'token')
				.get('/foo')
				.matchHeader('Authorization', 'Bearer token')
				.reply(200, {success: true});

			
			request.sendRequest({url: 'http://localhost:81/foo'}, function(error, response, body) {
				expect(request.settings.authToken).toBe('Bearer token');
				expect(error).toBeNull();
				ravendb.done();
				done();
			});
		});

		it('should return error when authentication fails', function(done) {
			var authrequest_headers = { };
			authrequest_headers['www-authenticate'] = true;
			authrequest_headers['oauth-source'] = 'http://localhost:81/auth';

			var ravendb = nock('http://localhost:81')
				.get('/foo')
				.reply(401, '', authrequest_headers)
				.get('/auth')
				.reply(403);

			request.settings.username = 'foo';
			request.settings.password = 'bar';
			request.sendRequest({url: 'http://localhost:81/foo'}, function(error, response, body) {
				expect(error).not.toBeNull();
				ravendb.done();
				done();
			});
		});
	});

	describe('.sendGet', function() {

		var request;

		beforeEach(function() {
			request = new RavenRequest({ host: 'http://localhost:81'});
		});

		it('should throw when path is undefined', function() {
			expect(function() { request.sendGet(); }).toThrow();
			expect(function() { request.sendGet(null); }).toThrow();
			expect(function() { request.sendGet(undefined); }).toThrow();
		});

		it('should throw when callback is undefined', function() {
			expect(function() { request.sendGet('foo'); }).toThrow();
			expect(function() { request.sendGet('foo', null); }).toThrow();
			expect(function() { request.sendGet('foo', undefined); }).toThrow();
		});

		it('should send request to default database when database is not specified', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/foo')
				.reply(200);

			request.sendGet('foo', function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				expect(data).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should send request to specified database', function(done) {
			request.settings.database = 'bar';
			var ravendb = nock('http://localhost:81')
				.get('/databases/bar/foo')
				.reply(200);

			request.sendGet('foo', function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				expect(data).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should parse response data', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/foo')
				.reply(200, {foo: 'bar'});

			request.sendGet('foo', function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				expect(data).toBeDefined();
				ravendb.done();
				done();
			});
		});
	});

	describe('.sendPost', function() {
		var request;

		beforeEach(function() {
			request = new RavenRequest({ host: 'http://localhost:81'});
		});

		it('should throw error when post options is undefined', function() {
			expect(function() { request.sendPost(); }).toThrow();
			expect(function() { request.sendPost(null); }).toThrow();
			expect(function() { request.sendPost(undefined); }).toThrow();
		});

		it('should throw error when path is not defined in post options', function() {
			expect(function() { request.sendPost( { }, function() { }); }).toThrow();
		});

		it('should throw error when callback is undefined', function() {
			expect(function() { request.sendPost({ path: 'foo' }); }).toThrow();
			expect(function() { request.sendPost({ path: 'foo' }, null); }).toThrow();
			expect(function() { request.sendPost({ path: 'foo' }, undefined); }).toThrow();
		});
		
		it('should send request to default database when database is not specified', function(done) {
			var ravendb = nock('http://localhost:81')
				.post('/foo')
				.reply(201);

			request.sendPost({ path: 'foo'} , function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				expect(data).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should send request to specified database', function(done) {
			request.settings.database = 'bar';
			var ravendb = nock('http://localhost:81')
				.post('/databases/bar/foo')
				.reply(201);

			request.sendPost({ path: 'foo'} , function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				expect(data).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should send request with data', function(done) {
			var data = { foo: 'bar'};
			var ravendb = nock('http://localhost:81')
				.post('/foo', data)
				.reply(201);

			request.sendPost({ path: 'foo', data: data}, function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should send request with headers', function(done) {
			var headers = {foo : 'bar'};
			var ravendb = nock('http://localhost:81')
				.post('/foo')
				.matchHeader('foo', 'bar')
				.reply(201);

			request.sendPost({ path: 'foo', headers: headers }, function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should send return error if response code is not 201', function(done) {
			var ravendb = nock('http://localhost:81')
				.post('/foo')
				.reply(405);

			request.sendPost({ path: 'foo' }, function(error, response, data) {
				expect(error).toBeDefined();
				ravendb.done();
				done();
			});
		});
	});

	describe('.sendPut', function() {
		var request;

		beforeEach(function() {
			request = new RavenRequest({ host: 'http://localhost:81'});
		});

		it('should throw error when put options is undefined', function() {
			expect(function() { request.sendPut(); }).toThrow();
			expect(function() { request.sendPut(null); }).toThrow();
			expect(function() { request.sendPut(undefined); }).toThrow();
		});

		it('should throw error when path is not defined in post options', function() {
			expect(function() { request.sendPut( { }, function() { }); }).toThrow();
		});

		it('should throw error when callback is undefined', function() {
			expect(function() { request.sendPut({ path: 'foo' }); }).toThrow();
			expect(function() { request.sendPut({ path: 'foo' }, null); }).toThrow();
			expect(function() { request.sendPut({ path: 'foo' }, undefined); }).toThrow();
		});
		
		it('should send request to default database when database is not specified', function(done) {
			var ravendb = nock('http://localhost:81')
				.put('/foo')
				.reply(201);

			request.sendPut({ path: 'foo'} , function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				expect(data).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should send request to specified database', function(done) {
			request.settings.database = 'bar';
			var ravendb = nock('http://localhost:81')
				.put('/databases/bar/foo')
				.reply(201);

			request.sendPut({ path: 'foo'} , function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				expect(data).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should send request with data', function(done) {
			var data = { foo: 'bar'};
			var ravendb = nock('http://localhost:81')
				.put('/foo', data)
				.reply(201);

			request.sendPut({ path: 'foo', data: data}, function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should send request with headers', function(done) {
			var headers = {foo : 'bar'};
			var ravendb = nock('http://localhost:81')
				.put('/foo')
				.matchHeader('foo', 'bar')
				.reply(201);

			request.sendPut({ path: 'foo', headers: headers }, function(error, response, data) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should send return error if response code is not 201', function(done) {
			var ravendb = nock('http://localhost:81')
				.put('/foo')
				.reply(405);

			request.sendPut({ path: 'foo' }, function(error, response, data) {
				expect(error).toBeDefined();
				ravendb.done();
				done();
			});
		});
	});

	describe('.sendDelete', function() {

		var request;

		beforeEach(function() {
			request = new RavenRequest({ host: 'http://localhost:81'});
		});

		it('should throw error when path is undefined', function() {
			expect(function() { request.sendDelete(); }).toThrow();
			expect(function() { request.sendDelete(null); }).toThrow();
			expect(function() { request.sendDelete(undefined); }).toThrow();
		});

		it('should throw error when callback is undefined', function() {
			expect(function() { request.sendDelete('foo'); }).toThrow();
			expect(function() { request.sendDelete('foo', null); }).toThrow();
			expect(function() { request.sendDelete('foo', undefined); }).toThrow();
		});

		it('should send request to default database when no database is specified.', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/foo')
				.reply(204);

			request.sendDelete('foo', function(error, response) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should send request to specified database.', function(done) {
			request.settings.database = 'bar';
			var ravendb = nock('http://localhost:81')
				.delete('/databases/bar/foo')
				.reply(204);

			request.sendDelete('foo', function(error, response) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should return error when response code is not 204', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/foo')
				.reply(405);

			request.sendDelete('foo', function(error, response) {
				expect(error).toBeDefined();
				expect(response).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should not return error when response code is 204', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/foo')
				.reply(204);

			request.sendDelete('foo', function(error, response) {
				expect(error).not.toBeDefined();
				expect(response).toBeDefined();
				ravendb.done();
				done();
			});
		});
	});
});

