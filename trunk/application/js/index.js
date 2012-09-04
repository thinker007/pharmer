function selectItem(divid,item){
	$('#'+divid).find('button').html($(item).find('.item-title').text()+' <span class="caret"></span>');
	$('#'+divid+' .already-selected').removeClass('already-selected');
	$(item).addClass('already-selected');
	$('#'+divid).find('button').removeClass('btn-warning').addClass('btn-success');
}