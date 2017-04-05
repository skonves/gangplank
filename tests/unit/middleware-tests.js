'use strict';

const assert = require('chai').assert;
const express = require('express');
const supertest = require('supertest');
const sut = require('../../lib/middleware');

describe('middleware', function () {
	it('rejects options without swaggerDefinition', function () {
		// ARRANGE
		const options = undefined;

		let result;
		try {
			// ACT
			result = sut(options);

			// ASSERT
			assert.fail();
		} catch (ex) {
			if (ex.message === 'assert.fail()') {
				throw (ex);
			}
			assert.ok(ex);
		}
	});

	it('returns middleware function', function () {
		// ARRANGE
		const options = { swaggerDefinition: {} };

		// ACT
		const result = sut(options);

		// ASSERT
		assert.equal(typeof (result), 'function');
		assert.equal(result.length, 3);
	});

	it('validates good request', function (done) {
		// ARRANGE
		const app = express();

		const swaggerDefinition = {
			paths: {
				'/test': {
					get: {
						parameters: [{
							name: 'id',
							in: 'query',
							type: 'string'
						}]
					}
				}
			}
		};
		const options = { swaggerDefinition };
		const url = '/test';
		const query = { id: 'asdf' };

		const expectedResult = {
			params: { id: 'asdf' },
			errors: [],
			isValid: true
		};

		// ACT
		app.use(sut(options));

		app.get(url, (req, res, next) => {
			// ASSERT
			assert.ok(req.gangplank, expectedResult);
			done();
		});

		supertest(app).get(url).query(query).end(() => { });
	});

	it('validates bad request', function (done) {
		// ARRANGE
		const app = express();

		const swaggerDefinition = {
			paths: {
				'/test': {
					get: {
						parameters: [{
							name: 'id',
							in: 'query',
							type: 'string'
						}]
					}
				}
			}
		};
		const options = { swaggerDefinition };
		const url = '/not-a-defined-url';
		const query = { id: 'asdf' };

		const expectedResult = { code: 'GANGPLANK_ERRORS' };

		// ACT
		app.use(sut(options));

		app.use((err, req, res, next) => {
			// ASSERT
			assert.ok(err);
			assert.deepEqual(err, expectedResult);
			done();
		});

		supertest(app).get(url).query(query).end(() => { });
	});
});
