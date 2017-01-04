'use strict';

module.exports = {
	requests: require('./lib/middleware'),
	responses: require('./lib/response-middleware'),
	errorHandler: require('./lib/error-handler')
};
