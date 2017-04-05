'use strict';

const validator = require('./validator');

module.exports = function (options) {
	options = options || {};

	if (!options.swaggerDefinition) {
		throw new Error('options must contain swaggerDefinition');
	}

	return function (req, res, next) {
		req.gangplank = validator.validateRequest(req, req.url, req.method, options.swaggerDefinition, options.exceptions);

		if (req.gangplank.isValid) {
			next();
		} else {
			next({ code: 'GANGPLANK_ERRORS' });
		}
	};
};
