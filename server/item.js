var common = require('./common');

var Item = exports.Item = function(es) {
	this.es = es;
}

Item.prototype.list = function(cb) {
	var _data;
	this.es.search(common.esIndex,'item',{
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
						_type: 'item'
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

Item.prototype.show = function(id,cb) {
	var _data;
	this.es.search(common.esIndex,'item',{
		from: 0,
		size: 1,
		query: {
			filtered: {
				query: {
					query_string: {
						field: 'itemId',
						query: id
					}
				},
				filter: {
					term: {
						_type: 'item'
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