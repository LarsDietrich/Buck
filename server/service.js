var journey = require('journey'),
	nodeHttp = require('http'),
	winston = require('winston'),
	fs = require('fs'),
	common = require('./common'),
	helpers = require('./helpers'),
	style = require('../client/style.js'),
	email = require('./email'),
	userEmail = '',
	userName = '',
	userHandle = '';

function getEmailFromCookie(request,body,cb) {
	userHandle = helpers.getCookie(request,'buckUserId');
	userName = helpers.getCookie(request,'buckUserName');
	userEmail = userHandle+'@'+common.domain;
	cb(null);
}

exports.createRouter = function(resources){
	var router = new(journey.Router)({filter:getEmailFromCookie});

	router.map(function(){
		this.filter(function(){
			this.path('/tmpl',function(){
				this.get(/([a-zA-Z0-9_-]+)\.html/).bind(function(req,res,template,params){
					fs.readFile('client/tmpl/'+template+'.html','utf-8',function(err,data){
						if (err){return res.send(500,{},{error:err});}
						res.baseResponse.headers = {'Content-Type':'text/html'};
						res.sendBody(data);
					});
				}); 
			});
			this.path('/login',function(){
				//GET /login
				this.get().bind(function(req,res,params){
					fs.readFile('client/login.html','utf-8',function(err,data){
						if (err){return res.send(500,{},{error:err});}
						res.baseResponse.headers = {'Content-Type':'text/html'};
						res.sendBody(data);
					});
				});
			});
			this.path('/fibonacci',function(){
				//GET /login
				this.get().bind(function(req,res,params){
					fs.readFile('client/fibonacci.html','utf-8',function(err,data){
						if (err){return res.send(500,{},{error:err});}
						res.baseResponse.headers = {'Content-Type':'text/html'};
						res.sendBody(data);
					});
				});
			});
			this.path('/style.css',function(){
				//GET /style.css
				this.get().bind(function(req,res,params){
					style.getCss(function(err,data){
						if (err){return res.send(500,{},{error:err});}
						res.baseResponse.headers = {'Content-Type':'text/css'};
						res.sendBody(data);
					});
				});
			});
			this.path(/\/(Storage|Utils|Client|Core).js/,function(){
				//GET /fn.js
				this.get().bind(function(req,res,params){
					fs.readFile('client/js/fn.js','utf-8',function(err,data){
						if (err){return res.send(500,{},{error:err});}
						res.baseResponse.headers = {'Content-Type':'application/javascript'};

						res.sendBody(data);
					});
				});
			});
			// this.path('/login.js',function(){
			// 	//GET /login.js
			// 	this.get().bind(function(req,res,params){
			// 		fs.readFile('client/js/login.js','utf-8',function(err,data){
			// 			if (err){return res.send(500,{},{error:err});}
			// 			res.baseResponse.headers = {'Content-Type':'application/javascript'};
			// 			res.sendBody(data);
			// 		});
			// 	});
			// });
			// this.path('/jq.js',function(){
			// 	//GET /jq.js
			// 	this.get().bind(function(req,res,params){
			// 		fs.readFile('client/js/jq.js','utf-8',function(err,data){
			// 			if (err){return res.send(500,{},{error:err});}
			// 			res.baseResponse.headers = {'Content-Type':'application/javascript'};
			// 			res.sendBody(data);
			// 		});
			// 	});
			// });
			// this.path('/plug.js',function(){
			// 	//GET /plug.js
			// 	this.get().bind(function(req,res,params){
			// 		fs.readFile('client/js/plug.js','utf-8',function(err,data){
			// 			if (err){return res.send(500,{},{error:err});}
			// 			res.baseResponse.headers = {'Content-Type':'application/javascript'};
			// 			res.sendBody(data);
			// 		});
			// 	});
			// });
			this.path('/api',function(){
				this.path('/joke',function(){
					this.get().bind(function(req,res,name,params){
						var firstName = name.name.substr(0,name.name.indexOf(' ')),
							lastName = name.name.substr(name.name.indexOf(' ')+1);
						var options = {
							host: 'api.icndb.com',
							port: 80,
							path: '/jokes/random?firstName='+encodeURIComponent(firstName)+'&lastName='+encodeURIComponent(lastName),
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
								'Connection': 'keep-alive',
								'User-Agent': 'Yo mama'
							}
						};
						nodeHttp.get(options, function(jokeRes) {
							jokeRes.setEncoding('utf-8');
							jokeRes.on('data', function (chunk) {
								res.sendBody(chunk);
							});
						}).on('error', function(e) {
							return res.send(500,{},{error:e});
						});
					});
				});
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
						if ( typeof(params.m) !== 'undefined' ) {
							winston.log('getting buckets/items for member: '+params.m );
							resources.bucket.list(function(err,buckets){
								if (err){return res.send(500,{},{error:err});}
								winston.log('buckets='+JSON.stringify(buckets));
								if ( typeof(buckets) !== 'undefined' ) {
									winston.log('got '+buckets.length+' buckets:');
									var ctr = buckets.length;
									var _items = [];
									buckets.forEach(function(bucket,i){
										resources.item.list(function(err,items){
											if (err){return res.send(500,{},{error:err});}
											winston.log('items = '+JSON.stringify(items));
											if (typeof items !== 'undefined') {
												winston.log('getting items for bucket: '+bucket.name);
												winston.log('got '+items.length+' items');
												_items = _items.concat(items);
											}
											ctr -= 1;
											winston.log('ctr is '+ctr);
											if ( ctr === 0 ) {
												winston.log('sending data back');
												res.send(200,{},_items);
											}
										},{b:bucket.bucketId});
									});
								} else {
									res.send(200,{},[]);
								}
							},params);
						} else if ( typeof(params.b) !== 'undefined' ) {
							resources.item.list(function(err,items){
								if (err){return res.send(500,{},{error:err});}
								res.send(200,{},items);
							},params);
						} else {
							resources.item.list(function(err,items){
								if (err){return res.send(500,{},{error:err});}
								res.send(200,{},items);
							},params);
						}
					});
					//GET /items/q/:query
					this.get(/q\/(.*)/).bind(function(req,res,query,params){
						winston.log(query);
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
							resources.bucket.list(function(err,buckets){ //get all buckets for user who submitted ticket
								if (err){return res.send(500,{},{error:err});}
								var ownBucket = false;
								if ( typeof(buckets) !== 'undefined' ) {
									var ctr = buckets.length;
									var _items = [];
									buckets.forEach(function(bucket,i){
										if ( bucket._id === item.bucketId ) { //it is the users' own bucket
											ownBucket = true;
										}
									});
									if ( ownBucket === false ) { //this means we need to send a notification to everybody in that bucket
										resources.bucket.show(item.bucketId,function(err,bucket){ //get item's bucket
											if (err){return res.send(500,{},{error:err});}
											if ( typeof item !== 'undefined' ) {
												item.bucketName = bucket.name; //this is needed for the email template
												email.sendMail({
													template: 'email_created',
													to: bucket.memberHandles.join('@'+common.domain+', ')+'@'+common.domain, //join doesn't apply to the last elem
													data: {
														item: item,
														memberName: userName
													}
												},function(err,sent) {
													console.log('Message ' + (sent ? 'sent' : 'failed'));
												});
											}
										});
									}
								}
							},{m:userHandle});
							res.send(200,{},result);
						});
					});
					//PUT /items/:id
					this.put(/\/([a-zA-Z0-9_-]+)/).bind(function(req,res,itemId,item){
						resources.item.show(itemId,function(err,originalItem){ //get the original item so that I can see what changed
							if (err){return res.send(500,{},{error:err});}

							resources.item.update(itemId,item,function(err,updated){
								if (err){return res.send(500,{},{error:updated});}

								if ( typeof item !== 'undefined' ) {
									//   not my own						  and status has changed				 
									if ( userHandle !== item.submitter && item.status !== originalItem.status ) {
										if ( item.status >= 3 ) { //and is at least accepted
											var template = 'email_modified';
										} else if ( item.status === 0 ) { //or deleted
											var template = 'email_deleted';
										}
										if ( typeof template !== 'undefined' ) {
											email.sendMail({
												template: template,
												to: item.submitter+'@'+common.domain,
												data: {
													item: item,
													originalItem: originalItem,
													memberName: userName
												}
											},function(err,sent) {
												console.log('Message ' + (sent ? 'sent' : 'failed'));
											});
										}
									}
								}

								res.send(200,{},{updated:updated});
							});
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
			this.path('/',function(){
				//this.get(/(items|buckets|\?.*|#.*)/).bind(function(req,res,params){
				this.any.bind(function(req,res,params){
					fs.readFile('client/index.html','utf-8',function(err,data){
						if (err){return res.send(500,{},{error:err});}
						res.baseResponse.headers = {'Content-Type':'text/html'};
						res.sendBody(data);
					});
				});
			});
		});
	});
	return router;
};