var QueryRequest = require('../lib/QueryRequest'),
	nock = require('nock');

describe('QueryRequest', function() {

	describe('querying indexes', function() {

		var request;
		beforeEach(function() {
			request = new QueryRequest('foo', { host: 'http://localhost:81' });
		});

		
	});

	describe('dynamic querying', function() {
		var request;
		beforeEach(function() {
			request = new QueryRequest({ host: 'http://localhost:81' });
		});
	});
});