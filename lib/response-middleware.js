'use strict';

const validator = require('./validator');

module.exports = function (options) {
	options = options || {};

	return function (req, res, next) {
		const end = res.end;

		res.end = function () {
			let data;

			if (arguments[0] instanceof Buffer) {
				const encoding = typeof (arguments[1] == 'string') ? arguments[1] : 'utf8';
				data = arguments[0].toString(encoding);
			} else if (typeof (arguments[0] == 'string')) {
				data = arguments[0];
			}

			if (res.gangplank) {
				// response validator has already run
				end.apply(res, arguments);
			} else {

				// Don't crash if data isn't valid json
				let body = data;
				try {
					body = JSON.parse(body);
				} catch (ex) {
				}

				res.gangplank = validator.validateResponse(req, res, body, options.swaggerDefinition);

				if (res.gangplank.isValid) {
					end.apply(res, arguments);
				} else {
					next(res.gangplank.errors);
				}
			}
		}

		next();
	};
};
