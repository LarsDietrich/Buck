var secret = require('./secret')
	helpers = require('./helpers'),
	nodemailer = require('nodemailer'),
	fs = require('fs'),
	templatesCache = [],

	/**
	 * @todo move this to common.js
	*/
	parse = function(template) {
		var body = "var out = ''; out+=" + "'" +
		template.replace( /[\r\t\n]/g, " " )
			.replace( /'(?=[^@]*@!\))/g, "\t" )
			.split( "'" ).join( "\\' ")
			.split( "\t" ).join( "'" )
			.replace( /\(@=(.+?)@\)/g, "'; out += $1; out += '" )
			.split( "\(@").join( "';" )
			.split( "@\)").join( "out+='" )
			+ "'; return out;";
		return new Function( 'data', body );
	},


	/**
	 * @todo move this to common.js
	*/
	getTmpl = function(template,cb) {
		if ( typeof(templatesCache[template]) !== 'undefined' ) {
			cb(null,templatesCache[template]);
		} else {
			var that = this;
			fs.readFile('server/tmpl/'+template+'.html','utf-8',function(err,tmpl){
				if (err){return cb(err);}
				var parsedTemplate = parse(tmpl);
				that.templatesCache[template] = parsedTemplate;
				cb(null,parsedTemplate);
			});
		}
	},
	/**
	 * email subjects are here, templates are in server/tmpl/[templateName].html
	*/
	templates = {
		email_modified: '"(@= data.item.name @)" was modified by (@= data.memberName @)',
		email_deleted:  '"(@= data.item.name @)" was deleted by (@= data.memberName @)',
		email_created:  '"(@= data.item.name @)" was created by (@= data.memberName @)'
	};

exports.sendMail = function(options, cb) {
	var body = '',
		subject = '';

	options.data.item.humanStatus = helpers.humanStatus(options.data.item.status);
	if ( typeof options.data.originalItem !== 'undefined' ) {
		options.data.originalItem.humanStatus = helpers.humanStatus(options.data.originalItem.status);
	}
	options.data.baseUrl = secret.baseUrl;

	if ( typeof templates[options.template] !== 'undefined' ) {
		getTmpl(options.template,function(err,tmpl){
			if (err){return cb(err);}

			subject = (parse(templates[options.template]))(options.data);
			body = tmpl(options.data);

			nodemailer.SMTP = secret.mail;
			nodemailer.send_mail({
				sender: 'Buck <buck@tradeshift.com>',
				reply_to: 'Buck <buck@tradeshift.com>',
				to: options.to,
				subject: subject,
				html: body,
			    debug: false
			}, function(error,success){
				cb(error,success);
			});

		});
	} else {
		return cb({error:'invalid template'});
	}	
};