var raven = require('../raven'),
	HiLoIdGenerator = require('../lib/hiloIdGenerator');

describe('raven', function() {

	describe('.server', function() {

		it('should throw when value is not a string', function() {
			expect(function() { raven.server(1234); }).toThrow();
		});

		it('should throw when value does not start with http or https', function() {
			expect(function() { raven.server('ftp://foobar'); }).toThrow();
			expect(function() { raven.server('bar'); }).toThrow();
		});

		it('should set the server setting for http', function() {
			raven.server('http://foobar');
			expect(raven.server()).toBe('http://foobar');
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

		it('should set server', function() {
			raven.connectionString('Url=http://localhost:80');
			expect(raven.server()).toBe('http://localhost:80');
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

	describe('raven.defaultIdFinder', function() {

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
			var data = { };
			data['@id'] = 'foo';
			expect(raven.defaultIdFinder(data)).toBe('foo');
		});

		it ('should return undefined for no matched id properties', function() {
			expect(raven.defaultIdFinder({
				Bar: 'Foo'
			})).toBe(undefined);
		});
	});

	describe('raven.defaultIdGenerator', function() {

		it('should throw when settings is null', function() {
			expect(function(){ raven.defaultIdGenerator(null); }).toThrow();
		});

		it('should throw when setting does not have a server property', function() {
			expect(function(){ raven.defaultIdGenerator({ }, null); }).toThrow();
		});

		it('should throw when callback is null', function() {
			expect(function() { raven.defaultIdGenerator({ server: 'foo' }); }).toThrow();
		});

		it('should return error when hilo generator returns error', function(done) {
			
			spyOn(HiLoIdGenerator.prototype, 'nextId')
				.andCallFake(function(cb) { cb(new Error('Failed')); });

			raven.defaultIdGenerator({ server: 'foo'}, function(error, id) {
				expect(error).toBeDefined();
				expect(error.message).toBe('Failed');
				expect(id).not.toBeDefined();
				done();
			});
		});

		it('should return id from hilo generator', function(done) {
			spyOn(HiLoIdGenerator.prototype, 'nextId')
				.andCallFake(function(cb) { cb(undefined, 123); });

			raven.defaultIdGenerator({ server: 'foo' }, function(error, id) {
				expect(error).not.toBeDefined();
				expect(id).toBe('123');
				done();
			});
		});
	});
});