# What is this?

This is a server that retrieves the stuff.co.nz JSON feed at a given interval,
augmenting it with the **most popular** information (viewed and shared).

## Installation

		npm install

## Configuration

Refer config.json

## Usage

		npm start

To retrieve the augmented JSON, browse to http://localhost:9000

### How it works

	* Start polling for the JSON based on `config.interval`
	* GET the JSON from `config.url`. By default no `mtime` is specified on the initial request.
	* Scrape the home page for the **most popular** information and add this to the JSON.
	* Store the results in `config.file || 'data/_json.json'`
	* Extract the `mtime` value for use on the next GET.
		* If this `mtime` is different to the last one, GET immediately.
		* If `mtime` hasn't changed, wait 60s.
	* Serve the augmented JSON from `config.file || 'data/_json.json'`
