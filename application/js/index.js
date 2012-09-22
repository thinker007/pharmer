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
	$('#drug_information').append('<div id="d_'+makeDashSeparated($("#searchid .item-title-current").text().trim())+'" about="'+uri+'">'+$('#temp_repo').find('#d_'+makeDashSeparated($("#searchid .item-title-current").text()).trim()).html()+'</div>');
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
						if((new_text.indexOf('<span property="nonProprietaryName">'+val['@surfaceForm']+'</span>')==-1) && val['@surfaceForm'].toLowerCase()!='drug' && val['@surfaceForm'].toLowerCase()!='drugs'){
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
										console.log('Service is not available at the moment. Please try again later...');				
									} 
									$.each(data.drugs, function(i,v){
										//fill the temp div
										$('#temp_repo').append(create_meta_tags(v));
									});
									if(data.drugs.length==1 && (val['@surfaceForm']==data.drugs[0].name)){
										new_text=new_text.replace(val['@surfaceForm'], generateAnnotation(val['@surfaceForm'], data.drugs[0].s, properties,'automatic'));
										//solve the problem with new <br> tag added
										var endstr="<br>";
										new_text=$.trim(new_text);
										var tmp2=new_text.substring(new_text.length-endstr.length,new_text.length);
										if(tmp2==endstr)
											new_text=new_text.substring(0,new_text.length-endstr.length);
										$('#presc_edit').html(new_text);
										placeCaretAtEnd( document.getElementById("presc_edit") );
										$('#drug_information').append('<div id="d_'+makeDashSeparated(val['@surfaceForm'])+'" about="'+data.drugs[0].s+'">'+$('#temp_repo').find('#d_'+makeDashSeparated(val['@surfaceForm'])).html()+'</div>');
										refreshTooltips();										
									}
								},
								error: function(xhr, txt, err){ 
									console.log("xhr: " + xhr + "\n textStatus: " +txt + "\n errorThrown: " + err+ "\n" );
									$('#ajax_progress_indicator').hide();
									console.log('Service is not available at the moment. Please try again later...');
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
	$('#alert_bar').addClass('hidden');
	var is_st_selected=0;
	var selected=getSelectionHtml();
	$('#temp_repo').html('');
	if(selected!='')
		is_st_selected=1;
	if(!is_st_selected){
		$("#result_of_search").html('');
		if(!$('#search_term').hasClass('hidden')){
			handleSearch();
		}else{
			$('#search_term').removeClass('hidden');
			$("#search_term").typeahead({
			  source: function(query, process) {
				$.get('search_terms.php', { term: query }, function(data) {	
					data = eval('(' + data + ')');
					return process(data);
				}); 
			  }
			});
		
		}
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
	$('#alert_bar').addClass('hidden');
	var term=$("#search_term").val().trim();
	if(term.length<4)
		return;
	$.ajax({
		type : "GET",
		async: true,
		url : 'search_drugbank.php?',
		data : 'name='+term,
		success : function(data) {
			try {
					jQuery.parseJSON( data );
					//must be valid JSON
			} catch(e) {
				//must not be valid JSON  
				$('#ajax_progress_indicator').hide();
				$('#alert_bar').show();
				$('#alert_bar').removeClass('hidden');
				//console.log('Online Service is not available at the moment. We will search our local database. For more complete results please try the service again...');	
				//try to get the value from the local database
				//this is not complete but provides a partial results
				$.ajax({
					type : "GET",
					async: true,
					url : 'search_drug_local.php?',
					data : 'drug='+term,
					success : function(data) {
						try {
								jQuery.parseJSON( data )
								//must be valid JSON
						} catch(e) {
							//must not be valid JSON  
							$('#ajax_progress_indicator').hide();			
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
						//$('#search_term').val('');
						$('#search_term').addClass('hidden');
					}
				});					
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
			//$('#search_term').val('');
			$('#search_term').addClass('hidden');
		},
		error: function(xhr, txt, err){ 
			console.log("xhr: " + xhr + "\n textStatus: " +txt + "\n errorThrown: " + err+ "\n" );		
			$('#ajax_progress_indicator').hide();
		},
	});	
}
function findDrugInteractions(){
	//now we do it on the fly but we can add the related annotation later to the document for client-side processing
	var drug_list=new Array();
	$.each($('#presc_edit .ph-entity'), function(i,v){
		//.log($(v).text().trim());
		//console.log($(v).attr('about'));
		drug_list.push($(v).attr('about'));
	});
	$.ajax({
		type : "POST",
		async: true,
		url : 'check_drug_interactions.php?',
		data : 'drugs='+drug_list,
		success : function(data) {
			try {
					jQuery.parseJSON( data )
					//must be valid JSON
			} catch(e) {
				//must not be valid JSON  
				$('#ajax_progress_indicator').hide();
				console.log('Service is not available at the moment. Please try again later...');				
			} 
			if(data.interactions.length){
				$("#drug_interactions_list").html('');
				$( "#interaction_template" ).tmpl( data).appendTo( "#drug_interactions_list" );
			}else{
				$("#drug_interactions_list").html('<br/> <center><h5>No interaction found!</h5></center><br/>');
			}
			//show Modal
			$('#drugInteractionsModal').modal('toggle');
		},
		error: function(xhr, txt, err){ 
			console.log("xhr: " + xhr + "\n textStatus: " +txt + "\n errorThrown: " + err+ "\n" );
			$('#ajax_progress_indicator').hide();
			console.log('Service is not available at the moment. Please try again later...');
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
	var extradesc='';
	var drugname;
	$.each($("#presc_edit").find('.ph-entity'), function(index, value) { 
			$(this).click(function(e) {

			});	
			$(this).mouseover(function(e) {				
				e.stopPropagation();
				drugname=makeDashSeparated($(this).text().trim());
				desc=$('#temp_repo').find('#d_'+drugname).find('[property="description"]').attr('content');
				 if(typeof desc === 'undefined'){
					desc=$('#drug_information').find('#d_'+drugname).find('[property="description"]').attr('content');
				}
				if($('#presc_edit').find('#d_'+drugname).find("span[property='quantity']").length)
					extradesc="Quantity: "+$('#presc_edit').find('#d_'+drugname).find("span[property='quantity']").attr('content')+'<br/>';
				if($('#presc_edit').find('#d_'+drugname).find("span[property='dosageForm']").length)
					extradesc=extradesc+'Form: '+$('#presc_edit').find('#d_'+drugname).find("span[property='dosageForm']").attr('content')+'<br/>';
				if($('#presc_edit').find('#d_'+drugname).find("span[property='dosageQuantity']").length)
					extradesc=extradesc+'Dosage: '+$('#presc_edit').find('#d_'+drugname).find("span[property='dosageQuantity']").attr('content')+'<br/>';
				desc=extradesc+''+desc;
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
	return "<span onclick='showInfoModal(this,1);' class='btn btn-small ph-entity "+extraClasses+"'"+uri+" typeof='Drug' id='d_"+makeDashSeparated(entity_string)+"'><span property='nonProprietaryName'>"+entity_string+"</span></span>&nbsp;";
}
function addAnnotation(annotation){
	$('#presc_edit').append('<br />'+annotation);
}
function updateSourceCode(){
	$('#drug_instructions').val($('#presc_edit').html());
	$('#drug_information_source	').val($('#drug_information').html());
}
function showTab(tabName,id){
	$('#'+tabName+' a[href="#'+id+'"]').tab('show');
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
function deleteAnnotation(drugname){
	var dugnameDashSeparated=makeDashSeparated(drugname);
	$('#presc_edit').find('#d_'+dugnameDashSeparated).replaceWith(drugname);
	$("#drugModal").modal("hide");
}
function saveAnnotation(drugname){
	var dugnameDashSeparated=makeDashSeparated(drugname);
	$('#presc_edit').find('#d_'+dugnameDashSeparated).find("span[property='quantity']").remove();
	if($('#inputQuantity').val())
		$('#presc_edit').find('#d_'+dugnameDashSeparated).append("<span property='quantity' content='"+$('#inputQuantity').val()+"'></span>");
	$('#presc_edit').find('#d_'+dugnameDashSeparated).find("span[property='dosageForm']").remove();
	$('#presc_edit').find('#d_'+dugnameDashSeparated).append("<span property='dosageForm' content='"+$('#inputDosageForm').val()+"'></span>");
	$('#presc_edit').find('#d_'+dugnameDashSeparated).find("span[property='dosageQuantity']").remove();
	if($('#inputDosageQuantity').val())
		$('#presc_edit').find('#d_'+dugnameDashSeparated).append("<span property='dosageQuantity' content='"+$('#inputDosageQuantity').val()+"'></span>");
	$('#presc_edit').find('#d_'+dugnameDashSeparated).find("span[property='usageInstruction']").remove();
	if($('#inputUsageInstruction').val())
		$('#presc_edit').find('#d_'+dugnameDashSeparated).append("<span property='usageInstruction' content='"+$('#inputUsageInstruction').val()+"'></span>");
	$("#drugModal").modal("hide");
}
function showInfoModal(obj,is_selected){
	var repo;
	if(is_selected)
		repo="drug_information";
	else
		repo="temp_repo";

	var drugname=$(obj).text().trim();
	$('#deleteButton').click(function(e) {
		deleteAnnotation(drugname);
	});
	$('#saveButton').click(function(e) {
		saveAnnotation(drugname);
	});	
	drugname=makeDashSeparated(drugname);	
	$('#description').html('No information found!');
	$('#description').html($('#'+repo).find('#d_'+drugname).find('[property="description"]').attr('content'));
	$('#absorption').html('No information found!');
	$('#absorption').html($('#'+repo).find('#d_'+drugname).find('[property="absorption"]').attr('content'));
	$('#affectedOrganism').html('No information found!');
	$('#affectedOrganism').html($('#'+repo).find('#d_'+drugname).find('[property="affectedOrganism"]').attr('content'));
	$('#biotransformation').html('No information found!');
	$('#biotransformation').html($('#'+repo).find('#d_'+drugname).find('[property="biotransformation"]').attr('content'));
	$('#halfLife').html('No information found!');
	$('#halfLife').html($('#'+repo).find('#d_'+drugname).find('[property="halfLife"]').attr('content'));
	$('#mechanismOfAction').html('No information found!');
	$('#mechanismOfAction').html($('#'+repo).find('#d_'+drugname).find('[property="mechanismOfAction"]').attr('content'));
	$('#pharmacology').html('No information found!');
	$('#pharmacology').html($('#'+repo).find('#d_'+drugname).find('[property="pharmacology"]').attr('content'));
	$('#toxicity').html('No information found!');
	$('#toxicity').html($('#'+repo).find('#d_'+drugname).find('[property="toxicity"]').attr('content'));
	$('#indication').html('No information found!');
	$('#indication').html($('#'+repo).find('#d_'+drugname).find('[property="indication"]').attr('content'));	
	var tmp='';
	var options='';
	if($('#'+repo).find('#d_'+drugname).find('[property="dosageForms"]').length)
		$.each($('#'+repo).find('#d_'+drugname).find('[property="dosageForms"]')[0].children ,function(inx,val){
			tmp2=$(val).attr('content');
			tmp2=tmp2.split('\/');
			tmp2=tmp2[tmp2.length-1];
			tmp=tmp+'<li>'+tmp2+'</li>';
			options=options+'<option value="'+tmp2+'">'+tmp2+'</option>';
		});
	options=options+'<option>Other</option>';
	$('#dosageForms').html('<ul>'+tmp+'</ul>');
	$('#inputDosageForm').html(options);
	var tmp='';
	if($('#'+repo).find('#d_'+drugname).find('[property="brandNames"]').length)
		$.each($('#'+repo).find('#d_'+drugname).find('[property="brandNames"]')[0].children ,function(inx,val){
			tmp=tmp+'<li>'+$(val).attr('content')+'</li>';
		});
		$('#brandNames').html('<ul>'+tmp+'</ul>');	
	var tmp='';
	if($('#'+repo).find('#d_'+drugname).find('[property="brandMixtures"]').length)
		$.each($('#'+repo).find('#d_'+drugname).find('[property="brandMixtures"]')[0].children ,function(inx,val){
			tmp=tmp+'<li>'+$(val).attr('content')+'</li>';
		});
		$('#brandMixtures').html('<ul>'+tmp+'</ul>');	
	var tmp='';
	var tmp2;
	if($('#'+repo).find('#d_'+drugname).find('[property="drugCategories"]').length)
		$.each($('#'+repo).find('#d_'+drugname).find('[property="drugCategories"]')[0].children ,function(inx,val){
			tmp2=$(val).attr('content');
			tmp2=tmp2.split('\/');
			tmp2=tmp2[tmp2.length-1];
			tmp=tmp+'<li>'+tmp2+'</li>';
		});
		$('#drugCategories').html('<ul>'+tmp+'</ul>');	
	var tmp='';
	if($('#'+repo).find('#d_'+drugname).find('[property="drugEnzymes"]').length)
		$.each($('#'+repo).find('#d_'+drugname).find('[property="drugEnzymes"]')[0].children ,function(inx,val){
			tmp=tmp+'<li>'+$(val).attr('content')+'</li>';
		});
		$('#drugEnzymes').html('<ul>'+tmp+'</ul>');		
	var tmp='';
	if($('#'+repo).find('#d_'+drugname).find('[property="foodInteractions"]').length)
		$.each($('#'+repo).find('#d_'+drugname).find('[property="foodInteractions"]')[0].children ,function(inx,val){
			tmp=tmp+'<li>'+$(val).attr('content')+'</li>';
		});
		$('#foodInteractions').html('<ul>'+tmp+'</ul>');	
	var tmp='';
	if($('#'+repo).find('#d_'+drugname).find('[property="contraindications"]').length)
		$.each($('#'+repo).find('#d_'+drugname).find('[property="contraindications"]')[0].children ,function(inx,val){
			tmp=tmp+'<li>'+$(val).attr('content')+'</li>';
		});
		$('#contraindications').html('<ul>'+tmp+'</ul>');	
	var tmp='';
	if($('#'+repo).find('#d_'+drugname).find('[property="drugTargets"]').length)
		$.each($('#'+repo).find('#d_'+drugname).find('[property="drugTargets"]')[0].children ,function(inx,val){
			tmp=tmp+'<li>'+$(val).attr('content')+'</li>';
		});
		$('#drugTargets').html('<ul>'+tmp+'</ul>');	
	$('#drugModalLabel').html(drugname);	
	if($('#presc_edit').find('#d_'+drugname).find("span[property='quantity']").length)
		$('#inputQuantity').val($('#presc_edit').find('#d_'+drugname).find("span[property='quantity']").attr('content'));
	else
		$('#inputQuantity').val('');
	if($('#presc_edit').find('#d_'+drugname).find("span[property='dosageForm']").length)
		$("#inputDosageForm").val($('#presc_edit').find('#d_'+drugname).find("span[property='dosageForm']").attr('content'));
	if($('#presc_edit').find('#d_'+drugname).find("span[property='dosageQuantity']").length)
		$('#inputDosageQuantity').val($('#presc_edit').find('#d_'+drugname).find("span[property='dosageQuantity']").attr('content'));
	else
		$('#inputDosageQuantity').val('');
	if($('#presc_edit').find('#d_'+drugname).find("span[property='usageInstruction']").length)
		$('#inputUsageInstruction').val($('#presc_edit').find('#d_'+drugname).find("span[property='usageInstruction']").attr('content'));
	else
		$('#inputUsageInstruction').val('');		
	//show Modal
	$('#drugModal').modal('toggle');
}
function create_meta_tags(v){
	var temp_s;
	temp_s="<div id='d_"+makeDashSeparated(v.name)+"' about='"+v.s+"' class='ph-entity'>";
	temp_s=temp_s+'<span property="description" content="'+v.description+'"></span>';
	if(typeof(v.absorption) != "undefined")
		temp_s=temp_s+'<span property="absorption" content="'+v.absorption+'"></span>';
	if(typeof(v.affectedOrganism) != "undefined")
		temp_s=temp_s+'<span property="affectedOrganism" content="'+v.affectedOrganism+'"></span>';
	
	if(typeof(v.biotransformation) != "undefined")
		temp_s=temp_s+'<span property="biotransformation" content="'+v.biotransformation+'"></span>';
	if(typeof(v.halfLife) != "undefined")
		temp_s=temp_s+'<span property="halfLife" content="'+v.halfLife+'"></span>';
	if(typeof(v.indication) != "undefined")
		temp_s=temp_s+'<span property="indication" content="'+v.indication+'"></span>';
	if(typeof(v.mechanismOfAction) != "undefined")
		temp_s=temp_s+'<span property="mechanismOfAction" content="'+v.mechanismOfAction+'"></span>';
	if(typeof(v.pharmacology) != "undefined")
		temp_s=temp_s+'<span property="pharmacology" content="'+v.pharmacology+'"></span>';
	if(typeof(v.toxicity) != "undefined")
		temp_s=temp_s+'<span property="toxicity" content="'+v.toxicity+'"></span>';
	if(typeof(v.dosageForms) != "undefined"){
		temp_s=temp_s+'<span property="dosageForms" typeOf="dosageForms">';
		$.each(v.dosageForms,function(ind,val){
			temp_s=temp_s+'<span property="dosageForm" content="'+val+'"></span>';
		});
		temp_s=temp_s+'</span>';
	}
	if(typeof(v.brandMixtures) != "undefined"){
		temp_s=temp_s+'<span property="brandMixtures" typeOf="brandMixtures">';
		$.each(v.brandMixtures,function(ind,val){
			temp_s=temp_s+'<span property="brandMixture" content="'+val+'"></span>';
		});
		temp_s=temp_s+'</span>';	
	}
	if(typeof(v.brandNames) != "undefined"){
		temp_s=temp_s+'<span property="brandNames" typeOf="brandNames">';
		$.each(v.brandNames,function(ind,val){
			temp_s=temp_s+'<span property="brandName" content="'+val+'"></span>';
		});
		temp_s=temp_s+'</span>';	
	}
	if(typeof(v.drugCategories) != "undefined"){
		temp_s=temp_s+'<span property="drugCategories" typeOf="drugCategories">';
		$.each(v.drugCategories,function(ind,val){
			temp_s=temp_s+'<span property="drugCategory" content="'+val+'"></span>';
		});
		temp_s=temp_s+'</span>';
	}	
	if(typeof(v.drugTargets) != "undefined"){
		temp_s=temp_s+'<span property="drugTargets" typeOf="drugTargets">';
		$.each(v.drugTargets,function(ind,val){
			temp_s=temp_s+'<span property="drugTarget" content="'+val+'"></span>';
		});	
		temp_s=temp_s+'</span>';
	}
	if(typeof(v.contraindications) != "undefined"){
		temp_s=temp_s+'<span property="contraindications" typeOf="Contraindication">';	
		$.each(v.contraindications,function(ind,val){
			temp_s=temp_s+'<span property="contraindication" content="'+val+'"></span>';
		});
		temp_s=temp_s+'</span>';
	}
	if(typeof(v.drugEnzymes) != "undefined"){
		temp_s=temp_s+'<span property="drugEnzymes" typeOf="drugEnzymes">';
		$.each(v.drugEnzymes,function(ind,val){
			temp_s=temp_s+'<span property="drugEnzyme" content="'+val+'"></span>';
		});
		temp_s=temp_s+'</span>';	
	}
	if(typeof(v.foodInteractions) != "undefined"){
		temp_s=temp_s+'<span property="foodInteractions" typeOf="foodInteractions">';
		$.each(v.foodInteractions,function(ind,val){
			temp_s=temp_s+'<span property="foodInteraction" content="'+val+'"></span>';
		});
		temp_s=temp_s+'</span>';
	}	
	temp_s=temp_s+'</div>';
	return temp_s;
}
function makeDashSeparated(word){
	var tmp=word.split(' ');
	if(!tmp.length)
		return word;
	else{
		return tmp.join('-');
	}	
}
function makeUnDashSeparated(word){
	var tmp=word.split('-');
	if(!tmp.length)
		return word;
	else{
		return tmp.join(' ');
	}	
}