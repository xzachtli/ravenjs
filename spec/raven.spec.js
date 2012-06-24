var raven = require('../raven.js'),
	RavenClient = require('../lib/client.js');

describe('raven.connect', function() {
	beforeEach(function() {
		raven.connectionString('Url=http://localhost;Database=Foo;UserName=Bar;Password=Baz;ApiKey=FooBar');	
	});

	it('creates a raven client', function() {
		expect(raven.connect()).toBeDefined();
	});

	it('creates client with default settings', function() {
		
		var client = raven.connect();
		expect(client.settings.server).toBe('http://localhost');
		expect(client.settings.database).toBe('Foo'); 
		expect(client.settings.username).toBe('Bar');
		expect(client.settings.password).toBe('Baz');
		expect(client.settings.apiKey).toBe('FooBar');
		expect(client.settings.keyFinder).toBeDefined();
		expect(client.settings.keyFinder).toBe(raven.defaultKeyFinder);
		expect(client.settings.keyGenerator).toBe(raven.defaultKeyGenerator);
	});

	it('creates client with overriden server setting', function(){
		raven.server('http://foo');
		var client = raven.connect();
		expect(client.settings.server).toBe('http://foo');
	});

	it('creates client with overriden database setting', function() {
		raven.database('override');
		var client = raven.connect();
		expect(client.settings.database).toBe('override');
	});

	it ('creates client with overriden username setting', function() {
		raven.username('override');
		var client = raven.connect();
		expect(client.settings.username).toBe('override');
	});

	it ('creates client with overriden password setting', function() {
		raven.password('override');
		var client = raven.connect();
		expect(client.settings.password).toBe('override');
	});

	it ('creates client with overriden apiKey setting', function() {
		raven.apiKey('override');
		var client = raven.connect();
		expect(client.settings.apiKey).toBe('override');
	});

	it ('creates client with overriden keyFinder setting', function() {
		var finder = function(document) { };
		raven.keyFinder(finder);
		var client = raven.connect();
		expect(client.settings.keyFinder).toBe(finder);
	});

	it ('creates client with overriden keyGenerator setting', function() {
		var generator = function(document, client) { };
		raven.keyGenerator(generator);
		var client = raven.connect();
		expect(client.settings.keyGenerator).toBe(generator);
	});
}); 