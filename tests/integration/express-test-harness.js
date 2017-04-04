'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;
const express = require('express');
const request = require('supertest');

const gangplank = require('../../index');

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
