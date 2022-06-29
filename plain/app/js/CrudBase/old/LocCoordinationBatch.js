/**
 * 施設と求人の場所まとめバッチ
 * 
 * @note
 * ReqBatchSmp.js(リクエスト分散バッチ処理【シンプル版】)に依存
 * 
 * @date 2019-5-31
 * @version 1.0.0
 */
class LocCoordinationBatch{
	
	/**
	 * 初期化
	 * 
	 * @param param
	 * - div_xid 当機能埋込先区分のid属性
	 */
	init(param){
		
		this.param = this._setParamIfEmpty(param);
		this.tDiv = jQuery('#' + this.param.div_xid); //  This division
		
		// 当機能のHTMLを作成および埋込
		let html = this._createHtml(); 
		this.tDiv.html(html);
		
		this.fShowBtn = this.tDiv.find('.lcb_f_show_btn'); // 機能表示ボタン要素
		this.funcDiv = this.tDiv.find('.lcb_func_div'); // 機能区分
		this.resDiv = this.tDiv.find('.lcb_res'); // 結果区分
		this.reloadBtn = this.tDiv.find('.lcb_reload_btn'); // リロードボタン
		this.errDiv = this.tDiv.find('.lcb_err'); // エラー区分
		
		this._addClickFShowBtn(this.fShowBtn); // 機能表示ボタンのクリックイベント
		this._addReloadBtnClickEvent(this.reloadBtn); // リロードボタンにクリックイベントを組み込む
		
		// スレッドコールバック関数
		var thread_cb = this.thread.bind(this);
		
		// リクエスト分散バッチ処理【シンプル版】
		this.reqBatchSmp = new ReqBatchSmp();
		this.reqBatchSmp.init({
			div_xid:'lcb_req_batch',
			data:this.param,
			ajax_url:this.param.ajax_url,
			fail_limit:0, // 失敗制限数
			prog_flg:false, // 進捗バーフラグ true:自動進捗（デフォ）, false:手動進捗
		},{
			thread_cb:thread_cb, // CSV読込スレッドのコールバック関数
		});
		
		this.reqBatchSmp.startBtn.val('バッチ処理開始');
	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};

		if(param['div_xid'] == null) param['div_xid'] = 'loc_coordination_batch';
		if(param['ajax_url'] == null) param['ajax_url'] = 'job/loc_coordination_batch';
		
		if(param['update_a'] == null) param['update_a'] = new Date().toLocaleString(); // 統一更新日時  %3
		if(param['status'] == null) param['status'] = 'init'; // 処理ステータス  %3
		if(param['prog_v'] == null) param['prog_v'] = 0; // 進捗値  %3
		if(param['prog_max'] == null) param['prog_max'] = 0; // 最大進捗値  %3
		if(param['count_a'] == null) param['count_a'] = 100; // 処理数A   １リクエストで一度に行う処理数
		
		return param;
	}
	
	
	/**
	 * 当機能のHTMLを作成および埋込
	 */
	_createHtml(){
		let html = `
	<input class='lcb_f_show_btn btn btn-default btn-xs' type="button" value='施設と求人の場所まとめバッチ' />
	<div class='lcb_func_div' style="display:none">
		<div style="display:inline-block;padding:10px;border:solid 4px #5bd59e;border-radius:5px;margin-bottom:10px">
			<div>施設と求人の場所を関連づけます。</div>
			<div class="lcb_res text-success"></div>
			<input type="button" class="lcb_reload_btn btn btn-primary" value="リロード" style="display:none">
			<div id="lcb_req_batch"></div>
			<div class="lcb_err text-danger"></div>
		</div>
	</div>
		`;
		return html;
	}
	
	
	/**
	 * エラーを表示
	 * @param string err_msg エラーメッセージ
	 */
	_showErr(err_msg){
		this.errDiv.append(err_msg + '<br>');
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
	 * リロードボタンにクリックイベントを組み込む
	 * @param jQuery reloadBtn リロードボタン
	 */
	_addReloadBtnClickEvent(reloadBtn){
		reloadBtn.click((evt)=>{
			location.reload(true);
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
	 * スレッド
	 */
	thread(res){
		this.param = res.data;
		let status = this.param.status;
		let prog_msg = '';
		
		switch(status){
		case 'init': // 初期
			this.resDiv.html('バッチ処理を実行中...');
			console.log('場所テーブルを一旦、初期化しています...');
			this.param.status = 'fac_init';
			break;
			
		case 'fac_init': // 施設・場所まとめ・初期化
			console.log('施設と場所を関連開始');
			this.param.status = 'fac_continu';
			break;
			
		case 'fac_continu': // 施設・場所まとめ・継続
			prog_msg = this.param.prog_v + '/' + this.param.prog_max;
			console.log('施設と場所を関連づけています...' + prog_msg);
			var rete = this.param.prog_v / this.param.prog_max * 100;
			this.reqBatchSmp.advanceProg(rete);
			break;
			
		case 'fac_end': // 施設・場所まとめ・終了
			console.log('施設と場所を関連づけ完了');
			this.param.status = 'job_init';
			break;
			
		case 'job_init': // 求人・場所まとめ・初期化
			console.log('続いて、求人と場所を関連づけ開始');
			this.param.status = 'job_continu';
			break;
			
		case 'job_continu': // 求人・場所まとめ・継続
			prog_msg = this.param.prog_v + '/' + this.param.prog_max;
			console.log('求人と場所を関連づけています...' + prog_msg);
			var rete = this.param.prog_v / this.param.prog_max * 100;
			this.reqBatchSmp.advanceProg(rete);
			break;
			
		case 'end': // 終了
			console.log('すべて終了しました。');
			this.resDiv.html('すべて終了しました。「リロード」ボタンを押して一覧を更新してください。');
			this.reqBatchSmp.stopThread();
			this.reloadBtn.show(); // リロードボタンを表示
			this.reqBatchSmp.advanceProg(100);
			break;
		}
		
		
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