var winston = require('winston');

winston.add(winston.transports.File, { 
	filename: global.logFile, // @todo: not cool
	level: 'silly', 
	handleExceptions: true, 
	exitOnError: false,
	maxsize: 512000
});

winston.handleExceptions();

exports.w = winston;
