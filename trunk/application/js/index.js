//used for connecting to NLP APIs
var proxy_url="proxy.php?";

function selectItem(divid,item){
	$('#'+divid).find('.item-title-current').html($(item).find('.item-title').text());
	$('#'+divid+' .already-selected').removeClass('already-selected');
	$(item).addClass('already-selected');
	$('#'+divid).find('button').removeClass('btn-warning').addClass('btn-success');
	$('#presc_edit').attr('contenteditable','false');
	$('#presc_edit').attr('contenteditable','true');
	
	//highlight in the text
	var selected=getSelectionHtml();
	if(selected!=''){
		var new_text=$('#presc_edit').html();
		new_text=new_text.replace(selected, "<span class='btn btn-small ph-entity'>"+$("#searchid .item-title-current").text()+"</span>"); 
		$('#presc_edit').html(new_text);
		refreshTooltips();
	}
}

function detect_drugs(html_data,start,end){
	var request_data = encodeURIComponent(html_data);
	var new_text=$('#presc_edit').html();
	request_data = "api=DBpedia&query=" + request_data;
	
	$.ajax({
		type : "POST",
		async: true,
		url : proxy_url,
		data : request_data,
		contentType: "application/x-www-form-urlencoded",
		dataType: "json",
		success : function(data) {
			if(!data['Resources'])
				return;
			$.each(data['Resources'], function(key, val) {
				var tmp=val['@types'];
				if(tmp != ""){
					var term1 = new RegExp("drug");
					var term2 = new RegExp("chemical_compound");
					var term3 = new RegExp("medicine");
					var term4 = new RegExp("medical_treatment");
					var check1 = term1.exec(tmp);
					var check2 = term2.exec(tmp);
					var check3 = term3.exec(tmp);
					var check4 = term4.exec(tmp);
					//console.log(check1+' '+check2+' '+check3+' '+check4);
					if ((check1 != null) || (check2 != null) || (check3 != null) || (check4 != null)) {
						//console.log(val['@surfaceForm']);
						if(start==0 && end==html_data.length){ //sending the whole content
							//do not do anything 
						}else{
							new_text=$('#presc_edit').html();
						}
						new_text=new_text.replace(val['@surfaceForm'], "<span class='btn btn-small ph-entity'>"+val['@surfaceForm']+"</span>"); 
					}
				}
			});
			//solve the problem with new <br> tag added
			var endstr="<br>";
			new_text=$.trim(new_text);
			var tmp2=new_text.substring(new_text.length-endstr.length,new_text.length);
			if(tmp2==endstr)
				new_text=new_text.substring(0,new_text.length-endstr.length);
			$('#presc_edit').html(new_text);
			placeCaretAtEnd( document.getElementById("presc_edit") );
			refreshTooltips();
		},
		error: function(xhr, txt, err){ 
			console.log("xhr: " + xhr + "\n textStatus: " +txt + "\n errorThrown: " + err+ "\n url: " + proxy_url);
			$('#ajax_progress_indicator').hide();
		},
	});
	
}
function search_drug(){
	var is_st_selected=0;
	var selected=getSelectionHtml();
	if(selected!='')
		is_st_selected=1;
	if(!is_st_selected){
		$('#search_term').removeClass('hidden');
		$("#result_of_search").html('');
	}else{
		var search_term=$('<div>'+selected+'</div>').text();
		$('#search_term').val(search_term);
		$('#search_term').removeClass('hidden');
		$("#result_of_search").html('');
		var event = $.Event('keyup');
		event.keyCode = 13; // enter
		$('#search_term').trigger(event);
		
	}
}

function realTimeTag(){
    var el = document.getElementById("presc_edit");
    var range = window.getSelection().getRangeAt(0);
	var position=getCharacterOffsetWithin(range, el);
    //console.log("Caret char pos: " +position );
	var data =$('#presc_edit').text();
	var data=data.substring(0,position);
	var tmp=data.split('\.');
	var chunk=$.trim(tmp[tmp.length-2]);
	var start=position-chunk.length;
	var end=position;
	detect_drugs(chunk,start,end);
}
function handleSearch(){
	var term=$("#search_term").val();
	$.ajax({
		type : "GET",
		async: true,
		url : 'search_drugbank.php?',
		data : 'name='+term,
		success : function(data) {
			//console.log(data);
			data.search_term=term;
			$("#result_of_search").html('');
			$.each(data.drugs, function(i,v){
				v.description=dotToLine(v.description, '.<br />');
			});
			$( "#search_result" ).tmpl( data).appendTo( "#result_of_search" );

			$('#search_term').addClass('hidden');
		},
		error: function(xhr, txt, err){ 
			console.log("xhr: " + xhr + "\n textStatus: " +txt + "\n errorThrown: " + err+ "\n" );
		},
	});	
}
function getCharacterOffsetWithin(range, node) {
    var treeWalker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT,
        function(node) {
            var nodeRange = document.createRange();
            nodeRange.selectNode(node);
            return nodeRange.compareBoundaryPoints(Range.END_TO_END, range) < 1 ?
                NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
        false
    );

    var charCount = 0;
    while (treeWalker.nextNode()) {
        charCount += treeWalker.currentNode.length;
    }
    if (range.startContainer.nodeType == 3) {
        charCount += range.startOffset;
    }
    return charCount;
}
function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}
function getSelectionHtml() {
    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }
    return html;
}
function refreshTooltips(){
	$.each($("#presc_edit").find('.ph-entity'), function(index, value) { 
			$(this).click(function(e) {

			});	
			$(this).mouseover(function(e) {								
				//e.stopPropagation();
				$(this).popover({placement:'bottom', trigger:'hover', title: 'hello!', content: 'this is the content'});
			});
			$(this).mousemove(function(e) {

			});										
			$(this).mouseout(function() {

			});	
	});
}
function findAllDrugs(){
	var data=$('#presc_edit').html();
	detect_drugs(data,0,data.length);
}
function dotToLine(text, separator){
	var next;
	var tmp=text.split('\.');
	$.each(tmp, function(i,v){
		if (v.length>90){
			next=v.substring(90,v.length);
			tmp[i]=v.substring(0,90)+'<br />-'+next;
			if(next.length>90)
				tmp[i]=v.substring(0,90)+'<br />'+next.substring(0,90)+'<br />-'+next.substring(90,next.length);
		}
	});
	var output = tmp.join(separator); 
	return output;
}