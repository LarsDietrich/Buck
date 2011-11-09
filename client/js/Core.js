function Core(cb) {
	this.init(cb);
}
Core.prototype = {
	init: function(cb) {
		var that = this;

		this.client = new Client();
		this.utils = new Utils();
		this.storage = new Storage(this.client);
		this.ui = {};
		this.storage.reload(function(){
			that.ui = new UI(that.storage,that.utils);
			that.parseUrl(function(){cb()});
		});
	},
	/*
	/items
		  /:itemId <- display single item (?q=item_asdfg)
	/buckets
		  /:bucketId <- display single bucket (?q=bucket_asdfg)
	/?q=:query
	*/
	parseUrl: function(cb) {
		var that = this,
			path = document.location.pathname,
			q = document.location.search;
		if ( $.cookie('buckUserId') === null || $.cookie('buckUserName') === null ) {
			if ( path.indexOf('/login') === -1 ) {
				return document.location = '/login';
			} else {
				cb();
			}
		} else {
			path = path.split('/').slice(1);
			if ( path.length > 1 ) {
				this.storage.setQuery({
					query: path[1]
				});
			}

			if ( path[0].indexOf('items') !== -1 ) {
				this.ui.switchMode('items',function(){cb();});
			} else if ( path[0].indexOf('buckets') !== -1 ) {
				this.ui.switchMode('buckets',function(){cb();});
			} else if ( q.indexOf('q=') !== -1 ) {
				q = q.split('=')[1]; //?q=asdf -> asdf
					
				this.storage.setQuery({
					query: q
				});
				this.ui.switchMode('items',function(){
					cb();
				});
			} else {
				cb();
			}
		}
	}
}           