# Faux

First you will need to create a file called `keys.config` it should take the form:

```
exports.keys = {
	client_id : 'YOUR CLIENT ID',
	client_secret : 'YOUR SECRET',
	redirect_uri : 'http://localhost:8888/callback'
}
```

run `npm install`

may also need to run:
```
	npm install express
	npm install request
	npm install cookie-parser
	npm install mongodb
	npm install mongoose
```


then run `node app.js`


Then open http://localhost:8888 in your browser.
