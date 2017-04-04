'use strict';

const assert = require('chai').assert;
const express = require('express');
const supertest = require('supertest');
const sut = require('../../lib/validator');

describe('validator', function () {
	describe('validateRequest', function () {
		const swaggerSpec = {
			paths: {
				'/route-with-params': {
					get: {
						parameters: [{
							name: 'param1',
							in: 'query',
							type: 'string',
							required: true
						}]
					}
				},
				'/route-without-params': {
					get: {
						parameters: []
					}
				}
			}
		};

		it('validates defined route with parameters', function (done) {
			// ARRANGE
			const app = express();

			const url = '/route-with-params';
			const method = 'get';
			const query = { param1: 'asdf' };

			const expectedResult = {
				params: { param1: 'asdf' },
				errors: [],
				isValid: true
			};

			app.use((req, res, next) => {
				// ACT
				var result = sut.validateRequest(req, url, method, swaggerSpec);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).get(url).query(query).end(() => { });
		});

		it('validates defined route without parameters', function (done) {
			// ARRANGE
			const app = express();

			const url = '/route-without-params';
			const method = 'get';

			const expectedResult = {
				params: {},
				errors: [],
				isValid: true
			};

			app.use((req, res, next) => {
				// ACT
				var result = sut.validateRequest(req, url, method, swaggerSpec);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).get(url).end(() => { });
		});

		it('validates undefined route with exception', function (done) {
			// ARRANGE
			const app = express();

			const url = '/undefined-route';
			const method = 'get';
			const exceptions = ['.*'];

			const expectedResult = {
				params: {},
				errors: [],
				isValid: true
			};

			app.use((req, res, next) => {
				// ACT
				var result = sut.validateRequest(req, url, method, swaggerSpec, exceptions);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).get(url).end(() => { });
		});

		it('validates undefined route without exception', function (done) {
			// ARRANGE
			const app = express();

			const url = '/undefined-route';
			const method = 'get';
			const exceptions = [];

			const expectedResult = {
				params: {},
				errors: [{ route: '/undefined-route', notFound: true }],
				isValid: false
			};

			app.use((req, res, next) => {
				// ACT
				var result = sut.validateRequest(req, url, method, swaggerSpec, exceptions);

				// ASSERT
				assert.deepEqual(result, expectedResult);
				done();
			});

			supertest(app).get(url).end(() => { });
		});
	});

	describe('isException', function () {
		it('allows an undefined exception array', function () {
			// ARRANGE
			const url = '/test';
			const exceptions = undefined;
			const expectedResult = false;

			// ACT
			const result = sut.isException(url, exceptions);

			// ASSERT
			assert.equal(result, expectedResult);
		});

		it('allows an empty exception array', function () {
			// ARRANGE
			const url = '/test';
			const exceptions = [];
			const expectedResult = false;

			// ACT
			const result = sut.isException(url, exceptions);

			// ASSERT
			assert.equal(result, expectedResult);
		});

		it('ignores a non-array exceptions parameter', function () {
			// ARRANGE
			const url = '/test';
			const exceptions = 'not an array';
			const expectedResult = false;

			// ACT
			const result = sut.isException(url, exceptions);

			// ASSERT
			assert.equal(result, expectedResult);
		});

		it('identifies positive match', function () {
			// ARRANGE
			const url = '/test';
			const exceptions = ['/[a-z]{4}'];
			const expectedResult = true;

			// ACT
			const result = sut.isException(url, exceptions);

			// ASSERT
			assert.equal(result, expectedResult);
		});

		it('does not identify negative match', function () {
			// ARRANGE
			const url = '/test';
			const exceptions = ['/[0-9]{4}'];
			const expectedResult = false;

			// ACT
			const result = sut.isException(url, exceptions);

			// ASSERT
			assert.equal(result, expectedResult);
		});
	});

	describe('validateWithParameters', function () {
		const swaggerSpec = {
			paths: {
				'/has-required-param': {
					get: {
						parameters: [{
							name: 'required-param',
							in: 'query',
							required: true,
							type: 'string',
							minLength: 'too short'.length + 1
						}]
					}
				},
				'/has-optional-param': {
					get: {
						parameters: [{
							name: 'optional-param',
							in: 'query',
							required: false,
							type: 'string'
						}]
					}
				}
			}
		};

		it('catches a missing required parameter', function () {
			// ARRANGE
			const values = {};
			const routePattern = '/has-required-param';
			const parameters = swaggerSpec.paths[routePattern].get.parameters;

			const expectedResult = {
				params: {},
				isValid: false,
				errors: [{
					parameter: 'required-param',
					location: 'query',
					notFound: true
				}]
			};

			// ACT
			const result = sut.validateWithParameters(values, parameters, routePattern, swaggerSpec);

			// ASSERT
			assert.deepEqual(result, expectedResult);
		});

		it('ignores a missing optional parameter', function () {
			// ARRANGE
			const values = {};
			const routePattern = '/has-optional-param';
			const parameters = swaggerSpec.paths[routePattern].get.parameters;

			const expectedResult = {
				params: {},
				errors: [],
				isValid: true
			};

			// ACT
			const result = sut.validateWithParameters(values, parameters, routePattern, swaggerSpec);

			// ASSERT
			assert.deepEqual(result, expectedResult);
		});

		it('catches a bad parameter', function () {
			// ARRANGE
			const values = {
				'required-param': 'too short'
			};
			const routePattern = '/has-required-param';
			const parameters = swaggerSpec.paths[routePattern].get.parameters;

			const expectedParams = {
				'required-param': 'too short'
			};
			const expectedIsValid = false;
			const expectedErrorCount = 1;

			// ACT
			const result = sut.validateWithParameters(values, parameters, routePattern, swaggerSpec);

			// ASSERT
			assert.ok(result);
			assert.deepEqual(result.params, expectedParams);
			assert.equal(result.isValid, expectedIsValid);
			assert.ok(result.errors);
			assert.equal(result.errors.length, expectedErrorCount);
		});

		it('returns a good parameter', function () {
			// ARRANGE
			const values = {
				'required-param': 'long enough to be valid'
			};
			const routePattern = '/has-required-param';
			const parameters = swaggerSpec.paths[routePattern].get.parameters;

			const expectedResult = {
				params: {
					'required-param': 'long enough to be valid'
				},
				errors: [],
				isValid: true
			};

			// ACT
			const result = sut.validateWithParameters(values, parameters, routePattern, swaggerSpec);

			// ASSERT
			assert.deepEqual(result, expectedResult);
		});
	});

	describe('validateWithoutParameters', function () {
		it('returns a default gangplank object', function () {
			// ARRANGE
			const defaultResult = {
				params: {},
				errors: [],
				isValid: true
			};

			// ACT
			const result = sut.validateWithoutParameters();

			// ASSERT
			assert.deepEqual(result, defaultResult);
		});
	});

	describe('validateAsRouteException', function () {
		it('returns a default gangplank object', function () {
			// ARRANGE
			const defaultResult = {
				params: {},
				errors: [],
				isValid: true
			};

			// ACT
			const result = sut.validateAsRouteException();

			// ASSERT
			assert.deepEqual(result, defaultResult);
		});
	});

	describe('validateAsRouteNotFound', function () {
		it('returns a route-not-found gangplank object', function () {
			// ARRANGE
			const url = '/test';
			const expectedResult = {
				params: {},
				isValid: false,
				errors: [{
					route: url,
					notFound: true
				}]
			};

			// ACT
			const result = sut.validateAsRouteNotFound(url);

			// ASSERT
			assert.deepEqual(result, expectedResult);
		});
	});

	describe('getValueOrDefault', function () {
		it('directly returns value when value is defined', function () {
			// ARRANGE
			const value = 'asdf';
			const parameterDefinition = {
				required: true
			};
			const expectedResult = 'asdf';

			// ACT
			const result = sut.getValueOrDefault(value, parameterDefinition);

			// ASSERT
			assert.equal(result, expectedResult);
		});

		it('returns undefined when required value is undefined', function () {
			// ARRANGE
			const value = undefined;
			const parameterDefinition = {
				required: true
			};

			// ACT
			const result = sut.getValueOrDefault(value, parameterDefinition);

			// ASSERT
			assert.isUndefined(result);
		});

		it('returns default when option value has default value', function () {
			// ARRANGE
			const value = undefined;
			const parameterDefinition = {
				required: false,
				default: 'asdf'
			};
			const expectedResult = 'asdf';

			// ACT
			const result = sut.getValueOrDefault(value, parameterDefinition);

			// ASSERT
			assert.equal(result, expectedResult);
		});

		it('returns undefined when option value has no default value', function () {
			// ARRANGE
			const value = undefined;
			const parameterDefinition = {
				required: false
			};

			// ACT
			const result = sut.getValueOrDefault(value, parameterDefinition);

			// ASSERT
			assert.isUndefined(result);
		});
	});

	describe('preCast', function () {
		describe('array', function () {
			describe('pipes', function () {
				const collectionFormat = 'pipes';

				it('casts a valid array', function () {
					// Arrange
					const value = 'a|b|c|d|e';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'string'
						},
						collectionFormat
					};
					const expectedValue = ['a', 'b', 'c', 'd', 'e'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});

				it('casts an invalid array', function () {
					// Arrange
					const value = '1|2|c|d|e';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'integer'
						},
						collectionFormat
					};
					const expectedValue = [1, 2, 'c', 'd', 'e'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});

				it('casts a non-array', function () {
					// Arrange
					const value = 'not-a-valid-array';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'string'
						},
						collectionFormat
					};
					const expectedValue = ['not-a-valid-array'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});
			});

			describe('csv', function () {
				const collectionFormat = 'csv';

				it('casts a valid array', function () {
					// Arrange
					const value = 'a,b,c,d,e';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'string'
						},
						collectionFormat
					};
					const expectedValue = ['a', 'b', 'c', 'd', 'e'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});

				it('casts an invalid array', function () {
					// Arrange
					const value = '1,2,c,d,e';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'integer'
						},
						collectionFormat
					};
					const expectedValue = [1, 2, 'c', 'd', 'e'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});

				it('casts a non-array', function () {
					// Arrange
					const value = 'not-a-valid-array';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'string'
						},
						collectionFormat
					};
					const expectedValue = ['not-a-valid-array'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});
			});

			describe('ssv', function () {
				const collectionFormat = 'ssv';

				it('casts valid ssv array', function () {
					// Arrange
					const value = 'a b c d e';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'string'
						},
						collectionFormat
					};
					const expectedValue = ['a', 'b', 'c', 'd', 'e'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});

				it('casts an invalid array', function () {
					// Arrange
					const value = '1 2 c d e';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'integer'
						},
						collectionFormat
					};
					const expectedValue = [1, 2, 'c', 'd', 'e'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});

				it('casts a non-array', function () {
					// Arrange
					const value = 'not-a-valid-array';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'string'
						},
						collectionFormat
					};
					const expectedValue = ['not-a-valid-array'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});
			});

			describe('tsv', function () {
				const collectionFormat = 'tsv';

				it('casts valid tsv array', function () {
					// Arrange
					const value = 'a\tb\tc\td\te';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'string'
						},
						collectionFormat
					};
					const expectedValue = ['a', 'b', 'c', 'd', 'e'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});

				it('casts an invalid array', function () {
					// Arrange
					const value = '1\t2\tc\td\te';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'integer'
						},
						collectionFormat
					};
					const expectedValue = [1, 2, 'c', 'd', 'e'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});

				it('casts a non-array', function () {
					// Arrange
					const value = 'not-a-valid-array';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'string'
						},
						collectionFormat
					};
					const expectedValue = ['not-a-valid-array'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});
			});

			describe('unspecified', function () {
				it('casts valid unspecified array', function () {
					// Arrange
					const value = 'a,b,c,d,e';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'string'
						}
					};
					const expectedValue = ['a', 'b', 'c', 'd', 'e'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});

				it('casts an invalid array', function () {
					// Arrange
					const value = '1,2,c,d,e';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'integer'
						}
					};
					const expectedValue = [1, 2, 'c', 'd', 'e'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});

				it('casts a non-array', function () {
					// Arrange
					const value = 'not-a-valid-array';
					const parameterDefinition = {
						type: 'array',
						items: {
							type: 'string'
						}
					};
					const expectedValue = ['not-a-valid-array'];

					// Act
					const result = sut.preCast(value, parameterDefinition);

					// Assert
					assert.sameMembers(result, expectedValue);
				});
			});
		});

		describe('boolean', function () {
			const parameterDefinition = { type: 'boolean' };

			it('directly returns non-string input', function () {
				// Arrange
				const value = 1337;
				const expectedValue = 1337;

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});

			it('casts "true"', function () {
				// Arrange
				const value = 'true';
				const expectedValue = true;

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});

			it('casts "false"', function () {
				// Arrange
				const value = 'false';
				const expectedValue = false;

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});

			it('does not cast string', function () {
				// Arrange
				const value = 'asdf';
				const expectedValue = 'asdf';

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});
		});

		describe('integer', function () {
			const parameterDefinition = { type: 'integer' };

			it('casts a valid value', function () {
				// Arrange
				const value = '5';
				const expectedValue = 5;

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});

			it('does not cast float', function () {
				// Arrange
				const value = '5.5';
				const expectedValue = '5.5';

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});

			it('does not cast string', function () {
				// Arrange
				const value = 'asdf';
				const expectedValue = 'asdf';

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});
		});

		describe('number', function () {
			const parameterDefinition = { type: 'number' };

			it('casts a valid value', function () {
				// Arrange
				const value = '5.5';
				const expectedValue = 5.5;

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});

			it('does not cast string', function () {
				// Arrange
				const value = 'asdf';
				const expectedValue = 'asdf';

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});
		});

		describe('object', function () {
			const parameterDefinition = { type: 'object' };

			it('casts a valid value', function () {
				// Arrange
				const value = '{"key":"value"}';
				const expectedValue = { key: 'value' };

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.deepEqual(result, expectedValue);
			});

			it('does not cast string', function () {
				// Arrange
				const value = 'asdf';
				const expectedValue = 'asdf';

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});
		});

		describe('string', function () {
			const parameterDefinition = { type: 'string' };

			it('directly returns value', function () {
				// Arrange
				const value = 'asdf';
				const expectedValue = 'asdf';

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});
		});

		describe('other', function () {
			const parameterDefinition = { type: 'not defined in the spec' };

			it('directly returns value', function () {
				// Arrange
				const value = 'asdf';
				const expectedValue = 'asdf';

				// Act
				const result = sut.preCast(value, parameterDefinition);

				// Assert
				assert.strictEqual(expectedValue, result);
			});
		});
	});

	describe('postCast', function () {
		it('directly returns non-strings', function () {
			// ARRANGE
			const value = 12345;
			const parameterDefinition = {
				type: 'number'
			};

			// ACT
			const result = sut.postCast(value, parameterDefinition);

			// ASSERT
			assert.strictEqual(result, value);
		});

		it('directly returns strings not formated as date or date-time', function () {
			// ARRANGE
			const value = 'asdf@example.com';
			const parameterDefinition = {
				type: 'string',
				format: 'email'
			};

			// ACT
			const result = sut.postCast(value, parameterDefinition);

			// ASSERT
			assert.strictEqual(result, value);
		});

		it('casts date formated string', function () {
			// ARRANGE
			const value = '2016-07-11';
			const parameterDefinition = {
				type: 'string',
				format: 'date'
			};

			const expectedValue = new Date(value);

			// ACT
			const result = sut.postCast(value, parameterDefinition);

			// ASSERT
			assert.deepEqual(result, expectedValue);
		});

		it('casts date formated string', function () {
			// ARRANGE
			const value = '2016-07-11T16:00:00Z';
			const parameterDefinition = {
				type: 'string',
				format: 'date-time'
			};

			const expectedValue = new Date(value);

			// ACT
			const result = sut.postCast(value, parameterDefinition);

			// ASSERT
			assert.deepEqual(result, expectedValue);
		});
	});

	describe('validateValue', function () {
		it('QED', () => { });
	});
});
