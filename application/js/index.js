function selectItem(divid,item){
	$('#'+divid).find('.item-title-current').html($(item).find('.item-title').text());
	$('#'+divid+' .already-selected').removeClass('already-selected');
	$(item).addClass('already-selected');
	$('#'+divid).find('button').removeClass('btn-warning').addClass('btn-success');
}