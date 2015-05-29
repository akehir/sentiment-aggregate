var http = require('http');
var express = require('express');
var twitter = require('ntwitter');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
// Twitter keys registered for url: http://sentimentanalysis-demo-akehir.eu-gb.mybluemix.net/
// Created at: https://dev.twitter.com/apps
var tweeter = new twitter({
	consumer_key: 'Wr7nCnCWW6K9VTc8BZFkmfRp4',
	consumer_secret: 'z1yZAinkZwnGiAAICgmU8RRYdUaQ1L9JnL6SGG8oipMF9rEFzt',
	access_token_key: '72076928-DJyqqtOMpyFbpkLdBvIob3DfDarSeulSGZCdKvWU2',
	access_token_secret: 'xkfNyQvB9DqIMK6sqgaTo7t7Jd5xUf3WH67wdT5NzpmPj'
});

var params = {screen_name: 'nodejs'};
tweeter.get('statuses/user_timeline', params, function(error, tweets, response){
  if (!error) {
    console.log(tweets);
  }
  console.log("out"+error);
});


var app = express();
// Configure the app web container
app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));
});
