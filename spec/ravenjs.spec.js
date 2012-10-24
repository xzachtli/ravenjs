var raven = require('../ravenjs'),
	RavenClient = require('../lib/RavenClient'),
	HiLoIdGenerator = require('../lib/HiLoIdGenerator');

describe('raven', function() {

	describe('.host', function() {

		it('should throw when value is not a string', function() {
			expect(function() { raven.host(1234); }).toThrow();
		});

		it('should throw when value does not start with http or https', function() {
			expect(function() { raven.host('ftp://foobar'); }).toThrow();
			expect(function() { raven.host('bar'); }).toThrow();
		});

		it('should set the host setting for http', function() {
			raven.host('http://foobar');
			expect(raven.host()).toBe('http://foobar');
		});
	});

	describe('.database', function() {
		it('should throw when value is not a string', function() {
			expect(function() { raven.database(1234); }).toThrow();
		});

		it('should set database name', function() {
			raven.database('Foo');
			expect(raven.database()).toBe('Foo');
		});

		it('should remove database name', function() {
			raven.database('Foo');
			raven.database('');
			expect(raven.database()).toBe(undefined);
		});
	});

	describe('.username', function() {
		it('should throw when value is not a string', function() {
			expect(function() { raven.username(1234); }).toThrow();
		});

		it('should set username', function() {
			raven.username('Foo');
			expect(raven.username()).toBe('Foo');
		});

		it ('should remove username', function() {
			raven.username('Foo');
			raven.username('');
			expect(raven.username()).toBe(undefined);
		});
	});

	describe('.password', function() {
		it('should throw when value is not a string', function() {
			expect(function() { raven.password(1234); }).toThrow();
		});

		it('should set password', function() {
			raven.password('Foo');
			expect(raven.password()).toBe('Foo');
		});

		it('should remove password', function() {
			raven.password('Foo');
			raven.password('');
			expect(raven.password()).toBe(undefined);
		});
	});

	describe('.apiKey', function() {
		it('should throw when value is not a string', function() {
			expect(function() { raven.apiKey(1234); }).toThrow();
		});

		it('should set apiKey', function() {
			raven.apiKey('Foo');
			expect(raven.apiKey()).toBe('Foo');
		});

		it('should remove apiKey', function() {
			raven.apiKey('Foo');
			raven.apiKey('');
			expect(raven.apiKey()).toBe(undefined);
		});
	});

	describe('.useOptimisticConcurrency', function() {
		it('should throw when value is not a boolean', function() {
			expect(function() { raven.useOptimisticConcurrency('foobar'); }).toThrow();
		});

		it ('should set value', function() {
			raven.useOptimisticConcurrency(true);
			expect(raven.useOptimisticConcurrency()).toBe(true);
		});
	});

	describe('.connectionString', function() {

		it('should throw when value is not a string', function() {
			expect(function() { raven.connectionString(1234); }).toThrow();
		});

		it('should throw when connection string does not contain valid Url setting', function() {
			expect(function() { raven.connectionStriong('foobar'); }).toThrow();
		});

		it('should throw when Url specifies an invalid url scheme', function() {
			expect(function() { raven.connectionString('ftp://shouldnotwork'); }).toThrow();
		});

		it('should set host', function() {
			raven.connectionString('Url=http://localhost:80');
			expect(raven.host()).toBe('http://localhost:80');
		});

		it('should set database', function() {
			raven.connectionString('Url=http://localhost:80;Database=Foo');
			expect(raven.database()).toBe('Foo');
		});

		it('should set username', function() {
			raven.connectionString('Url=http://localhost:80;UserName=Foo');
			expect(raven.username()).toBe('Foo');
		});

		it('should set password', function() {
			raven.connectionString('Url=http://localhost:80;Password=Foo');
			expect(raven.password()).toBe('Foo');
		});

		it('should set apiKey', function() {
			raven.connectionString('Url=http://localhost:80;ApiKey=Bar');
			expect(raven.apiKey()).toBe('Bar');
		});
	});

	describe('.configure', function() {

		it('should not run when current environment doesn not match', function(){
			raven.database(''); //Set it to undefined
			process.env.NODE_ENV = 'Foo';
			raven.configure('Bar', function() {
				raven.database('changed');
			});

			expect(raven.database()).toBe(undefined);
		});

		it('should run when current environment matches', function() {
			raven.database(''); //Set it to undefined
			process.env.NODE_ENV = 'Foo';
			raven.configure('Foo', function(){
				raven.database('Bar');
			});

			expect(raven.database()).toBe('Bar');
		});

		it('should always run all environment', function() {
			raven.database(''); //Set it to undefined
			process.env.NODE_ENV = undefined;
			raven.configure('all', function() {
				raven.database('Bar');
			});

			expect(raven.database()).toBe('Bar');
		});

		it('should always run when no environment is specified', function(){
			raven.database(''); //Set it to undefined
			process.env.NODE_ENV = undefined;
			raven.configure(function() {
				raven.database('Bar');
			});

			expect(raven.database()).toBe('Bar');
		});
	});

	describe('.defaultIdFinder', function() {

		it('should return undefined for undefined documents', function(){
			expect(raven.defaultIdFinder()).toBe(undefined);
		});

		it('should return key from id property', function(){
			expect(raven.defaultIdFinder({
				id: 'Foo'
			})).toBe('Foo');
		});

		it('should return key from Id property', function() {
			expect(raven.defaultIdFinder({
				Id: 'Foo'
			})).toBe('Foo');
		});

		it('should return id from @id metadata', function() {
			var data = { '@metadata': { '@id': 'foo' }};
			expect(raven.defaultIdFinder(data)).toBe('foo');
		});

		it ('should return undefined for no matched id properties', function() {
			expect(raven.defaultIdFinder({
				Bar: 'Foo'
			})).toBe(undefined);
		});
	});

	describe('.defaultIdGenerator', function() {
	
		it('should throw when doc is null', function() {
			expect(function(){ raven.defaultIdGenerator(null, { host: 'foo' }); }).toThrow();
		});

		it('should throw when settings is null', function() {
			expect(function(){ raven.defaultIdGenerator({}, null); }).toThrow();
		});

		it('should throw when setting does not have a host property', function() {
			expect(function(){ raven.defaultIdGenerator({}, { }, null); }).toThrow();
		});

		it('should throw when callback is null', function() {
			expect(function() { raven.defaultIdGenerator({}, { host: 'foo' }); }).toThrow();
		});

		it('should return error when hilo generator returns error', function(done) {

			spyOn(HiLoIdGenerator.prototype, 'nextId')
				.andCallFake(function(cb) { cb(new Error('Failed')); });

			raven.defaultIdGenerator({}, { host: 'foo'}, function(error, id) {
				expect(error).toBeDefined();
				expect(error.message).toBe('Failed');
				expect(id).not.toBeDefined();
				done();
			});
		});

		it('should return id from hilo generator without collection name', function(done) {
			spyOn(HiLoIdGenerator.prototype, 'nextId')
				.andCallFake(function(cb) { cb(undefined, 123); });

			raven.defaultIdGenerator({}, { host: 'foo' }, function(error, id) {
				expect(error).not.toBeDefined();
				expect(id).toBe('123');
				done();
			});
		});
		
		it('should return id from hilo generator with collection name', function(done) {
			spyOn(HiLoIdGenerator.prototype, 'nextId')
				.andCallFake(function(cb) { cb(undefined, 123); });
				
			doc = { '@metadata': { 'Raven-Entity-Name': 'bars' } };

			raven.defaultIdGenerator(doc, { host: 'foo' }, function(error, id) {
				expect(error).not.toBeDefined();
				expect(id).toBe('bars/123');
				done();
			});
		});
		
		it('should return id from hilo generator with collection name lower-camel-cased', function(done) {
			spyOn(HiLoIdGenerator.prototype, 'nextId')
				.andCallFake(function(cb) { cb(undefined, 123); });
				
			doc = { '@metadata': { 'Raven-Entity-Name': 'FooBars' } };

			raven.defaultIdGenerator(doc, { host: 'foo' }, function(error, id) {
				expect(error).not.toBeDefined();
				expect(id).toBe('fooBars/123');
				done();
			});
		});
	});

	describe('.connect', function() {
		beforeEach(function() {
			raven.connectionString('Url=http://localhost:8080;Database=Foo;UserName=Bar;Password=Baz;ApiKey=FooBar');
		});

		it('creates a raven client', function() {
			expect(raven.connect() instanceof RavenClient).toBeTruthy();
		});

		it('creates client with default settings', function() {

			var client = raven.connect();
			expect(client.settings.host).toBe('http://localhost:8080');
			expect(client.settings.database).toBe('Foo');
			expect(client.settings.username).toBe('Bar');
			expect(client.settings.password).toBe('Baz');
			expect(client.settings.apiKey).toBe('FooBar');
			expect(client.settings.idFinder).toBeDefined();
			expect(client.settings.idFinder).toBe(raven.defaultIdFinder);
			expect(client.settings.idGenerator).toBe(raven.defaultIdGenerator);
		});

		it('creates client with overriden host setting', function(){
			raven.host('http://foo');
			var client = raven.connect();
			expect(client.settings.host).toBe('http://foo');
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
			var finder = function(doc) { };
			raven.idFinder(finder);
			var client = raven.connect();
			expect(client.settings.idFinder).toBe(finder);
		});

		it ('creates client with overriden keyGenerator setting', function() {
			var generator = function(doc, settings) { };
			raven.idGenerator(generator);
			var client = raven.connect();
			expect(client.settings.idGenerator).toBe(generator);
		});
	});

	describe('.create', function() {
		it('should return a new object when type name is not specified.', function() {
			var obj = raven.create();
			expect(obj).toBeDefined();
			expect(obj['@metadata']).not.toBeDefined();
		});

		it('should throw when type name is not a string', function() {
			expect(function() { raven.create(1); }).toThrow();
			expect(function() { raven.create({ }); }).toThrow();
		});

		it('should create an object with specified type name and generated pluaralized collection name if no second arg.', function() {
			var obj = raven.create('foo');
			expect(obj).toBeDefined();
			expect(obj['@metadata']['Raven-Clr-Type']).toBe('foo');
			expect(obj['@metadata']['Raven-Entity-Name']).toBe('foos');
		});
		
		it('should throw when collection name is not a string or bool', function() {
			expect(function() { raven.create('foo', 1); }).toThrow();
			expect(function() { raven.create('foo', { }); }).toThrow();
		});

		it('should create a object with specified raven clr-type and entity name.', function() {
			var obj = raven.create('foo', 'foobars');
			expect(obj).toBeDefined();
			expect(obj['@metadata']['Raven-Clr-Type']).toBe('foo');
			expect(obj['@metadata']['Raven-Entity-Name']).toBe('foobars');
		});
		
		it('should create a object with specified raven clr-type and non-pluralized singular entity name.', function() {
			var obj = raven.create('foo', false);
			expect(obj).toBeDefined();
			expect(obj['@metadata']['Raven-Clr-Type']).toBe('foo');
			expect(obj['@metadata']['Raven-Entity-Name']).toBe('foo');
		});
		
		it('should create a object with specified raven clr-type and pluralized entity name.', function() {
			var obj = raven.create('foo', true);
			expect(obj).toBeDefined();
			expect(obj['@metadata']['Raven-Clr-Type']).toBe('foo');
			expect(obj['@metadata']['Raven-Entity-Name']).toBe('foos');
		});
	});
});