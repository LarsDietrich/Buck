var less = require('less');
var fs = require('fs');

module.exports = {
	getCss: function(cb){ 
		function addLess(err,dat) {
			if ( err ) {
				console.log(err);
				return; 
			}
			var parser = new(less.Parser);

			fs.readFile('client/css/bottom.less','utf-8',function(err,data){
				if (err){return cb(err);}
				parser.parse(data, function (err, tree) {
				    if (err) { return cb(err) }
				    cb(null,dat+"\n"+tree.toCSS({compress:false}));
				});
			});
		}

		fs.readFile('client/css/skeleton.css','utf-8',function(err,data){addLess(err,data)});
	}
};

