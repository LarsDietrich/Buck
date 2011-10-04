var common = require('./common'),
	helpers = require('./helpers');

var Item = exports.Item = function(db,es) {
	this.db = db;
	this.es = es;
}

Item.prototype.list = function(cb,params) {
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
						_type: 'item'
					}
				}
			}
		},
		sort: [
			{
				modified: "desc"
			},
			{
				created: "desc"
			}
		]
	};
	if ( typeof(params) !== 'undefined' ) {
		if ( typeof(params.b) !== 'undefined' ) {
			filter.query.filtered.query.query_string.query = '*'+params.b+'*';
			filter.query.filtered.query.query_string.field = 'bucketId';
		} else if ( typeof(params.q) !== 'undefined' ) {
			filter.query.filtered.query.query_string.query = '*'+params.q+'*';
		}
	}
	this.es.search(common.esIndex,'item',filter)
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

Item.prototype.create = function(item,cb) {
	item._id = item.itemId = 'item_'+helpers.randomString(30);
	item.resource = 'Item';

	this.db.save(item._id,item,function(err,res){
		if (err) {
			return cb(err);
		}
		cb(null,item);
	});
};

Item.prototype.update = function(id,item,cb) {
	this.db.merge(id,item,function(err,res){
		if (err) {
			return cb(err);
		}
		cb(null,true);
	});
};

Item.prototype.destroy = function(id,cb) {
	var that = this;
	this.show(id,function(err,doc){
		if (err) {
			return cb(err);
		}

		that.db.remove(id,doc._rev,function(err,res){
			if (err) {
				return cb(err);
			}
			that.es.deleteDocument(common.esIndex,'item',id)
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