var RavenRequest = require('../lib/RavenRequest'),
	nock = require('nock');

describe('RavenRequest.ctor', function() {

	it('should throw when settings is null', function() {
		expect(function() { new RavenRequest() } ).toThrow();
	});

	it('should throw when settings is undefined', function() {
		expect(function() { new RavenRequest(undefined); }).toThrow();
	});
});

describe('RavenRequest.sendRequest', function() {
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

describe('RavenRequest.authenticate', function() {
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