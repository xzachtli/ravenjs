//ravenjs Guide
//========================

//Getting Started
//===============
//ravenjs is available as a NPM module. Use npm to install the ravenjs package:
//`npm install ravenjs`

//Import the ravenjs module
var raven = require('ravenjs');

//Configuration
//=============


//Using a connection string
//-------------------------
raven.connectionString('Url=http://localhost:80;Database=FooDB;UserName=Foo;Password=**;ApiKey=**');
//Use the standard ravendb connection string format (case sensitive):

//*	Url: The ravendb server host url. Only http and https URL schemes are supported.

//*	Database: *Optional* RavenDB Tennant to connect to.

//*	UserName: *Optional* Username credentials to use to connect to the server.

//*	Password: *Optional* Password credentials to use to conenct to the server.

//*	ApiKey: *Optional* Server ApiKey to use for authentication.

//**NOTE:** If both User and Password and ApiKey is provided, the User and Password crdedentials are preferred.

//Individual configuration options
//--------------------------------

//Configure the RavenDB Host to connect to. Accepts a fully qualified URL incuding port no.
raven.host('http://localhost:80');

//The database tennant to conenct to.
raven.database('FooDb');

//The Username credentials to use when connecting to the server.
raven.username('FooUser');

//The Password credentials to use when connecting to the server.
raven.password('*****');

//The ApiKey to use when connecting to the server.
raven.apiKey('****');

//The proxy server to use for conencting to the server. Only http and https URL schemes are supported.
raven.proxy('http://foooproxy:8080');

//Enable optimistic concurrency mode. Default is false.
raven.useOptimisticConcurrency(true);

//Specify a custom id finder function. The document is provided as a single argument to the function
//and expects a string return value.
raven.idFinder(function(doc) {
	if (doc.id) return doc.id;
	if (doc.Id) return doc.Id;
});

//Specify a custom id generator function. The document and a callback function are provided as arguments to
//the function. The callback expects two arguments: Error, if any, and the generated id.
//**NOTE:** The default id generator uses the HiLoIdGenerator part of ravenjs to generate new ids.
raven.idGenerator(function(doc, callback) {
	var id; //generate a new id...
	callback(undefined, id);
});

//Environment specific configuration
//----------------------------------

//ravenjs supports arbitary environment specific configuration ala Expressjs. Use the `configure()`
//method to specify environment specific configurations. The first argument to `configure()` is the
//environment name for which the callback function should be executed.
raven.configure('development', function() {
	raven.connectionString('Url=http://localhost:80')
		.useOptimisticConcurrency(true);
});

//Creating a ravenjs connection
//=============================

//Once ravenjs is configured, you can use the `connect` method to create a client conenction.
var client = raven.connect();

//`connect(opts)` accepts an options parameter that can be used to override the default
//configuration settings of ravenjs.
var client = raven.connect({
	database:'FooDb',
	useOptimisticConcurrency: true
});

//Document Operations
//===================

//Get a document by id
//--------------------
client.get('foo', function(error, doc) {
	console.log(doc);
});

//Use the `client.get(id, callback)` method to get a document by it's id. The callback is invoked
//with two arguments:

//* error: Any error that occured while trying get the document.
//* doc: The actual document.

//Saving / Updating a document
//---------------

//Use the `client.save([id], doc, callback)` to save the document.
client.save('person/1', doc, function(error) {
	console.log(error);
});

//The id parameter is optional, and if it's not provided ravenjs uses the default id finder to find the current id of the document.
//If ravenjs cannot find an id, and it's not an existing document, a new id is assigned to it using the configured id generator.
client.save(doc, function(error) {
	console.log(error);
});

//Deleting a document
//-------------------

//Use the `client.remove(obj, callback)` to delete the document by passing the document id.
client.remove('person/1', function(error) {
	console.log(error);
});

//Optionally you can pass in an existing document retrieved using the `get` method to delete
client.remove(doc, function(error) {
	console.log(error);
});

//Index Operations
//================

//Index operations are accessible by the `client.index(indexName)` fluent method. the `index` method
//returns a raven request wrapper that can be used to operate on indexes.

//Creating a new index
//--------------------

//Use the `map()` and/or `reduce()` methods to specify the index map/reduce definition and invoke
//`create()` to create the index
client.index('CityPopulation')
	.map('from doc in docs select new {doc.Address.City, Count = 1}')
	.reduce('from result in results group result by result.City into g select new {City = g.Key, Count = g.Sum(x => x.Count)}')
	.create(function(error) {
		console.log(error);
	});

//Deleting an existing index
//--------------------------

//Use the `remove(callback)` method on the index wrapper request to delete an index.
client.index('CityPopulation').remove(function(error) {
	console.log(error);
});

//Query Operations
//================

//Query operations are accessible by the `client.query` fluent method. The `query` method returns a
//raven requst wrapper that can be used to issue queries on the server. Invoking the subsequent `results`
//method issues the query and invokes the provided callback with the data / error returned from the server.

//Querying an index
//-----------------

