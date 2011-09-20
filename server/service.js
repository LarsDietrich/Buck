var journey = require('journey');

exports.createRouter = function(resources){
	var router = new(journey.Router);
	router.path('/buckets',function(){
		//GET /buckets
		this.get().bind(function(req,res,params){
			resources.bucket.list(function(err,buckets){
				if (err){return res.send(500,{},{error:err});}
				res.send(200,{},{buckets:buckets});
			});
		});
		//GET /buckets/:id
		this.get(/\/([a-zA-Z0-9]+)/).bind(function(req,res,bucketId,params){
			resources.bucket.show(bucketId,function(err,bucket){
				if (err){return res.send(500,{},{error:err});}
				res.send(200,{},{bucket:bucket});
			});
		});
		//POST /buckets
		this.post().bind(function(req,res,params){
			res.send(501,{},{action:'create'});
		});
		//PUT /buckets/:id
		this.post(/\/([a-zA-Z0-9]+)/).bind(function(req,res,bucketId,params){
			res.send(501,{},{action:'update'});
		});
		//DELETE /buckets/:id
		this.del(/\/([a-zA-Z0-9]+)/).bind(function(req,res,bucketId,params){
			res.send(501,{},{action:'delete'});
		});
	});

	router.path('/items',function(){
		//GET /items
		this.get().bind(function(req,res,params){
			resources.item.list(function(err,items){
				if (err){return res.send(500,{},{error:err});}
				res.send(200,{},{items:items});
			});
		});
		//GET /items/:id
		this.get(/\/([a-zA-Z0-9]+)/).bind(function(req,res,itemId,params){
			resources.item.show(itemId,function(err,item){
				if (err){return res.send(500,{},{error:err});}
				res.send(200,{},{item:item});
			});
		});
		//POST /items
		this.post().bind(function(req,res,params){
			res.send(501,{},{action:'create'});
		});
		//PUT /items/:id
		this.post(/\/([a-zA-Z0-9]+)/).bind(function(req,res,itemId,params){
			res.send(501,{},{action:'update'});
		});
		//DELETE /items/:id
		this.del(/\/([a-zA-Z0-9]+)/).bind(function(req,res,itemId,params){
			res.send(501,{},{action:'delete'});
		});
	});

	router.path('/members',function(){
		//GET /members
		this.get().bind(function(req,res,params){
			resources.member.list(function(err,members){
				if (err){return res.send(500,{},{error:err});}
				res.send(200,{},{members:members});
			});
		});
		//GET /members/:id
		this.get(/\/([a-zA-Z0-9]+)/).bind(function(req,res,memberId,params){
			resources.member.show(memberId,function(err,member){
				if (err){return res.send(500,{},{error:err});}
				res.send(200,{},{member:member});
			});
		});
	});

	return router;
};