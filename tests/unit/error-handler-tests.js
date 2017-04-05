'use strict';

const assert = require('chai').assert;
const express = require('express');
const supertest = require('supertest');

const sut = require('../../lib/error-handler');

describe('error-handler', function () {
	describe('errorHandler', function () {
		it('skips when headers have been sent', function (done) {
			// ARRANGE
			const app = express();

			const route = '/not-defined';

			const gangplank = {
				params: {},
				errors: [],
				isValid: false
			};

			const expectedHttpStatusCode = 200;

			app.use((req, res, next) => {
				req.gangplank = gangplank;

				// ACT
				next({ code: 'GANGPLANK_ERRORS' });
			});

			app.use((err, req, res, next) => {
				res.sendStatus(expectedHttpStatusCode);
				next(err);
			});

			app.use(sut);

			app.use((err, req, res, next) => {
				if (!res.headersSent) {
					res.sendStatus(500);
				}
			});

			supertest(app).get(route).end((err, result) => {
				// ASSERT
				assert.notOk(err);
				assert.strictEqual(result.status, expectedHttpStatusCode);
				assert.notOk(result.body.errors);
				done();
			});
		});

		it('skips when not a gangplank error', function (done) {
			// ARRANGE
			const app = express();

			const route = '/not-defined';

			const gangplank = {
				params: {},
				errors: [],
				isValid: false
			};

			const expectedHttpStatusCode = 200;

			app.use((req, res, next) => {
				req.gangplank = gangplank;

				// ACT
				next({ code: 'not GANGPLANK_ERRORS' });
			});

			app.use(sut);

			app.use((err, req, res, next) => {
				res.sendStatus(expectedHttpStatusCode);
			});

			supertest(app).get(route).end((err, result) => {
				// ASSERT
				assert.notOk(err);
				assert.strictEqual(result.status, expectedHttpStatusCode);
				assert.notOk(result.body.errors);
				done();
			});
		});

		it('emits on route not found', function (done) {
			// ARRANGE
			const app = express();

			const route = '/not-found';

			const routeNotFoundError = {
				route: '/not-found',
				notFound: true
			};

			const gangplank = {
				params: {},
				errors: [routeNotFoundError],
				isValid: false
			};

			const expectedCode = 'ROUTE_NOT_FOUND';
			const expectedStatus = '404';
			const expectedHttpStatusCode = 404;

			app.use((req, res, next) => {
				req.gangplank = gangplank;

				// ACT
				next({ code: 'GANGPLANK_ERRORS' });
			});

			app.use(sut);

			app.use((err, req, res, next) => {
				if (!res.headersSent) {
					res.sendStatus(500);
				}
			});

			supertest(app).get(route).end((err, result) => {
				// ASSERT
				assert.notOk(err);
				const errorResult = result.body.errors[0];

				assert.strictEqual(result.status, expectedHttpStatusCode);

				assert.ok(errorResult);
				assert.ok(errorResult.id);
				assert.strictEqual(errorResult.code, expectedCode);
				assert.strictEqual(errorResult.status, expectedStatus);
				assert.ok(errorResult.title);
				assert.ok(errorResult.details);
				done();
			});
		});

		it('emits on missing parameter', function (done) {
			// ARRANGE
			const app = express();

			const route = '/not-found';

			const missingParameterError = {
				parameter: 'required-param',
				location: 'query',
				notFound: true
			};

			const gangplank = {
				params: {},
				errors: [missingParameterError],
				isValid: false
			};

			const expectedCode = 'MISSING_PARAMETER';
			const expectedStatus = '400';
			const expectedHttpStatusCode = 400;

			app.use((req, res, next) => {
				req.gangplank = gangplank;

				// ACT
				next({ code: 'GANGPLANK_ERRORS' });
			});

			app.use(sut);

			app.use((err, req, res, next) => {
				if (!res.headersSent) {
					res.sendStatus(500);
				}
			});

			supertest(app).get(route).end((err, result) => {
				// ASSERT
				assert.notOk(err);
				const errorResult = result.body.errors[0];

				assert.strictEqual(result.status, expectedHttpStatusCode);

				assert.ok(errorResult);
				assert.ok(errorResult.id);
				assert.strictEqual(errorResult.code, expectedCode);
				assert.strictEqual(errorResult.status, expectedStatus);
				assert.ok(errorResult.title);
				assert.ok(errorResult.details);
				done();
			});
		});

		it('emits on bad parameter', function (done) {
			// ARRANGE
			const app = express();

			const route = '/not-found';

			const badParameterError = {
				parameter: 'required-param',
				errors: [{
					// TODO: fix this
					property: 'required-param',
					instance: 'asdf',
					key: 'value'
				}]
			};

			const gangplank = {
				params: {},
				errors: [badParameterError],
				isValid: false
			};

			const expectedCode = 'BAD_REQUEST';
			const expectedStatus = '400';
			const expectedHttpStatusCode = 400;

			app.use((req, res, next) => {
				req.gangplank = gangplank;

				// ACT
				next({ code: 'GANGPLANK_ERRORS' });
			});

			app.use(sut);
			app.use((err, req, res, next) => {
				if (!res.headersSent) {
					res.sendStatus(500);
				}
			});

			supertest(app).get(route).end((err, result) => {
				// ASSERT
				assert.notOk(err);
				const errorResult = result.body.errors[0];

				assert.strictEqual(result.status, expectedHttpStatusCode);

				assert.ok(errorResult);
				assert.ok(errorResult.id);
				assert.strictEqual(errorResult.code, expectedCode);
				assert.strictEqual(errorResult.status, expectedStatus);
				assert.ok(errorResult.title);
				assert.ok(errorResult.details);
				done();
			});
		});

		it('emits on undefined parameter', function (done) {
			// ARRANGE
			const app = express();

			const route = '/not-found';

			const badParameterError = {
				parameter: 'required-param',
				errors: [{
					// TODO: fix this
					property: 'required-param',
					key: 'value'
				}]
			};

			const gangplank = {
				params: {},
				errors: [badParameterError],
				isValid: false
			};

			const expectedCode = 'BAD_REQUEST';
			const expectedStatus = '400';
			const expectedHttpStatusCode = 400;

			app.use((req, res, next) => {
				req.gangplank = gangplank;

				// ACT
				next({ code: 'GANGPLANK_ERRORS' });
			});

			app.use(sut);

			app.use((err, req, res, next) => {
				if (!res.headersSent) {
					res.sendStatus(500);
				}
			});

			supertest(app).get(route).end((err, result) => {
				// ASSERT
				assert.notOk(err);
				const errorResult = result.body.errors[0];

				assert.strictEqual(result.status, expectedHttpStatusCode);

				assert.ok(errorResult);
				assert.ok(errorResult.id);
				assert.strictEqual(errorResult.code, expectedCode);
				assert.strictEqual(errorResult.status, expectedStatus);
				assert.ok(errorResult.title);
				assert.ok(errorResult.details);
				done();
			});
		});

		it('emits on bad sub-property', function (done) {
			// ARRANGE
			const app = express();

			const route = '/not-found';

			const badParameterError = {
				parameter: 'required-param',
				errors: [{
					// TODO: fix this
					property: 'instance.required-param',
					instance: 'asdf',
					key: 'value'
				}]
			};

			const gangplank = {
				params: {},
				errors: [badParameterError],
				isValid: false
			};

			const expectedCode = 'BAD_REQUEST';
			const expectedStatus = '400';
			const expectedHttpStatusCode = 400;

			app.use((req, res, next) => {
				req.gangplank = gangplank;

				// ACT
				next({ code: 'GANGPLANK_ERRORS' });
			});

			app.use(sut);

			app.use((err, req, res, next) => {
				if (!res.headersSent) {
					res.sendStatus(500);
				}
			});

			supertest(app).get(route).end((err, result) => {
				// ASSERT
				assert.notOk(err);
				const errorResult = result.body.errors[0];

				assert.strictEqual(result.status, expectedHttpStatusCode);

				assert.ok(errorResult);
				assert.ok(errorResult.id);
				assert.strictEqual(errorResult.code, expectedCode);
				assert.strictEqual(errorResult.status, expectedStatus);
				assert.ok(errorResult.title);
				assert.ok(errorResult.details);
				done();
			});
		});

		it('ignores malformed errors', function (done) {
			// ARRANGE
			const app = express();

			const route = '/some-route';

			const gangplank = {
				params: {},
				errors: [{}],
				isValid: true
			};

			const expectedHttpStatusCode = 200;

			app.use((req, res, next) => {
				req.gangplank = gangplank;

				// ACT
				next({ code: 'GANGPLANK_ERRORS' });
			});

			app.use(sut);

			app.use((err, req, res, next) => {
				if (!res.headersSent) {
					res.sendStatus(500);
				}
			});

			supertest(app).get(route).end((err, result) => {
				// ASSERT
				assert.notOk(err);
				const errorResult = result.body.errors[0];

				assert.strictEqual(result.status, expectedHttpStatusCode);
				done();
			});
		});
	});
});
