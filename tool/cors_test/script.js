
function corsTest(){
	console.log('CORSテスト');
	let sendData={neko_name:'cat&dog%',same:{hojiro:'ホオジロザメ',shumoku:'シュモクザメ'}};
	
	let fd = new FormData();
	
	let send_json = JSON.stringify(sendData);//データをJSON文字列にする。
	fd.append( "key1", send_json );
	fd.append('_method','get');
	
	
	let ajax_url = "https://amaraimusi.sakura.ne.jp/crud_base_laravel8/dev/public/web_api/cors_test";
	//let ajax_url = "http://localhost/crud_base_laravel8/dev/public/web_api/cors_test";
	
	// AJAX
	jQuery.ajax({
		type: "post",
		url: ajax_url,
		data: fd,
		cache: false,
		dataType: "text",
		processData: false,
		contentType : false,
	})
	.done((res_json, type) => {
		let res;
		try{
			res =jQuery.parseJSON(res_json);//パース
		}catch(e){
			jQuery("#err").append(res_json);
			return;
		}
		console.log(res);
		$('#res').html(res.success);
	})
	.fail((jqXHR, statusText, errorThrown) => {
		let errElm = jQuery('#err');
		errElm.append('アクセスエラー');
		errElm.append(jqXHR.responseText);
		alert(statusText);
	});
}