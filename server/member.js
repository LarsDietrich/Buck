var common = require('./common');

var Member = exports.Member = function(es) {
	this.es = es;
}

Member.prototype.list = function(cb) {
	var _data;
	this.es.search(common.esIndex,'member',{
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
						_type: 'member'
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

Member.prototype.show = function(id,cb) {
	var _data;
	this.es.search(common.esIndex,'member',{
		from: 0,
		size: 1,
		query: {
			filtered: {
				query: {
					query_string: {
						field: 'handle',
						query: id
					}
				},
				filter: {
					term: {
						_type: 'member'
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