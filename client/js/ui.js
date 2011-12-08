function UI(storage,utils) {
	this.init(storage,utils);
}
UI.prototype = {
	init: function(storage,utils) {
		this.currentMode = '';

		this.utils = utils;
		this.storage = storage;

		this.templates = [];

		this.menu();

		this.tokenInputOptions = {
			_classname: 'token-input-list',
			searchDelay: 100
		};
	},
	getTmpl: function(template,cb) {
		if ( typeof(this.templates[template]) !== 'undefined' ) {
			cb(this.templates[template]);
		} else {
			var that = this;
			$.get('/tmpl/'+template+'.html',function(tmpl){
				var parsedTemplate = that.parse(tmpl);
				/**
				 * @todo use localStorage, once the crunch settles
				 */
				that.templates[template] = parsedTemplate;
				cb(parsedTemplate);
			});
		}
	},
	parse: function(template) {
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
	menu: function() {
		var that = this;
		$('nav > a').click(function(e){
			e.preventDefault();
			var $elem = $(this);
			that.switchMode($(this).attr('data-page'),function(){
				$elem.addClass('active');
			});
		});
	},
	beforeSwitch: function() {
		$(document).unbind(); //unbind all events
		$('.menu a').removeClass('active'); //reset active buttons
		$('.dynamic').html(''); //remove all dynamically requested content
		$('.'+this.tokenInputOptions._className).remove(); //remove tokeninputs
		$('section').hide(); //hide all sections
	},
	switchMode: function(mode,cb) {
		var that = this;
		if ( this.currentMode !== mode ) {
			this.currentMode = mode;
			if ( mode === 'buckets' ) {
				this.storage.reloadBuckets(function(){
					that.beforeSwitch();
					that.bucketsMode();
					history.pushState(null,'Bucket List','/buckets');
					cb();
				});
			} else if ( mode === 'items' ) {
			//	this.storage.reloadItems(function(){
					that.beforeSwitch();
					that.itemsMode();
					if ( typeof that.storage.getQuery().query === 'undefined' || that.storage.getQuery().query.length == 0 ) {
						history.pushState(null,'Item List','/items');
					}
					cb();
			//	});
			} else if ( mode === 'login' ) {
				this.storage.reloadMembers(function(){
					that.loginMode();
					cb();
				});
			}
		}
	},
	loginMode: function() {
		var that = this;
		$("input.login").tokenInput('/api/members',$.extend(that.tokenInputOptions,{
			hintText: 'Enter your name or handle',
			tokenLimit: 1,
			onResult: function(results) {
				$.each(results, function(index, value) {
					value.id = value._id;
				});
				return results;
			},
			onAdd: function(item) {
				$.cookie('buckUserName', item.name,{expires:365});
				$.cookie('buckUserId', item.id,{expires:365});
				document.location = '/';
			},
		}));
	},

	bucketsMode: function() {
		var that = this;

		this.storage.setQuery({
			query: undefined,
			member: undefined
		});

		this.drawBuckets(function(){
			$('#buckets').show();

			that.bucketLiveBinds();
			that.bucketBinds();
		},true);
	},
	bucketLiveBinds: function() {
		var that = this;
		$('.bucket .members').live('click',function(){
			var $container = $(this).closest('.bucket'),
				bucketId = $container.attr('data-id'),
				bucket = that.storage.getBucket(bucketId),
				members = [];
			$container.find('.saveMembers').removeClass('hidden');

			that.storage.getBucket(bucketId).memberHandles.forEach(function(memberHandle){
				var member = this.storage.getMember(memberHandle);
				members.push({_id:memberHandle,name:member.name});
			},that);
			$(this).tokenInput('/api/members',$.extend(that.tokenInputOptions,{
				prePopulate: members,
				preventDuplicates: true,
				hintText: 'Enter a name or handle'
			}));
		});
		$(".bucket .saveMembers").live('click',function () {
			var $container = $(this).closest('.bucket'),
				bucketId = $container.attr('data-id'),
				bucket = that.storage.getBucket(bucketId),
				members = [];
			$(this).siblings('.members').tokenInput("get").forEach(function(member){
				members.push(member.id);
			});
			
			//bucket.memberHandles = that.utils.arrayUnique(members);
			bucket.memberHandles = members;
			that.storage.setBucket(bucketId,bucket,function(){
				that.drawBuckets(function(){});
			});
		});
		$(".bucket .delete").live('click',function () {
			var $container = $(this).closest('.bucket'),
				bucketId = $container.attr('data-id'),
				bucket = that.storage.getBucket(bucketId);
			if ( confirm('Are you sure you want to delete '+bucket.name+'?') ) {
				that.storage.removeBucket(bucketId,function(){
					that.drawBuckets(function(){});
				});
			}
		});
		$('.bucket .newBucket').live('click',function(){
			var $container = $(this).closest('.bucket'),
				members = [];

			$(this).siblings('.members').tokenInput("get").forEach(function(member){
				members.push(member._id);
			});

			var newBucket = {
				name: $container.find('input[name=bucketName]').val(),
				desc: $container.find('input[name=bucketDesc]').val(),
				memberHandles: members
			};
			that.storage.newBucket(newBucket,function(){
				that.drawBuckets(function(){});
			});
		});
	},
	bucketBindsUnbind: function() {
		$('.editable-bucketname, .editable-bucketdesc').unbind();
		$('.newBucketContainer .members').removeData('tokenInputObject');
		$('#buckets').find('.token-input-list').remove();

	},
	bucketBinds: function() {
		var that = this;
		$('.editable-bucketname').twipsy();
		$('.editable-bucketname').inlineEdit({
			save: function(e,data) {
				var bucketId = $(this).closest('.bucket').attr('data-id'),
					bucket = that.storage.getBucket(bucketId);
				bucket.name = data.value;
				that.storage.setBucket(bucketId,bucket,function(){});
			}
		});
		$('.editable-bucketdesc').twipsy({
			placement: 'below'
		});
		$('.editable-bucketdesc').inlineEdit({
			control: 'textarea',
			save: function(e,data) {
				var bucketId = $(this).closest('.bucket').attr('data-id'),
					bucket = that.storage.getBucket(bucketId);
				bucket.desc = data.value;
				that.storage.setBucket(bucketId,bucket,function(){});
			}
		});
		if ( typeof $('.newBucketContainer .members').data('tokenInputObject') === 'undefined' ) {
			$('.newBucketContainer .members').tokenInput('/api/members',{
				preventDuplicates: true,
				hintText: 'Enter a name or handle'
			});
		}
	},
	drawBuckets: function(cb,reload) {
		var that = this,
			loadBuckets = {
				reloadBuckets: function(cb){cb();}
			};
		$('.twipsy').remove();
		this.storage.getJoke(function(joke){
			$('.joke').html(joke);
		});

		if ( typeof(reload) !== 'undefined' ) {
			loadBuckets = this.storage;
		}
		loadBuckets.reloadBuckets(function(){
			that.getTmpl('bucket',function(aBucket){
				that.getTmpl('bucketList',function(bucketListTmpl){
					that.tempBuckets = [];
					$.each(that.storage.buckets,function(i,bucket){
						if ( typeof(bucket) !== 'undefined' ) {
							bucket.members = [];
							if ( typeof bucket.memberHandles !== 'undefined' ) {
								bucket.memberHandles.forEach(function(memberHandle){
									bucket.members.push(this.storage.getMember(memberHandle));
								},that);
							}
							that.tempBuckets.push(aBucket(bucket));
						}
					});
					that.bucketBindsUnbind();
					$('.dynamic.buckets').html('');
					$('.dynamic.buckets').html(bucketListTmpl(that.tempBuckets));

					that.bucketBinds();
					that.utils.refreshTimeago();
					cb();
				});
			});
		});
	},

	itemsMode: function() {
		var that = this;
		$('.search').val('');
		if ( typeof this.storage.query === 'undefined' ) { 
			this.storage.setQuery({
				member: that.utils.currentMember()
			});
		}
		this.drawItems(function(){
			$('#items h1').each(function(e){
				if ( $(this).hasClass('open') ) {
					$(this).closest('section').children('div, table').show();
				} else {
					$(this).closest('section').children('div, table').hide();
				}
			});

			var bucketOptions = '';
			$.each(that.storage.buckets,function(bucketId,bucket){
				bucketOptions += '<option value="'+bucketId+'" data-name="'+bucket.name+'">'+bucket.name+'</option>';
			});
			var $select = $('#items input[name=itemBucket]');
			$select.html(bucketOptions);

			function sortAlpha(a,b){  
				return a.innerHTML > b.innerHTML ? 1 : -1;  
			};  
			  
			$select.children('option').sort(sortAlpha).appendTo($select);  

			$('#items').show();
			that.itemLiveBinds();
		},true);
	},
	itemLiveBinds: function() {
		var that = this,
			searchTimeout,
			query = '';


		if ( typeof this.storage.getQuery().query !== 'undefined' && ( query = this.storage.getQuery().query ).length > 0 ) {
			$('#items').addClass('searchMode');
		}
		$('.search').val(query);
		$('.search').live('change keyup',function(){
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(function(){
				var q = that.storage.getQuery().query;
				if ( typeof q !== 'undefined' && q.length ) {
					history.pushState(null,'Search for "'+q+'"','/?q='+q);
				} else {
					history.pushState(null,'Item List','/items');
				}
			},500);
			if ( $(this).val().length !== 0 ) {
				var query = $(this).val();
				if ( query.length === 1 ) { 
					$('.itemsMenu').text('y Items');
				} else if ( query.length === 2 ) { 
					$('.itemsMenu').text('Items');
				}
				that.storage.setQuery({query:query});
				that.drawItems(function(){
					$('#items').addClass('searchMode');
					if ( $('#items-notyours > div').children().length ) {
						$('#items-notyours > div').show();
					}
				},true);
			} else {
				//document.location.reload(true);

				$('.items').removeClass('searchMode');
				$('.itemsMenu').text('My Items');
				that.storage.setQuery({
					member: that.utils.currentMember()
				});
				that.drawItems(function(){
					$('#items').removeClass('searchMode');
				},true);
			}
		});
		
		$('.itembucket').live('click',function(e){
			var item = that.storage.getItem($(this).closest('.item').attr('data-id'));

			var bucketOptions = '';
			$.each(that.storage.buckets,function(bucketId,bucket){
				bucketOptions += '<option value="'+bucketId+'" data-name="'+bucket.name+'">'+bucket.name+'</option>';
			}); 
			var $parent = $(this).parent(),
				$select = $('<select></select>').css('display','block').addClass('itembucketContainer');
			$(this).removeClass('itembucket').addClass('disabledItembucket');
			$parent.append($select);
			$parent.append('<button class="save changeBucket">Save</button>');
			$parent.append('<button class="cancel changeBucket">Cancel</button>');
			$select.html(bucketOptions);

			function sortAlpha(a,b){  
				return a.innerHTML > b.innerHTML ? 1 : -1;  
			};
			$select.children('option').sort(sortAlpha).appendTo($select);
			$select.val(item.bucketId).removeClass('itembucket');
		});
		$('.changeBucket.save').live('change click',function(){
			var $item = $(this).closest('.item'),
				item = that.storage.getItem($item.attr('data-id'));
			item.status = 2;
			item.bucketId = $(this).siblings('.itembucketContainer').val();
			that.storage.setItem(item.itemId,item,function(){
				setTimeout(function(){
					that.drawItems(function(){});
				},0);
			});
		});
		$('.changeBucket.cancel').live('click',function(){
			$(this).siblings('.disabledItembucket').addClass('itembucket').removeClass('disabledItembucket');
			$(this).closest('.item').find('.itembucketContainer, .changeBucket').remove();
		});

		$('.escalate.button, .done.button').live('click',function(){
			var $item = $(this).closest('.item'),
				itemId = $item.attr('data-id'),
				item = that.storage.getItem(itemId),
				$this = $(this);
			item.status++;
			if ( item.status >= 3 ) {
				item.owner = that.utils.currentMember();
			}
			that.storage.setItem(itemId,item,function(){
				$item.css('opacity',0.3);
				that.drawItems(function(){});
			});
		});
		$('.deescalate.button').live('click',function(){
			var $item = $(this).closest('.item'),
				itemId = $item.attr('data-id'),
				item = that.storage.getItem(itemId);
			item.status--;
			if ( item.status < 3 ) {
				item.owner = '';
			}
			that.storage.setItem(itemId,item,function(){
				$item.css('opacity',0.3);
				that.drawItems(function(){});
			});
		});
		$('.delete.button').live('click',function(){
			var $item = $(this).closest('.item'),
				itemId = $item.attr('data-id'),
				item = that.storage.getItem(itemId);
			if ( confirm('Are you sure you want to delete '+item.name+'?') ) {
				that.storage.removeItem(itemId,function(){
					$item.css('opacity',0.3);
					that.drawItems(function(){});
				});
			}
		});
		$('#items h1').live('click',function(e){
			e.preventDefault();

			if ( $(this).hasClass('open') ) {
				$(this).removeClass('open').addClass('closed');
			} else {
				$(this).removeClass('closed').addClass('open');
			}
			$(this).closest('section').children('div, table').slideToggle();
		});
		
	},
	itemBindsUnbind: function() {
		$('.itemAction .button.done, .itemAction .button.escalate, .itemAction .button.delay, .itemAction .button.deescalate, .editable-itemname, .editable-itemdesc, .itemAddDialog input, .itemAddDialog .save.button').unbind();

		$('.itemAddDialog .itemBucket').removeData('tokenInputObject');
		$('#items').find('.token-input-list').remove();
	},
	itemBinds: function() {
		var that = this;
		$('.itemAddDialog input').keypress(function(e){
			if ( e.which === 13 ) {
				$('.itemAddDialog .save.button').trigger('click');
			}
		});
		$('.itemAddDialog .save.button').click(function(){
			var $this = $(this),
				nameInput = $('.itemAddDialog input[name=itemName]'),
				descInput = $('.itemAddDialog input[name=itemDesc]'),
				bucketId = $('.itemAddDialog input[name=itemBucket]').tokenInput("get")[0];
			if ( nameInput.val().length && typeof bucketId !== 'undefined' ) {
				localStorage['lastBucketId'] = bucketId.id;

				bucketId = bucketId.id;
				var newItem = {
					name: nameInput.val(),
					bucketId: bucketId,
					desc: $('.itemAddDialog input[name=itemDesc]').val(),
					submitter: that.utils.currentMember(),
					status: 2,
					created: (new Date().getTime())
				};
				$this.css('opacity',0.3);
				that.storage.newItem(newItem,function(){
					that.drawItems(function(){});
					$this.css('opacity',1);
					nameInput.val('');
					descInput.val('');
				});
			} else {
				alert('Name & Bucket must not be empty!');
			}
		});

		if ( typeof $('.itemAddDialog .itemBucket').data('tokenInputObject') === 'undefined' ) {
			var prePopulate = [];
			if ( typeof localStorage['lastBucketId'] !== 'undefined' && localStorage['lastBucketId'] !== null ) {
				var bucket = that.storage.getBucket(localStorage['lastBucketId']);
				if ( typeof bucket !== 'undefined' ) {
	 				prePopulate.push({
						_id: bucket._id,
						name: bucket.name
					});
				}
			}
			$('.itemAddDialog .itemBucket').tokenInput('/api/buckets',$.extend(this.tokenInputOptions,{
				prePopulate: prePopulate,
				preventDuplicates: true,
				hintText: 'Start typing the name of the desired bucket',
				tokenLimit: 1
			}));

			$('.itemAddDialog .token-input-list').click(function(e){
				$('.itemAddDialog .itemBucket').tokenInput('clear');
			});
		}

		//init tablesorter, but only if it hasn't been already, and has at least 2 data row
		$('.tablesorter-simple').each(function(i){
			if ( $(this).find('tr').length > 1 && (typeof $(this).data('tablesorter') === 'undefined' || $(this).data('tablesorter') === null) ) {
				$(this).tablesorter({
					sortList: [[2,1]],
					headers: {
						//2:{sorter: 'timeago'},
						//3:{sorter: false}
						2:{sorter: false}
					}
				}); 
			}
		});
		$('.tablesorter-notyours').each(function(i){
			if ( $(this).find('tr').length > 1 && (typeof $(this).data('tablesorter') === 'undefined' || $(this).data('tablesorter') === null) ) {
				$(this).tablesorter({
					sortList: [[3,1]]
				}); 
			}
		});
		$('.itemAction .button.done, .itemAction .button.escalate').twipsy();
		$('.itemAction .button.delay, .itemAction .button.deescalate, .itemAdd > a, .itembucket').twipsy({placement:'below'});
		$('.editable-itemname').twipsy();
		$('.editable-itemname').inlineEdit({
			save: function(e,data) {
				var itemId = $(this).closest('.item').attr('data-id'),
					item = that.storage.getItem(itemId);
				item.name = data.value;
				that.storage.setItem(itemId,item,function(){});
			}
		});
		$('.editable-itemdesc').twipsy({
			placement: 'below'
		});
		$('.editable-itemdesc').inlineEdit({
			control: 'textarea',
			save: function(e,data) {
				var itemId = $(this).closest('.item').attr('data-id'),
					item = that.storage.getItem(itemId);
				item.desc = data.value;
				that.storage.setItem(itemId,item,function(){});
			}
		});
	},
	fixStamps: function(that) {
		that.fixItemStampHeight($('.items.done.container'),4);
		that.fixItemStampHeight($('.items.deleted.container'),4);
	},
	fixItemStampHeight: function($items,itemsPerRow) {
		var itemBuffer = [];
		var itemHeights = [];
		var hadToShow = false;
		if ( !$items.filter(':visible').length ) {
			hadToShow = true;
			var originalDisplay = $items.css('display');
			$items.css('display','block');
		}
		$items.children('.item').each(function(){
			itemBuffer.push($(this));
			itemHeights.push($(this).get(0).offsetHeight);
			if ( itemBuffer.length === itemsPerRow ) {
				var maxHeight = Math.max.apply(Math,itemHeights);
				itemBuffer.forEach(function($item){
					$item.height(maxHeight);
				});
				itemBuffer = [];
				itemHeights = [];
			}
		});
		if ( hadToShow ) {
			$items.css('display',originalDisplay);
		}
	},
	drawItems: function(cb,reload) {
		var that = this,
			loadItems = {
				reloadItems: function(cb){cb();}
			};
		$('.twipsy').remove();
		this.storage.getJoke(function(joke){
			$('.joke').html(joke);
		});

		if ( typeof(reload) !== 'undefined' ) {
			loadItems = this.storage;
		}
		loadItems.reloadItems(function(){
			that.getTmpl('itemCell',function(anItemCell){
				that.getTmpl('item',function(anItem){
					that.getTmpl('itemList',function(itemListTmpl){
						that.tempItems = {
							current: [],
							accepted: [],
							notyours: [],
							incoming: [],
							decayed: [],
							done: [],
							deleted: []
						};
						var ctr = {
							current: 0,
							accepted: 0,
							notyours: 0,
							incoming: 0,
							decayed: 0,
							done: 0,
							deleted: 0
						};
						$.each(that.storage.items,function(i,item){
							var bucket = that.storage.getBucket(item.bucketId);
							if ( typeof(bucket) !== 'undefined' ) {
								item.bucketName = bucket.name;
								item.humanStatus = that.utils.humanStatus(item.status);
								var anItemTmpl = anItem;
								
								if ( ( item.humanStatus === 'accepted' || item.humanStatus === 'current' ) && (item.owner !== that.utils.currentMember()) ) {
									item.realHumanStatus = item.humanStatus;
									item.humanStatus = 'notyours';
									item.ownerName = that.storage.getMember(item.owner).name;	
								}
								item.ctr = ctr[item.humanStatus]++;        
								if ( item.humanStatus === 'incoming' || item.humanStatus === 'notyours') { //table view for incoming/notyours                    
									anItemTmpl = anItemCell;
								}
								that.tempItems[item.humanStatus].push(anItemTmpl(item));
							}
						});
						that.itemBindsUnbind();
						$('.dynamic.items').html('');
						$('.dynamic.items').html(itemListTmpl(that.tempItems));

						$('#items h1').each(function(){
							if ( $(this).hasClass('open') ) {
								$(this).closest('section').children('div, table').show();
							} else {
								$(this).closest('section').children('div, table').hide();
							}
						});


						setTimeout(function(){ //lazy rendering sux
							that.fixStamps(that);
						},0);


						that.itemBinds();
						that.utils.refreshTimeago();
						cb();
					});
				});
			});
		});
	}
};
