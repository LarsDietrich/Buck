 /**
 * randomString returns a pseude-random ASCII string which contains at least the specified number of bits of entropy
 * the return value is a string of length ⌈bits/6⌉ of characters from the base64 alphabet
 * @param {int} bits: Number of bits to use for the randomString
 * 
 */
var randomString = exports.randomString = function (bits) {
	var chars, rand, i, ret;
	
	chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; 
	ret = '';
	
	// in v8, Math.random() yields 32 pseudo-random bits (in spidermonkey it gives 53)
	while (bits > 0) {
		// 32-bit integer
		rand = Math.floor(Math.random() * 0x100000000); 
		// base 64 means 6 bits per character, so we use the top 30 bits from rand to give 30/6=5 characters.
		for (i = 26; i > 0 && bits > 0; i -= 6, bits -= 6) {
			ret += chars[0x3F & rand >>> i];
		}
	}
	
	return ret;
};

/* http://blog.stevenlevithan.com/archives/faster-trim-javascript */
function trim (str) {
	var	str = str.replace(/^\s\s*/, ''),
		ws = /\s/,
		i = str.length;
	while (ws.test(str.charAt(--i)));
	return str.slice(0, i + 1);
}

var getCookie = exports.getCookie = function(req,name) {
	var cookieValue = null;
	if (req.headers.cookie && req.headers.cookie != '') {
			var cookies = req.headers.cookie.split(';');
			for (var i = 0; i < cookies.length; i++) {
					var cookie = trim(cookies[i]);
					// Does this cookie string begin with the name we want?
					if (cookie.substring(0, name.length + 1) == (name + '=')) {
							cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
							break;
					}
			}
	}
	return cookieValue;
}

/**
 * @todo move this to some client/server common js file
*/
var humanStatus = exports.humanStatus = function(status) {
	var humanStatus = 'incoming';
	switch (status) {
		case 0:
			humanStatus = 'deleted';
			break;
		case 1:
			humanStatus = 'decayed';
			break;
		case 2:
			humanStatus = 'incoming';
			break;
		case 3:
			humanStatus = 'accepted';
			break;
		case 4:
			humanStatus = 'current';
			break;
		case 5:
			humanStatus = 'done';
			break;
	}
    var f = humanStatus.charAt(0).toUpperCase();
    return f + humanStatus.substr(1);
}