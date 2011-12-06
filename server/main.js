var http = require('http'),
	winston = require('winston'),
	static = require('node-static'),
	helpers = require('./helpers'),
	database = require('./database'),
	elasticSearchClient = require('./elasticsearch'),
	rsc = require('./resources'),
	common = require('./common'),
	service = require('./service'),
	style = require('../client/style.js'),
	fs = require('fs'),
	logger = require('./logger');

exports.createServer = function(port,db,es){
	var resources = rsc(db,es),
		router = service.createRouter(resources),
		files = new (static.Server)('./client', { cache: 3600 }),
		httpServer = http.createServer(function(req,res){
		var body = '';

		logger.w.info('Incoming Request',{url:req.url});
		
		req.on('data',function(chunk){
			body += chunk;
		});
		
		req.on('end',function(){
			if ( req.url.indexOf('/items') === 0 || req.url.indexOf('/buckets') === 0 ) {
				req.url = '/';
			} else if ( req.url.indexOf('/login') === 0 ) {
				req.url = '/login.html';
			}
			var emitter = router.handle(req,body,function(route){
				if ( route.status === 404 ) {
					files.serve(req,res,function(err,result){
						if (err && (err.status===404)) {
							res.writeHead(404);
							res.end('File not found.');
						}
					});
					return;
				}
				res.writeHead(route.status,route.headers);
				res.end(route.body);
			});
			emitter.on('log',function(info) {
				logger.w.info('Request completed', info);
			});
		});
	});

	if (port) {
		httpServer.listen(port);
	}

	return httpServer;
};

exports.start = function (options, cb) {
	var db = database.setup(options,function(err,db){
		if (err) {
			return cb(err);
		}
		var es = new elasticSearchClient.ElasticSearchClient(elasticSearchClient.serverOptions);
		cb(null, exports.createServer(options.port,db,es));
	});
}
