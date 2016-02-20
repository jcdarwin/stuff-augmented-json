var config  = require('./config.json'),
	fs      = require('fs'),
	path    = require('path'),
	poll    = require('./lib/poll'),
	express = require('express')

function die(msg){
	console.log(msg);
	process.exit(1);
}

var app = new (require('express'))()
var port = process.env.PORT || config.port
var url = process.env.url || config.url;

console.log('port: ' + port);
console.log('url: ' + url);

if (url.indexOf('http') == 0){
	url = url.replace(/^.*\/\//, '');
}
var parts = url.match(/^([^\/]+)(.*)$/);
if (parts === null){
	die('Invalid URL supplied: ' + url);
}

var file = process.env.file || config.file || 'data/_json.json'

// Start polling the JSON feed
var polling = poll({
	url: {
		host: parts[1],
		path: parts[2],
		headers: {
			'user-agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.22 (KHTML, like Gecko) Ubuntu Chromium/25.0.64.160 Chrome/25.0.1364.160 Safari/537.22'
		}
	},
	mtime: '',
	interval: 60000,
	file: file,
	verbose: true
});

app.get("/", function(req, res) {
	// Have we got a cached version of the feed?
	if (fs.statSync(path.join(__dirname, 'data/_json.json')).isFile()) {
		res.setHeader('Content-Type', 'application/json');
		res.sendFile(path.join(__dirname, 'data/_json.json'));
	} else {
		polling.then(function(){
			res.setHeader('Content-Type', 'application/json');
			res.sendFile(path.join(__dirname, 'data/_json.json'));
		}, function(e){
			die('Invalid response: ' + e);
		});
	}
})

app.listen(port, function(error) {
	if (error) {
	  console.error(error)
	} else {
	  console.info("==> 🌎  Listening on port %s.", port)
	}
})
