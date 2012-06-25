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

	describe('should return', function() {
	it('should not throw error when response is 200', function() {
			var ravendb = nock('http://localhost:81')
				.get('/foo')
				.reply(200, {success: "true"});

			var client = new RavenClient({});
			client.request({
				url: 'http://localhost:81/foo',
				method: 'GET' },
				function(error, response, body) {
					expect(error).toBeNull();
					expect(reqi
				});
		});
	});
});