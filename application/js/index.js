//used for connecting to NLP APIs
var proxy_url="proxy.php?";

function selectItem(divid, uri, item){
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
		var properties=new Array();
		if(new_text.indexOf('<span property="nonProprietaryName">'+$("#searchid .item-title-current").text()+'</span>')==-1){
			new_text=new_text.replace(selected, generateAnnotation($("#searchid .item-title-current").text(), uri,properties,'')); 
			$('#presc_edit').html(new_text);
		}
	}else{
		addAnnotation(generateAnnotation($("#searchid .item-title-current").text(), uri,properties,''));
	}
	$('#drug_information').append('<div id="d_'+$("#searchid .item-title-current").text()+'" about="'+uri+'">'+$('#temp_repo').find('#d_'+$("#searchid .item-title-current").text()).html()+'</div>');
	desc=$('#temp_repo').find('#d_'+$("#searchid .item-title-current").text()).find('[property="description"]').attr('content');
	refreshTooltips();
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
			try {
					jQuery.parseJSON( data )
					//must be valid JSON
			} catch(e) {
				//must not be valid JSON  
				$('#ajax_progress_indicator').hide();
				console.log('Service is not available at the moment. Please try again later...');				
			}		
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
						var properties=new Array();
						var uri='';
						if(new_text.indexOf('<span property="nonProprietaryName">'+val['@surfaceForm']+'</span>')==-1){
							$.ajax({
								type : "GET",
								async: true,
								url : 'search_drugbank.php?',
								data : 'name='+val['@surfaceForm'],
								success : function(data) {
									try {
											jQuery.parseJSON( data )
											//must be valid JSON
									} catch(e) {
										//must not be valid JSON  
										$('#ajax_progress_indicator').hide();
										alert('Service is not available at the moment. Please try again later...');				
									} 
									$.each(data.drugs, function(i,v){
										//fill the temp div
										$('#temp_repo').append(create_meta_tags(v));
									});
									if(data.drugs.length==1 && val['@surfaceForm']==data.drugs[0].name){
										new_text=new_text.replace(val['@surfaceForm'], generateAnnotation(val['@surfaceForm'], data.drugs[0].s, properties,'automatic'));
									}
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
									console.log("xhr: " + xhr + "\n textStatus: " +txt + "\n errorThrown: " + err+ "\n" );
									$('#ajax_progress_indicator').hide();
									alert('Service is not available at the moment. Please try again later...');
								},
							});	 
						}
					}
				}
			});
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
	$('#temp_repo').html('');
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
	if(term.length<4)
		return;
	$.ajax({
		type : "GET",
		async: true,
		url : 'search_drugbank.php?',
		data : 'name='+term,
		success : function(data) {
			try {
					jQuery.parseJSON( data )
					//must be valid JSON
			} catch(e) {
				//must not be valid JSON  
				$('#ajax_progress_indicator').hide();
				alert('Service is not available at the moment. Please try again later...');				
			} 
			data.search_term=term;
			$("#result_of_search").html('');
			$.each(data.drugs, function(i,v){

				//fill the temp div
				$('#temp_repo').append(create_meta_tags(v));
				v.description=dotToLine(v.description, '.<br />');
			});
			if(data.drugs.length){
				if(data.drugs.length>1)
					data.hint="<b>"+data.drugs.length+"</b> drugs match your query. Please select the right one:";
				else
					data.hint='';
			}else{
				data.hint="No matches found!";
			}
			
			$( "#search_result" ).tmpl( data).appendTo( "#result_of_search" );
			$('#search_term').addClass('hidden');
		},
		error: function(xhr, txt, err){ 
			console.log("xhr: " + xhr + "\n textStatus: " +txt + "\n errorThrown: " + err+ "\n" );
			$('#ajax_progress_indicator').hide();
			alert('Service is not available at the moment. Please try again later...');
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
	var desc='';
	$.each($("#presc_edit").find('.ph-entity'), function(index, value) { 
			$(this).click(function(e) {

			});	
			$(this).mouseover(function(e) {				
				e.stopPropagation();
				desc=$('#temp_repo').find('#d_'+$(this).text()).find('[property="description"]').attr('content');
				 if(typeof desc === 'undefined'){
					desc=$('#drug_information').find('#d_'+$(this).text()).find('[property="description"]').attr('content');
				}
				$(this).popover({placement:'bottom', trigger:'hover', title: $(this).text(), content: desc});
				$(this).popover('show');
			});									
			$(this).mouseout(function() {
				//$(this).popover('destroy')
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
function shortenToLine(text){
	var next,next2,tmp;
	if (text.length>90){
		next=text.substring(90,text.length);
		tmp=text.substring(0,90)+'<br />-'+next;
		if(next.length>90){
			next2=next.substring(90,next.length);
			tmp=text.substring(0,90)+'<br />'+next.substring(0,90)+'<br />-'+next.substring(90,next.length);
			if(next2.length>90){
				tmp=text.substring(0,90)+'<br />'+next.substring(0,90)+'<br />-'+next2.substring(0,90)+'<br />-'+next2.substring(90,next2.length);
			}
		
		}
	}
	return tmp;
}
function generateAnnotation(entity_string,uri,properties,extraClasses){
	if($.trim(uri)!='')
		uri=" about='"+uri+"'";
	else
		uri="";
	return "<span class='btn btn-small ph-entity "+extraClasses+"'"+uri+" typeof='Drug'><span property='nonProprietaryName'>"+entity_string+"</span></span>&nbsp;";
}
function addAnnotation(annotation){
	$('#presc_edit').append('<br />'+annotation);
}
function updateSourceCode(){
	$('#drug_instructions').val($('#presc_edit').html());
	$('#drug_information_source	').val($('#drug_information').html());
}
function updateTurtle(){
	var data=updateIFrame();
	var turtle = toTurtle(data);
	$('#facts_view').val(turtle);
}
function updateGraph(){
	var data=updateIFrame();
	var d3Nodes = toD3TreeGraph(data);
	viz.redraw(d3Nodes);
}
function updateIFrame(){
	var previewFrame = document.getElementById('preview');
    var preview =  previewFrame.contentDocument || previewFrame.contentWindow.document;
	preview.open();

    preview.write('<div vocab="http://schema.org/">'+$('#presc_edit').html()+'</div>');
    preview.close();
    
    if(!preview.data)
    {
       RDFa.attach(preview);
    }
    else
    {
       RDFa.attach(preview, true);       
    }
	return preview.data;
}
function create_meta_tags(v){
	var temp_s;
	temp_s="<div id='d_"+v.name+"' about='"+v.s+"'>";
	temp_s=temp_s+'<span property="description" content="'+v.description+'"></span>';
	temp_s=temp_s+'<span property="absorption" content="'+v.absorption+'"></span>';
	temp_s=temp_s+'<span property="affectedOrganism" content="'+v.affectedOrganism+'"></span>';
	temp_s=temp_s+'<span property="biotransformation" content="'+v.biotransformation+'"></span>';
	temp_s=temp_s+'<span property="halfLife" content="'+v.halfLife+'"></span>';
	temp_s=temp_s+'<span property="indication" content="'+v.indication+'"></span>';
	temp_s=temp_s+'<span property="mechanismOfAction" content="'+v.mechanismOfAction+'"></span>';
	temp_s=temp_s+'<span property="pharmacology" content="'+v.pharmacology+'"></span>';
	temp_s=temp_s+'<span property="toxicity" content="'+v.toxicity+'"></span>';
	temp_s=temp_s+'<span property="dosageForms" typeOf="dosageForms">';
	$.each(v.dosageForms,function(ind,val){
		temp_s=temp_s+'<span property="dosageForm" content="'+val+'"></span>';
	});
	temp_s=temp_s+'</span>';
	temp_s=temp_s+'<span property="brandMixtures" typeOf="brandMixtures">';
	$.each(v.brandMixtures,function(ind,val){
		temp_s=temp_s+'<span property="brandMixture" content="'+val+'"></span>';
	});
	temp_s=temp_s+'</span>';	
	temp_s=temp_s+'<span property="brandNames" typeOf="brandNames">';
	$.each(v.brandNames,function(ind,val){
		temp_s=temp_s+'<span property="brandName" content="'+val+'"></span>';
	});
	temp_s=temp_s+'</span>';	
	temp_s=temp_s+'<span property="drugCategories" typeOf="drugCategories">';
	$.each(v.drugCategories,function(ind,val){
		temp_s=temp_s+'<span property="drugCategory" content="'+val+'"></span>';
	});
	temp_s=temp_s+'</span>';
	$.each(v.contraindications,function(ind,val){
		temp_s=temp_s+'<span property="contraindication" content="'+val+'"></span>';
	});
	temp_s=temp_s+'<span property="drugEnzymes" typeOf="drugEnzymes">';
	$.each(v.drugEnzymes,function(ind,val){
		temp_s=temp_s+'<span property="drugEnzyme" content="'+val+'"></span>';
	});
	temp_s=temp_s+'</span>';	
	temp_s=temp_s+'<span property="foodInteractions" typeOf="foodInteractions">';
	$.each(v.foodInteractions,function(ind,val){
		temp_s=temp_s+'<span property="foodInteraction" content="'+val+'"></span>';
	});
	temp_s=temp_s+'</span>';		
	temp_s=temp_s+'</div>';
	return temp_s;
}