var QueryRequest = require('../lib/QueryRequest'),
	nock = require('nock');

describe('QueryRequest', function() {

	var request;
	var responseData = {
							TotalResults:1,
							SkippedResults: 0,
							Results:
							[
								{ foo: 'foo'},
								{ foo: 'bar'}
							]
						};

	beforeEach(function() {
		request = new QueryRequest('foo', { host: 'http://localhost:81' });
	});

	describe('.collection', function() {

		it('should not throw when index name is not specified.', function() {
			delete request.indexName;
			expect(function() { request.collection('bar'); }).not.toThrow();
			expect(request.queryData.collection).toBe('bar');
		});
		
		it('should throw error when index name is specified', function() {
			expect(function() { request.collection('bar'); }).toThrow();
			expect(request.queryData.collection).not.toBeDefined();
		});
		
		it('should properly pluralize if using typeName instead of collectionName', function() {
			delete request.indexName;
			request.collection('bar', true);
			expect(request.queryData.collection).toBe('bars');
		});
	});
	
	describe('.lucene', function() {

		it('should throw when luceneQuery is undefined', function() {
			expect(function() { request.lucene(); }).toThrow();
			expect(function() { request.lucene(null); }).toThrow();
			expect(function() { request.lucene(undefined); }).toThrow();
		});

		it('should throw when luceneQuery is not string', function() {
			expect(function() { request.lucene({}, 'bar'); }).toThrow();
		});
		
		it('should throw when where is already used', function() {
			expect(function() { request.where('Foo').is('Bar').lucene('Foo:Bar'); }).toThrow();
		});
		
		it('should throw when lucene is already used', function() {
			expect(function() { request.lucene('Foo:Bar').lucene('Foo:Bar'); }).toThrow();
		});
		
		it('should apply query', function() {
			request.lucene('Foo:Bar');
			expect(request.queryData.query).toBeDefined();
			expect(request.queryData.query).toBe('Foo:Bar');
		});
	});

	describe('.where', function() {

		it('should throw when filter field name is undefined', function() {
			expect(function() { request.where(); }).toThrow();
			expect(function() { request.where(null); }).toThrow();
			expect(function() { request.where(undefined); }).toThrow();
		});

		it('should throw when filter field name is not string', function() {
			expect(function() { request.where({}, 'bar'); }).toThrow();
		});
		
		it('should throw when query is already used', function() {
			expect(function() { request.query('Foo:Bar').where('Foo').is('Bar'); }).toThrow();
		});
		
		it('should apply query filter', function() {
			request.where('Foo').is('Bar');
			expect(request.queryData.fluentQuery).toBeDefined();
			expect(request.queryData.fluentQuery.toString()).toBe('(Foo:Bar)');
		});
	});

	describe('.and', function() {
		
		it('should throw when filter field name is undefined', function() {
			expect(function() { request.and(); }).toThrow();
			expect(function() { request.and(null); }).toThrow();
			expect(function() { request.and(undefined); }).toThrow();
		});

		it('should throw when filter field name is not string', function() {
			expect(function() { request.and({}, 'bar'); }).toThrow();
		});

		it('should throw when and() is called before where().', function() {
			expect(function() { request.and('foo', 'bar'); }).toThrow();
		});

		it('should assign where filter to query data', function() {
			request
				.where('foo').is('bar')
				.and('bar').is('baz');

			expect(request.queryData.fluentQuery).toBeDefined();
			expect(request.queryData.fluentQuery.toString()).toBe('(foo:bar AND bar:baz)');
		});
	});
	
	describe('.or', function() {
		
		it('should throw when filter field name is undefined', function() {
			expect(function() { request.and(); }).toThrow();
			expect(function() { request.and(null); }).toThrow();
			expect(function() { request.and(undefined); }).toThrow();
		});

		it('should throw when filter field name is not string', function() {
			expect(function() { request.and({}, 'bar'); }).toThrow();
		});

		it('should throw when or() is called before where().', function() {
			expect(function() { request.and('foo', 'bar'); }).toThrow();
		});

		it('should assign where filter to query data', function() {
			request
				.where('foo').is('bar')
				.or('bar').is('baz');

			expect(request.queryData.fluentQuery).toBeDefined();
			expect(request.queryData.fluentQuery.toString()).toBe('(foo:bar OR bar:baz)');
		});
	});

	describe('.select', function() {

		it('should throw when no select arguments are specified.', function() {
			expect(function() { request.select(); }).toThrow();
		});

		it('should throw when any selcet argument is not valid.', function() {
			expect(function() {
				request.select('Foo', 1, { bar: 'baz' });
			}).toThrow();
			expect(request.queryData.select).not.toBeDefined();
		});

		it('should set select filters for query', function() {
			request.select('foo', 'bar');
			expect(request.queryData.select).toBeDefined();
			expect(request.queryData.select.length).toBe(2);
			expect(request.queryData.select[0]).toBe('foo');
			expect(request.queryData.select[1]).toBe('bar');
		});
	});

	describe('.orderBy', function() {

		it('should throw when order by field is undefined', function(){
			expect(function() { request.orderBy(); }).toThrow();
			expect(function() { request.orderBy(null); }).toThrow();
			expect(function() { request.orderBy(undefined); }).toThrow();
		});

		it('should add field to query order by', function() {
			request.orderBy('foo');
			expect(request.queryData.orderBy).toBe('foo');
		});
	});

	describe('.orderByDescending', function() {

		it('should throw when order by field is undefined', function(){
			expect(function() { request.orderByDescending(); }).toThrow();
			expect(function() { request.orderByDescending(null); }).toThrow();
			expect(function() { request.orderByDescending(undefined); }).toThrow();
		});

		it('should add field with descending operator to query order by', function() {
			request.orderByDescending('foo');
			expect(request.queryData.orderBy).toBe('-foo');
		});
	});

	describe('.skip', function() {

		it('should throw when argument is not a valid number', function() {
			expect(function() { request.skip(); }).toThrow();
			expect(function() { request.skip(null); }).toThrow();
			expect(function() { request.skip(undefined); }).toThrow();
			expect(function() { request.skip('foo'); }).toThrow();
			expect(function() { request.skip({foo: 1}); }).toThrow();
		});

		it('should set query skip count', function() {
			request.skip(10);
			expect(request.queryData.skip).toBe(10);
		});

		it('should not set skip when skip count is 0', function() {
			request.skip(0);
			expect(request.queryData.skip).not.toBeDefined();
		})
	});

	describe('.take', function() {

		it('should throw when argument is not a valid number', function() {
			expect(function() { request.take(); }).toThrow();
			expect(function() { request.take(null); }).toThrow();
			expect(function() { request.take(undefined); }).toThrow();
			expect(function() { request.take('foo'); }).toThrow();
			expect(function() { request.take({foo: 1}); }).toThrow();
		});

		it('should set query take count', function() {
			request.take(10);
			expect(request.queryData.take).toBe(10);
		});

		it('should not set take when take count is 0', function() {
			request.take(0);
			expect(request.queryData.take).not.toBeDefined();
		});
	});

	describe('.results', function() {

		it ('should request specified index results', function(done){
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo')
				.reply(200, responseData, { 'content-type': 'application/json; charset=utf-8' });

			request.results(function(error, data) {
				expect(error).not.toBeDefined();
				expect(data).toBeDefined();
				expect(data.Results.length).toBe(2);
				ravendb.done();
				done();
			});
		});

		it('should resolve promise with specified index results', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo')
				.reply(200, responseData, { 'content-type': 'application/json; charset=utf-8'});

			request
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
					expect(data.Results.length).toBe(2);
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});
		
		it('should request index with query filter', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?query=Baz%3ABoo')
				.reply(200, responseData);

			request
				.lucene('Baz:Boo')
				.results(function(error, data) {
					expect(error).not.toBeDefined();
					expect(data).toBeDefined();
					ravendb.done();
					done();
				});
		});

		it('should resolve promise and request index with query filter', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?query=Baz%3ABoo')
				.reply(200, responseData);

			request
				.lucene('Baz:Boo')
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should request index with where filter', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?query=(Baz%3ABoo)')
				.reply(200, responseData);

			request
				.where('Baz').is('Boo')
				.results(function(error, data) {
					expect(error).not.toBeDefined();
					expect(data).toBeDefined();
					ravendb.done();
					done();
				});
		});

		it('should resolve promise and request index with where filter', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?query=(Baz%3ABoo)')
				.reply(200, responseData);

			request.where('Baz').is('Boo')
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		})

		it('should throw when index name is not specified and no collection or filters specified', function(){
			delete request.indexName;
			expect(function() {
				request.results(function(error, data) { });
			}).toThrow();
		});

		it('should request dynamic index for collection.', function(done) {
			delete request.indexName;
			var ravendb = nock('http://localhost:81')
				.get('/indexes/dynamic/foo')
				.reply(200, responseData);

			request.collection('foo').results(function(error, data) {
				expect(error).not.toBeDefined();
				expect(data).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and request dynamic index for collection', function(done) {
			delete request.indexName;
			var ravendb = nock('http://localhost:81')
				.get('/indexes/dynamic/foo')
				.reply(200, responseData);

			request.collection('foo')
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				});
		});	
		
		it('should request dynamic index for typeName.', function(done) {
			delete request.indexName;
			var ravendb = nock('http://localhost:81')
				.get('/indexes/dynamic/foos')
				.reply(200, responseData);

			request.collection('foo', true).results(function(error, data) {
				expect(error).not.toBeDefined();
				expect(data).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and request dynamic index for typeName', function(done) {
			delete request.indexName;
			var ravendb = nock('http://localhost:81')
				.get('/indexes/dynamic/foos')
				.reply(200, responseData);

			request.collection('foo', true)
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				});
		});

		it('should request dynamic index for query', function(done) {
			delete request.indexName;
			var ravendb = nock('http://localhost:81')
				.get('/indexes/dynamic?query=(foo%3Abar)')
				.reply(200, responseData);

			request
				.where('foo').is('bar')
				.results(function(error, data) {
					expect(error).not.toBeDefined();
					expect(data).toBeDefined();
					ravendb.done();
					done();
				});
		});

		it('should resolve promise and request dynamic index for query', function(done) {
			delete request.indexName;
			var ravendb = nock('http://localhost:81')
				.get('/indexes/dynamic?query=(foo%3Abar)')
				.reply(200, responseData);

			request.where('foo').is('bar')
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				});
		});

		it('should request query with multiple where filters', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?query=(Baz%3ABoo%20AND%20Bar%3ABaz)')
				.reply(200, responseData);

			request
				.where('Baz').is('Boo')
				.and('Bar').is('Baz')
				.results(function(error, data) {
					expect(error).not.toBeDefined();
					expect(data).toBeDefined();
					ravendb.done();
					done();
				});
		});

		if ('should resolve promise and request query with multiple where filters', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?query=(Baz%3ABoo%20AND%20Bar%3ABaz)')
				.reply(200, responseData);

			request
				.where('Baz').is('Boo')
				.and('Bar').is('Baz')
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				});
		});

		it('should request query with select values', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?fetch=Foo&fetch=Bar')
				.reply(200, responseData);

			request.select('Foo', 'Bar')
				.results(function(error, data) {
					expect(error).not.toBeDefined();
					expect(data).toBeDefined();
					ravendb.done();
					done();
				});
		});

		if('should resolve promise and query with select values', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?fetch=Foo&fetch=Bar')
				.reply(200, responseData);

			request.select('Foo', 'Bar')
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				});
		});

		it('should request query with ordering', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?sort=Bar')
				.reply(200, responseData);

			request.orderBy('Bar').results(function(error, data) {
				expect(error).not.toBeDefined();
				expect(data).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and query with ordering', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?sort=Bar')
				.reply(200, responseData);

			request.orderBy('Bar')
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should request query with descending order', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?sort=-Bar')
				.reply(200, responseData);

			request.orderByDescending('Bar').results(function(error, data) {
				expect(error).not.toBeDefined();
				expect(data).toBeDefined();
				ravendb.done();
				done();
			});
		});

		if ('should resolve promise and query with descending order', function(data) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?sort=-Bar')
				.reply(200, responseData);

			request.orderByDescending('Bar')
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should request query with skip count', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?start=1')
				.reply(200, responseData);

			request.skip(1).results(function(error, data) {
				expect(error).not.toBeDefined();
				expect(data).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and query with skip count', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?start=1')
				.reply(200, responseData);

			request.skip(1).results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should request query with take count', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?pageSize=20')
				.reply(200, responseData);

			request.take(20).results(function(error, data) {
				expect(error).not.toBeDefined();
				expect(data).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should resolve promise and query with take count', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?pageSize=20')
				.reply(200, responseData);

			request.take(20)
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(data).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});

		it('should request query with all operators', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?query=(foo%3Abar%20AND%20bar%3Abaz)&fetch=foo&sort=bar&start=10&pageSize=100')
				.reply(200, responseData);
			
			request
				.where('foo').is('bar')
				.and('bar').is('baz')
				.select('foo')
				.orderBy('bar')
				.skip(10)
				.take(100)
				.results(function(error, data) {
					expect(error).not.toBeDefined();
					expect(data).toBeDefined();
					ravendb.done();
					done();
				});
		});

		it('should resolve promise and query with all operators', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/indexes/foo?query=(foo%3Abar%20AND%20bar%3Abaz)&fetch=foo&sort=bar&start=10&pageSize=100')
				.reply(200, responseData);

			request.where('foo').is('bar')
				.and('bar').is('baz')
				.select('foo')
				.orderBy('bar')
				.skip(10)
				.take(100)
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function(){
					ravendb.done();
					done();
				})
				.done();
		})
		
		it('should generate complex WHERE/AND query', function(done) {
			var ravendb = nock('http://localhost:81')
				.filteringPath(function(path) {	
					expect(path).toEqual('/indexes/foo?query=(foo%3Abar%20AND%20(Boo%3AFoo%20AND%20faz%3Abuz)%20AND%20bar%3Abaz)');
					return '/alwaysWorks'
				})
				.get('/alwaysWorks')
				.reply(200, responseData);
				
			request
				.where('foo').is('bar')
				.where(function(query) {
					query.where('Boo').is('Foo').and('faz').is('buz');
				}).and('bar').is('baz')
				.results(function(error, data) {
					ravendb.done();
					done();
				});
		});

		it('should resolve promise and generate complex WHERE/AND query', function(done) {
			var ravendb = nock('http://localhost:81')
				.filteringPath(function(path) {	
					expect(path).toEqual('/indexes/foo?query=(foo%3Abar%20AND%20(Boo%3AFoo%20AND%20faz%3Abuz)%20AND%20bar%3Abaz)');
					return '/alwaysWorks'
				})
				.get('/alwaysWorks')
				.reply(200, responseData);

			request.where('foo').is('bar')
				.where(function(query) {
					query.where('Boo').is('Foo').and('faz').is('buz');
				})
				.and('bar').is('baz')
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});
		
		it('should generate complex WHERE/OR query', function(done) {
			var ravendb = nock('http://localhost:81')
				.filteringPath(function(path) {
					expect(path).toEqual('/indexes/foo?query=(foo%3Abar%20OR%20(Boo%3AFoo%20OR%20faz%3Abuz)%20OR%20bar%3Abaz)');
					return '/alwaysWorks'
				})
				.get('/alwaysWorks')
				.reply(200, responseData);
				
			request
				.where('foo').is('bar')
				.or(function(query) {
					query.where('Boo').is('Foo').or('faz').is('buz');
				}).or('bar').is('baz')
				.results(function(error, data) {
					ravendb.done();
					done();
				});
		});

		it('should resolve promise and generate complex WHERE/OR query', function(done) {
			var ravendb = nock('http://localhost:81')
				.filteringPath(function(path) {
					expect(path).toEqual('/indexes/foo?query=(foo%3Abar%20OR%20(Boo%3AFoo%20OR%20faz%3Abuz)%20OR%20bar%3Abaz)');
					return '/alwaysWorks'
				})
				.get('/alwaysWorks')
				.reply(200, responseData);

			request.where('foo').is('bar')
				.or(function(query) { query.where('Boo').is('Foo').or('faz').is('buz');})
				.or('bar').is('baz')
				.results()
				.then(function(data) {
					expect(data).toBeDefined();
				})
				.fail(function(error) {
					expect(error).not.toBeDefined();
				})
				.fin(function() {
					ravendb.done();
					done();
				})
				.done();
		});
	});
});