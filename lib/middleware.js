'use strict';

const validator = require('./validator');

module.exports = function (options) {
	options = options || {};

	return function (req, res, next) {
		var x = validator.validate(req, options.swaggerDefinition, options.exceptions);

		if (x) {
			next(x);
		} else {
			next();
		}
	};
};
