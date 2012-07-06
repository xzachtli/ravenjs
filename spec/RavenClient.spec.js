var RavenClient = require('../lib/RavenClient'),
	DocumentRequests = require('../lib/DocumentRequests'),
	IndexRequests = require('../lib/IndexRequests'),
	QueryRequest = require('../lib/QueryRequest'),
	AttachmentRequests = require('../lib/AttachmentRequests');

describe('RavenClient', function() {

	var client;
	beforeEach(function() {
		client = new RavenClient({ host: 'http://localhost:81 '});
	});

	it('should use DocumentRequests.get to get documents', function(done){
		spyOn(DocumentRequests.prototype, 'get')
			.andCallFake(function(id, callback){
				return callback(undefined, { foo: 'bar' });
			});
		
		client.get('foo', function(error, data) {
			expect(error).not.toBeDefined();
			expect(data).toBeDefined();
			expect(DocumentRequests.prototype.get).toHaveBeenCalled();
			done();
		});
	});

	it('should use DocumentRequests.save for saving documents', function(done) {
		spyOn(DocumentRequests.prototype, 'save')
			.andCallFake(function(data, callback) {
				expect(data.foo).toBeDefined();
				callback(undefined);
			});

		client.save({ foo: 'bar' }, function(error) {
			expect(error).not.toBeDefined();
			expect(DocumentRequests.prototype.save).toHaveBeenCalled();
			done();
		});
	});

	it('should use DocumentRequests.remove for deleting documents', function(done) {
		spyOn(DocumentRequests.prototype, 'remove')
			.andCallFake(function(id, callback) {
				expect(id).toBe('foo');
				callback(undefined);
			});

		client.remove('foo', function(error) {
			expect(error).not.toBeDefined();
			expect(DocumentRequests.prototype.remove).toHaveBeenCalled();
			done();
		});
	});

	it('should return a IndexRequests instance for manipulating indexes', function() {
		expect(client.index('foo') instanceof IndexRequests).toBeTruthy();
	});

	it('should return a QueryRequest instance for querying data', function() {
		expect(client.query() instanceof QueryRequest).toBeTruthy();
	});

	it('should return a AtachmentRequests instance for manipulating attachments', function(){
		expect(client.attachment('foo') instanceof AttachmentRequests).toBeTruthy();
	});
});
