/**
 * リクエスト分散バッチ処理
 * 
 * @note リクエストを1件ずつ、実行するバッチ処理
 * 
 * @date 2019-4-23 | 2019-5-4
 * @version 1.1.3
 */
class ReqBatch{
	
	/**
	 * 初期化
	 * @param object param
	 *  - div_xid 当機能埋込先区分のid属性
	 *  - start_btn_xid スタートボタンのid属性
	 *  - ajax_url AJAX通信先URL
	 *  - asyn_cb 非同期コールバック
	 *  - interval インターバル(ミリ秒） デフォルト1000ms
	 *  - fail_limit 失敗限界数   失敗数が失敗限界数を超えると強制停止
	 *  - asyn_res_cb function 非同期処理レスポンスコールバック
	 *  - asyn_param 非同期コールバックに付加するパラメータ
	 *  - complete_cb 完了コールバック
	 */
	init(param){
		param = this._setParamIfEmpty(param);
		this.tDiv = jQuery('#' + param.div_xid); //  This division
		this.startBtn = jQuery('#' + param.start_btn_xid); //  バッチ処理・スタートボタン
		this.handlers = []; // スレッドのハンドラーリスト
		this.param = param;
		
	}
	
	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};
		
		if(param['div_xid'] == null) param['div_xid'] = 'req_batch_div';
		if(param['start_btn_xid'] == null) param['start_btn_xid'] = 'req_batch_start_btn';
		if(param['interval'] == null) param['interval'] = 1000;
		if(param['ajax_url'] == null && param['asyn_cb'] == null) throw new Error("Empty 'ajax_url' and 'asyn_cb' !");
		if(param['fail_limit'] == null) param['fail_limit'] = 5;
		if(param['asyn_param'] == null) param['asyn_param'] = null;
		
		
		return param;
	}
	
	
	/**
	 * バッチ処理開始
	 * @param data 処理対象のデータ
	 */
	start(data){
		
		this.data = data;
		
		// 当機能のHTMLを作成および埋込
		var html = this._createHtml(); 
		this.tDiv.html(html);
		this.tDiv.show();
		
		// ▼機能や区分の要素を取得
		this.successDiv = this.tDiv.find('.req_batch_success'); // 成功メッセージ
		this.reloadBtn = this.tDiv.find('.req_batch_reload'); // リロードボタン
		this.errDiv = this.tDiv.find('.req_batch_err'); // 一般エラーメッセージ
		this.prog = this.tDiv.find('.req_batch_prog'); // 進捗バー
		this.stopBtn = this.tDiv.find('.req_batch_stop_btn'); // 停止ボタン
		this.failBtn = this.tDiv.find('.req_batch_fail_btn'); // 失敗表示ボタン
		this.consoleDiv = this.tDiv.find('.req_batch_console'); // コンソール区分
		this.cCountDiv = this.tDiv.find('.req_batch_c_count'); // 処理数
		this.cSuccessDiv = this.tDiv.find('.req_batch_c_success_count'); // 成功数
		this.cFailDiv = this.tDiv.find('.req_batch_c_fail_count'); // 失敗数
		this.cMemDiv = this.tDiv.find('.req_batch_c_mem'); // メモリ
		this.failDiv = this.tDiv.find('.req_batch_fail'); // 失敗区分
		

		this._addReloadClickEvent(this.reloadBtn); 	// リロードボタンクリックイベントを追加
		this._addStopClickEvent(this.stopBtn); 	// 停止ボタンクリックイベントを追加
		this._addFailBtnClickEvent(this.failBtn); // 失敗ボタンのクリックイベントを追加 
		this.mems = this._resetMemoryData(); 	// メモリデータをリセット
		this.prog.show(); // 進捗バーを表示
		this.prog.val(0);
		this.startBtn.hide(); // スタートボタンを隠す

		this.main_index = 0; // メインインデックス
		this.asyn_flg = 0; // 非同期処理フラグ 0:非同期処理終わり, 1:非同期処理の実行中
		this.data_num = this.data.length; // データ数
		this.success_count = 0; // 成功数
		this.fail_count = 0; // 失敗数

		this.ic_start_time = Math.floor($.now()); // 間隔制御・スタートタイム
		
		// ★ スレッド開始。スレッドにする関数と間隔（ミリ秒）を指定する。
		var h = setInterval(()=>{this.thread();}, this.param.interval); 
		this.handlers.push(h); // ハンドラをリストに追加
	}
	
	
	/**
	 * 当機能のHTMLを作成および埋込
	 * @return string 当機能のHTML
	 */
	_createHtml(){
		var html = `
	<div>
		<div class="req_batch_success text-success"></div>
		<input type="button" class="req_batch_reload btn btn-success btn-sm" value="リロード" style="display:none"> 
	</div>
	<div class="req_batch_err text-danger"></div>
	<div><progress class="req_batch_prog"  max="100" style="display:none">■</progress></div>
	<div class="btn-group">
		<input type="button" value="停止" class="req_batch_stop_btn btn btn-secondary btn-sm"/>
		<input type="button" value="失敗(0)" class="req_batch_fail_btn btn btn-secondary btn-sm"/>
	</div>
	<br>
	<div class="req_batch_console console">
		<div><span>処理数:</span><span class="req_batch_c_count"></span></div>
		<div><span>成功:</span><span class="req_batch_c_success_count">0</span></div>
		<div><span>失敗:</span><span class="req_batch_c_fail_count">0</span></div>
		<div style="width:100%;font-size:0.8em"><span>メモリチェック:</span><span class="req_batch_c_mem"></span></div>
	</div>
	<div class="req_batch_fail text-danger" style="display:none"></div>
		`;
		return html;
	}
	
	
	/**
	 * リロードボタンクリックイベントを追加
	 * @param jQuery reloadBtn リロードボタンの要素
	 */
	_addReloadClickEvent(reloadBtn){
		reloadBtn.click((evt)=>{
			location.reload(true); // ブラウザをリロード
		});
	}
	
	
	/**
	 * 停止ボタンクリックイベントを追加
	 * @param jQuery stopBtn 停止ボタンの要素
	 */
	_addStopClickEvent(stopBtn){
		stopBtn.click((evt)=>{
			this.stopThread(); // スレッド停止
			this.startBtn.show(); // スタートボタンを再表示
		});
	}
	
	
	/**
	 * 失敗ボタンクリックイベントを追加
	 * @param jQuery failBtn 失敗ボタンの要素
	 */
	_addFailBtnClickEvent(failBtn){
		failBtn.click((evt)=>{
			this.failDiv.toggle(300);
		});
	}

	
	/**
	 * スレッド | 定期的に呼び出される関数
	 */
	thread(){
		
		// 非同期処理が終わっている状態（非同期フラグ＝0）である場合
		if(this.asyn_flg == 0){
			this._showCCount(); // 処理数を表示
			this._advanceProg(); // 進捗バーを進める
			this.ic_start_time = Math.floor($.now()); // 間隔制御・スタートタイム  Interval control start time

			// すべての処理が終わったら、終了処理を行う
			if(this.data_num == this.main_index){
				this._endProcessing(); // 終了処理
				return;
			}
				
			this.asyn_flg = 1; // 非同期処理フラグを非同期処理中にする。
			
			// 外・非同期処理が設定されていれば実行
			if(this.param.asyn_cb){
				var ent = this.data[this.main_index];
				this.param.asyn_cb(this.main_index, ent, this.param.asyn_param); // 外・非同期処理
				
			}else{
				this._asynForInner(); // 内・非同期処理を実行
			}
			
			this.main_index ++; // メインインデックスを進める
			this._showMemory(); // メモリ情報を表示する
			
		}else{
			// 非同期処理がまだ終わっていないなら何もしない
		}

	}
	
	
	/**
	 * 処理数を表示
	 */
	_showCCount(){
		var msg = this.main_index + '/' + this.data_num;
		this.cCountDiv.html(msg);
	}
	
	
	/**
	 * 進捗バーを進める
	 */
	_advanceProg(){
		var v = (this.main_index / this.data_num) * 100;
		this.prog.val(v);
	}
	
	
	/**
	 * 終了処理
	 */
	_endProcessing(){
		this.prog.hide(); // 進捗バーを隠す
		this.successDiv.html('すべての処理が終わりました。');
		this._showCCount(); // 処理数を表示
		this.stopThread(); // スレッドを停止する
		this.reloadBtn.show(); // リロードボタンを表示する
		
		// 完了コールバックの呼び出し
		if(this.param.complete_cb){
			this.param.complete_cb();
		}
		
	}
	
	
	/**
	 * 内・非同期処理を開始
	 */
	_asynForInner(){
		
		var ent = this.data[this.main_index];
		var sendData = ent;
		var send_json = JSON.stringify(sendData);//データをJSON文字列にする。

		// AJAX
		jQuery.ajax({
			type: "POST",
			url: this.param.ajax_url,
			data: "key1=" + send_json,
			cache: false,
			dataType: "text",
		})
		.done((res_json, type) => {
			var res;
			try{
				res =jQuery.parseJSON(res_json);//パース

			}catch(e){
				this.asynFail(res_json); // 非同期処理・失敗
				return;
				
			}
			
			this.asynSuccess(res); // 非同期処理・成功

		})
		.fail((jqXHR, statusText, errorThrown) => {
			this.errDiv.html(jqXHR.responseText);
			alert(statusText);
		});
		
	}
	
	
	/**
	 * 非同期処理・失敗
	 * @param string res_json レスポンス・JSON
	 */
	asynFail(res_json){
		this.asyn_flg = 0; // 非同期処理を終了にする
		this._addFail(this.main_index, res_json); // 失敗情報を追加
		this._showFailCount(); // 失敗数のカウントと表示
		this._checkFailLimit(); // 失敗数が失敗限界数を超えたら強制停止
	}
	
	
	/**
	 * 非同期処理・成功
	 */
	asynSuccess(res){
		// 非同期処理レスポンスコールバック
		if(this.param.asyn_res_cb){
			var index = this.main_index - 1;
			this.param.asyn_res_cb(index , res);
		}

		this._successCountAndShow(); // 成功数えと表示
		this.asyn_flg = 0; // 非同期処理を終了にする
	}
	
	
	/**
	 * 成功数えと表示
	 */
	_successCountAndShow(){
		// 成功数を加算し、成功要素へセットして表示する
		this.success_count ++;
		this.cSuccessDiv.html(this.success_count);
		
	}
	
	
	/**
	 * 失敗情報を失敗区分に追加
	 * @param string fail_text 失敗テキスト
	 */
	_addFail(main_index, fail_text){
		var html = `
			<div style="display:inline-block">
				<input type="button" class="btn btn-secondary btn-sm" value="失敗 ${main_index}" onclick="jQuery('#req_batch_fail${main_index}').toggle(300)">
				<div id="req_batch_fail${main_index}" style="display:none">${fail_text}</div>
			</div>
		`;
		
		this.failDiv.append(html);
	}
	
	
	/**
	 * 失敗数のカウントと表示
	 */
	_showFailCount(){
		this.fail_count ++;
		this.cFailDiv.html(this.fail_count);
		
		// 失敗ボタン名の失敗カウントを更新
		var btn_name = "失敗(" + this.fail_count + ")";
		this.failBtn.attr('value', btn_name);
	}
	
	
	/**
	 * 失敗数が失敗限界数を超えたら強制停止
	 */
	_checkFailLimit(){
		if(this.fail_count > this.param.fail_limit){
			this.stopThread();
			var err_msg = `失敗数が${this.param.fail_limit}回を超えたので処理を中断します。`;
			this.errDiv.html(err_msg);
		}
	}
	
	
	/**
	 * スレッドを停止する。
	 */
	stopThread(){
		for(var i in this.handlers){
			var h = this.handlers[i];
			clearInterval(h); // スレッド停止
		}
	}
	
	
	/**
	 * メモリ情報を表示する
	 */
	_showMemory(){
		
		if(this.mems == null) return;

		var memory = performance.memory;
		
		//		var m1 = memory.jsHeapSizeLimit - this.mems.jsHeapSizeLimit1;
		//		var m2 = memory.totalJSHeapSize - this.mems.totalJSHeapSize1;
		var m3 = memory.usedJSHeapSize - this.mems.usedJSHeapSize1;
		
		this.cMemDiv.html(m3);
		
	}
	
	
	/**
	 * メモリデータのリセット
	 * @note Chrome系のみ対応
	 */
	_resetMemoryData(){
		var memory = performance.memory;
		if(memory==null) return null;
		
		var mems = {
			'jsHeapSizeLimit1':memory['jsHeapSizeLimit'],
			'totalJSHeapSize1':memory['totalJSHeapSize'],
			'usedJSHeapSize1':memory['usedJSHeapSize'],
		}
		
		return mems;
	}
	
}











