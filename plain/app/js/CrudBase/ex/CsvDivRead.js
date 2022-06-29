/**
 * CSV分割読込
 * 
 * @note
 * FileUploadK.jsとReqBatchSmp.jsに依存
 * 
 * @date 2019-5-19 | 2019-5-27
 * @version 1.0.1
 * 
 */
class CsvDivRead{
	
	/**
	 * 初期化
	 * @param object param
	 *  - div_xid 当機能埋込先区分のid属性
	 *  - work_dp 作業ディレクトリパス
	 *  - csvFieldData CSVフィールドデータ
	 *  - zip_upload_ajax_url ZIPアップロードAjaxURL
	 *  - csv_read_ajax_url CSV読込保存AjaxURL
	 *  - batch_data_num 一括データ処理数
	 *  - zip_clear_flg ZIPファイル群クリアフラグ（危険） true:作業終了zipファイル群を削除, false:削除しない(デフォ）
	 */
	init(param){
		param = this._setParamIfEmpty(param);

		this.tDiv = jQuery('#' + param.div_xid); //  This division
		
		// 当機能のHTMLを作成および埋込
		var html = this._createHtml(); 
		this.tDiv.html(html);
		
		// ファイルアップロードオブジェクト | ZIPのアップロード
		this.fileUploadK = new FileUploadK({
				'ajax_url':param.zip_upload_ajax_url,
				'prog_slt':'#sdr_fuk_prog',
				'err_slt':'#sdr_err',});
		this.fileUploadK.addEvent('sdr_file');
		
		this.fukUploadBtn = this.tDiv.find("#sdr_fuk_upload_btn"); // ZIPファイルアップロードボタン
		this.zipSendW = this.tDiv.find("#sdr_zip_send_w"); // ZIP送信ラッパー
		this.succMsg = this.tDiv.find("#sdr_success_msg"); // 正常メッセージ区分 
		this.reloadBtn = this.tDiv.find("#sdr_reload_btn"); // リロードボタン
		this.errDiv = this.tDiv.find("#sdr_err"); // エラー区分
		
		this._addReloadBtnClickEvent(this.reloadBtn); // リロードボタンにクリックイベントを組み込む
		this._addFukUploadBtnClickEvent(this.fukUploadBtn); // ZIPファイルアップロードボタンにクリックイベントを組み込む
		
		this.param = param;
	}
	
	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};
		if(param['div_xid'] == null) param['div_xid'] = 'csv_div_read';
		if(param['work_dp'] == null) param['work_dp'] = 'upload_files/';
		if(param['zip_upload_ajax_url'] == null) throw new Error("'zip_upload_ajax_url' is empty!");
		if(param['csv_read_ajax_url'] == null) throw new Error("'csv_read_ajax_url' is empty!");
		if(param['batch_data_num'] == null) param['batch_data_num'] = 1000; // 一度に処理する行数
		if(param['offset'] == null) param['offset'] = 0;
		if(param['req_batch_count'] == null) param['req_batch_count'] = 0; // リクエストバッチ回数
		if(param['stack_mem_size'] == null) param['stack_mem_size'] = 0; // 累積サイズ
		if(param['zip_clear_flg'] == null) param['zip_clear_flg'] = false; // ZIPファイル群クリアフラグ
		
		return param;
	}
	
	
	/**
	 * 当機能のHTMLを作成および埋込
	 */
	_createHtml(){
		let html = `
	<div>
		<label for="sdr_file" class="fuk_label" style="display:inline-block;background-color:#ddb9dd;border-radius:5px;padding:4px;">
			<input type="file" id="sdr_file" accept="application/zip" title="CSVのZIPファイルをドラッグ＆ドロップ" style="display:none" />
		</label>

		<div id="sdr_zip_send_w" >
			<input id="sdr_fuk_upload_btn" type="button" value="ZIPを送信" class="btn btn-warning">
			<progress id="sdr_fuk_prog" value="0" max="100"></progress>
		</div>
		<div id="sdr_success_msg" class="text-success"></div>
		<input id="sdr_reload_btn" type="button" class="btn btn-primary" value="リロード" style="display:none">
		<div id="sdr_req_batch"></div>
		<div id="sdr_err" class="text-danger"></div>
	</div>
		`;
		return html;
	}
	
	
	/**
	 * リロードボタンにクリックイベントを組み込む
	 * @param jQuery reloadBtn リロードボタン
	 */
	_addReloadBtnClickEvent(reloadBtn){
		reloadBtn.click((evt)=>{
			location.reload(true);
		});
	}
	
	
	/**
	 * ZIPファイルアップロードボタンにクリックイベントを組み込む
	 * @param jQuery fukUploadBtn ZIPファイルアップロードボタン
	 */
	_addFukUploadBtnClickEvent(fukUploadBtn){
		fukUploadBtn.click((evt)=>{
			
			
			this.param['unique_key'] = this._getUniqueStr(); // ユニークキーをセットする
			this.param['zip_dp'] = this.param.work_dp + this.param.unique_key + '/'; // ZIPディレクトリパス
			
			// ファイル情報と一緒に送信するデータ
			var withData = this.param;
			
			// ZIPファイルをサーバーにアップロードする。
			var func = this.afterZipUpload.bind(this);
			this.fileUploadK.uploadByAjax(func,withData);
			
			
		});
	}
	
	// ユニークキーをセットする
	_getUniqueStr(){
		let str_time = new Date().getTime().toString(16);
		let unique_key = 'sdr' + str_time;
		return unique_key;
	}
	
	
	/**
	 * ZIPファイルアップロード完了後
	 */
	afterZipUpload(param){

		// エラーメッセージが空でなければ、エラーを表示して処理終了
		if(!this._empty(param.err_msg)){
			this._showErr(param.err_msg);
			return;
		}
		
		// CSV読込スレッドのコールバック関数
		var thread_cb = this.threadCsvRead.bind(this);

		// リクエスト分散バッチ処理【シンプル版】
		this.reqBatchSmp = new ReqBatchSmp();
		this.reqBatchSmp.init({
			div_xid:'sdr_req_batch',
			data:param,
			ajax_url:this.param.csv_read_ajax_url,
			fail_limit:0, // 失敗制限数
			prog_flg:false, // 進捗バーフラグ true:自動進捗（デフォ）, false:手動進捗
		},{
			thread_cb:thread_cb, // CSV読込スレッドのコールバック関数
		});
		
		this.reqBatchSmp.startBtn.val('CSV読込');

		param['offset'] = 0; // CSV分割読込オフセット
		param['req_batch_count'] = 0; // リクエストバッチ回数
		
		this.param = param;
		
		this.zipSendW.hide(); // ZIP送信ラッパー区分を隠す
		
		this.succMsg.html('サーバーにZIPファイルを送信しました。続けて「CSV読込」を実行してください。');
		
		
	}
	
	
	/**
	 * CSV読込スレッドのコールバック関数
	 * @param object param
	 */
	threadCsvRead(res){
		var param = res.data;
		
		// 終了フラグがONならスレッドを停止
		if(param.end_flg == true){
			this.succMsg.html('CSV読込処理は、すべて終了しました。「リロード」ボタンを押して一覧を更新してください。');
			this.reqBatchSmp.stopThread();
			this.reloadBtn.show(); // リロードボタンを表示
			return;
		}
		
		let prog_rate = param.stack_mem_size / param.fsize * 100; // 進捗率を算出
		this.reqBatchSmp.advanceProg(prog_rate); // 進捗バーを進める
		
		let prog_rate2 = Math.round(prog_rate); // 進捗率から小数点を切り捨て）
		this.succMsg.html('CSV読込中です... ' + prog_rate2 + '%');
		
		param.req_batch_count ++; // リクエストバッチ回数をカウント
		
		
		this.param = param;
	}
	
	
	/**
	 * エラーを表示
	 * @param string err_msg エラーメッセージ
	 */
	_showErr(err_msg){
		this.errDiv.append(err_msg + '<br>');
	}
	
	
	// Check empty.
	_empty(v){
		if(v == null || v == '' || v=='0'){
			return true;
		}else{
			if(typeof v == 'object'){
				if(Object.keys(v).length == 0){
					return true;
				}
			}
			return false;
		}
	}
	
}