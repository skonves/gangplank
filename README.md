# Gangplank
Robust, unopinionated, spec-driven validation for Swagger and Express APIs

* Robust: Heavily tested to support Swagger (aka OpenAPI) v2.0
* Unopinionated: Works as an Express middleware without forcing any particular code patterns or error message formats.
* Spec-driven: Facilitates rigorously defining an API spec once in a machine readable format, and then using that spec to perform all validation without needing to hand-write or generate any more validation code.

## Quick Start
1. Install using npm: `npm install gangplank`

1. Add middleware:

	``` js
	var spec = require('./swagger.json');
	app.use(gangplank.requests({ swaggerDefinition: spec }));
	```

1. Add error handler:

	``` js
	// Gangplank's default error handler returns errors in a JSON API style schema
	// (See below more info)
	app.use(gangplank.errorHandler);
	```

Everything put together:

``` js
var express = require('express');
var gangplank = require('gangplank');

var app = express();

var spec = require('./swagger.json');
app.use(gangplank.requests({ swaggerDefinition: spec }));

// TODO: register routes here

// Gangplank's default error handler returns errors in a JSON API style schema
// (See below more info)
app.use(gangplank.errorHandler);

app.listen(3000, function () {
	console.log(`listening on port 3000`);
});
```

## Parameter Access

Gangplank provides access to validated, type-cast parameters on the request via `req.gangplank.params`.  For example, an integer parameter passed via the query string is guarenteed to be a valid value and will be cast to a `Number` object.  This precludes some of the most common boilerplate code in ExpressJS route handlers: guard clauses for validating and casting parameters.  Additionally, all parameters from all sources (path, query, body, header, and/or forms) are included in this single object.  Parameter values can still be retrieved from their original locations (eg. `req.params`, `req.get()` etc), but those values will be in their original string format.

Example swagger.json:

``` json
{
	"swagger": "2.0",
	"paths": {
		"/users/{id}/widgets": {
			"get": {
				"parameters": [
					{
						"name": "id",
						"in": "path",
						"type": "string",
						"required": true
					},
					{
						"name": "offset",
						"in": "query",
						"type": "integer",
						"required": false,
						"default": 100,
						"minimum": 1,
						"maximum": 1000
					},
					{
						"name": "limit",
						"in": "query",
						"type": "integer",
						"required": false,
						"default": 0,
						"minimum": 0
					}
				]
			}
		}
	}
}
```

The associated route handler is as simple as:

``` js
app.get('/users/:id/widgets', (req, res, next) => {
	const userId = req.gangplank.params.id;      // String
	const offset = req.gangplank.params.offset;  // Number
	const limit = req.gangplank.params.limit;    // Number

	// TODO: add logic here

	res.status(501).send();
});
```

In the above example, the value of `userId` is trivially just the string value from the path, but `offset` and `limit` will be `Number` objects guarenteed to be within the correct range.  Also, because they are not required and have default values, if the consumer does not include them in the query string, `offset` and `limit` will contain their respective default values.


Note that while Gangplank will include the body parameter, `body-parser` or another similar middleware must be run before `app.use(gangplank.requests(options));` in order for the body content to be accessible.  If the body is not parsed, it will not be found and will likely fail validation due to a missing parameter.

## Error handling

In the event that a request does not validate per `swagger.json`, the request validation middleware will pass an Array containing all errors to the `next()` function.  Validation errors will occur for one of three reasons:

### Route not found
The request verb and URI do not match an operation defined in the spec.

``` json
{
	"route": "/users/12345/billing-info",
	"notFound": true
}
```

Note that even if a route handler is added to the Express `app`, if the operation verb and path are not defined in `swagger.json`, Gangplank will consider the route to not exist.  Conversely, if the an operation is defined in `swagger.json` but not in the Express `app`, Gangplank will not create an error object, and Express will handle it with its default missing route behavior. 

### Missing parameter
The request does not contain a parameter defined as required in the spec.

``` json
{
	"parameter": "id",
	"location": "path",
	"notFound": true
}
```

### Bad parameter
A parameter is contained in the request, but does not meet the criteria in the spec.

``` json
{
	"parameter": "id",
	"errors": []
}
```

The Swagger 2.0 specification is largely based on JSON Schema v4, and Gangplank relies heavily on the `jsonschema` package under the hood to perform validation.  Because of this, the `errors` property in a Bad Parameter error is simply a collection of errors returned from the json schema validator.

## Default Error Handler
By default, Gangplank is very unopinionated in how validation errors are handled.  Errors are passed as an array via the `next()` function which allows developers to implement error handling in their preferred idiomatic Express style.  However, for convenience, Gangplank includes an error handling middleware that converts the Gangplank error objects to the JSON API Error format:

``` js
app.use(gangplank.errorHandler);
```

## Response validation

Validation of response messages is on the road map for this project, but has not yet been implemented.

## Contributing
// TODO