'use strict';

const Validator = require('jsonschema').Validator;
//const utils = require('./validator-utils');
const expressUtility = require('./express-utility');

function validateRequest(req, url, method, swaggerDefinition, exceptions) {
	const routeInfo = expressUtility.getRouteInfo(url, method, swaggerDefinition);

	if (routeInfo.definition) {
		// Route found
		if (routeInfo.definition.parameters && routeInfo.definition.parameters.length) {
			const values = expressUtility.getValuesFromRequest(req, routeInfo.definition.parameters, routeInfo.pattern);
			return validateWithParameters(values, routeInfo.definition.parameters, routeInfo.pattern, swaggerDefinition);
		} else {
			return validateWithoutParameters();
		}
	} else {
		// Route not found
		if (isException(url, exceptions)) {
			return validateAsRouteException();
		} else {
			return validateAsRouteNotFound(url);
		}
	}
}

/**
 * Determines if the current route is an exception and thus will not be considered missing.
 * @param {string} url
 * @param {Array<string>} exceptions
 */
function isException(url, exceptions) {
	if (exceptions && Array.isArray(exceptions)) {
		for (let i = 0; i < exceptions.length; i++) {
			if ((new RegExp(exceptions[i])).test(expressUtility.getBaseRoute(url))) {
				// Found exception
				return true;
			}
		}
	}
	return false;
}

function validateWithParameters(values, parameters, routePattern, swaggerDefinition) {
	const gangplank = {
		params: {},
		errors: [],
		isValid: true
	};
	parameters.forEach(parameter => {
		let value = getValueOrDefault(values[parameter.name], parameter);

		if (typeof (value) !== 'undefined') {
			value = preCast(value, parameter);
			const result = validateValue(value, parameter.schema || parameter, swaggerDefinition);
			if (result && !result.errors.length) {
				value = postCast(value, parameter.schema || parameter);
			}

			gangplank.params[parameter.name] = value;

			if (result.errors.length > 0) {
				gangplank.isValid = false;
				gangplank.errors.push({
					parameter: parameter.name,
					errors: result.errors
				});
			}

		} else if (parameter.required) {
			gangplank.isValid = false;
			gangplank.errors.push({
				parameter: parameter.name,
				location: parameter.in,
				notFound: true
			});
		}
	});

	return gangplank;
}

function validateWithoutParameters() {
	return {
		params: {},
		errors: [],
		isValid: true,
	};
}

function validateAsRouteException() {
	return {
		params: {},
		errors: [],
		isValid: true,
	};
}

function validateAsRouteNotFound(url) {
	return {
		params: {},
		errors: [{
			route: url,
			notFound: true
		}],
		isValid: false
	};
}

function getValueOrDefault(value, parameterDefinition) {
	if (typeof (value) === 'undefined' && !parameterDefinition.required) {
		return parameterDefinition.default;
	} else {
		return value;
	}
}

/** Casts raw values from the request before they are validated */
function preCast(value, parameterDefinition) {
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
				return preCast(v, parameterDefinition.items);
			});

			return result;
		}
		case 'boolean': {
			if (typeof (value) == 'string') {
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
		case 'object': {
			try {
				return JSON.parse(value);
			} catch (ex) {
				return value;
			}
		}
		default: {
			return value;
		}
	}
}

/** Casts values AFTER validated to support string formats */
function postCast(value, parameterDefinition) {
	const type = parameterDefinition.type;
	const format = parameterDefinition.format;
	if (type === 'string' && (format === 'date' || format === 'date-time')) {
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
	validateRequest,
	isException,
	validateWithParameters,
	validateWithoutParameters,
	validateAsRouteException,
	validateAsRouteNotFound,
	validateValue,
	getValueOrDefault,
	preCast,
	postCast,
	autoCast: preCast // TODO: REMOVE THIS!!
};
