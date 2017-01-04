'use strict';

module.exports = function () {
	return function (req, res, next) {
		const end = res.end;

		res.end = function () {
			let data;

			if (arguments[0] instanceof Buffer) {
				const encoding = typeof (arguments[1] == 'string') ? arguments[1] : 'utf8';
				data = arguments[0].toString(encoding);
			} else if (typeof (arguments[0] == 'string')) {
				data = arguments[0];
			}

			// DO VALIDATION HERE

			// console.log('===== END =====');
			// console.log(data);
			// console.log('================');

			// if (res.gangplank) {
			// 	end.apply(res, arguments);
			// } else {
			// 	res.gangplank = { isValid: false, message: 'FORCED ERROR' };
			// 	next(res.gangplank);
			// }

			end.apply(res, arguments);
		}

		next();
	};
};
