var http = require('http'),
	winston = require('winston'),
	database = require('./database'),
	elasticSearchClient = require('./elasticsearch'),
	rsc = require('./resources'),
	common = require('./common'),
	service = require('./service');

exports.createServer = function(port,db,es){
	var resources = rsc(db,es); 
	var router = service.createRouter(resources);
	var httpServer = http.createServer(function(req,res){
		var body = '';

		winston.info('Incoming Request',{url:req.url});
		
		req.on('data',function(chunk){
			body += chunk;
		});

		req.on('end',function(){
			var emitter = router.handle(req,body,function(route){
				res.writeHead(route.status,route.headers);
				res.end(route.body);
			});
			emitter.on('log',function(info) {
				winston.info('Request completed', info);
			});
		});
	});

	if (port) {
		httpServer.listen(port);
	}

	return httpServer;
};

exports.start = function (options, cb) {
	winston.add(winston.transports.File, { filename: options.logFile });
	//winston.remove(winston.transports.Console);
	var db = database.setup(options,function(err,db){
		if (err) {
			return cb(err);
		}
		var es = new elasticSearchClient.ElasticSearchClient(elasticSearchClient.serverOptions);
		cb(null, exports.createServer(options.port,db,es));
	});
}
