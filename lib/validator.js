'use strict';

const Validator = require('jsonschema').Validator;
const expressUtility = require('./express-utility');

function validateRequest(req, url, method, swaggerDefinition, exceptions) {
	const routeInfo = expressUtility.getRouteInfo(url, method, swaggerDefinition);

	let gangplank = {
		params: {},
		isValid: true,
		errors: null,
	};

	if (routeInfo.definition) {
		if (routeInfo.definition.parameters) {
			let errors;
			routeInfo.definition.parameters.forEach(parameter => {
				const value = getValueFromRequest(req, parameter, routeInfo.pattern);

				if (typeof (value) !== 'undefined') {
					const result = validateValue(value, parameter.schema || parameter, swaggerDefinition);
					gangplank.params[parameter.name] = postCast(value, parameter.schema || parameter, result);

					if (result.errors.length > 0) {
						// Bad Parameter
						gangplank.isValid = false;
						gangplank.errors = gangplank.errors || [];
						gangplank.errors.push({
							parameter: parameter.name,
							errors: result.errors
						});
					}

				} else if (parameter.required) {
					// Missing Parameter
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

	// Route not found
	gangplank.isValid = false;
	gangplank.errors = [{
		route: url,
		notFound: true
	}];

	return gangplank;
}

function getValueFromRequest(request, parameterDefinition, routePattern) {
	const paramName = parameterDefinition.name;

	switch (parameterDefinition.in) {
		case 'path':
			return autoCast(expressUtility.getValueFromPath(request, paramName, routePattern), parameterDefinition);
		case 'query': {
			const value = expressUtility.getValueFromQuery(request, paramName);
			const valueOrDefault =
				typeof (value) == 'undefined' && !parameterDefinition.required ?
					parameterDefinition.default :
					value;
			return autoCast(valueOrDefault, parameterDefinition);
		}
		case 'header': {
			const value = expressUtility.getValueFromHeaders(request, paramName);
			const valueOrDefault =
				typeof (value) == 'undefined' && !parameterDefinition.required ?
					parameterDefinition.default :
					value;
			return autoCast(valueOrDefault, parameterDefinition);
		}
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
			if (typeof (value) == 'boolean') {
				return value;
			} else if (typeof (value) == 'string') {
				return value.toLowerCase() === 'true' || value.toLowerCase() === 'false' ?
					value.toLowerCase() === 'true' :
					value;
			} else {
				return value;
			}
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
	if (validationResult &&
		validationResult.errors.length === 0 &&
		parameterDefinition.type === 'string' &&
		(parameterDefinition.format === 'date' || parameterDefinition.format === 'date-time')
	) {
		return new Date(value);
	} else {
		return value;
	}
}

function validateValue(value, parameterSchema, swaggerDefinition) {
	const validator = new Validator();
	validator.addSchema(swaggerDefinition, '/');
	return validator.validate(value, parameterSchema);
}

module.exports = {
	validateValue,
	validateRequest,
	autoCast
};
