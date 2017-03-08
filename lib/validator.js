'use strict';

const Validator = require('jsonschema').Validator;
const expressUtility = require('./express-utility');

function validateRequest(req, url, method, swaggerDefinition, exceptions) {
	const routeInfo = expressUtility.getRouteInfo(url, method, swaggerDefinition);

	let gangplank = {
		params: {},
		isValid: true,
		errors: null,
	}

	if (routeInfo.definition) {
		if (routeInfo.definition.parameters) {
			let errors;
			routeInfo.definition.parameters.forEach(parameter => {
				const value = getValueFromRequest(req, parameter, routeInfo.pattern);

				if (typeof (value) !== 'undefined') {
					const result = validateValue(value, parameter.schema || parameter, swaggerDefinition.definitions);
					gangplank.params[parameter.name] = postCast(value, parameter.schema || parameter, result);

					if (result.errors.length > 0) {
						gangplank.isValid = false;
						gangplank.errors = gangplank.errors || [];
						gangplank.errors.push({
							parameter: parameter.name,
							errors: result.errors
						});
					}

				} else if (parameter.required) {
					gangplank.isValid = false;
					gangplank.errors = gangplank.errors || [];
					gangplank.errors.push({
						parameter: parameter.name,
						location: parameter.in,
						notFound: true
					});
				}
			});

			return gangplank;
		} else {
			return gangplank;
		}
	} else if (Array.isArray(exceptions) && exceptions.length > 0) {
		for (let i = 0; i < exceptions.length; i++) {
			if ((new RegExp(exceptions[i])).test(expressUtility.getBaseRoute(url))) {
				return gangplank;
			}
		}
	}

	gangplank.isValid = false;
	gangplank.errors = [{
		route: url,
		notFound: true
	}];

	return gangplank;
}

function validateResponse(req, res, body, swaggerDefinition) {
	const routeInfo = expressUtility.getRouteInfo(req.url, req.method, swaggerDefinition);

	let gangplank = {
		params: {},
		isValid: true,
		errors: null,
	}

	if (!routeInfo) {
		return gangplank;
	}

	const responseSpec = routeInfo.definition.responses['' + res.statusCode] || routeInfo.definition.responses['default'];

	if (!responseSpec) {
		gangplank.isValid = false;
		gangplank.errors = gangplank.errors || [];
		gangplank.errors.push({
			message: 'Response is not specified for status code and no default response is specified.'
		});
		return gangplank;
	}

	const headers = responseSpec.headers;
	const schema = responseSpec.schema;

	if (headers) {
		Object.keys(headers).forEach(headerName => {
			const headerSpec = headers[headerName];
			const rawValue = res.get(headerName);
			const value = autoCast(rawValue, headerSpec);

			if (typeof (value) !== 'undefined') {
				gangplank.headers = gangplank.headers || {};
				gangplank.headers[headerName] = value;

				const result = validateValue(value, headerSpec, swaggerDefinition.definitions);

				if (result.errors.length > 0) {
					gangplank.isValid = false;
					gangplank.errors = gangplank.errors || [];
					gangplank.errors.push({
						header: headerName,
						errors: result.errors
					});
				}

			} else {
				gangplank.isValid = false;
				gangplank.errors = gangplank.errors || [];
				gangplank.errors.push({
					header: headerName,
					notFound: true
				});
			}
		});
	}

	if (schema) {
		if (typeof (body) !== 'undefined') {
			const result = validateValue(body, schema.schema || schema, swaggerDefinition.definitions);

			if (result.errors.length > 0) {
				gangplank.isValid = false;
				gangplank.errors = gangplank.errors || [];
				gangplank.errors.push({
					errors: result.errors
				});
			}

		} else {
			gangplank.isValid = false;
			gangplank.errors = gangplank.errors || [];
			gangplank.errors.push({
				message: 'body is missing'
			});
		}
		return gangplank;
	} else if (body) {
		gangplank.isValid = false;
		gangplank.errors = gangplank.errors || [];
		gangplank.errors.push({
			message: 'unexpected body'
		});
	}

	return gangplank;
}

function getValueFromRequest(request, parameterDefinition, routePattern) {
	const paramName = parameterDefinition.name;

	switch (parameterDefinition.in) {
		case 'path':
			return autoCast(expressUtility.getValueFromPath(request, paramName, routePattern), parameterDefinition);
		case 'query':
			return autoCast(expressUtility.getValueFromQuery(request, paramName), parameterDefinition);
		case 'header':
			return autoCast(expressUtility.getValueFromHeaders(request, paramName), parameterDefinition);
		case 'body':
			return expressUtility.getValueFromBody(request, paramName);
		case 'form':
			return expressUtility.getValueFromBody(request, paramName);
	}
}

function autoCast(value, parameterDefinition) {
	switch (parameterDefinition.type) {
		case 'array': {
			let values;

			switch (parameterDefinition.collectionFormat) {
				case 'ssv':
					values = value.split(' ');
					break;
				case 'tsv':
					values = value.split('\t');
					break;
				case 'pipes':
					values = value.split('|');
					break;
				case 'csv':
				default:
					values = value.split(',');
					break;
			}

			const result = values.map(v => {
				return autoCast(v, parameterDefinition.items);
			});

			return result;
		}
		case 'boolean': {
			return value.toLowerCase() === 'true' || value.toLowerCase() === 'false' ? value.toLowerCase() === 'true' : value;
		}
		case 'integer': {
			const result = Number(value);
			return Number.isInteger(result) ? result : value;
		}
		case 'number': {
			const result = Number(value);
			return Number.isNaN(result) ? value : result;
		}
		case 'null': {
			return value;
		}
		case 'object': {
			try {
				return JSON.parse(value);
			} catch (ex) {
				return value;
			}
		}
		case 'string': {
			return value;
		}
	}
}

function postCast(value, parameterDefinition, validationResult) {
	if (validationResult && validationResult.errors.length === 0 && parameterDefinition.type === 'string' && (parameterDefinition.format === 'date' || parameterDefinition.format === 'datetime')) {
		return new Date(value);
	} else {
		return value;
	}
}

function validateValue(value, parameterSchema, definitions) {
	const validator = new Validator();

	Object.keys(definitions || {}).forEach(key => {
		validator.addSchema(reroot(definitions[key]), `/definitions/${key}`);
	});

	return validator.validate(value, reroot(parameterSchema));
}

function reroot(schema) {
	return JSON.parse(JSON.stringify(schema).replace(/:"#\//, ':"/'));
}

module.exports = {
	validateValue,
	validateRequest,
	validateResponse,
	autoCast
};
