$(function(){
    // function supports_html5_storage() {
    //     try {
    //         return 'localStorage' in window && window['localStorage'] !== null;
    //     } catch (e) {
    //         return false;
    //     }
    // }
    // if ( !supports_html5_storage() ) {
    //     $('html').html('<h1>Unsupported browser</h1>');
    // }
    //window.history.replaceState('data','title','/#url');
});

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

function Utils() {
    this.init();
}

Utils.prototype = {
    init: function() {
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
        $('abbr.timeago').timeago();
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
    }
};

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
    removeBucket: function(bucketId,cb) {
        delete this.buckets[bucketId];
        cb();
        this.client.del('buckets/'+bucketId,function(result){});
    },
    setQuery: function(query) {
        console.log('setQuery('+JSON.stringify(query)+')');
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
                if ( data ) {
                    data.forEach(function(item){
                        this.items[item.itemId] = item;
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
        this.items[itemId] = item;
        cb();
        this.client.put('items/'+itemId,item,function(result){});
    },
    newItem: function(item,cb) {
        var that = this;
        this.client.post('items',item,function(result){
            item.itemId = result.itemId;
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
    }
};

function UI(storage,utils) {
    this.init(storage,utils);
}
UI.prototype = {
    init: function(storage,utils) {
        $.timeago.settings.allowFuture = true; //allow future dates
        $.timeago.settings.refreshMillis = 10000; //refresh times every 10 seconds

        $.inlineEdit.defaults.hover = 'editable-hover';
        $.inlineEdit.defaults.cancelOnBlur = false;
        $.inlineEdit.defaults.buttons = '<button class="save">Save</button> <button class="cancel">Cancel</button>';

        $.fn.twipsy.defaults.animate = false;
        $.fn.twipsy.defaults.delayIn = 100;
        $.fn.twipsy.defaults.delayOut = 0;

        this.utils = utils;
        this.storage = storage;

        this.templates = [];

        this.menu();

        this.tokenInputUrl = '/api/members/';
        this.tokenInputOptions = {
            theme: 'facebook',
            searchDelay: 100,
            '_className': 'token-input-list-facebook'
        };
    },
    getTmpl: function(template,cb) {
        if ( typeof(this.templates[template]) !== 'undefined' ) {
            cb(this.templates[template]);
        } else {
            var that = this;
            $.get('/tmpl/'+template+'.html',function(tmpl){
                var parsedTemplate = that.parse(tmpl);
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
        if ( mode === 'buckets' ) {
            this.storage.reloadBuckets(function(){
                that.beforeSwitch();
                that.bucketsMode();
                cb();
            });
        } else if ( mode === 'items' ) {
            this.storage.reloadItems(function(){
                that.beforeSwitch();
                that.itemsMode();
                cb();
            });
        } else if ( mode === 'login' ) {
            this.storage.reloadMembers(function(){
                that.loginMode();
                cb();
            });
        }
    },
    loginMode: function() {
        $("input.login").tokenInput('/api/members',{
            hintText: 'Enter your name or handle',
            tokenLimit: 1,
            onResult: function(results) {
                $.each(results, function(index, value) {
                    value.id = value._id;
                });
                return results;
            },
            onAdd: function(item) {
                $.cookie('buckUserName', item.name);
                $.cookie('buckUserId', item.id);
                document.location = '/';
            },
        });
    },
    itemsMode: function() {
        var that = this;
        $('.search').val('');
        this.storage.setQuery({
            member: that.utils.currentMember()
        });
        this.drawItems(function(){
            $('#items h1').each(function(e){
                if ( $(this).hasClass('open') ) {
                    $(this).closest('section').children('div').show();
                } else {
                    $(this).closest('section').children('div').hide();
                }
            });
            var bucketOptions = '';
            $.each(that.storage.buckets,function(bucketId,bucket){
                bucketOptions += '<option value="'+bucketId+'">'+bucket.name+'</option>';
            });
            $('#items select[name=itemBucket]').html(bucketOptions);
            $('#items').show();
            that.itemLiveBinds();
            that.itemBinds();
        },true);
    },
    itemLiveBinds: function() {
        var that = this,
            searchTimeout;
        $('.search').live('change keyup',function(){
            if ( $(this).val() !== '' ) {
                var query = $(this).val();
                if ( query.length === 1 ) { 
                    $('.itemsMenu').text('y Items');
                } else if ( query.length === 2 ) { 
                    $('.itemsMenu').text('Items');
                }
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function(){
                    that.storage.setQuery({query:query});
                    that.drawItems(function(){
                        if ( $('#items-notyours > div').children().length ) {
                            $('#items-notyours > div').show();
                        }
                    },true);
                },1);
            } else {
                $('.itemsMenu').text('My Items');
                that.storage.setQuery({
                    member: that.utils.currentMember()
                });
                $('#items-notyours > div').hide();
            }
        });
        $('.itemAdd > a').live('click',function(){
            $(this).hide();
            $('.itemAddDialog').show();
            $('.twipsy').remove();
            $('.itemAddDialog input[name=itemName]').trigger('focus');
        });
        $('.itemAddDialog select, .itemAddDialog input').live('keypress',function(e){
            if ( e.which === 13 ) {
                $('.itemAddDialog .save.button').trigger('click');
            }
        });
        $('.itemAddDialog .cancel.button').live('click',function(){
            $('.itemAdd > a').show();
            $('.itemAddDialog').hide();
            $('.itemAddDialog input').val('');
        });
        $('.itemAddDialog .save.button').live('click',function(){
            var $this = $(this);
            $('.itemAdd > a').show();
            $('.itemAddDialog').hide();
            var newItem = {
                name: $('.itemAddDialog input[name=itemName]').val(),
                bucketId: $('.itemAddDialog select[name=itemBucket] option:selected').val(),
                submitter: that.utils.currentMember(),
                status: 2,
                created: (new Date().getTime())
            };
            $this.html('Saving...').css('opacity',0.7);
            that.storage.newItem(newItem,function(){
                $('.itemAddDialog .cancel.button').trigger('click');
                $this.html('Save').css('opacity',1);
                that.drawItems(function(){});
            });
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
                if ( $this.hasClass('done') ) {
                    $.getScript('/confetti.js');
                }
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
            $(this).closest('section').children('div').toggle();
        });
    },
    itemBindsUnbind: function() {
        $('.itemAction .button.done, .itemAction .button.escalate, .itemAction .button.delay, .itemAction .button.deescalate, .editable-itemname, .editable-itemdesc').unbind();
    },
    itemBinds: function() {
        var that = this;
        $('.itemAction .button.done, .itemAction .button.escalate').twipsy();
        $('.itemAction .button.delay, .itemAction .button.deescalate, .itemAdd > a').twipsy({placement:'below'});
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
    drawItems: function(cb,reload) {
        console.log('drawItems('+cb.toString()+','+reload+')');
        var that = this,
            loadItems = {
                reloadItems: function(cb){cb();}
            };
        $('.twipsy').remove();

        if ( typeof(reload) !== 'undefined' ) {
            loadItems = this.storage;
        }
        loadItems.reloadItems(function(){
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
                    var ctr = 0;
                    $.each(that.storage.items,function(i,item){
                        var bucket = that.storage.getBucket(item.bucketId);
                            if ( typeof(bucket) !== 'undefined' ) {
                            item.bucketName = bucket.name;
                            item.humanStatus = that.utils.humanStatus(item.status);
                            item.ctr = ctr++;
                            if ( ( item.status === 3 || item.status === 4 ) && (item.owner !== that.utils.currentMember()) ) {
                                that.tempItems.notyours.push(anItem(item));
                            } else {
                                that.tempItems[item.humanStatus].push(anItem(item));
                            }
                        }
                    });
                    $('.dynamic.items').html('');
                    console.log(that.tempItems);
                    $('.dynamic.items').html(itemListTmpl(that.tempItems));
                    $('#items h1').each(function(){
                        if ( $(this).hasClass('open') ) {
                            $(this).closest('section').children('div').show();
                        } else {
                            $(this).closest('section').children('div').hide();
                        }
                    });

                    that.itemBindsUnbind();
                    that.itemBinds();
                    cb();
                });
            });
        });
    },
    bucketsMode: function() {
        $('#buckets').show();
    }
};

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
            cb();
        });
    }
}

$(function(){
    var defaultMode = 'items';
    if ( document.location.pathname.indexOf('/login') === -1 ) {
        if ( $.cookie('buckUserId') === null || $.cookie('buckUserName') === null ) {
            document.location = '/login';
        }
        $('#logoutLink').html($('#logoutLink').html()+" "+$.cookie('buckUserId'));
        $('#logoutLink').click(function(e){
            $.cookie('buckUserId',null);
            $.cookie('buckUserName',null);
            document.location = '/login';
            e.preventDefault();
            e.stopPropagation();
        });
    } else {
        defaultMode = 'login';
    }
    var Buck = new Core(function(){
        Buck.ui.switchMode(defaultMode,function(){});
    });
});
