/**
 * 大型CSVインポート | CSV分割読込
 * 
 * @note
 * FileUploadK.jsとReqBatchSmp.jsに依存
 * 
 * @date 2019-5-19 | 2019-9-2
 * @version 2.0.3
 * 
 */
class CsvImportBig{
	
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
	 * @param object coms コンポーネントリスト
	 *  - bulkDelete 一括削除オブジェクト | BulkDelete.js 指定すると一旦削除ができる。(省略可）
	 */
	init(param,coms){
		param = this._setParamIfEmpty(param);
		
		if(coms == null) coms = {};
		this.coms = coms;

		this.tDiv = jQuery('#' + param.div_xid); //  This division
		
		// 当機能のHTMLを作成および埋込
		var html = this._createHtml(param); 
		this.tDiv.html(html);
		
		// ファイル配置イベント関数をセットする
		let funcFileputEvent = this.fileputEvent.bind(this);
		let fukCallbacks = {
				fileputEvent:funcFileputEvent
		}
		
		// ファイルアップロードオブジェクト | ZIPのアップロード
		this.fileUploadK = new FileUploadK({
				'ajax_url':param.zip_upload_ajax_url,
				'prog_slt':'#sdr_fuk_prog',
				'err_slt':'#sdr_err',}, fukCallbacks);
		this.fileUploadK.addEvent('sdr_file');
		
		this.fukUploadBtn = this.tDiv.find("#sdr_fuk_upload_btn"); // ZIPファイルアップロードボタン
		this.zipSendW = this.tDiv.find("#sdr_zip_send_w"); // ZIP送信ラッパー
		this.succMsg = this.tDiv.find("#sdr_success_msg"); // 正常メッセージ区分 
		this.reloadBtn = this.tDiv.find("#sdr_reload_btn"); // リロードボタン
		this.errDiv = this.tDiv.find("#sdr_err"); // エラー区分
		this.delBtn = this.tDiv.find("#sdr_bulk_delete_btn"); // 削除ボタン
		
		// ログ関連
		this.logW = this.tDiv.find("#sdr_log_w"); // ログのラッパー区分
		this.logErrCount = this.tDiv.find("#sdr_log_err_count"); // ログエラーカウント
		this.logDl = this.tDiv.find("#sdr_log_dl"); // ログダウンロードボタン
		this.logShow = this.tDiv.find("#sdr_log_show"); // ログ表示ボタン
		this.logTextW = this.tDiv.find("#sdr_log_text_w"); // ログテキストのラッパー区分
		this.logTextCloseBtn = this.tDiv.find("#sdr_log_text_close"); // ログテキスト閉じるボタン
		this.logText = this.tDiv.find("#sdr_log_text"); //エラーログテキスト区分
		

		this._addReloadBtnClickEvent(this.reloadBtn); // リロードボタンにクリックイベントを組み込む
		this._addFukUploadBtnClickEvent(this.fukUploadBtn); // ZIPファイルアップロードボタンにクリックイベントを組み込む
		this._addDelBtnClickEvent(this.delBtn); // 削除ボタンにクリックイベントを組み込む
		this._addLogShowClickEvent(this.logShow); // ログ表示ボタンにクリックイベントを組み込む
		this._addLogTextCloseClickEvent(this.logTextCloseBtn); // ログテキスト閉じるボタンにクリックイベントを組み込む
		
		this.param = param;
	}
	
	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};
		if(param['div_xid'] == null) param['div_xid'] = 'csv_import_big';
		if(param['work_dp'] == null) param['work_dp'] = 'upload_files/';
		if(param['zip_upload_ajax_url'] == null) throw new Error("'zip_upload_ajax_url' is empty!");
		if(param['csv_read_ajax_url'] == null) throw new Error("'csv_read_ajax_url' is empty!");
		if(param['log_text_ajax_url'] == null) throw new Error("'log_text_ajax_url' is empty!");
		
		if(param['batch_data_num'] == null) param['batch_data_num'] = 1000; // 一度に処理する行数
		if(param['offset'] == null) param['offset'] = 0;
		if(param['req_batch_count'] == null) param['req_batch_count'] = 0; // リクエストバッチ回数
		if(param['stack_mem_size'] == null) param['stack_mem_size'] = 0; // 累積サイズ
		if(param['zip_clear_flg'] == null) param['zip_clear_flg'] = false; // ZIPファイル群クリアフラグ
		if(param['csv_row_no'] == null) param['csv_row_no'] = 1; // CSV行番
		if(param['err_count'] == null) param['err_count'] = 0; // エラーカウント
		if(param['reg_count'] == null) param['reg_count'] = 0; // 登録件数
		
		
		let date_str = this._dateFormat(null, 'Ymdhis');
		if(param['err_log_fp'] == null) param['err_log_fp'] = 'log/csv_import_big' + date_str + '.log'; // エラーログファイルパス
		 
