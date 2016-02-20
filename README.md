# What is this?

This is a server that retrieves the stuff.co.nz JSON feed at a given interval,
augmenting it with the **most popular** information (viewed and shared).

## Installation

	npm install

## Configuration

Refer config.json

## Usage

	npm start

To retrieve the augmented JSON, browse to http://localhost:5000

## Deployment

We use dokku, so deployment is as easy as:

	git remote add dokku dokku@dokku.mebooks.co.nz:stuff-augmented-json

	git push dokku master

Note that dokku wil want us to serve our app on a specific port, so we need to
check `process.env.PORT`.

Once deployed, we can visit our app at http://stuff-augmented-json.dokku.mebooks.co.nz/

We can also find more information about our app on our dokku box:

	// ssh into the dokku box using PKA
	ssh root@dokku.mebooks.co.nz

	// display all dokku commands
	dokku

	// display our latest log messages (console.log) for our app
	dokku logs stuff-augmented-json

	// disable our app
	dokku disable stuff-augmented-json

	// enable our app
	dokku enable stuff-augmented-json

	// display the deployed app
	ls -al /home/dokku/stuff-augmented-json

### How it works

	* Start polling for the JSON based on `config.interval`
	* GET the JSON from `config.url`. By default no `mtime` is specified on the initial request.
	* Scrape the home page for the **most popular** information and add this to the JSON.
	* Store the results in `config.file || 'data/_json.json'`
	* Extract the `mtime` value for use on the next GET.
		* If this `mtime` is different to the last one, GET immediately.
		* If `mtime` hasn't changed, wait 60s.
	* Serve the augmented JSON from `config.file || 'data/_json.json'`
