var request = require('../lib/ravenRequest'),
	nock = require('nock');

describe('ravenRequest', function() {

	it('should throw when settings is null', function() {
		expect(function() { request(null, null, null); } ).toThrow();
	});

	it('shoulw throw when settings is undefined', function(){
		expect(function() { request(undefined, null, null); }).toThrow();
	});

	it ('should throw when requestData is null', function(){
		expect(function() { request({ }, null, { }); }).toThrow();
	});

	it('should throw when requestData is undefined', function() {
		expect(function() { request({ }, undefined, { }); }).toThrow();
	});

	it('should throw when callback is null', function() {
		expect(function() { request({ }, { }, null); }).toThrow();
	});

	it('should throw when callback is undefined', function() {
		expect(function() { request({ }, { }, undefined); }).toThrow();
	});

	it ('should authenticate with existing token', function(done) {
		var ravendb = nock('http://localhost:81')
			.matchHeader('Authorization', 'auth')
			.get('/foo')
			.reply(200, {success: 'true'});

		request({ authToken: 'auth'}, { url: 'http://localhost:81/foo'}, function(error, response, body) {
			expect(error).toBeNull();
			ravendb.done();
			done();
		});
	});

	it('should send request with data', function(done) {
		var ravendb = nock('http://localhost:81')
			.matchHeader('content-type', 'application/json; charset=UTF-8')
			.matchHeader('accept', 'application/json')
			.get('/foo', {foo: 'bar'})
			.reply(200, {success: 'true'});

		request({ }, {url: 'http://localhost:81/foo', json: {foo: 'bar'}}, function(error, response, body) {
			expect(error).toBeNull();
			ravendb.done();
			done();
		});
	});

	it('should authenticate using username pssword and set auth token', function(done) {
			
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

		var settings = { username: 'foo', password: 'bar' };
		request(settings, {url: 'http://localhost:81/foo'}, function(error, response, body) {
			expect(settings.authToken).toBe('Bearer token');
			expect(error).toBeNull();
			ravendb.done();
			done();
		});
		
	});

	it('should authenticate using apiKey and set auth token', function(done) {

		var authrequest_headers = { };
		authrequest_headers['www-authenticate'] = true;
		authrequest_headers['oauth-source'] = 'http://localhost:81/auth';

		var apiKey = 'apikey123';

		var ravendb = nock('http://localhost:81')
			.get('/foo')
			.reply(401, '', authrequest_headers)
			.get('/auth')
			.matchHeader('grant_type', 'client_credentials')
			.matchHeader('accept', 'application/json; charset=UTF-8')
			.matchHeader('Api-Key', apiKey)
			.reply(200, 'token')
			.get('/foo')
			.matchHeader('Authorization', 'Bearer token')
			.reply(200, {success: true});

		var settings = { apiKey: apiKey };
		request(settings, {url: 'http://localhost:81/foo'}, function(error, response, body) {
			expect(settings.authToken).toBe('Bearer token');
			expect(error).toBeNull();
			ravendb.done();
			done();
		});
	});

	it('should return error when authentication is failed', function(done) {

		var authrequest_headers = { };
		authrequest_headers['www-authenticate'] = true;
		authrequest_headers['oauth-source'] = 'http://localhost:81/auth';

		var ravendb = nock('http://localhost:81')
			.get('/foo')
			.reply(401, '', authrequest_headers)
			.get('/auth')
			.reply(403);

		request({ username: 'foo', password: 'bar'}, {url: 'http://localhost:81/foo'}, function(error, response, body) {
			expect(error).not.toBeNull();
			ravendb.done();
			done();
		});
	});

	it('should return successful response', function(done) {
		var ravendb = nock('http://localhost:81')
			.get('/foo')
			.reply(200, {success: 'true'});

		request({ } , { url: 'http://localhost:81/foo'}, function(error, response, body) {
			expect(error).toBeNull();
			expect(response).not.toBeNull();
			expect(body).toBeDefined();
			ravendb.done();
			done();
		});
	});	
});