var bucket = require('./bucket');
var item = require('./item');
var member = require('./member');

rsc = function(db,es) {
	return {
		bucket: new bucket.Bucket(db,es),
		item: new item.Item(db,es),
		member: new member.Member(db,es)
	}
};
module.exports = rsc; 