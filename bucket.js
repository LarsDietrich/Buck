var common = require('./common');

var Bucket = exports.Bucket = function(es) {
	this.es = es;
}

Bucket.prototype.list = function(cb) {
	var _data;
	this.es.search(common.esIndex,'bucket',{
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
	})
		.on('data',function(data){
     		data = JSON.parse(data);
     		if ( data.hits.total > 0 ) {
     			_data = data.hits.hits;
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
     		 if ( data.hits.total == 1 ) {
     		 	_data = data.hits.hits[0];
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