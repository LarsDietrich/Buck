var common = require('./common'),
	helpers = require('./helpers');

var Bucket = exports.Bucket = function(db,es) {
	this.db = db;
	this.es = es;
}

Bucket.prototype.list = function(cb,params) {
	var _data;
	var filter = {
		from: 0,
		size: common.esMax,
		query: {
			filtered: {
				query: {
					query_string: {
						query: '*'
					}
				},
				filter: {
					term: {
						_type: 'bucket'
					}
				}
			}
		}
	};
	if ( typeof(params) !== 'undefined' && typeof(params.q) !== 'undefined' ) {
		filter.query.filtered.query.query_string.query = '*'+params.q+'*';
	}
	this.es.search(common.esIndex,'bucket',filter)
		.on('data',function(data){
     		data = JSON.parse(data);
     		if ( !data.error && data.hits.total > 0 ) { 
     			_data = data.hits.hits;
				_data = _data.map(function(elem){return elem._source;});
     		}
		})
		.on('done',function(){
     		cb(null,_data);
		})
		.on('error',function(err){
			cb(err);
		})
		.exec();
};

Bucket.prototype.show = function(id,cb) {
	var _data;
	this.es.search(common.esIndex,'bucket',{
		from: 0,
		size: 1,
		query: {
			filtered: {
				query: {
					query_string: {
						field: 'bucketId',
						query: id
					}
				},
				filter: {
					term: {
						_type: 'bucket'
					}
				}
			}
		}
	})
		.on('data',function(data){
			data = JSON.parse(data);
     		 if ( !data.error && data.hits.total == 1 ) {
     		 	_data = data.hits.hits[0]._source;
     		 }
		})
		.on('done',function(){
     		cb(null,_data);
		})
		.on('error',function(err){
			cb(err);
		})
		.exec();
};

Bucket.prototype.create = function(bucket,cb) {
	bucket._id = bucket.bucketId = 'bucket_'+helpers.randomString(30);
	bucket.resource = 'Bucket';

	this.db.save(bucket._id,bucket,function(err,res){
		if (err) {
			return cb(err);
		}
		cb(null,bucket);
	});
};

Bucket.prototype.update = function(id,bucket,cb) {
	this.db.merge(id,bucket,function(err,res){
		if (err) {
			return cb(err);
		}
		cb(null,true);
	});
};

Bucket.prototype.destroy = function(id,cb) {
	var that = this;
	this.show(id,function(err,doc){
		if (err) {
			return cb(err);
		} else if (typeof(doc)==='undefined') {
			return cb(err);
		}
		that.db.remove(id,doc._rev,function(err,res){
			if (err) {
				return cb(err);
			}
			that.es.deleteDocument(common.esIndex,'bucket',id)
				.on('done',function(){
					cb(null,true);
				})
				.on('error',function(err){
					cb(err);
				})
				.exec();
		});
	});
};