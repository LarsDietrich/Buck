var less = require('less');
var fs = require('fs');

module.exports = {
	getCss: function(cb){
		var parser = new(less.Parser);

		fs.readFile('client/style.less','utf-8',function(err,data){
			if (err){return cb(err);}
			parser.parse(data, function (err, tree) {
			    if (err) { return cb(err) }
			    cb(null,tree.toCSS());
			});
		});
	}
};

