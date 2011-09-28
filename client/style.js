var less = require('less');
var fs = require('fs');

module.exports = {
	getCss: function(cb){ 
		var parser = new(less.Parser);

		fs.readFile('client/css/bottom.less','utf-8',function(fsErr,lessData){
			if (fsErr){console.log(fsErr); return cb(fsErr);}
			fs.readFile('client/css/skeleton.css','utf-8',function(fsErrTwo,cssData){
				if (fsErrTwo){console.log(fsErrTwo); return cb(fsErrTwo);}
				parser.parse(cssData+lessData, function (err, tree) {
				    if (err) { console.log(err); return cb(err) }
				    cb(null,tree.toCSS({compress:false}));
				});
			});
		}); 		
	}
};

