'use strict';

const Validator = require('jsonschema').Validator;
const expressUtility = require('./express-utility');

function validate(req, url, method, swaggerDefinition, exceptions) {
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
				const value = getValue(req, parameter, routeInfo.pattern);

				if (typeof (value) !== 'undefined') {
					gangplank.params[parameter.name] = value;
					const result = validateValue(value, parameter.schema || parameter, swaggerDefinition.definitions);

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

function getValue(request, parameterDefinition, routePattern) {
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
	validate,
	autoCast
};