		return param;
	}
	
	
	/**
	 * 当機能のHTMLを作成および埋込
	 */
	_createHtml(param){
		
		
		let html = `
	<div>
		<label for="sdr_file" class="fuk_label" style="display:inline-block;background-color:#ddb9dd;border-radius:5px;padding:4px;">
			<input type="file" id="sdr_file" accept="application/zip" title="CSVのZIPファイルをドラッグ＆ドロップ" style="display:none" />
		</label>

		<div id="sdr_zip_send_w" style="display:none">
			<input id="sdr_fuk_upload_btn" type="button" value="ZIPを送信" class="btn btn-warning">
			<progress id="sdr_fuk_prog" value="0" max="100"></progress>
		</div>
		<div id="sdr_err" class="text-danger"></div>
		<div id="sdr_success_msg" class="text-success"></div>
		<input id="sdr_reload_btn" type="button" class="btn btn-primary" value="リロード" style="display:none">
		<div id="sdr_log_w" style="display:none;padding:3px">
			<div class="text-danger" style="margin-bottom:10px">
				エラー数: <span id="sdr_log_err_count">0</span>
				<input type="button" id="sdr_bulk_delete_btn" class="btn btn-danger btn-xs" value = "登録分を一旦削除する" title="登録した分をDBから削除します。(入力エラーのある行は登録していません。)" >
			</div>
			<a id="sdr_log_dl" href="" target="blank" download="download.txt" class="btn btn-info btn-xs">エラーログ・ダウンロード</a>
			<input id="sdr_log_show" type="button" value="エラーログ表示" class="btn btn-info btn-xs" />
		</div>
		<div id="sdr_log_text_w" style="display:none">
			<input id="sdr_log_text_close" type="button" value="閉じる" class="btn btn-secondary btn-xs" />
			<pre id="sdr_log_text"></pre>
		</div>
		<div id="sdr_req_batch"></div>
	</div>
		`;
		return html;
	}
	
	
	/**
	 * ファイル配置直後イベント
	 * @param box ファイル情報ボックス
	 */
	fileputEvent(box){
		this.zipSendW.show();
		this.logW.hide();
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
		
		this._setErrLogs(param); // ログ関連のセット
		
		
		
	}
	
	
	/**
	 * 削除ボタンにクリックイベントを組み込む
	 * @param jQuery btn 削除ボタン
	 */
	_addDelBtnClickEvent(btn){
		btn.click((evt)=>{
			this._delBtnClickEvent(); // 削除ボタンにクリックイベント
		});
	}
	
	/**
	 * 削除ボタンにクリックイベント
	 */
	_delBtnClickEvent(){
		if(this.coms.bulkDelete == null) return;
		let csv_fn = this.param.csv_fn;
		let kjs = {csv_fn:csv_fn};
		this.coms.bulkDelete.deleteByKjs(kjs); // 検索条件を指定して削除を実行する

	}
	
	
	/**
	 * ログ表示ボタンにクリックイベントを組み込む
	 * @param jQuery logShow ログ表示ボタン
	 */
	_addLogShowClickEvent(logShow){
		logShow.click((evt)=>{
			this._logShowClickEvent(); // ログ表示ボタンにクリックイベント
		});
	}
	
	
	/**
	 * ログ表示ボタンにクリックイベント
	 */
	_logShowClickEvent(){
		
		var text1 = "cat&dog"; // &が混じった文字列
		text1 = text1.replace(/&/g, '%26'); // PHPのJSONデコードでエラーになるので、＆だけ変換しておく。
		
		var sendData=this.param;
		sendData = this._ampTo26(sendData); // PHPのJSONデコードでエラーになるので、＆を%26に一括変換する

		var send_json = JSON.stringify(sendData);//データをJSON文字列にする。

		// AJAX
		jQuery.ajax({
			type: "POST",
			url: this.param.log_text_ajax_url,
			data: "key1=" + send_json,
			cache: false,
			dataType: "text",
		})
		.done((res_json, type) => {
			var res;
			try{
				res =jQuery.parseJSON(res_json);//パース
			}catch(e){
				this._showErr(res_json);
				return;
			}
			
			// ログテキストを表示
			this.logText.html(res.log_text);
			this.logTextW.show();
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			this._showErr(jqXHR.responseText);
			alert(statusText);
		});
	}
	
	
	/**
	 * ログテキスト閉じるボタンにクリックイベントを組み込む
	 * @param jQuery logTextCloseBtn ログテキスト閉じるボタン
	 */
	_addLogTextCloseClickEvent(logTextCloseBtn){
		logTextCloseBtn.click((evt)=>{
			this.logTextW.hide();
		});
	}
	
	/**
	 * CSV読込スレッドのコールバック関数
	 * @param object param
	 */
	threadCsvRead(res){
		var param = res.data;

		// 終了フラグがONならスレッドを停止
		if(param.end_flg == true){
			let reg_count = param.reg_count; // 登録件数
			if(param.err_count == 0){
				// 入力エラーが0件である場合
				let msg = `${reg_count}件登録しました。CSV読込処理は、すべて終了しました。「リロード」ボタンを押して一覧を更新してください。`;
				this._showMsg(msg);
				
				this.reloadBtn.show(); // リロードボタンを表示
			}else{
				// 入力エラーが1件以上である場合
				let msg = `${reg_count}件登録しましたが入力エラーのため登録できないデータもありました。`;
				this._showMsg('');
				this._showErr(msg);
				this.logW.show();
				
				// 一括削除オブジェクトが空であるなら削除ボタンを空にする
				if(this.coms.bulkDelete == null){
					this.delBtn.hide();
				}
			}
			this.reqBatchSmp.advanceProg(100); // 進捗バーを100%にする
			this.reqBatchSmp.stopThread();
			
			return;
		}
		
		// 進捗率算出
		let prog_rate = Math.round(param.offset / param.fsize * 1000) / 10; // 進捗率から小数点を切り捨て）
		this.reqBatchSmp.advanceProg(prog_rate); // 進捗バーを進める
		
		this.succMsg.html('CSV読込中です... ' + prog_rate + '%');
		console.log('progress: ' + param.offset + '/' + param.fsize);
		
		param.req_batch_count ++; // リクエストバッチ回数をカウント
		
		this.logErrCount.html(param.err_count); // エラー件数をセット
		
		this.param = param;
	}
	
	
	/**
	 * ログ関連のセット
	 * @param object param
	 */
	_setErrLogs(param){

		
		// ログファイルパスをダウンロード要素にセット。その際、拡張子がlogだとセキュリティが働くのでtxtに変更する。
		let txt_fp = param.err_log_fp;
		
		txt_fp = txt_fp.substr(0, txt_fp.length-3); // 末尾の3文字である「log」を除去する。
		txt_fp += 'txt'; // 拡張子であるtxtを付け足す。
		this.logDl.attr('href', param.err_log_fp);
		this.logDl.attr('download', txt_fp);

	}
	
	
	/**
	 * エラーを表示
	 * @param string err_msg エラーメッセージ
	 */
	_showErr(err_msg){
		this.errDiv.append(err_msg + '<br>');
	}
	
	
	/**
	 * メッセージを表示する
	 * @param string msg メッセージ
	 */
	_showMsg(msg){
		this.succMsg.html(msg);
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
	
	
	/**
	 * 日付フォーマット変換
	 * @param mixed date1 日付
	 * @param string format フォーマット Y-m-d, Y/m/d h:i:s など
	 * @returns string 「yyyy-mm-dd」形式の日付文字列
	 */
	_dateFormat(date1, format){
		
		if(date1 == null) date1 = new Date().toLocaleString();
		if(format == null) format = 'Y-m-d';
		
		// 引数が文字列型であれば日付型に変換する
		if((typeof date1) == 'string'){
			date1 = new Date(date1);
			if(date1 == 'Invalid Date'){
				return null;
			}
		}
		
		var year = date1.getFullYear();
		
		var month = date1.getMonth() + 1;
		month = ("0" + month).slice(-2); // 2桁の文字列に変換する
		
		var day = date1.getDate();
		day = ("0" + day).slice(-2);
		
		var houre = date1.getHours();
		houre = ("0" + houre).slice(-2);
		
		var minute = date1.getMinutes();
		minute = ("0" + minute).slice(-2);
		
		var second = date1.getSeconds();
		second = ("0" + second).slice(-2); // 2桁の文字列に変換する
		
		var date_str = format;
		date_str = date_str.replace('Y', year);
		date_str = date_str.replace('m', month);
		date_str = date_str.replace('d', day);
		date_str = date_str.replace('h', houre);
		date_str = date_str.replace('i', minute);
		date_str = date_str.replace('s', second);
		
		//var date_str = year + '-' + month + '-' + day;
		return date_str;
	}
	
	
	/**
	 * データ中の「&」を「%26」に一括エスケープ
	 * @note
	 * PHPのJSONデコードでエラーになるので、＆記号を「%26」に変換する
	 * 
	 * @param mixed data エスケープ対象 :文字列、オブジェクト、配列を指定可
	 * @returns エスケープ後
	 */
	_ampTo26(data){
		if (typeof data == 'string'){
			if ( data.indexOf('&') != -1) {
				return data.replace(/&/g, '%26');
			}else{
				return data;
			}
		}else if (typeof data == 'object'){
			for(var i in data){
				data[i] = this._ampTo26(data[i]);
			}
			return data;
		}else{
			return data;
		}
	}
	
}