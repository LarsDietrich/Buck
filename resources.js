var bucket = require('./bucket');
var item = require('./item');
var member = require('./member');

rsc = function(es) {
	return {
		bucket: new bucket.Bucket(es),
		item: new item.Item(es),
		member: new member.Member(es)
	}
};
module.exports = rsc; 