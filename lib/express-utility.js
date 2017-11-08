'use strict';

function getRouteInfo(url, method, swaggerDefinition) {
	const route = getBaseRoute(url);

	const pattern = Object.keys(swaggerDefinition.paths).find(key => {
		return doesRouteMatch(key, route);
	}) || Object.keys(swaggerDefinition.paths).find(key => {
		return doesRouteMatch(swaggerDefinition.basePath + key, route);
	});

	let definition;

	const pathMethods = swaggerDefinition.paths[pattern];

	if (pathMethods) {
		definition = pathMethods[method.toLowerCase()];
	}

	replaceRefParams(definition, swaggerDefinition);

	return {
		pattern,
		definition
	};
}

function getResponseInfo(url, method, statusCode, swaggerDefinition) {
	console.log('=============>', url, method, statusCode);
	const routeInfo = getRouteInfo(url, method, swaggerDefinition);
	console.log('=============>', JSON.stringify(routeInfo, null, '  '));
	const responseInfo = routeInfo.definition.responses[`${statusCode}`] || routeInfo.definition.responses.default;
	return responseInfo && responseInfo.$ref ? resolveJsonPointer(responseInfo.$ref, swaggerDefinition) : responseInfo;
}

// TODO: consider using a library for this
function resolveJsonPointer(jpath, object) {
	return jpath.split('/')
		.reduce((obj, segment) => segment === '#' ? object : (obj || {})[segment], object);
}

function replaceRefParams(routeDefinition, swaggerDefinition) {
	((routeDefinition || {}).parameters || []).forEach((parameter, i) => {
		if (parameter.$ref && parameter.$ref.indexOf('#/parameters/' == 0)) {
			routeDefinition.parameters[i] = swaggerDefinition.parameters[parameter.$ref.substr('#/parameters/'.length)];
		}
	});

	return routeDefinition;
}

function doesRouteMatch(routePattern, route) {
	const regex = new RegExp('^' + routePattern.replace(/\{([^\/]*?)\}/g, '[^\/]*?') + '$', 'g');
	return regex.test(route);
}

function getBaseRoute(url) {
	const route = ~url.indexOf('?') ? url.substr(0, url.indexOf('?')) : url;
	return route.endsWith('/') ? route.substr(0, route.length - 1) : route;
}

function getRouteParams(routePattern, route) {
	const regex1 = new RegExp('^' + routePattern.replace(/\{.*?\}/g, '\{(.*?)\}') + '$', 'g');
	const regex2 = new RegExp('^' + routePattern.replace(/\{.*?\}/g, '(.*?)') + '$', 'g');

	var names = regex1.exec(routePattern);
	var values = regex2.exec(route);

	var params = {};

	for (let i = 1; i < names.length; i++) {
		params[names[i]] = values[i];
	}

	return params;
}

function getValueFromPath(request, paramName, routePattern) {
	//return request.params[paramName];
	var route = getBaseRoute(request.url);
	return getRouteParams(routePattern, route)[paramName];
}

function getValueFromQuery(request, paramName) {
	const key = Object.keys(request.query).filter(param => param.toLowerCase() === paramName.toLowerCase())[0];
	return key ? request.query[key] : undefined;
}

function getValueFromHeaders(request, paramName) {
	return request.get(paramName);
}

function getValueFromBody(request, paramName) {
	return request.body || {};
}

function getValuesFromRequest(request, parameterDefinitions, routePattern) {
	const values = {};

	parameterDefinitions.forEach(parameterDefinition => {
		const paramName = parameterDefinition.name;

		switch (parameterDefinition.in) {
			case 'path':
				values[paramName] = getValueFromPath(request, paramName, routePattern);
				break;
			case 'query':
				values[paramName] = getValueFromQuery(request, paramName);
				break;
			case 'header':
				values[paramName] = getValueFromHeaders(request, paramName);
				break;
			case 'body':
				values[paramName] = getValueFromBody(request, paramName);
				break;
			// case 'form':
			// 	values[paramName] = getValueFromForm(request, paramName);
		}
	});

	return values;
}

function getHeadersFromResponse(response) {
	return response._headers;
}

module.exports = {
	doesRouteMatch,
	getBaseRoute,
	getRouteParams,
	getValueFromPath,
	getValueFromQuery,
	getValueFromHeaders,
	getValueFromBody,
	getRouteInfo,
	getResponseInfo,
	getValuesFromRequest,
	getHeadersFromResponse
};
