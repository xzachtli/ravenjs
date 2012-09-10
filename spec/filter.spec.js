var filter = require('../lib/filter.js');

describe('filter', function() {

	describe('.ctor', function() {

		it ('should throw when the that argument is undefined', function() {
			expect(function() {
				filter(null, 'Foo', function() { });
			}).toThrow();

			expect(function() {
				filter(undefined, 'Foo', function() { });
			}).toThrow();
		});

		it('should throw when the field argument is undefined', function() {
			expect(function() {
				filter({ }, undefined, function() { });
			}).toThrow();

			expect(function() {
				filter({ }, null, function() { });
			}).toThrow();

			expect(function() {
				filter({ }, '', function() { });
			}).toThrow();
		});

		it ('should throw when the callback argument is undefined', function() {
			expect(function() {
				filter({ }, 'Foo', undefined);
			}).toThrow();

			expect(function() {
				filter({ }, 'Foo', null);
			}).toThrow();
		});
	});

	describe('when filtering', function() {
		var returnObj = { },
			filterValue = '',
			cb = function(val) {
				filterValue = val;
			};

		var f = filter(returnObj, 'Foo', cb);

		describe('.is', function() {

			it('should throw when the value is undefined', function() {
				expect(function() { f.is(null); }).toThrow();
				expect(function() { f.is(undefined); }).toThrow();
			});

			it('should return the passed in return object', function() {
				expect(f.is('Bar')).toBe(returnObj);
			});

			it('should invoke the callback with query filter value', function() {
				f.is('Bar');
				expect(filterValue).toBe('Foo:Bar');
			});

			it('should invoke the callback with query filter with AND operator', function() {
				f.is(['Bar', 'Baz']);
				expect(filterValue).toBe('(Foo:Bar AND Foo:Baz)');
			});

		});

		describe('.isEither', function() {
			it ('should throw when the value is undefined', function() {
				expect(function() { f.isEither(null); }).toThrow();
				expect(function() { f.isEither(undefined); }).toThrow();
			});

			it ('should throw when value is not an array', function() {
				expect(function() { f.isEither('Foo'); }).toThrow();
				expect(function() { f.isEither({}); }).toThrow();
			});

			it('should return the passed in return object', function() {
				expect(f.isEither(['Bar', 'Baz'])).toBe(returnObj);
			});

			it('should invoke the callback with OR query filter value', function() {
				f.isEither(['Bar', 'Baz']);
				expect(filterValue).toBe('(Foo:Bar OR Foo:Baz)');
			});

			it('should invoke the callback with a single query filter', function() {
				f.isEither(['Bar']);
				expect(filterValue).toBe('Foo:Bar');
			});
		});

	});
});