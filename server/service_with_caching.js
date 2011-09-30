var journey = require('journey'),
	http = require('http'),
	fs = require('fs'),
	common = require('./common'),
	style = require('../client/style.js');

exports.createRouter = function(resources){
	var router = new(journey.Router),
		that = this;
	this.storage = {};
	router.path('/',function(){
		//GET /
		this.get('/').bind(function(req,res,params){
			if ( typeof(that.storage['index.html']) === 'undefined' ) {
				fs.readFile('client/index.html','utf-8',function(err,data){
					if (err){return res.send(500,{},{error:err});}
					res.baseResponse.headers = {'Content-Type':'text/html'};
					that.storage['index.html'] = data;
					res.sendBody(data);
				});
			} else {
				res.baseResponse.headers = {'Content-Type':'text/html'};
				res.sendBody(that.storage['index.html']);
			}
		});
	});
	router.path('/f',function(){
		//GET /f/adelle-:weight.:extension
		this.get(/adelle_(light|regular|bold).(eot|woff|ttf)/).bind(function(req,res,weight,extension,params){
			fs.readFile('client/fonts/adelle_'+weight+'.'+extension,'utf-8',function(err,data){
				if (err){return res.send(500,{},{error:err});}
				res.baseResponse.headers = {'Content-Type':'font/ttf'};
				res.sendBody(data);
			});
		});
	});
	router.path('/tmpl',function(){
		this.get(/([a-zA-Z0-9_-]+)\.html/).bind(function(req,res,template,params){
			if ( typeof(that.storage[template+'.html']) === 'undefined' ) {
				fs.readFile('client/tmpl/'+template+'.html','utf-8',function(err,data){
					if (err){return res.send(500,{},{error:err});}
					res.baseResponse.headers = {'Content-Type':'text/html'};
					that.storage[template+'.html'] = data;
					res.sendBody(data);
				});
			} else {
				res.baseResponse.headers = {'Content-Type':'text/html'};
				res.sendBody(that.storage[template+'.html']);
			}
		}); 
	});
	router.path('/login',function(){
		//GET /login
		this.get().bind(function(req,res,params){
			if ( typeof(that.storage['login.html']) === 'undefined' ) {
				fs.readFile('client/login.html','utf-8',function(err,data){
					if (err){return res.send(500,{},{error:err});}
					res.baseResponse.headers = {'Content-Type':'text/html'};
					that.storage['login.html'] = data;
					res.sendBody(data);
				});
			} else {
				res.baseResponse.headers = {'Content-Type':'text/html'};
				res.sendBody(that.storage['login.html']);
			}
		});
	});
	router.path('/style.css',function(){
		//GET /style.css
		this.get().bind(function(req,res,params){
			if ( typeof(that.storage['style.css']) === 'undefined' ) {
				style.getCss(function(err,data){
					if (err){return res.send(500,{},{error:err});}
					res.baseResponse.headers = {'Content-Type':'text/css'};
					res.sendBody(data);
				});
			} else {
				res.baseResponse.headers = {'Content-Type':'text/css'};
				res.sendBody(that.storage['style.css']);
			}
		});
	});
	router.path('/fn.js',function(){
		//GET /fn.js
		this.get().bind(function(req,res,params){
			if ( typeof(that.storage['fn.js']) === 'undefined' ) {
				fs.readFile('client/js/fn.js','utf-8',function(err,data){
					if (err){return res.send(500,{},{error:err});}
					res.baseResponse.headers = {'Content-Type':'application/javascript'};
					if ( common.compressJS ) {
						var jsp = require("uglify-js").parser;
						var pro = require("uglify-js").uglify;
						var ast = jsp.parse(data); // parse code and get the initial AST
						ast = pro.ast_mangle(ast); // get a new AST with mangled names
						ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
						data = pro.gen_code(ast); // compressed code here
					}
					that.storage['fn.js'] = data;
					res.sendBody(data);
				});
			} else {
				res.baseResponse.headers = {'Content-Type':'application/javascript'};
				res.sendBody(that.storage['fn.js']);
			}
		});
	});
	router.path('/jq.js',function(){
		//GET /jq.js
		this.get().bind(function(req,res,params){
			if ( typeof(that.storage['jq.js']) === 'undefined' ) {
				fs.readFile('client/js/jq.js','utf-8',function(err,data){
					if (err){return res.send(500,{},{error:err});}
					res.baseResponse.headers = {'Content-Type':'application/javascript'};
					if ( common.compressJS ) {
						var jsp = require("uglify-js").parser;
						var pro = require("uglify-js").uglify;
						var ast = jsp.parse(data); // parse code and get the initial AST
						ast = pro.ast_mangle(ast); // get a new AST with mangled names
						ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
						data = pro.gen_code(ast); // compressed code here
					}
					that.storage['jq.js'] = data;
					res.sendBody(data);
				});
			} else {
				res.baseResponse.headers = {'Content-Type':'application/javascript'};
				res.sendBody(that.storage['jq.js']);
			}
		});
	});
	router.path('/plug.js',function(){
		//GET /plug.js
		this.get().bind(function(req,res,params){
			if ( typeof(that.storage['plug.js']) === 'undefined' ) {
				fs.readFile('client/js/plug.js','utf-8',function(err,data){
					if (err){return res.send(500,{},{error:err});}
					res.baseResponse.headers = {'Content-Type':'application/javascript'};
					if ( common.compressJS ) {
						var jsp = require("uglify-js").parser;
						var pro = require("uglify-js").uglify;
						var ast = jsp.parse(data); // parse code and get the initial AST
						ast = pro.ast_mangle(ast); // get a new AST with mangled names
						ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
						data = pro.gen_code(ast); // compressed code here
					}
					that.storage['fn.js'] = data;
					res.sendBody(data);
				});
			} else {
				res.baseResponse.headers = {'Content-Type':'application/javascript'};
				res.sendBody(that.storage['plug.js']);
			}
		});
	});
	router.path('/api',function(){
		this.path('/buckets',function(){
			//GET /buckets
			this.get().bind(function(req,res,params){
				resources.bucket.list(function(err,buckets){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},buckets);
				},params);
			});
			//GET /buckets/q/:query
			this.get(/q\/(.*)/).bind(function(req,res,query,params){
				resources.bucket.list(function(err,buckets){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},buckets);
				},{q:query});
			});
			//GET /buckets/:id
			this.get(/\/([a-zA-Z0-9_-]+)/).bind(function(req,res,bucketId,params){
				resources.bucket.show(bucketId,function(err,bucket){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},{bucket:bucket});
				});
			});
			//POST /buckets
			this.post().bind(function(req,res,bucket){
				resources.bucket.create(bucket,function(err,result){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},result);
				});
			});
			//PUT /buckets/:id
			this.put(/\/([a-zA-Z0-9_-]+)/).bind(function(req,res,bucketId,bucket){
				resources.bucket.update(bucketId,bucket,function(err,updated){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},{updated:updated});
				});
			});
			//DELETE /buckets/:id
			this.del(/\/([a-zA-Z0-9_-]+)/).bind(function(req,res,bucketId,params){
				resources.bucket.destroy(bucketId,function(err,destroyed){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},{destroyed:destroyed});
				});
			});
		});

		this.path('/items',function(){
			//GET /items
			this.get().bind(function(req,res,params){
				console.log('geci');
				if ( typeof(params.m) !== 'undefined' ) {
					console.log('ribanc');
					resources.bucket.list(function(err,buckets){
						if (err){return res.send(500,{},{error:err});}
						if ( typeof(buckets) !== 'undefined' ) {
							var ctr = buckets.length;
							var _items = [];
							buckets.forEach(function(bucket,i){
								resources.item.list(function(err,items){
									if (err){return res.send(500,{},{error:err});}
									_items = _items.concat(items);
									ctr -= 1;
									if ( ctr === 0 ) {
										res.send(200,{},_items);
									}
								},{b:bucket.bucketId});
							});
						} else {
							res.send(200,{},[]);
						}
					},params);
				} else if ( typeof(params.b) !== 'undefined' ) {
					console.log('fasz');
					resources.item.list(function(err,items){
						if (err){return res.send(500,{},{error:err});}
						res.send(200,{},items);
					},params);
				} else {
					console.log('anyad');
					resources.item.list(function(err,items){
						if (err){return res.send(500,{},{error:err});}
						res.send(200,{},items);
					},params);
				}
			});
			//GET /items/q/:query
			this.get(/q\/(.*)/).bind(function(req,res,query,params){
				console.log(query);
				resources.item.list(function(err,items){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},items);
				},{q:query});
			});
			//GET /items/:id
			this.get(/\/([a-zA-Z0-9_-]+)/).bind(function(req,res,itemId,params){
				resources.item.show(itemId,function(err,item){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},{item:item});
				});
			});
			//POST /items
			this.post().bind(function(req,res,item){
				resources.item.create(item,function(err,result){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},result);
				});
			});
			//PUT /items/:id
			this.put(/\/([a-zA-Z0-9_-]+)/).bind(function(req,res,itemId,item){
				console.log(itemId);
				console.log(item);
				resources.item.update(itemId,item,function(err,updated){
					if (err){return res.send(500,{},{error:updated});}
					res.send(200,{},{updated:updated});
				});
			});
			//DELETE /items/:id
			this.del(/\/([a-zA-Z0-9_-]+)/).bind(function(req,res,itemId,params){
				resources.item.destroy(itemId,function(err,destroyed){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},{destroyed:destroyed});
				});
			});
		});

		this.path('/members',function(){
			//GET /members
			this.get().bind(function(req,res,params){
				resources.member.list(function(err,members){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},members);
				},params);
			});
			//GET /members/:id
			this.get(/\/([a-zA-Z0-9_-]+)/).bind(function(req,res,memberId,params){
				resources.member.show(memberId,function(err,member){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},{member:member});
				});
			});
		});
	});
	return router;
};