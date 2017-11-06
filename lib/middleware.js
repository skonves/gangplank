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
			if (options.response) {
				const fn = res.end;
				res.end = function () {
					if (!res.gangplank) {
						res.gangplank = validator.validateResponse(req, res, arguments, req.url, req.method, options.swaggerDefinition, options.exceptions);

						if (res.gangplank.isValid) {
							fn.apply(res, arguments);
						} else {
							next({ code: 'GANGPLANK_ERRORS', scope: 'RESPONSE' });
						}
					} else {
						fn.apply(res, arguments);
					}
				};
			}
			next();
		} else {
			next({ code: 'GANGPLANK_ERRORS', scope: 'REQUEST' });
		}
	};
};
