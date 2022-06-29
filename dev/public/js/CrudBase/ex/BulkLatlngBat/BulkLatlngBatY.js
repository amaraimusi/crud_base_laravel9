/**
 * 一括緯度経度取得・バッチ処理 Yahoo API版
 * 
 * @note
 * ReqBatch.jsに依存。
 * ReqBatch.jsは「リクエスト分散バッチ処理」と呼ばれるバッチ処理系のライブラリ
 * 
 * @date 2019-4-26 | 2019-5-29
 * @version 1.1.1
 */
class BulkLatlngBatY{
	
	/**
	 * 初期化
	 * @param object param
	 * - req_batch_ajax_url リクエスト分散バッチ用のAjax URL
	 * - get_data_ajax_url データ取得用のAjax URL
	 * - interval スレッド間隔
	 * - exe_limit 処理制限数
	 * - fail_limit 失敗制限
	 * @param jQuery tDiv トップ要素
	 */
	init(param, tDiv){
		param = this._setParamIfEmpty(param);
		this.tDiv = tDiv
		
		this.reqBatch = new ReqBatch(); // リクエスト分散バッチ処理
		this.reqBatch.init({
			div_xid:'bulk_latlng_bat_y',
			start_btn_xid:'bllby_start_btn',
			interval:param.interval,
			fail_limit:param.fail_limit,
			ajax_url:param.req_batch_ajax_url,
			asyn_res_cb:this.asynRes,
		});
		
		this.resDiv = this.tDiv.find('#blly_res'); // レスメッセージ
		
		this.param = param;
	}
	
	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};
		
		if(param['req_batch_ajax_url'] == null) throw new Error("'req_batch_ajax_url' is empty!");
		if(param['get_data_ajax_url'] == null) throw new Error("'get_data_ajax_url' is empty!");
		if(param['interval'] == null) param['interval'] = 600;
		if(param['exe_limit'] == null) param['exe_limit'] = 20000;
		if(param['fail_limit'] == null) param['fail_limit'] = 45000;
		
		return param;
	}
	
	
	/**
	 * バッチ処理開始
	 */
	start(){

		this.resDiv.show();
		this.resDiv.html('お待ちください...');
		
		var sendData = this.param;
		var send_json = JSON.stringify(sendData);//データをJSON文字列にする。

		// AJAX
		jQuery.ajax({
			type: "POST",
			url: this.param.get_data_ajax_url,
			data: "key1=" + send_json,
			cache: false,
			dataType: "text",
		})
		.done((res_json, type) => {
			var res;
			try{
				res =jQuery.parseJSON(res_json);//パース
			}catch(e){
				jQuery("#err").append(res_json);
				return;
			}
			
			
			
			var data = res; // 緯度経度が空の求人データ
			
			// 0件処理
			if(data.length == 0){
				this.resDiv.html('処理対象データは0件です。');
				return;
			}
			this.resDiv.hide();
			
			// ★  バッチ処理開始
			this.reqBatch.start(data);
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			jQuery('#err').append('アクセスエラー');
			jQuery('#err').append(jqXHR.responseText);
			alert(statusText);
		});
		
		
	}

	
	/**
	 * 非同期処理のレスポンスコールバック
	 * @param object res 非同期処理のレスポンスデータ
	 */
	asynRes(res){
		console.log(res);
	}

}