'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;
const bodyParser = require('body-parser');
const express = require('express');
const request = require('supertest');

const gangplank = require('../../index');

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

describe('Body params', function () {
	// SETUP
	const app = express();
	const options = {
		swaggerDefinition: {
			swagger: '2.0',
			info: { version: '1.0.0', title: 'TEST' },
			paths: {
				'/test': {
					post: {
						parameters: [
							{
								name: 'testparm',
								in: 'body',
								description: 'test body param',
								schema: {
									'$ref': '#/definitions/testObject'
								},
								required: true
							}
						],
						responses: { 'default': { description: 'test' } }
					}
				}
			},
			definitions: {
				testObject: {
					type: 'object',
					required: ['prop1'],
					properties: {
						prop1: { type: 'integer' },
						prop2: { type: 'string' }
					}
				}
			}
		}
	};
	app.use(bodyParser.json());
	app.use(gangplank.requests(options));
	app.post('/test', (req, res) => {
		res.json({ message: "ASDF" });
	});
	app.use(gangplank.errorHandler);

	it('permits valid request', function (done) {
		// ARRANGE
		const expectedStatusCode = 200;

		const body = {
			prop1: 1337,
			prop2: 'asdf'
		};

		// ACT
		request(app).post('/test').set('Content-Type', 'application/json').send(body).end((err, res) => {

			// ASSERT
			assert.notOk(err);
			assert.ok(res.body);
			assert.equal(res.statusCode, expectedStatusCode, JSON.stringify(res.body));
			done();
		})
	});

	it('rejects invalid request', function (done) {
		// ARRANGE
		const expectedStatusCode = 400;

		const body = {
			prop1: '1337',
			prop2: 'asdf'
		};

		// ACT
		request(app).post('/test').set('Content-Type', 'application/json').send(body).end((err, res) => {

			// ASSERT
			assert.notOk(err);
			assert.ok(res.body);
			assert.equal(res.statusCode, expectedStatusCode, JSON.stringify(res.body));
			done();
		})
	});
});
