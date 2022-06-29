/**
 * 大型CSVエクスポート
 * 
 * @note
 * ReqBatchSmp.jsに依存
 * 
 * @date 2019-6-24 | 2019-8-15
 * @version 1.0.1
 * 
 */
class CsvExportBig{
	
	/**
	 * 初期化
	 * @param object param
	 *  - div_xid 当機能埋込先区分のid属性
	 *  - csv_fn CSVファイル名
	 *  - work_dp 作業ディレクトリパス
	 *  - tbl_name テーブル名 (データカウント用などに使用）
	 *  - csvFieldData CSVフィールドデータ
	 *  - csv_export_ajax_url CSVエクスポートAjaxURL
	 *  - batch_data_num 一括データ処理数
	 *  
	 *  @param object hooks フック群
	 *  - html_body1 HTMLボディ部1
	 *  - html_footer1 HTMLフッター部1
	 *  - startBtnCb1 スタートボタンクリック・コールバック1
	 */
	init(param, hooks){
		param = this._setParamIfEmpty(param);
		hooks = this._setHooksIfEmpty(hooks);

		this.tDiv = jQuery('#' + param.div_xid); //  This division
		
		// 当機能のHTMLを作成および埋込
		var html = this._createHtml(param, hooks); 
		this.tDiv.html(html);
		
		this.fShowBtn = this.tDiv.find('.csv_e_big_f_show_btn'); // 機能表示ボタン要素
		this.funcDiv = this.tDiv.find('.csv_e_big_func_div'); // 機能区分
		this.resDiv = this.tDiv.find('.csv_e_big_res'); // 結果区分
		this.errDiv = this.tDiv.find('.csv_e_big_err'); // エラー区分
		this.startBtn = this.tDiv.find('.csv_e_big_start_btn'); // スタートボタン要素
		this.reloadBtn = this.tDiv.find(".csv_e_big_reload_btn"); // リロードボタン
		this.dlBtns = this.tDiv.find(".csv_e_big_dl_btns"); // ダウンロードボタン群要素
		this.aCsvFp = this.tDiv.find(".csv_e_big_csv_fp"); // CSVダウンロードリンク要素
		this.aZipFp = this.tDiv.find(".csv_e_big_zip_fp"); // ZIPダウンロードリンク要素
		
		this._addClickFShowBtn(this.fShowBtn); // 機能表示ボタンのクリックイベント
		this._addStartBtnClickEvent(this.startBtn); // スタートボタンにクリックイベントを組み込む

		this.param = param;
		this.hooks = hooks;
	}
	
	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};
		if(param['div_xid'] == null) param['div_xid'] = 'csv_export_big';
		if(param['csv_fn'] == null) param['csv_fn'] = 'backup.csv';
		if(param['def_csv_fn'] == null) param['def_csv_fn'] = param.csv_fn;
		if(param['work_dp'] == null) param['work_dp'] = 'tmp/';
		if(param['tbl_name'] == null)  throw new Error("'tbl_name' is empty!");
		if(param['csv_export_ajax_url'] == null) throw new Error("'csv_export_ajax_url' is empty!");
		if(param['status'] == null) param['status'] = 'init'; // ステータス init:初期状態, continu:継続状態, end:終了状態
		if(param['batch_data_num'] == null) param['batch_data_num'] = 1000; // 一度に処理する行数
		if(param['offset'] == null) param['offset'] = 0;
		if(param['req_batch_count'] == null) param['req_batch_count'] = 0; // リクエストバッチ回数
		if(param['tooltip'] == null) param['tooltip'] = '大型CSVエクスポート'; // ツールチップ
		
		return param;
	}
	
	
	/**
	 * If Hooks property is empty, set a value.
	 */
	_setHooksIfEmpty(hooks){
		
		if(hooks == null) hooks = {};
		if(hooks['html_body1'] == null) hooks['html_body1'] = ''; // HTMLボディ部1
		if(hooks['html_footer1'] == null) hooks['html_footer1'] = ''; // HTMLフッター部1
		
		return hooks;
	}
	
	
	/**
	 * 当機能のHTMLを作成および埋込
	 * @param object param
	 * @param object hooks フック群
	 * @return string HTML文字列
	 */
	_createHtml(param, hooks){
		
		let html = `
	<input type="button" class="csv_e_big_f_show_btn btn btn-secondary btn-xs"  value="CSVエクスポート" title="${param.tooltip}">
	<div class='csv_e_big_func_div' style="display:none">
		<div style="display:inline-block;padding:10px;border:solid 4px #5bd59e;border-radius:5px;margin-bottom:10px">
			<p>大型CSVエクスポート</p>
			${hooks.html_body1}
			<input class="csv_e_big_start_btn btn btn-success" type='button' value="スタート" />
			<div class="csv_e_big_res text-success"></div>
			<div class="csv_e_big_err text-danger"></div>
			<div class="csv_e_big_dl_btns" style="display:none">
				<a class="csv_e_big_csv_fp btn btn-warning btn-xs" href="" download>CSVダウンロード<a>
				<a class="csv_e_big_zip_fp btn btn-warning btn-xs" href="" download>ZIPダウンロード<a>
			</div>
			<div id="csv_e_big_req_batch"></div>
			<div id="csv_e_big_err" class="text-danger"></div>
			${hooks.html_footer1}
		</div>
	</div>
		`;
		return html;
	}
	
	
	/**
	 * 機能表示ボタンのクリックイベント
	 * @param jQuery fShowBtn 機能表示ボタン
	 */
	_addClickFShowBtn(fShowBtn){
		
		fShowBtn.click((evt)=>{
			var d = this.funcDiv.css('display');
			if(d==null | d=='none'){
				let f_show_btn_name = this._getFShowBtnName(0);
				this.fShowBtn.val(f_show_btn_name);
				this.tDiv.css('display','block');
				this.funcDiv.show(300);
				
			}else{
				let f_show_btn_name = this._getFShowBtnName(1);
				this.fShowBtn.val(f_show_btn_name);
				this.tDiv.css('display','inline-block');
				this.funcDiv.hide(300);
				
			}

		});
	}
	
	
	/**
	 * 機能表示ボタン名に「閉じる」の文字を付け足したり、削ったりする。
	 * @param string show_flg 表示フラグ 0:閉, 1:表示
	 * @return string 機能表示ボタン名
	 */
	_getFShowBtnName(show_flg){
		let close_name = ' (閉じる)';
		let btn_name = this.fShowBtn.val();
		if(show_flg == 1){
			btn_name = btn_name.replace(close_name, '');
		}else{
			btn_name += close_name;
		}
		return btn_name;
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
	 * スタートボタンにクリックイベントを組み込む
	 * @param jQuery startBtn CSVエクスポートボタン
	 */
	_addStartBtnClickEvent(startBtn){
		startBtn.click((evt)=>{
			this._startBtnClickEvent(); // スタートボタンクリックイベント
		});
	}
	
	
	/**
	 * スタートボタンクリックイベント
	 */
	_startBtnClickEvent(){

		let param = this.param;
		
		// スタートボタンクリック・コールバック1
		if(this.hooks.startBtnCb1 != null){
			param = this.hooks.startBtnCb1(this.tDiv, param);
		}

		// CSVエクスポートスレッドのコールバック関数
		let thread_cb = this.threadCsvExport.bind(this);

		// リクエスト分散バッチ処理【シンプル版】
		this.reqBatchSmp = new ReqBatchSmp();
		this.reqBatchSmp.init({
			div_xid:'csv_e_big_req_batch',
			data:param,
			ajax_url:this.param.csv_export_ajax_url,
			fail_limit:0, // 失敗制限数
			prog_flg:false, // 進捗バーフラグ true:自動進捗（デフォ）, false:手動進捗
			start_btn_flg:false
		},{
			thread_cb:thread_cb, // CSVエクスポートスレッドのコールバック関数
		});

		param['offset'] = 0; // 大型CSVエクスポートオフセット
		param['req_batch_count'] = 0; // リクエストバッチ回数
		
		this.reqBatchSmp.start(); // バッチ処理開始

		this.param = param;
		
	}
	
	
	// ユニークキーをセットする
	_getUniqueStr(){
		let str_time = new Date().getTime().toString(16);
		let unique_key = 'sdr' + str_time;
		return unique_key;
	}
	
	
	/**
	 * CSVエクスポートスレッドのコールバック関数
	 * @param object param
	 */
	threadCsvExport(res){
		let param = res.data;
		
		// 進捗バーをすすめる
		let prog_rate = 0;
		if(param.data_count > 0){
			prog_rate = param.offset / param.data_count * 100; // 進捗率を算出
		}
		
		this.reqBatchSmp.advanceProg(prog_rate); // 進捗バーを進める
		console.log(prog_rate);
		
		let status = param.status;
		
		// メッセージを表示
		let msg = '';
		if(status == 'init'){
			msg = "エクスポート処理を開始します。";
		}else if(status == 'continu'){
			let prog_rate2 = Math.round(prog_rate * 10) / 10;
			msg = "処理中です..." + prog_rate2 + "%";
			
			// データが0件である場合、メッセージを表示して中断する。
			if(param.data_count == 0){
				msg = "データ件数は0件です。";
				this.reqBatchSmp.stopThread();
			}
			
		}else if(status=='zip'){
			msg = "ZIP圧縮中です...";
		
		}else if(status=='end'){
			this._showDonloadLink(param); // ダウンロードリンク群を表示、おようびパスセット
			msg = "処理が終わりました。下記のリンクからダウンロードできます。";
			this.reqBatchSmp.stopThread();
			
		}else{
			msg = "エラー:CSVエクスポートを停止しました。";
			console.log(msg);
			this.reqBatchSmp.stopThread();
			
		}
		this.resDiv.html(msg);

		this.param = param;
	}
	
	
	/**
	 * ダウンロードリンク群を表示、おようびパスセット
	 * @param object param 
	 */
	_showDonloadLink(param){

		this.dlBtns.show();
		this.aCsvFp.attr('href', param.csv_fp);
		this.aZipFp.attr('href', param.zip_fp);
		
		// パラメータを初期状態に戻す
		param.status = 'init';
		param.offset = 0;
		
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