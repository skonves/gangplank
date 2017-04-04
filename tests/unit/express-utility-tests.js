'use strict';

const assert = require('chai').assert;
const express = require('express');
const bodyParser = require('body-parser');
const supertest = require('supertest');

const sut = require('../../lib/express-utility');

describe('express-utility', function () {
	describe('getRouteInfo', function () {
		it('finds route info', function () {
			// Arrange
			const url = '/asdf/value1';
			const method = 'get';

			const expectedPattern = '/asdf/{param1}';
			const expectedDefinition = {
				someprop: 'value',
				otherprop: 'other value'
			};

			const swaggerDefinition = {
				paths: {
					[expectedPattern]: {
						[method]: expectedDefinition
					}
				}
			};

			// Act
			const result = sut.getRouteInfo(url, method, swaggerDefinition);

			// Assert
			assert.ok(result);
			assert.equal(expectedPattern, result.pattern);
			assert.equal(expectedDefinition, result.definition);
		});

		it('does not find definition when method is not found', function () {
			// Arrange
			const url = '/asdf/value1';
			const method = 'get';

			const expectedPattern = '/asdf/{param1}';
			const definition = {
				someprop: 'value',
				otherprop: 'other value'
			};

			const swaggerDefinition = {
				paths: {
					[expectedPattern]: {
						[method]: definition
					}
				}
			};

			// Act
			const result = sut.getRouteInfo(url, 'some-other-method', swaggerDefinition);

			// Assert
			assert.ok(result);
			assert.equal(result.pattern, expectedPattern);
			assert.isUndefined(result.definition);
		});

		it('does not find pattern or definition when route is not defined', function () {
			// Arrange
			const url = '/does-not-match-pattern';
			const method = 'get';

			const pattern = '/asdf/{param1}';
			const definition = {
				someprop: 'value',
				otherprop: 'other value'
			};

			const swaggerDefinition = {
				paths: {
					[pattern]: {
						[method]: definition
					}
				}
			};

			// Act
			const result = sut.getRouteInfo(url, method, swaggerDefinition);

			// Assert
			assert.ok(result);
			assert.isUndefined(result.pattern, pattern);
			assert.isUndefined(result.definition);
		});

		it('finds route info and replaces ref parameter', function () {
			// Arrange
			const url = '/asdf/value1';
			const method = 'get';

			const expectedPattern = '/asdf/{param1}';
			const expectedDefinition = {
				parameters: [{
					name: 'param1',
					in: 'query',
					required: false,
					type: 'string'
				},
				{
					name: 'param2',
					in: 'query',
					required: false,
					type: 'string'
				}]
			};

			const swaggerDefinition = {
				parameters: {
					param1: {
						name: 'param1',
						in: 'query',
						required: false,
						type: 'string'
					},
				},
				paths: {
					[expectedPattern]: {
						[method]: {
							parameters: [{
								$ref: '#/parameters/param1'
							},
							{
								name: 'param2',
								in: 'query',
								required: false,
								type: 'string'
							}]
						}
					}
				}
			};

			// Act
			const result = sut.getRouteInfo(url, method, swaggerDefinition);

			// Assert
			assert.ok(result);
			assert.equal(expectedPattern, result.pattern);
			assert.deepEqual(expectedDefinition, result.definition);
		});
	});

	describe('getValueFromPath', function () {
		it('finds param present in path', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'id';
			const routePattern = '/test/{id}';
			const requestUrl = '/test/asdf';
			const expectedResult = 'asdf';

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromPath(req, paramName, routePattern);

				// ASSERT
				assert.strictEqual(result, expectedResult);
				done();
			});

			supertest(app).get(requestUrl).end(() => { });
		});

		it('does not find param missing in path', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'not-in-the-route-pattern';
			const routePattern = '/test/{id}';
			const requestUrl = '/test/asdf';

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromPath(req, paramName, routePattern);

				// ASSERT
				assert.isUndefined(result);
				done();
			});

			supertest(app).get(requestUrl).end(() => { });
		});

		it('does not find param when there are no path params', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'not-in-the-route-pattern';
			const routePattern = '/test';
			const requestUrl = '/test';

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromPath(req, paramName, routePattern);

				// ASSERT
				assert.isUndefined(result);
				done();
			});

			supertest(app).get(requestUrl).end(() => { });
		});
	});

	describe('getValueFromQuery', function () {
		it('does not have a query string', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'id';
			const requestUrl = '/test';

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromQuery(req, paramName);

				// ASSERT
				assert.isUndefined(result);
				done();
			});

			supertest(app).get(requestUrl).end(() => { });
		});

		it('finds param present in query', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'id';
			const requestUrl = '/test?id=asdf';
			const expectedResult = 'asdf';

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromQuery(req, paramName);

				// ASSERT
				assert.strictEqual(result, expectedResult);
				done();
			});

			supertest(app).get(requestUrl).end(() => { });
		});

		it('does not find param missing from query', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'not-in-query';
			const requestUrl = '/test?id=asdf';

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromQuery(req, paramName);

				// ASSERT
				assert.isUndefined(result);
				done();
			});

			supertest(app).get(requestUrl).end(() => { });
		});
	});

	describe('getValueFromHeaders', function () {
		it('finds param present in headers', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'x-test-header';
			const value = 'asdf';
			const requestUrl = '/test';
			const expectedResult = 'asdf';

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromHeaders(req, paramName);

				// ASSERT
				assert.strictEqual(result, expectedResult);
				done();
			});

			supertest(app).get(requestUrl).set(paramName, value).end(() => { });
		});

		it('does not find param missing from headers', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'x-test-header';
			const value = 'asdf';
			const requestUrl = '/test';

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromHeaders(req, 'not-in-headersF');

				// ASSERT
				assert.isUndefined(result);
				done();
			});

			supertest(app).get(requestUrl).set(paramName, value).end(() => { });
		});
	});

	describe('getValueFromBody', function () {
		it('returns body when present', function (done) {
			// ARRANGE
			const app = express();
			const value = { key: 'value' };
			const requestUrl = '/test';
			const expectedResult = { key: 'value' };

			app.use(bodyParser.json());
			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromBody(req);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).post(requestUrl).send(value).end(() => { });
		});

		it('returns empty object when body is not sent', function (done) {
			// ARRANGE
			const app = express();
			const requestUrl = '/test';
			const expectedResult = {};

			app.use(bodyParser.json());
			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromBody(req);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).post(requestUrl).send().end(() => { });
		});

		it('returns empty object when body is not parsed', function (done) {
			// ARRANGE
			const app = express();
			const requestUrl = '/test';
			const expectedResult = {};

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValueFromBody(req);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).post(requestUrl).send().end(() => { });
		});
	});

	describe('getValuesFromRequest', function () {
		it('gets value from path', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'id';
			const routePattern = '/test/{id}';
			const requestUrl = '/test/asdf';
			const parameterDefinitions = [
				{
					name: paramName,
					in: 'path'
				}
			];
			const expectedResult = { id: 'asdf' };

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValuesFromRequest(req, parameterDefinitions, routePattern);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).get(requestUrl).end(() => { });
		});

		it('gets value from query', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'id';
			const routePattern = '/test';
			const requestUrl = '/test?id=asdf';
			const parameterDefinitions = [
				{
					name: paramName,
					in: 'query'
				}
			];
			const expectedResult = { id: 'asdf' };

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValuesFromRequest(req, parameterDefinitions, routePattern);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).get(requestUrl).end(() => { });
		});

		it('gets value from header', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'x-test-header';
			const value = 'asdf';
			const routePattern = '/test';
			const requestUrl = '/test';
			const parameterDefinitions = [
				{
					name: paramName,
					in: 'header'
				}
			];
			const expectedResult = { 'x-test-header': 'asdf' };

			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValuesFromRequest(req, parameterDefinitions, routePattern);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).get(requestUrl).set(paramName, value).end(() => { });
		});

		it('gets value from body', function (done) {
			// ARRANGE
			const app = express();
			const paramName = 'data';
			const value = { key: 'value' };
			const routePattern = '/test';
			const requestUrl = '/test';
			const parameterDefinitions = [
				{
					name: paramName,
					in: 'body'
				}
			];
			const expectedResult = { 'data': { key: 'value' } };

			app.use(bodyParser.json());
			app.use(function (req, res, next) {
				// ACT
				const result = sut.getValuesFromRequest(req, parameterDefinitions, routePattern);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).post(requestUrl).send(value).end(() => { });
		});
	});

	describe('getBaseRoute', function () {
		it('returns whole url when query is not present', function () {
			// ARRANGE
			const url = '/asdf/qwerty';
			const expected = '/asdf/qwerty';

			// ACT
			const result = sut.getBaseRoute(url);

			// ASSERT
			assert.equal(expected, result);
		});

		it('Does not return trailing slash when query is not present', function () {
			// ARRANGE
			const url = '/asdf/qwerty/';
			const expected = '/asdf/qwerty';

			// ACT
			const result = sut.getBaseRoute(url);

			// ASSERT
			assert.equal(expected, result);
		});

		it('returns everything prior to query', function () {
			// ARRANGE
			const url = '/asdf/qwerty?param=value';
			const expected = '/asdf/qwerty';

			// ACT
			const result = sut.getBaseRoute(url);

			// ASSERT
			assert.equal(expected, result);

		});

		it('returns everything but trailing slash prior to query', function () {
			// ARRANGE
			const url = '/asdf/qwerty/?param=value';
			const expected = '/asdf/qwerty';

			// ACT
			const result = sut.getBaseRoute(url);

			// ASSERT
			assert.equal(expected, result);

		});
	});

	describe('getRouteParams', function () {
		it('has slash only', function () {
			// Arrange
			const pattern = '/';
			const route = '/';
			const expected = {};

			// Act
			const result = sut.getRouteParams(pattern, route);

			// Assert
			assert.deepEqual(result, expected);
		});

		it('has no route parameters', function () {
			// Arrange
			const pattern = '/asdf/asdf';
			const route = '/asdf/asdf';
			const expected = {};

			// Act
			const result = sut.getRouteParams(pattern, route);

			// Assert
			assert.deepEqual(result, expected);
		});

		it('has a single route parameter', function () {
			// Arrange
			const pattern = '/asdf/{param}';
			const route = '/asdf/value';
			const expected = { param: 'value' };

			// Act
			const result = sut.getRouteParams(pattern, route);

			// Assert
			assert.deepEqual(result, expected);
		});

		it('has multiple route parameters', function () {
			// Arrange
			const pattern = '/asdf/{param1}/qwerty/{param2}';
			const route = '/asdf/value1/qwerty/value2';
			const expected = { param1: 'value1', param2: 'value2' };

			// Act
			const result = sut.getRouteParams(pattern, route);

			// Assert
			assert.deepEqual(result, expected);
		});
	});
});
