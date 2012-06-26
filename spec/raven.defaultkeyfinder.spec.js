var raven = require('../raven');

describe('raven.defaultKeyFinder', function() {

	it('should return undefined for undefined documents', function(){
		expect(raven.defaultKeyFinder()).toBe(undefined);
	});

	it('should return key from id property', function(){
		expect(raven.defaultKeyFinder({
			id: 'Foo'
		})).toBe('Foo');
	});

	it('should return key from Id property', function() {
		expect(raven.defaultKeyFinder({
			Id: 'Foo'
		})).toBe('Foo');
	});

	it ('should return undefined for no matched id properties', function() {
		expect(raven.defaultKeyFinder({
			Bar: 'Foo'
		})).toBe(undefined);
	});
});