'use strict';

var fs      = require('fs'),
	cheerio = require('cheerio'),
	http    = require('http'),
	moment  = require('moment'),
	path    = require('path'),
	Q       = require('q')

function die(msg){
	console.log(msg);
	process.exit(1);
}

function bind(){
	var args = Array.prototype.slice.call(arguments, 0);
	var func = args.shift();
	return function(){
		func.apply(this, args);
	};
}

function crawl(url, mtime){
	return Q.promise(function(resolve, reject, notify) {
		if (mtime) {
			if (url.path.indexOf('mtime') < 0){
				url.path = url.path + '&mtime=' + mtime;
			}else{
				url.path = url.path.replace(/mtime=\d+/, 'mtime=' + mtime);
			}
		}

		http.get(url, function(res){
			var data = '';
			res.on('data', function(d){
				data += d;
			});
			res.on('end', function(){
				var j = undefined;
				try{
					j = JSON.parse(data);
				}catch(ex){
					console.log('Exception: [[' + ex + ']]');
					j = {mtime: mtime};
				}

				j.stories.forEach(function(item){
					item.datetime_unix = moment(item.datetime_iso8601).unix()
				})

				resolve(j);
			});
		}).on('error', function(e){
			die('Fatal: ' + e.message);
		});

	});
}

function scrape(url) {
	return Q.promise(function(resolve, reject, notify) {
		http.get(url, function(res){
			var html = '';
			res.on('data', function(d){
				html += d;
			});
			res.on('end', function(){
				var popular = {};
				try{

					var $ = cheerio.load(html);

					var $mostPopular = $('#most_popular')
					var viewed = [];
					$mostPopular.find('#viewed .icon-story').each(function(index, element){
						var $element = $(this)
						var href = $element.attr('href')
						var id = parseInt(href.replace(/^.*\/([0-9]{8,})\/.*$/, '$1'))
						viewed.push({
							id: id,
							url: href,
							title: $element.text().trim()
						});
					})

					var shared = [];
					$mostPopular.find('#shared .icon-story').each(function(index, element){
						var $element = $(this)
						var href = $element.attr('href')
						var id = parseInt(href.replace(/^.*\/([0-9]{8,})\/.*$/, '$1'))
						shared.push({
							id: id,
							url: href,
							title: $element.text().trim()
						});
					})

					popular = {
						viewed: viewed,
						shared: shared
					}
				}catch(ex){
					console.log('Exception: [[' + ex + ']]');
				}
				resolve(popular);
			});
		}).on('error', function(e){
			die('Fatal: ' + e.message);
		});
	});
}

function poll(options) {
	var url = options.url || die('Fatal: url option must be supplied');;
	var mtime = options.mtime;
	var interval = options.interval || die('Fatal: interval option must be supplied');;
	var file = options.file || die('Fatal: file option must be supplied');
	var verbose = options.verbose

	return crawl(url, mtime)
		.then(function(j){
			if (j.mtime !== mtime){
				// Assumption: If mtime hasn't changed, there are no new stories.
				// Note: It's possible that there are no new stories even if mtime HAS changed.
				options.mtime = j.mtime;
				var urlToScrape = Object.assign({}, url)
				urlToScrape.path = '/'
				return scrape(urlToScrape).then(function(popular){
					// See if we can match our popular items to stories, and if so,
					// replace the popular item data with the story data.
					var storyLookupById = j.stories.reduce(function(previous, current){
						previous[current['id']] = current
						return previous
					}, {})

					j.stories = j.stories.map(function(item){
						item.urlHtml = item.url.replace(/\/_json/, '')
						return item
					})

					popular.viewed = popular.viewed.map(function(item){
						if (storyLookupById[item.id]) {
							return storyLookupById[item.id]
						} else {
							item.datetime_unix = moment(item.datetime_iso8601).unix()
							return item
						}
					})

					popular.shared = popular.shared.map(function(item){
						if (storyLookupById[item.id]) {
							return storyLookupById[item.id]
						} else {
							item.datetime_unix = moment(item.datetime_iso8601).unix()
							return item
						}
					})

					j.popular = popular;
					return Q.promise(function(resolve, reject, notify) {
						 fs.writeFile(file, JSON.stringify(j), 'utf8', function(){
							setTimeout(
								bind(poll, options),
								interval
							);
							verbose && console.log('\nmtime ' + j.mtime + ' at ' + (new Date()) + ' (' + j.stories.length + ' stories)');
							resolve();
						 });
					});
				});

			} else {
				verbose && console.log('\nmtime ' + j.mtime + ' at ' + (new Date()) + ' (no new stories)');
				setTimeout(
					bind(poll, options),
					interval
				);
			}
		})
}

exports = module.exports = poll;
