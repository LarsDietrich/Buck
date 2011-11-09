function Client() {
	this.init();
}

Client.prototype = {
	init: function() {
		this.apiUrl = '/api/';
	},
	redirectToLogin: function() {
		window.location.href = '/login';
	},
	request: function(type,method,data,success) {
		var that = this,
			url = this.apiUrl+type,
			requestParams = {
			url: url,
			type: method,
			contentType: 'application/json',
			dataType: 'json',
			success: function(result) {
				success(result);
			},
			statusCode: {
				401: function() {
					that.redirectToLogin();
				}
			}
		};
		if ( typeof(apiUrl) !== 'undefined' ) {
			requestParams.url = apiUrl;
		}
		if ( data !== null ) {
			if ( method === 'POST' || method === 'PUT' ) {
				$.extend(requestParams,{
					processData: false,
					data: JSON.stringify(data)
				});
			} else if ( method === 'GET' ) {
				if ( requestParams.url.indexOf('?') === -1 ) {
				   requestParams.url += '?';
				} else {
				   requestParams.url += '&';
				}
				requestParams.url += $.param(data,true);
			}
		}
		$.ajax(requestParams);
	},
	post: function(type,data,success) {
		this.request(type,'POST',data,success);
	},
	get: function(type,data,success) {
		this.request(type,'GET',data,success);
	},
	put: function(type,data,success) {
		this.request(type,'PUT',data,success);
	},
	del: function(type,success) {
		this.request(type,'DELETE',null,success);
	}
};