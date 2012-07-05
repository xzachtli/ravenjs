var AttachmentRequests = require('../lib/AttachmentRequests'),
	nock = require('nock');

describe('AttachmentRequests', function() {
	var request;

	beforeEach(function() {
		request = new AttachmentRequests({ host: 'http://localhost:81' });
	});

	describe('.get', function() {

		it('should throw when key is undefined', function() {
			expect(function() { request.get(); }).toThrow();
			expect(function() { request.get(null); }).toThrow();
			expect(function() { request.get(undefined); }).toThrow();
		});
	});
});