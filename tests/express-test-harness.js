'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;
const express = require('express');
const request = require('supertest');

const gangplank = require('../index');

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

describe('request validator', function () {
	// SETUP
	const app = express();
	const options = {
		swaggerDefinition: {
			swagger: '2.0',
			info: { version: '1.0.0', title: 'TEST' },
			paths: {
				'/test': {
					get: {
						parameters: [
							{
								name: 'q',
								in: 'query',
								description: 'name',
								type: 'string',
								required: true
							}
						],
						responses: { 'default': { description: 'test' } }
					}
				}
			}
		}
	};
	app.use(gangplank.requests(options));
	app.get('/test', (req, res) => {
		res.json({ message: 'ASDF' });
	});
	app.use(gangplank.errorHandler);

	it('permits valid request', function (done) {
		// ARRANGE
		const expectedStatusCode = 200;

		// ACT
		request(app).get('/test?q=asdf').end((err, res) => {

			// ASSERT
			assert.notOk(err);
			assert.ok(res.body);
			assert.equal(res.statusCode, expectedStatusCode, JSON.stringify(res.body));
			done();
		});
	});

	it('rejects request for undefined route', function (done) {
		// ARRANGE
		const expectedStatusCode = 404;

		// ACT
		request(app).get('/undefined-route').end((err, res) => {

			// ASSERT
			assert.notOk(err);
			assert.ok(res.body);
			assert.equal(res.statusCode, expectedStatusCode);

			done();
		});
	});

	it('rejects request missing required parameter', function (done) {
		// ARRANGE
		const expectedStatusCode = 400;

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.notOk(err);
			assert.ok(res.body);
			assert.equal(res.statusCode, expectedStatusCode);

			done();
		});
	});
});

// describe('response validator', function () {
// 	// SETUP
// 	const baseSwagger = {
// 		swagger: '2.0',
// 		info: { version: '1.0.0', title: 'TEST' },
// 		paths: {
// 			'/test': {
// 				get: {
// 					responses: {
// 						'200': {
// 							description: 'test'
// 						}
// 					},
// 					parameters: [
// 						{
// 							name: 'q',
// 							in: 'query',
// 							description: 'name',
// 							type: 'string',
// 							required: true
// 						}
// 					]
// 				}
// 			}
// 		}
// 	};

// 	it('permits valid response', function (done) {
// 		// ARRANGE
// 		let swaggerDefinition = clone(baseSwagger);
// 		swaggerDefinition.paths['/test'].get.responses['200'].schema = {
// 			type: 'object',
// 			required: ['message'],
// 			properties:
// 			{
// 				message: { type: 'string' }
// 			}
// 		};

// 		const app = express();
// 		app.use(gangplank.responses({ swaggerDefinition }));
// 		app.get('/test', (req, res) => {
// 			res.json({ message: 'valid string valid' });
// 		});
// 		app.use(gangplank.errorHandler);

// 		const expectedStatusCode = 200;

// 		// ACT
// 		request(app).get('/test?q=asdf').end((err, res) => {

// 			// ASSERT
// 			assert.notOk(err);
// 			assert.ok(res.body);
// 			assert.equal(res.statusCode, expectedStatusCode, JSON.stringify(swaggerDefinition, null, '  '));
// 			done();
// 		});
// 	});

// 	it('rejects response with invalid body', function (done) {
// 		// ARRANGE
// 		let swaggerDefinition = clone(baseSwagger);
// 		swaggerDefinition.paths['/test'].get.responses['200'].schema = {
// 			type: 'object',
// 			required: ['message'],
// 			properties:
// 			{
// 				message: { type: 'number' }
// 			}
// 		};

// 		const app = express();
// 		app.use(gangplank.responses({ swaggerDefinition }));
// 		app.get('/test', (req, res) => {
// 			res.json({ message: 'this is not a number' });
// 		});
// 		app.use(gangplank.errorHandler);

// 		const expectedStatusCode = 500;

