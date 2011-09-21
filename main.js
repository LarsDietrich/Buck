var http = require('http');
var winston = require('winston');

var elasticSearchClient = require('./elasticsearch');

var rsc = require('./resources');
var common = require('./common');
var service = require('./service');

exports.createServer = function(port){
	var es = new elasticSearchClient.ElasticSearchClient(elasticSearchClient.serverOptions);
	var resources = rsc(es); 
	var router = service.createRouter(resources);
	var httpServer = http.createServer(function(req,res){
		var body = '';

		winston.info('Incoming Req',{url:req.url});
		
		req.on('data',function(chunk){
			body += chunk;
		});

		req.on('end',function(){
			router.handle(req,body,function(route){
				res.writeHead(route.status,route.headers);
				res.end(route.body);
			});
		});
	});

	if (port) {
		httpServer.listen(port);
	}

	return httpServer;
};

exports.start = function (options, callback) {
  var server = exports.createServer(options.port);
  callback(null, server);
}
