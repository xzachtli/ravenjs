var raven = require('./raven');

raven.server('http://localhost:8080');
var client = raven.connect();

client.get('bar23', function(error, doc) {
	console.log(doc);
	doc.Price = 200;
	client.save(doc, function(error) {
		console.log(error);
	});
});