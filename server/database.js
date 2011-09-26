var cradle = require('cradle');

var setup = exports.setup = function(opts,cb) {
	cradle.setup({
		host: opts.host || '127.0.0.1', 
		port: 5984,
		options: opts.options
	});
	var conn = new (cradle.Connection)({auth:opts.auth}),
		db = conn.database(opts.database || 'buck');

	cb(null,db);
};