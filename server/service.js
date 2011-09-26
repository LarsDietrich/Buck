var journey = require('journey'),
	fs = require('fs'),
	style = require('../client/style.js');

exports.createRouter = function(resources){
	var router = new(journey.Router);
	router.path('/',function(){
		//GET /
		this.get('/').bind(function(req,res,params){
			fs.readFile('client/index.html','utf-8',function(err,data){
				if (err){return res.send(500,{},{error:err});}
				res.baseResponse.headers = {'Content-Type':'text/html'}; //hack to send actual html headers
				res.sendBody(data);
			});
		});
	});
	router.path('/style.css',function(){
		//GET /style.css
		this.get().bind(function(req,res,params){
			style.getCss(function(err,data){
				if (err){return res.send(500,{},{error:err});}
				res.baseResponse.headers = {'Content-Type':'text/html'}; //hack to send actual html headers
				res.sendBody(data);
			});
		});
	});
	router.path('/fn.js',function(){
		//GET /fn.js
		this.get().bind(function(req,res,params){
			fs.readFile('client/fn.js','utf-8',function(err,data){
				if (err){return res.send(500,{},{error:err});}
				res.baseResponse.headers = {'Content-Type':'text/html'}; //hack to send actual html headers
				res.sendBody(data);
			});
		});
	});
	router.path('/api',function(){
		this.path('/buckets',function(){
			//GET /buckets
			this.get().bind(function(req,res,params){
				resources.bucket.list(function(err,buckets){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},{buckets:buckets});
				});
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
					res.send(200,{},{bucket:result});
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
				resources.item.list(function(err,items){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},{items:items});
				});
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
				resources.item.create(item,function(err,res){
					if (err){return res.send(500,{},{error:err});}
					res.send(200,{},{bookmark:res});
				});
			});
			//PUT /items/:id
			this.put(/\/([a-zA-Z0-9_-]+)/).bind(function(req,res,itemId,item){
				resources.item.update(itemId,item,function(err,res){
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
					res.send(200,{},{members:members});
				});
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