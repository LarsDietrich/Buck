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
        var that = this;
        var url = this.apiUrl+type;
        var requestParams = {
            url: url,
            type: method,
            success: function(result) {
                success(result);
            },
            statusCode: {
                401: function() {
                    that.redirectToLogin();
                }
            }
        };
        if ( data != null && method != 'GET' ) {
            $.extend(requestParams,{
                processData: false,
                data: JSON.stringify(data)
            });
        } else if ( data != null && method == 'GET' ) {
            if ( requestParams.url.indexOf('?') == -1 ) {
                requestParams.url += '?';
            } else {
                requestParams.url += '&';
            }
            requestParams.url += +data.join('&');
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
    delete: function(type,success) {
        this.request(type,'DELETE',null,success);
    },
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
        function pad(n){return n<10 ? '0'+n : n}
        return d.getUTCFullYear()+'-'
            + pad(d.getUTCMonth()+1)+'-'
            + pad(d.getUTCDate())+'T'
            + pad(d.getUTCHours())+':'
            + pad(d.getUTCMinutes())+':'
            + pad(d.getUTCSeconds())+'Z'
    },
    humanStatus: function(status) {
        switch (status) {
            case 0:
                return 'deleted';
            break;
            case 1:
                return 'decayed';
            break;
            case 2:
                return 'incoming';
            break;
            case 3:
                return 'accepted';
            break;
            case 4:
                return 'current';
            break;
            case 5:
                return 'done';
            break;
        }
        return 'incoming';
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
        var that = this;

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
        if ( ((new Date().getTime())-that.bucketsTime) > this.maxAge ) {
            this.client.get('buckets',null,function(data){
                that.buckets = {};
                data.forEach(function(bucket,i){
                    this.buckets[bucket.bucketId] = bucket;
                },that);
                that.bucketsTime = new Date().getTime();
                that.fakeParallel();
            }); 
        } else {
            this.fakeParallel();
        }
    },
    reloadItems: function(cb) {
        var that = this;
        if (typeof(cb)==='function') {
            this.ctr = 0;
            this.doneCb = cb;
            this.parallelCalls = 1;
        }
        if ( ((new Date().getTime())-that.itemsTime) > this.maxAge ) {
            this.client.get('items',null,function(data){
                that.items = {};
                data.forEach(function(item,i){
                    this.items[item.itemId] = item;
                },that);
                that.itemsTime = new Date().getTime();
                that.fakeParallel();
            });
        } else {
            this.fakeParallel();
        }
    },
    reloadMembers: function(cb) {
        var that = this;
        if (typeof(cb)==='function') {
            this.ctr = 0;
            this.doneCb = cb;
            this.parallelCalls = 1;
        }
        if ( ((new Date().getTime())-that.membersTime) > this.maxAge ) {
            this.client.get('members',null,function(data){
                that.members = {};
                data.forEach(function(member,i){
                    this.members[member.handle] = member;
                },that);
                that.membersTime = new Date().getTime();
                that.fakeParallel();
            });
        } else {
            this.fakeParallel();
        }
    },
    fakeParallel: function() {
        if ( ++this.ctr === parseInt(this.parallelCalls,10) ) {
            this.doneCb();
        }
    }
}


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
    var Buck = new Core(function(){
        Buck.ui.switchMode('items',function(){});
    });
});

function UI(storage,utils) {
    this.init(storage,utils);
}
UI.prototype = {
    init: function(storage,utils) {
        $.timeago.settings.allowFuture = true; //allow future dates
        $.timeago.settings.refreshMillis = 10000; //refresh times every 10 seconds
        this.utils = utils;
        this.storage = storage;

        this.templates = [];

        this.menu();

        this.tokenInputUrl = '/api/members/';
        this.tokenInputOptions = {
            theme: 'facebook',
            searchDelay: 100,
            _className: 'token-input-list-facebook'
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
        if ( mode == 'buckets' ) {
            this.storage.reloadBuckets(function(){
                that.beforeSwitch();
                that.bucketsMode();
                cb();
            });
        } else if ( mode == 'items' ) {
            this.storage.reloadItems(function(){
                that.beforeSwitch();
                that.itemsMode();
                cb();
            });
        }
    },
    itemsMode: function() {
        $('#items').show();
        this.drawItems();
    },
    drawItems: function() {
        var that = this;
        this.storage.reloadItems(function(){
            that.getTmpl('item',function(anItem){
                that.getTmpl('itemList',function(itemListTmpl){
                    that.tempItems = {
                        current: [],
                        accepted: [],
                        incoming: [],
                        decayed: [],
                        done: [],
                        deleted: []
                    };
                    $.each(that.storage.items,function(i,item){
                        item.bucketName = that.storage.buckets[item.bucketId].name;
                        item.humanStatus = that.utils.humanStatus(item.status);
                        that.tempItems[item.humanStatus].push(anItem(item));
                    });
                    $('.dynamic.items').html(itemListTmpl(that.tempItems));
                });
            });
        });
    },
    bucketsMode: function() {
        $('#buckets').show();
    }
}