var utils = require('../lib/utils.js');

describe('utils', function() {

	describe('.isString()', function() {
		it('should return false for undefined', function() {
			expect(utils.isString(undefined)).not.toBeTruthy();
		});

		it('should return false for null', function() {
			expect(utils.isString(null)).not.toBeTruthy();
		});

		it('should return false for object', function() {
			expect(utils.isString({ })).not.toBeTruthy();
		});

		it('should return false for function', function() {
			expect(utils.isString(function() { })).not.toBeTruthy();
		});

		it('should return false for number', function() {
			expect(utils.isString(1)).not.toBeTruthy();
		});

		it('should return true for strings', function() {
			expect(utils.isString('Foo')).toBeTruthy();
		});
	});

	describe('.isNumber()', function() {
		it('should return false for undefined', function() {
			expect(utils.isNumber(undefined)).not.toBeTruthy();
		});

		it('should return false for null', function() {
			expect(utils.isNumber(null)).not.toBeTruthy();
		});

		it('should return false for string', function() {
			expect(utils.isNumber('1')).not.toBeTruthy();
		});

		it('should return false for object', function() {
			expect(utils.isNumber({ })).not.toBeTruthy();
		});

		it('should return false for function', function() {
			expect(utils.isNumber(function() { })).not.toBeTruthy();
		});

		it('should return true for number', function() {
			expect(utils.isNumber(1)).toBeTruthy();
		});
	});

	describe('.isFunction()', function() {
		it('should return false for undefined', function() {
			expect(utils.isFunction(undefined)).not.toBeTruthy();
		});

		it('should return false for null', function() {
			expect(utils.isFunction(null)).not.toBeTruthy();
		});

		it('should return false for string', function() {
			expect(utils.isFunction('Foo')).not.toBeTruthy();
		});

		it('should return false for number', function() {
			expect(utils.isFunction(1)).not.toBeTruthy();
		});

		it('should return false for object', function() {
			expect(utils.isFunction({ })).not.toBeTruthy();
		});

		it('should return true for function', function() {
			expect(utils.isFunction( function() { })).toBeTruthy();
		});
	});

	describe('.isObject()', function() {
		it('should return false for undefined', function() {
			expect(utils.isObject(undefined)).not.toBeTruthy();
		});

		it('should return false for null', function() {
			expect(utils.isObject(null)).not.toBeTruthy();
		});

		it('should return false for string', function() {
			expect(utils.isObject('Fooo')).not.toBeTruthy();
		});

		it('should return false for function', function() {
			expect(utils.isObject(function() { })).not.toBeTruthy();
		});

		it('should return false for number', function() {
			expect(utils.isObject(1)).not.toBeTruthy();
		});

		it('should return true for object', function() {
			expect(utils.isObject({ })).toBeTruthy();
		});
	});

	describe('.clone()', function() {
		it('should return original value if source is not an object', function() {
			var cloned = utils.clone(1);
			expect(cloned).toBe(1);
		});

		it('should create a cloned array when source is an array', function() {
			var source = ['foo', 'bar'];
			var cloned = utils.clone(source);
			expect(cloned).toBeDefined();
			expect(cloned.length).toBe(2);

			cloned.push('baz');
			expect(source.length).toBe(2);
			expect(cloned.length).toBe(3);
		});

		it('should create a cloned object when source is an object', function() {
			var source = { firstName: 'foo' };
			var cloned = utils.clone(source);
			expect(cloned).toBeDefined();
			expect(cloned.firstName).toBeDefined();
			expect(cloned.firstName).toBe(source.firstName);

			cloned.firstName = 'Baz';
			expect(source.firstName).toBe('foo');
		});
	});
});