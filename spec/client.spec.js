var RavenClient = require('../lib/client.js'),
	nock = require('nock');

describe('client.request', function() {

	describe('should throw', function() {

		it ('when requestData is null', function(){
			var client = new RavenClient({});
			expect(function() {
				client.request(null, { });
			}).toThrow();
		});

		it('when requestData is undefined', function() {
			var client = new RavenClient({});
			expect(function() {
				client.request(undefined, {});
			}).toThrow();
		});

		it('when callback is null', function() {
			var client = new RavenClient({});
			expect(function() {
				client.request({ }, null);
			}).toThrow();
		});

		it('when callback is undefined', function() {
			var client = new RavenClient({});
			expect(function() {
				client.request({ }, undefined);
			}).toThrow();
		});
	});

	describe('should send request', function(){

		it('with existing auth token', function(done) {
			var ravendb = nock('http://localhost:81')
				.matchHeader('Authorization', 'auth')
				.get('/foo')
				.reply(200, {success: 'true'});

			var client = new RavenClient({});
			client.settings.authToken = 'auth';
			client.request({ url: 'http://localhost:81/foo'}, function(error, response, body) {
				expect(error).toBeNull();
				done();
			});
		});

		it('with data', function(done) {
			var ravendb = nock('http://localhost:81')
				.matchHeader('content-type', 'application/json; charset=UTF-8')
				.matchHeader('accept', 'application/json')
				.get('/foo', {foo: 'bar'})
				.reply(200, {success: 'true'});

			var client = new RavenClient({});
			client.request({url: 'http://localhost:81/foo', json: {foo: 'bar'}}, function(error, response, body) {
				expect(error).toBeNull();
				ravendb.done();
				done();
			});
		});
	});

	describe('on authentication', function() {
 
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

			var client = new RavenClient({ username: 'foo', password: 'bar'});
			client.request({url: 'http://localhost:81/foo'}, function(error, response, body) {
				expect(client.settings.authToken).toBe('Bearer token');
				expect(error).toBeNull();
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

			var client = new RavenClient({ apiKey: apiKey});
			client.request({url: 'http://localhost:81/foo'}, function(error, response, body) {
				expect(client.settings.authToken).toBe('Bearer token');
				expect(error).toBeNull();
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

			var client = new RavenClient({ username: 'foo', password: 'bar'});
			client.request({url: 'http://localhost:81/foo'}, function(error, response, body) {
				expect(error).not.toBeNull();
				done();
			});
		});
		
	});

	describe('should return', function() {

		it('successful response', function(done) {
				var ravendb = nock('http://localhost:81')
					.get('/foo')
					.reply(200, {success: 'true'});

				var client = new RavenClient({});
				client.request({ url: 'http://localhost:81/foo'}, function(error, response, body) {
						expect(error).toBeNull();
						expect(response).not.toBeNull();
						expect(body).toBeDefined();
						ravendb.done();
						done();
					});
			});
		});
});