# Gangplank
Robust, unopinionated, spec-driven validation for Swagger and Express APIs

* Robust: Heavily tested to support Swagger (aka OpenAPI) v2.0
* Unopinionated: Works as an Express middleware without forcing any particular code patterns or error message formats.
* Spec-driven: Facilitates rigorously defining an API spec once in a machine readable format, and then using that spec to perform all validation without needing to hand-write or generate any more validation code.

## Quick Start
1. Install using npm: `npm install gangplank`;

1. Add middleware:

	``` js
	var spec = require('./swagger.json');
	app.use(gangplank.requests({ swaggerDefinition: spec }));
	```

1. Add error handler:

	``` js
	// Included handler returns errors in a JSON API style schema
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

// Included handler returns errors in a JSON API style schema
// (See below more info)
app.use(gangplank.errorHandler);

app.listen(3000, function () {
	console.log(`listening on port 3000`);
});
```

## Parameter Access

One of the common boilerplate features of route handlers is code to find and validate incoming parameters.
Additionally, numeric parameters that are passed via the query string or in a header need to be cast as
a `Number`.  Route handlers also tend to become responsible for enforcing default values.

Take for example the following route handler:

``` js
app.get('/accounts/:id/orders', (req, res) => {
	const accountId = req.params.id;
	const offset = Number(req.query.offset || 0);
	const limit = Number(req.query.limit || 25);

	if (offset >= 0 && limit > 0 && limit <= 100) {
		res.status(400).json({ message: 'Bad request' });
	} else {
		ordersSerivce.getOrders(accountId, offset, limit, (err, result) => {
			if (err) {
				res.status(500).json({ message: 'Error fetching orders' });
			} else {
				res.status(200).json({ orders: result.orders });
			}
		});
	}
});
```

The bulk of that route handler focuses on something other that it's main purpose: to get orders.

By specifying those parameters in swagger, Gangplank will not only find, convert, and/or validate parameters
from the request, but it will add a `gangplank` object to the request which contains the validated parameters cast to
their correct types.

The previous example can be simplified as follows:

``` js
app.get('/accounts/:id/orders', (req, res) => {
	const accountId = req.gangplank.params.id;
	const offset = req.gangplank.params.offset;
	const limit = req.gangplank.params.limit;

	ordersSerivce.getOrders(accountId, offset, limit, (err, result) => {
		if (err) {
			res.status(500).json({ message: 'Error fetching orders' });
		} else {
			res.status(200).json({ orders: result.orders });
		}
	});
});
```

This this example, `offset` and `limit` don't need to be converted as they will be in the correct range and will have 
default values set if they were not passed by the consumer.

## Request validation
// TODO

## Response validation
// TODO

## Custom Error handling
// TODO

## Contributing
// TODO