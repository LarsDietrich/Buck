var http = require('http'),
	winston = require('winston'),
	helpers = require('./helpers'),
	database = require('./database'),
	elasticSearchClient = require('./elasticsearch'),
	rsc = require('./resources'),
	common = require('./common'),
	service = require('./service'),
	fs = require('fs');

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
			if ( req.url === '/favicon.ico' ) {
				fs.readFile('client/favicon.ico',function(err,data){
					res.writeHead(200,{'Content-Type':'image/vnd.microsoft.icon'});
					res.end(data);
				});
			} else if ( /\/(storage|utils|client|ui|core|plug|jq|fn).js/.test(req.url) ) {
				fs.readFile('client/js'+req.url,'utf-8',function(err,data){
					res.writeHead(200,{'Content-Type':'application/javascript'});
					res.end(data);
				});
			} else if ( req.url === '/' || /(\/(\?q=)|\/items|\/buckets)(.*)/.test(req.url) ) {
				fs.readFile('client/index.html','utf-8',function(err,data){
					res.writeHead(200,{'Content-Type':'text/html'});
					res.end(data);
				});
			} else {
				var emitter = router.handle(req,body,function(route){
					res.writeHead(route.status,route.headers);
					res.end(route.body);
				});
				emitter.on('log',function(info) {
					winston.info('Request completed', info);
				});
			}
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
