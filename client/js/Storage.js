function Storage(client) {
	this.init(client);
}
Storage.prototype = {
	init: function(client) {
		this.client = client;

		this.maxAge = 1000; //1 second cache

		this.itemsTime = 0;
		this.bucketsTime = 0;
		this.membersTime = 0;

		this.items = {};
		this.members = {};
		this.buckets = {};
	},
	reload: function(cb) {
		this.doneCb = cb;
		this.parallelCalls = 3;

		this.ctr = 0;
		this.reloadItems();
		this.reloadMembers();
		this.reloadBuckets();
	},
	reloadBuckets: function(cb) {
		var that = this;
		if (typeof(cb)==='function') {
			this.ctr = 0;
			this.doneCb = cb;
			this.parallelCalls = 1;
		}
		if ( ((new Date().getTime())-this.bucketsTime) > this.maxAge ) {
			this.client.get('buckets',null,function(data){
				that.buckets = {};
				if ( data ) {
					data.forEach(function(bucket){
						this.buckets[bucket.bucketId] = bucket;
					},that);
				}
				that.bucketsTime = new Date().getTime();
				that.fakeParallel();
			});
		} else {
			this.fakeParallel();
		}
	},
	getBucket: function(bucketId) {
		return this.buckets[bucketId];
	},
	setBucket: function(bucketId,bucket,cb) {
		this.buckets[bucketId] = bucket;
		cb();
		this.client.put('buckets/'+bucketId,bucket,function(result){});
	},
	newBucket: function(bucket,cb) {
		var that = this;
		this.client.post('buckets',bucket,function(result){
			bucket.bucketId = result.bucketId;
			that.buckets[result.bucketId] = bucket;
			cb();
		});
	},
	removeBucket: function(bucketId,cb) {
		delete this.buckets[bucketId];
		cb();
		this.client.del('buckets/'+bucketId,function(result){});
	},
	setQuery: function(query) {
		if ( typeof(query.query) !== 'undefined' ) {
			this.query = query.query;
		} else {
			this.query = undefined;
		}
		if ( typeof(query.member) !== 'undefined' ) {
			this.member = query.member;
		} else {
			this.member = undefined;
		}

		this.itemsTime = -1;
		this.bucketsTime = -1;
		this.membersTime = -1;
	},
	getQuery: function() {
		return {
			query:this.query,
			member:this.member
		};
	},
	reloadItems: function(cb) {
		var that = this;
		if (typeof(cb)==='function') {
			this.ctr = 0;
			this.doneCb = cb;
			this.parallelCalls = 1;
		}
		var query = {};
		if ( typeof(this.query) !== 'undefined' ) {
			query.q = this.query;
		}
		if ( typeof(this.member) !== 'undefined' ) {
			query.m = this.member;
		}
		if ( ((new Date().getTime())-this.itemsTime) > this.maxAge ) {
			this.client.get('items',query,function(data){
				that.items = {};
				if ( data && data.length ) {
					data.forEach(function(item){
						if ( item ) {
							this.items[item.itemId] = item;
						}
					},that);
				}
				that.itemsTime = new Date().getTime();
				that.fakeParallel();
			});
		} else {
			this.fakeParallel();
		}
	},
	getItem: function(itemId) {
		return this.items[itemId];
	},
	setItem: function(itemId,item,cb) {
		/**
		 * @todo move this somewhere else, it's not the Storage's business
		 */
		if ( item.name === '' ) {
			alert('Item name cannot be empty!');
		} else {
			/**
			 @todo UNIX timestamp
			*/
			item.modified = new Date();
			this.items[itemId] = item;
			cb();
			this.client.put('items/'+itemId,item,function(result){});
		}
	},
	newItem: function(item,cb) {
		var that = this;
		this.client.post('items',item,function(result){
			item.itemId = result.itemId;
			item.modified = (new Date()).getTime();
			that.items[result.itemId] = item;
			cb();
		});
	},
	removeItem: function(itemId,cb) {
		this.items[itemId].status = 0;
		cb();
		this.client.put('items/'+itemId,this.items[itemId],function(result){});
	},
	reloadMembers: function(cb) {
		var that = this;
		if (typeof(cb)==='function') {
			this.ctr = 0;
			this.doneCb = cb;
			this.parallelCalls = 1;
		}
		if ( ((new Date().getTime())-this.membersTime) > this.maxAge ) {
			this.client.get('members',null,function(data){
				that.members = {};
				if ( data ) {
					data.forEach(function(member){
						this.members[member.handle] = member;
					},that);
				}
				that.membersTime = new Date().getTime();
				that.fakeParallel();
			});
		} else {
			this.fakeParallel();
		}
	},
	getMember: function(memberId) {
		return this.members[memberId];
	},
	fakeParallel: function() {
		if ( ++this.ctr === parseInt(this.parallelCalls,10) ) {
			this.doneCb();
		}
	},
	getJoke: function(cb) {
		var count = 0,
			i = 0,
			rand,
			memberName;

		for (k in this.members) {
			if (this.members.hasOwnProperty(k)) {
				++count;
			}
		}
		rand = (Math.floor(Math.random()*count+1)-1);
		$.each(this.members,function(idx,member){
			if ( ++i === rand ) {
				memberName = member.name;
				return true;
			}
		});
		this.client.get('joke',{
			name: memberName
		},function(data){
			cb(data.value.joke);
		})
		
	},
};
