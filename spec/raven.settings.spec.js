var raven = require('../raven.js');

describe('when setting raven', function() {

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
	})

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
		})
	})

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
		})
	}); 
});