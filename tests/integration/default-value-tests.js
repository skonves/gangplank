'use strict';

const assert = require('chai').assert;
const bodyParser = require('body-parser');
const express = require('express');
const request = require('supertest');

const gangplank = require('../../index');

function clone(obj, type, required, defaultValue) {
	const spec = JSON.parse(JSON.stringify(obj));

	spec.paths['/test'].get.parameters[0].type = type;
	spec.paths['/test'].get.parameters[0].required = required;
	spec.paths['/test'].get.parameters[0].default = defaultValue;

	return spec;
}

const baseSpec = {
	swagger: '2.0',
	info: { version: '1.0.0', title: 'TEST' },
	paths: {
		'/test': {
			get: {
				parameters: [
					{
						name: 'sut',
						in: 'query',
						// type: 'string',
						// format: 'date',
						// required: false
					}
				],
				responses: { 'default': { description: 'test' } }
			}
		}
	}
};

describe('default query parameter', function () {
	it('returns a default integer', function (done) {
		// ARRANGE
		const spec = clone(baseSpec, 'integer', false, 1337);

		//console.log(JSON.stringify(spec));

		const app = express();
		app.use(bodyParser.json());
		app.use(gangplank.requests({ swaggerDefinition: spec }));
		app.get('/test', (req, res) => {

			// ASSERT A
			// try {
			//console.log(req.gangplank);
			assert.strictEqual(req.gangplank.params.sut, 1337);
			done();
			// 	res.send();
			// } catch (ex) {
			// 	res.status(500).json({ message: ex.message });
			// }
		});

		// ACT
		request(app).get('/test').end(() => { });
	});

	it('errors on a missing required integer', function (done) {
		// ARRANGE
		const spec = clone(baseSpec, 'integer', true, 1337);

		const app = express();
		app.use(bodyParser.json());
		app.use(gangplank.requests({ swaggerDefinition: spec }));
		app.get('/test', (req, res) => {

			//console.log(req.gangplank.errors);

			res.status(500).send();
		});
		app.use((err, req, res, next) => {
			res.status(400).json(err);
		});

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT B
			assert.equal(res.statusCode, 400, res.body);
			done();
		});
	});

	it('returns a default number', function (done) {
		// ARRANGE
		const spec = clone(baseSpec, 'number', false, 3.1337);

		const app = express();
		app.use(bodyParser.json());
		app.use(gangplank.requests({ swaggerDefinition: spec }));
		app.get('/test', (req, res) => {

			// ASSERT A
			try {
				assert.strictEqual(req.gangplank.params.sut, 3.1337);
				res.send();
			} catch (ex) {
				res.status(500).json({ message: ex.message });
			}
		});

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT B
			assert.equal(res.statusCode, 200, res.body.message);
			done();
		});
	});

	it('errors on a missing required number', function (done) {
		// ARRANGE
		const spec = clone(baseSpec, 'number', true, 3.1337);

		const app = express();
		app.use(bodyParser.json());
		app.use(gangplank.requests({ swaggerDefinition: spec }));
		app.get('/test', (req, res) => {

			//console.log(req.gangplank.errors);

			res.status(500).send();
		});
		app.use((err, req, res, next) => {
			res.status(400).json(err);
		});

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT B
			assert.equal(res.statusCode, 400, res.body);
			done();
		});
	});

	it('returns a default boolean', function (done) {
		// ARRANGE
		const spec = clone(baseSpec, 'boolean', false, true);

		const app = express();
		app.use(bodyParser.json());
		app.use(gangplank.requests({ swaggerDefinition: spec }));
		app.get('/test', (req, res) => {

			// ASSERT A
			try {
				assert.strictEqual(req.gangplank.params.sut, true);
				res.send();
			} catch (ex) {
				res.status(500).json({ message: ex.message });
			}
		});

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT B
			assert.equal(res.statusCode, 200, res.body.message);
			done();
		});
	});

	it('errors on a missing required boolean', function (done) {
		// ARRANGE
		const spec = clone(baseSpec, 'boolean', true, true);

		const app = express();
		app.use(bodyParser.json());
		app.use(gangplank.requests({ swaggerDefinition: spec }));
		app.get('/test', (req, res) => {

			//console.log(req.gangplank.errors);

			res.status(500).send();
		});
		app.use((err, req, res, next) => {
			res.status(400).json(err);
		});

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT B
			assert.equal(res.statusCode, 400, res.body);
			done();
		});
	});

	it('returns a default string', function (done) {
		// ARRANGE
		const spec = clone(baseSpec, 'string', false, 'default value');

		const app = express();
		app.use(bodyParser.json());
		app.use(gangplank.requests({ swaggerDefinition: spec }));
		app.get('/test', (req, res) => {

			// ASSERT A
			try {
				assert.strictEqual(req.gangplank.params.sut, 'default value');
				res.send();
			} catch (ex) {
				res.status(500).json({ message: ex.message });
			}
		});

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT B
			assert.equal(res.statusCode, 200, res.body.message);
			done();
		});
	});

	it('errors on a missing required string', function (done) {
		// ARRANGE
		const spec = clone(baseSpec, 'string', true, 'default value');

		const app = express();
		app.use(bodyParser.json());
		app.use(gangplank.requests({ swaggerDefinition: spec }));
		app.get('/test', (req, res) => {

			//console.log(req.gangplank.errors);

			res.status(500).send();
		});
		app.use((err, req, res, next) => {
			res.status(400).json(err);
		});

		// ACT
		request(app).get('/test').end((err, res) => {

			// ASSERT B
			assert.equal(res.statusCode, 400, res.body);
			done();
		});
	});
});
