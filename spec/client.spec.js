var RavenClient = require('../lib/client.js'),
	nock = require('nock');

describe('client', function() {

	describe('when sending request', function() {

		it ('should throw when requestData is null', function(){
			var client = new RavenClient({});
			expect(client.request(null, { })).toThrow();
		});
	});
});