// 		// ACT
// 		request(app).get('/test?q=asdf').end((err, res) => {

// 			// ASSERT
// 			assert.notOk(err);
// 			assert.ok(res.body);
// 			assert.equal(res.statusCode, expectedStatusCode, JSON.stringify(swaggerDefinition, null, '  '));
// 			done();
// 		});
// 	});

// 	it('rejects response with unexpected body', function (done) {
// 		// ARRANGE
// 		let swaggerDefinition = clone(baseSwagger);
// 		swaggerDefinition.paths['/test'].get.responses['200'].schema = undefined;

// 		const app = express();
// 		app.use(gangplank.responses({ swaggerDefinition }));
// 		app.get('/test', (req, res) => {
// 			res.json({ message: 'this is not a number' });
// 		});
// 		app.use(gangplank.errorHandler);

// 		const expectedStatusCode = 500;

// 		// ACT
// 		request(app).get('/test?q=asdf').end((err, res) => {

// 			// ASSERT
// 			assert.notOk(err);
// 			assert.ok(res.body);
// 			assert.equal(res.statusCode, expectedStatusCode, JSON.stringify(swaggerDefinition, null, '  '));
// 			done();
// 		});
// 	});

// 	it('rejects response with missing body', function (done) {
// 		// ARRANGE
// 		let swaggerDefinition = clone(baseSwagger);
// 		swaggerDefinition.paths['/test'].get.responses['200'].schema = {
// 			type: 'object',
// 			required: ['message'],
// 			properties:
// 			{
// 				message: { type: 'number' }
// 			}
// 		};

// 		const app = express();
// 		app.use(gangplank.responses({ swaggerDefinition }));
// 		app.get('/test', (req, res) => {
// 			res.status(200).send();
// 		});
// 		app.use(gangplank.errorHandler);

// 		const expectedStatusCode = 500;

// 		// ACT
// 		request(app).get('/test?q=asdf').end((err, res) => {

// 			// ASSERT
// 			assert.notOk(err);
// 			assert.ok(res.body.errors);
// 			assert.equal(res.statusCode, expectedStatusCode, res.text);
// 			done();
// 		});
// 	});

// 	it('rejects response with invalid header', function (done) {
// 		// ARRANGE
// 		let swaggerDefinition = clone(baseSwagger);
// 		swaggerDefinition.paths['/test'].get.responses['200'].headers = {
// 			'X-CustomHeader': {
// 				type: 'integer'
// 			}
// 		};

// 		const app = express();
// 		app.use(gangplank.responses({ swaggerDefinition }));
// 		app.get('/test', (req, res) => {
// 			res.set('X-CustomHeader', '{"value": "1337"}').status(200).send();
// 		});
// 		app.use(gangplank.errorHandler);

// 		const expectedStatusCode = 500;

// 		// ACT
// 		request(app).get('/test?q=asdf').end((err, res) => {

// 			// ASSERT
// 			assert.notOk(err);
// 			assert.ok(res.body.errors);
// 			assert.equal(res.statusCode, expectedStatusCode);
// 			done();
// 		});
// 	});

// 	it('rejects response with missing header', function (done) {
// 		// ARRANGE
// 		let swaggerDefinition = clone(baseSwagger);
// 		swaggerDefinition.paths['/test'].get.responses['200'].headers = {
// 			'X-CustomHeader': {
// 				type: 'integer'
// 			}
// 		};

// 		const app = express();
// 		app.use(gangplank.responses({ swaggerDefinition }));
// 		app.get('/test', (req, res) => {
// 			res.set('X-AnotherCustomHeader', 'string value').status(200).send();
// 		});
// 		app.use(gangplank.errorHandler);

// 		const expectedStatusCode = 500;

// 		// ACT
// 		request(app).get('/test?q=asdf').end((err, res) => {

// 			// ASSERT
// 			assert.notOk(err);
// 			assert.ok(res.body.errors);
// 			assert.equal(res.statusCode, expectedStatusCode);
// 			done();
// 		});
// 	});
// });
