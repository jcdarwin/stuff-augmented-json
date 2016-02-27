var config   = require('./config.json'),
    compress = require('compression'),
    fs       = require('fs'),
    path     = require('path'),
    poll     = require('./lib/poll'),
    express  = require('express')

function die(msg){
    console.log(msg);
    process.exit(1);
}

var app = new (require('express'))();
app.use(compress());

var port = process.env.PORT || config.port;
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
    try {
        fs.access(path.join(__dirname, 'data/_json.json'), fs.F_OK, function(err) {
            if (!err) {
                res.setHeader('Content-Type', 'application/json');
                res.header('Access-Control-Allow-Origin', '*');

                fs.readFile(path.join(__dirname, 'data/_json.json'), function(err, data){
                    if (err) {
                        die('Error reading json: ' + e);
                    }

                    // Return only the number of stories requested
                    var limit = parseInt(req.query.limit);
                    if (limit) {
                        var j = JSON.parse(data);
                        j.stories.splice(limit);
                        j.popular.viewed.splice(limit);
                        j.popular.shared.splice(limit);
                        data = JSON.stringify(j);
                    }

                    res.end(data);
                });

            } else {
            }
        });
    } catch(e) {
        polling.then(function(){
            res.setHeader('Content-Type', 'application/json');
            res.header('Access-Control-Allow-Origin', '*');
            res.sendFile(path.join(__dirname, 'data/_json.json'));
            res.end();
        }, function(e){
            die('Invalid response: ' + e);
        });
    }

})

app.get("/healthcheck", function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.end('alive');
})

app.listen(port, function(error) {
    if (error) {
      console.error(error)
    } else {
      console.info("==> 🌎  Listening on port %s.", port)
    }
})
