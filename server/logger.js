var winston = require('winston');


winston.add(winston.transports.File, { filename: global.logFile, level: 'silly' });

//winston.handleExceptions(winston.transports.File, { filename: global.logFile+'.exceptions.log' });

/*


exceptionHandlers: [
new winston.transports.File({ filename: './exceptions.log', timestamp: true, maxsize: 1000000 })
],

exitOnError: true,
*/
//winston.add(winston.transports.Console);

exports.w = winston;

/*new (winston.Logger)({
  transports: [
	new (winston.transports.Console)(),
	new (winston.transports.File)({ filename: global.logFile })
  ]
});
*/