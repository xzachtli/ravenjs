var NestedQuery = require('../lib/NestedQuery');

describe('NestedQuery', function() {

	describe('.ctor', function() {

	});

	describe('creating query', function() {
		var returnObj = { },
			filterValue = '',
			cb = function(val) {
				filterValue = val;
			};

		var q;
		
		beforeEach(function() {
			q = new NestedQuery();
		});
		
		describe('general functionality and .toString', function() {
			it('should always return itself', function() {
				expect(q.where('baz').is('bar').and('foo').is('baz').or('foo').is('baz')).toBe(q);
			});
			
			it('should return empty string with no conditions', function() {
				expect(q.toString()).toBe('');
			});
			
			it('should build query and add parenthesis to group conditions', function() {
				expect(q.where('baz').is('bar').toString()).toBe('(baz:bar)');
				expect(q.and('foo').is('baz').toString()).toBe('(baz:bar AND foo:baz)');
				expect(q.or('Bar').is('Foo').toString()).toBe('(baz:bar AND foo:baz OR Bar:Foo)');
			});
		});

		describe('.where', function() {
			it('should throw when the value is undefined', function() {
				expect(function() { q.where(null); }).toThrow();
				expect(function() { q.where(undefined); }).toThrow();
			});

			it('should allow function to add nested query', function() {
				expect(q.where('baz').is('bar').toString()).toBe('(baz:bar)');
				expect(q.where(function(query) {
						query.where('Foo').is('Bar')
					}).toString()).toBe('(baz:bar AND (Foo:Bar))');
			});

			it('should allow function to add multiple nested queries', function() {
				expect(q.where('baz').is('bar').where(function(query) {
						query.where('Foo').is('Bar').where('Boo').is('Baz').where(function(query) {
							query.where('baz').is('foo').where('bar').is('boo');
						});
					}).toString()).toBe('(baz:bar AND (Foo:Bar AND Boo:Baz AND (baz:foo AND bar:boo)))');
			});
			
			it('should tolerate empty nesteds', function() {
				expect(q.where('baz').is('bar').where(function(query) { }).toString()).toBe('(baz:bar)');
			});
		});
		
		describe('.and', function() {
			it('should throw when the value is undefined', function() {
				expect(function() { q.and(null); }).toThrow();
				expect(function() { q.and(undefined); }).toThrow();
			});
			
			it('should throw if used before where()', function() {
				expect(function() { q.and('baz').is('bar').toString(); }).toThrow();
			});
			
			it('should allow function to add nested query', function() {
				expect(q.where('baz').is('bar').toString()).toBe('(baz:bar)');
				expect(q.and(function(query) {
						query.where('Foo').is('Bar')
					}).toString()).toBe('(baz:bar AND (Foo:Bar))');
			});
			
			it('should allow function to add multiple nested queries', function() {
				expect(q.where('baz').is('bar').and(function(query) {
						query.where('Foo').is('Bar').and('Boo').is('Baz').and(function(query) {
							query.where('baz').is('foo').and('bar').is('boo');
						});
					}).toString()).toBe('(baz:bar AND (Foo:Bar AND Boo:Baz AND (baz:foo AND bar:boo)))');
			});
			
			it('should tolerate empty nesteds', function() {
				expect(q.where('baz').is('bar').and(function(query) { }).toString()).toBe('(baz:bar)');
			});
		});
		
		describe('.or', function() {
			it('should throw when the value is undefined', function() {
				expect(function() { q.or(null); }).toThrow();
				expect(function() { q.or(undefined); }).toThrow();
			});
			
			it('should throw if used before where()', function() {
				expect(function() { q.or('baz').is('bar').toString(); }).toThrow();
			});
			
			it('should allow function to add nested query', function() {
				expect(q.where('baz').is('bar').toString()).toBe('(baz:bar)');
				expect(q.or(function(query) {
						query.where('Foo').is('Bar')
					}).toString()).toBe('(baz:bar OR (Foo:Bar))');
			});
			
			it('should allow function to add multiple nested queries', function() {
				expect(q.where('baz').is('bar').or(function(query) {
						query.where('Foo').is('Bar').or('Boo').is('Baz').or(function(query) {
							query.where('baz').is('foo').or('bar').is('boo');
						});
					}).toString()).toBe('(baz:bar OR (Foo:Bar OR Boo:Baz OR (baz:foo OR bar:boo)))');
			});
			
			it('should tolerate empty nesteds', function() {
				expect(q.where('baz').is('bar').or(function(query) { }).toString()).toBe('(baz:bar)');
			});
		});

	});
});