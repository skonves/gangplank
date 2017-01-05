'use strict';

const validator = require('./validator');

module.exports = function (options) {
	options = options || {};

	return function (req, res, next) {
		req.gangplank = validator.validateRequest(req, req.url, req.method, options.swaggerDefinition, options.exceptions);

		if (req.gangplank.isValid) {
			next();
		} else {
			next(req.gangplank.errors);
		}
	};
};
