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

describe('date and datetime tests', function () {
	// SETUP
	const swaggerDefinition = {
		swagger: '2.0',
		info: { version: '1.0.0', title: 'TEST' },
		paths: {
			'/test': {
				get: {
					parameters: [
						{
							name: 'date',
							in: 'query',
							description: 'name',
							type: 'string',
							format: 'date',
							required: false
						},
						{
							name: 'datetime',
							in: 'query',
							description: 'name',
							type: 'string',
							format: 'date-time',
							required: false
						}
					],
					responses: { 'default': { description: 'test' } }
				}
			}
		}
	};

	it('parses and casts valid date', function (done) {
		// ARRANGE
		const app = express();
		app.use(bodyParser.json());
		app.use(gangplank.requests({ swaggerDefinition }));
		app.get('/test', (req, res) => {
			const status =
				req.gangplank.params.date instanceof Date && req.gangplank.params.datetime instanceof Date ?
				200 :
				400;
			res.sendStatus(status);
		});

		// ACT
		request(app).get('/test?date=2016-07-11&datetime=2016-07-11T11:22:33.444Z').end((err, res) => {

			// ASSERT
			assert.equal(res.statusCode, 200);
			done();
		});
	});
});
