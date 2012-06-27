var raven = require('./raven');

raven.server('http://localhost:8080');
var client = raven.connect();

var doc = {
	name: 'Ritesh',
	last: 'Rao'
};

client.save(doc, function(error) {
	console.log(error);
	doc = {
		name: 'Ritesh',
		last: 'Rao'
	};
	client.save(doc, function(error) {
		console.log(error);
	});
});