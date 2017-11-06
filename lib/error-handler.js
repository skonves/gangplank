'use strict';

const uuid = require('uuid');

module.exports = function errorHandler(err, req, res, next) {
	if (err.code === 'GANGPLANK_ERRORS' && !res.headersSent) {
		if (err.scope === 'REQUEST') {
			let errors = [];
			let code = 200;

			req.gangplank.errors.forEach(error => {
				if (error.route && error.notFound) {
					const e = {
						id: uuid.v4(),
						code: 'ROUTE_NOT_FOUND',
						status: '404',
						title: 'Route not found',
						details: `Route '${req.method} ${error.route}' could not be found.  Refer to docs for a complete list of routes.`
					};

					errors.push(e);
					code = Math.max(404, code);
				} else if (error.parameter && error.notFound) {
					const e = {
						id: uuid.v4(),
						code: 'MISSING_PARAMETER',
						status: '400',
						title: 'Missing required parameter',
						details: `Required parameter '${error.parameter}' could not be found in ${error.location}.`,
						source: {
							parameter: error.parameter
						}
					};

					errors.push(e);
					code = Math.max(400, code);
				} else if (error.parameter && Array.isArray(error.errors)) {
					error.errors.forEach(validationError => {
						const instanceName = validationError.property.replace('instance', error.parameter);
						const instanceType = instanceName === error.parameter ? 'Parameter' : 'Property';
						const instanceValueDisplay =
							typeof (validationError.instance) === 'undefined' ?
								' ' :
								` (${validationError.instance}) `;

						const e = {
							id: uuid.v4(),
							code: 'BAD_REQUEST',
							status: '400',
							title: 'Request value is invalid',
							details: `${instanceType} '${instanceName}'${instanceValueDisplay}${validationError.message}.`,
							source: {
								// TODO: return valid JSON Path for body parameters
								// SEE: http://jsonapi.org/format/#errors
								parameter: error.parameter
							}
						};

						errors.push(e);
					});
					code = Math.max(400, code);
				}
			});
			res.status(code).send({ errors });
		} else if (err.scope === 'RESPONSE') {
			const errors = res.gangplank.errors.map(error => {
				switch (error.type) {
					case 'INVALID_HEADER':
						return {
							id: uuid.v4(),
							code: 'INVALID_RESPONSE_HEADER',
							status: '500',
							title: 'Response header is invalid. (INTERNAL SERVER ERROR)',
							details: 'TODO',
							source: {
								parameter: error.name
							}
						};
					case 'MISSING_HEADER':
						return {
							id: uuid.v4(),
							code: 'MISSING_RESPONSE_HEADER',
							status: '500',
							title: 'Required response header is missing. (INTERNAL SERVER ERROR)',
							details: 'TODO',
							source: {
								parameter: error.name
							}
						};
					case 'INVALID_BODY':
						return {
							id: uuid.v4(),
							code: 'INVALID_RESPONSE_BODY',
							status: '500',
							title: 'Response body is invalid. (INTERNAL SERVER ERROR)',
							details: 'TODO',
							source: {}
						};
					case 'INVALID_STATUS':
						return {
							id: uuid.v4(),
							code: 'INVALID_RESPONSE_CODE',
							status: '500',
							title: 'Undefined response for status code. (INTERNAL SERVER ERROR)',
							details: `No response is defined for status code '${error.value}' and no default response is defined.`,
							source: {}
						};
				}
			});
			res.status(500).json({ errors });
		}
	}
	next(err);
};
