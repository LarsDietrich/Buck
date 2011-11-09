function Utils() {
	this.init();
}

Utils.prototype = {
	init: function() {
		$.timeago.settings.allowFuture = true; //allow future dates
		$.timeago.settings.refreshMillis = 60000; //refresh times every 60 seconds
		$.timeago.settings.strings.minute = "about a minute";
		$.timeago.settings.strings.seconds= "seconds";
		$.timeago.settings.strings.minute= "a minute";
		$.timeago.settings.strings.minutes= "%d minutes";
		$.timeago.settings.strings.hour= "an hour";
		$.timeago.settings.strings.hours= "%d hours";
		$.timeago.settings.strings.day= "a day";
		$.timeago.settings.strings.days= "%d days";
		$.timeago.settings.strings.month= "a month";
		$.timeago.settings.strings.months= "%d months";
		$.timeago.settings.strings.year= "a year";
		$.timeago.settings.strings.years= "%d years";

		$.inlineEdit.defaults.hover = 'editable-hover';
		$.inlineEdit.defaults.cancelOnBlur = false;
		$.inlineEdit.defaults.buttons = '<button class="save">Save</button> <button class="cancel">Cancel</button>';

		$.fn.twipsy.defaults.animate = true;
		$.fn.twipsy.defaults.delayIn = 100;
		$.fn.twipsy.defaults.delayOut = 0;
		$.fn.popover.defaults.animate = true;
		$.fn.popover.defaults.delayIn = 0;
		$.fn.popover.defaults.delayOut = 0;

		$.tablesorter.addParser({
			id: 'timeago',
			is: function(s) {
				return false;
			},
			format: function(s) {
				return s.toLowerCase().replace(/good/,2).replace(/medium/,1).replace(/bad/,0);
			},
			type: 'numeric'
		});

		this.refreshTimeago();
	},
	highlight: function($elem) {
		$('html, body').animate({
			scrollTop: $elem.offset().top
		}, 200,function() {
			$elem.animate({
				opacity: 0.1
			},200,function(){
				$elem.animate({
					opacity: 1
				},300);
			});
		});
	},
	refreshTimeago: function() {
		$('.timeago').timeago();
	},
	isoDate: function(timestamp){
		var d = new Date(timestamp);
		function pad(n){return n<10 ? '0'+n : n;}
		return d.getUTCFullYear()+'-'
			+ pad(d.getUTCMonth()+1)+'-'
			+ pad(d.getUTCDate())+'T'
			+ pad(d.getUTCHours())+':'
			+ pad(d.getUTCMinutes())+':'
			+ pad(d.getUTCSeconds())+'Z';
	},
	humanStatus: function(status) {
		switch (status) {
			case 0:
				return 'deleted';
			case 1:
				return 'decayed';
			case 2:
				return 'incoming';
			case 3:
				return 'accepted';
			case 4:
				return 'current';
			case 5:
				return 'done';
		}
		return 'incoming';
	},
	currentMember: function() {
		return $.cookie('buckUserId');
	},
	arrayUnique: function(inputArr) {
		var key = '',
			tmp_arr2 = {},
			val = '';

		var __array_search = function (needle, haystack) {
			var fkey = '';
			for (fkey in haystack) {
				if (haystack.hasOwnProperty(fkey)) {
					if ((haystack[fkey] + '') === (needle + '')) {
						return fkey;
					}
				}
			}
			return false;
		};

		for (key in inputArr) {
			if (inputArr.hasOwnProperty(key)) {
				val = inputArr[key];
				if (false === __array_search(val, tmp_arr2)) {
					tmp_arr2[key] = val;
				}
			}
		}

		return tmp_arr2;
	}

};