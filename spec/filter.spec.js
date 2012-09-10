var filter = require('../lib/filter.js');

describe('filter', function() {

	describe('.ctor', function() {
		
		it('should throw when field is undefined', function() {
			expect(function() { filter(undefined); }).toThrow();
			expect(function() { filter(null); }).toThrow();
		});

		it('should throw when field is not a string', function() {
			expect(function() { filter({}); }).toThrow();
		});
	});

	describe('value', function() {

		it('should throw when value is undefined', function() {
			expect(function() { filter('foo').value(undefined); }).toThrow();
			expect(function() { filter('foo').value(null); }).toThrow();
		});

		it('should return a valid value filter', function() {
			expect(filter('foo').value('bar')).toBe('foo:bar');
		});
	});

	describe('or', function() {

		it('should throw when values is undefined', function() {

			expect(function() { filter('foo').or(undefined); }).toThrow();
			expect(function() { filter('foo').or(null); }).toThrow();
		});

		it('should throw when values is not an array', function() {
			expect(function() { filter('foo').or('bar'); }).toThrow();
		});

		it('should return valid or filter with a single value', function() {
			expect(filter('foo').or(['bar']))
				.toBe('(foo:bar)');
		});

		it('should return valid or filter with multiple values', function() {
			expect(filter('foo').or(['bar', 'baz']))
				.toBe("(foo:bar OR foo:baz)");
		});
	});

	describe('and', function() {

		it('should throw when values is undefined', function() {

			expect(function() { filter('foo').and(undefined); }).toThrow();
			expect(function() { filter('foo').and(null); }).toThrow();
		});

		it('should throw when values is not an array.', function() {

			expect(function() { filter('foo').and({}); }).toThrow();
		});

		it('should return valid and filter with a single value.', function() {
			expect(filter('foo').and(['bar']))
				.toBe('(foo:bar)');
		});

		it('should return valid and filter with multiple values', function() {
			expect(filter('foo').and(['bar', 'baz']))
				.toBe('(foo:bar AND foo:baz)');
		});
	});
});