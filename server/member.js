var common = require('./common');

var Member = exports.Member = function(db,es) {
	this.db = db;
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
/*
Member.prototype.create = function(member,cb) {
	member._id = helpers.randomString(24);
	member.resource = 'Member';

	this.db.save(member._id,member,function(err,res){
		if (err) {
			return cb(err);
		}
		cb(null,member);
	});
};

Member.prototype.update = function(id,member,cb) {
	this.db.merge(id,member,function(err,res){
		if (err) {
			return cb(err);
		}
		cb(null,true);
	});
};

Member.prototype.destroy = function(id,cb) {
	var that = this;
	this.show(id,function(err,doc){
		if (err) {
			return cb(err);
		}

		that.db.remove(id,doc._rev,function(err,res){
			if (err) {
				return cb(err);
			}
			cb(null,true);
		});
	});
};*/