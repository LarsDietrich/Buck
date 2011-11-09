$(function(){
	var defaultMode = 'items';
	if ( document.location.pathname.indexOf('/login') === -1 ) {
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
