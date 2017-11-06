'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;
const express = require('express');
const request = require('supertest');

const gangplank = require('../../index');

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

describe('response validator', function () {
	it('returns 500 when header is missing', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				paths: {
					'/test': {
						get: {
							responses: {
								'default': {
									headers: {
										'x-test': { type: 'string' },
									}
								}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.sendStatus(204);
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 500);
			assert.ok(res.body.errors);
			assert.ok(res.body.errors.find(error => error.code === 'MISSING_RESPONSE_HEADER'));
			done();
		});
	});

	it('continues when no headers are defined', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				paths: {
					'/test': {
						get: {
							responses: {
								'default': {}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.sendStatus(204);
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 204);
			assert.notOk(res.body.errors);
			done();
		});
	});

	it('returns 500 when header is invalid', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				paths: {
					'/test': {
						get: {
							responses: {
								'default': {
									headers: {
										'x-test': { type: 'integer' },
									}
								}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.setHeader('x-test', 'not an integer');
			res.sendStatus(204);
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 500);
			assert.ok(res.body.errors);
			assert.ok(res.body.errors.find(error => error.code === 'INVALID_RESPONSE_HEADER'));
			done();
		});
	});

	it('returns 500 when body is invalid', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				paths: {
					'/test': {
						get: {
							responses: {
								'default': {
									schema: {
										type: 'object',
										required: ['test'],
										properties: {
											test: {
												type: 'integer'
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.json({});
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 500);
			assert.ok(res.body.errors);
			assert.ok(res.body.errors.find(error => error.code === 'INVALID_RESPONSE_BODY'));
			done();
		});
	});

	it('returns 500 when body is required but missing', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				paths: {
					'/test': {
						get: {
							responses: {
								'default': {
									schema: {
										type: 'object',
										required: ['test'],
										properties: {
											test: {
												type: 'integer'
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.sendStatus(204);
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 500);
			assert.ok(res.body.errors);
			assert.ok(res.body.errors.find(error => error.code === 'INVALID_RESPONSE_BODY'));
			done();
		});
	});

	it('validates non-json bodies', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				paths: {
					'/test': {
						get: {
							responses: {
								'default': {
									schema: {
										type: 'string'
									}
								}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.send('text');
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 200);
			assert.equal(res.text, 'text');
			done();
		});
	});

	it('continues when a body is returned but no body is defined', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				paths: {
					'/test': {
						get: {
							responses: {
								'default': {}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.status(200).json({ foo: 'bar' });
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 200);
			assert.notOk(res.body.errors);
			done();
		});
	});

	it('returns 500 when status code is not defined and there is no default', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				paths: {
					'/test': {
						get: {
							responses: {
								'200': {}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.sendStatus(204);
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 500);
			assert.ok(res.body.errors);
			assert.ok(res.body.errors.find(error => error.code === 'INVALID_RESPONSE_CODE'));
			done();
		});
	});

	it('handles response by $ref', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				responses: {
					'test-success': {
						schema: {
							type: 'object',
							required: ['test'],
							properties: {
								test: {
									type: 'integer'
								}
							}
						}
					}
				},
				paths: {
					'/test': {
						get: {
							responses: {
								'200': {
									$ref: '#/responses/test-success'
								}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.status(200).json({ test: 'not an integer' });
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 500);
			assert.ok(res.body.errors);
			assert.ok(res.body.errors.find(error => error.code === 'INVALID_RESPONSE_BODY'));
			done();
		});
	});

	it('considers a response defined with a bad $ref to not be defined', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				responses: {
					'test-success': {
						schema: {
							type: 'object',
							required: ['test'],
							properties: {
								test: {
									type: 'integer'
								}
							}
						}
					}
				},
				paths: {
					'/test': {
						get: {
							responses: {
								'200': {
									$ref: '#/responses/not/a/valid/value'
								}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.status(200).json({ test: 'not an integer' });
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			console.log(JSON.stringify(res.body, null, '  '));
			assert.equal(res.statusCode, 500);
			assert.ok(res.body.errors);
			assert.ok(res.body.errors.find(error => error.code === 'INVALID_RESPONSE_CODE'));
			done();
		});
	});

	it('independently validates multiple headers with the same name', function (done) {
		// ARRANGE
		const app = express();
		app.use(gangplank.requests({
			response: true,
			swaggerDefinition: {
				swagger: '2.0',
				info: { version: '1.0.0', title: 'TEST' },
				paths: {
					'/test': {
						get: {
							responses: {
								'default': {
									headers: {
										'x-test': { type: 'integer' },
									}
								}
							}
						}
					}
				}
			}
		}));
		app.get('/test', (req, res) => {
			res.setHeader('x-test', ['not an integer', 'also not an integer']);
			res.sendStatus(204);
		});
		app.use(gangplank.errorHandler);

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 500);
			assert.ok(res.body.errors);
			assert.equal(res.body.errors.filter(error => error.code === 'INVALID_RESPONSE_HEADER').length, 2);
			done();
		});
	});
});
