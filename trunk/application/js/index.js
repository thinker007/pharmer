//used for connecting to NLP APIs
var proxy_url="proxy.php?";

function selectItem(divid,item){
	$('#'+divid).find('.item-title-current').html($(item).find('.item-title').text());
	$('#'+divid+' .already-selected').removeClass('already-selected');
	$(item).addClass('already-selected');
	$('#'+divid).find('button').removeClass('btn-warning').addClass('btn-success');
	$('#presc_edit').attr('contenteditable','false');
	$('#presc_edit').attr('contenteditable','true');
}

function detect_drugs(){
	var dataReceived;
	var data = encodeURIComponent($('#presc_edit').text());
	var new_text=$('#presc_edit').html();
	data = "api=DBpedia&query=" + data;
	dataReceived=connectEnricherAPI(proxy_url,data);
	$.each(dataReceived['Resources'], function(key, val) {
		var tmp=val['@types'];
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
			new_text=new_text.replace(val['@surfaceForm'], "<b>"+val['@surfaceForm']+"</b>"); 
		}
	});
	$('#presc_edit').html(new_text);
}

function connectEnricherAPI(url,request_data){
	var dataReceived;
	$.ajax({
		type : "POST",
		async: false,
		url : url,
		data : request_data,
		contentType: "application/x-www-form-urlencoded",
		dataType: "json",
		success : function(data) {
			dataReceived =  data;
		},
		error: function(xhr, txt, err){ 
			//alert("xhr: " + xhr + "\n textStatus: " +txt + "\n errorThrown: " + err+ "\n url: " + url);
			dataReceived=0;
		},
	});
	return dataReceived;
}