//Specify the index name when invoking `client.query()` method to query that index
client.query('CityPopulation').results(function(error, data) {
	console.log('Total Results : ' + data.TotalResults);
});

//Query filtering, sorting, projections and paging
//-----------------------------------

//Use the `where(fieldName, fieldValue)` method to spcify a query filter
client.query('CityPopulation')
	.where('City', 'Boston')
	.results(function(error, data) {
		console.log('Total Population of Boston: ' + data.Results[0].Count);
	});

//You can chain filters using additional `where` or `and` filters
client.query('Albums')
	.where('Title', '*Great*')
	.and('Genre.Name', 'Rock')
	.results(function(error, data) {
		console.log('Total Rock Albums where title contains Great:' + data.TotalResults);
	});

//Use the `orderBy(fieldName)` to sort results
client.query('Albums')
	.where('Genre.Name', 'Rock')
	.orderBy('Title')
	.results(function(error, data) {
		for(var album in data.Results) {
			console.log(album.Title);
		}
	});

//You can also sort descending
client.query('Albums')
	.where('Genre.Name', 'Rock')
	.orderByDescending('Title')
	.results(function(error, data) {
		for(var album in data.Results) {
			console.log(album.Title);
		}
	});

//Use the `select([field,...]` to specify query projections.
client.query('Albums')
	.select('Title', 'Genre.Name')
	.results(function(error, data) {
		for(var album in data.Results) {
			console.log(util.format('Album %s is of %s genre', album.Title, album.Name));
		}
	});

//Use the `skip(n)` and `take(n)` methods for paging
client.query('Albums')
	.skip(10)
	.take(10)
	.results(function(error, data) {
		for(var album in data.Results) {
			console.log(album.Title);
		}
	});

//Dynamic Queries
//---------------

//ravenjs also supports dynamic queries. Use the same `query()` method wrapper on the client without
//an index name to indicate you want to issue a dynamic query. **NOTE** When issuing a dynamic query,
//you must specify at issue specify at least one `where` filter or specify a collection to query using
//the `collection()` method.

//Issue a dynamic query on a collection
client.query().collection('Persons').results(function(error, data) {
	for(var person in data.Results) {
		console.log(person.firstName);
	}
});

//Issue a dynamic query using a where filter
client.query().where('Artist.Name', 'U2').results(function(error, data) {
	console.log('Total Albums by U2: ' + data.TotalResults);
});

//Attachment Operations
//=====================

//Attachment operations are accessible using the `query.attachment(id)` wrapper method. The
//`attachment` method returns a raven request wrapper that can be used to work with attachments.

//Getting an attachment
//---------------------

//Use the `get(callback)` method to get an attachment by it's id. the callback is invoked with
//an object containing two properties:
//* data - buffer containing the attachment data.
//* headers - any headers stored along with the attachment.
client.attachment('IMG001.jpg', function(error, data) {
	fs.writeFile('IMG001.jpg', data, function(err) {
		console.log('Saved IMG001!');
	});
});

//Saving an attachment
//--------------------

//Use the `save(opts, callback)` method to save an attachment to the server. The method takes
//The opts argument should be an option containing two members:

//*	data - A buffer containing the attachment data to save.
//*	[headers] - Optional. An object containing the headers to store along with the attachment.
fs.readFile('IMG001.jpg', function(err, data) {
	if (err) throw err;
	client.attachment('IMG001.jpg').save({ data: data}, function(error) {
		console.log('Image saved!');
	});
});

//Deleting an attachment
//----------------------

//Use the `delete(callback)` method to delete an attachment.
client.attachment('ING001.jpg', function(error) {
	console.log('Image deleted!');
});

//Utilities
//=========

//`raven.collection(collectionName)`
//----------------------------------

//Creates a new object and assigns the Raven-Entity-Name metadata to the newly created
//object.
var video = raven.create('Videos');
video.Title = 'Foo Bar';
client.save(video, function(error) {
	console.log('Video Saved!');
});

//`raven.defaultIdFinder`
//-----------------------

//Default id finder function used by ravenjs to discover id's of a document.
function defaultIdFinder(doc) {
	if (!doc) return undefined;
	if (doc['@metadata'] && doc['@metadata']['@id']) return doc['@metadata']['@id'];
	if (doc.hasOwnProperty('id')) return doc.id;
	if (doc.hasOwnProperty('Id')) return doc.Id;
}

//`raven.defaultIdGenerator`
//--------------------------

//Default id generator function used by ravenjs to generate id's for a document when saving.
//The default id generator uses the built in HiLoIdGenerator to generate an id.
function defaultIdGenerator(settings, callback) {
	if (!settings) throw Error('Expected a valid setings object.');
	if (!settings.host) throw Error('Invalid settings. Expected host property.');
	if (!callback || !_(callback).isFunction) throw Error('Exepected a valid callback function.');

	var generator = new HiLoIdGenerator(settings);
	generator.nextId(function(error, id) {
		if (error) return callback(error);
		return callback(undefined, id.toString());
	});
}