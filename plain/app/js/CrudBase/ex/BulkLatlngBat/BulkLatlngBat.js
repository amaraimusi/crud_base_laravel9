/**
 * 一括緯度経度取得機能
 * 
 * @note
 * 
 * ▼ 下記のモジュールが必要
 * - BulkLatlngBatY.js
 * - BulkLatlngBatG.js
 * - ReqBatch.js
 * 
 * @date 2019-5-24 | 2019-5-29
 * @version 1.1.0
 * @license MIT
 */
class BulkLatlngBat{
	
	
	/**
	 * 初期化
	 * 
	 * @param param
	 * - div_xid トップ要素のid属性名
	 * - paramY Yahoo版のパラメータ
	 *     - req_batch_ajax_url リクエスト分散バッチ用のAjax URL
	 *     - get_data_ajax_url データ取得用のAjax URL
	 *     - interval スレッド間隔
	 *     - fail_limit 失敗制限
	 * - paramG Google版のパラメータ
	 *     - get_data_ajax_url データ取得用のAjax URL
	 *     - save_ajax_url 保存Ajax URL
	 *     - interval スレッド間隔
	 *     - fail_limit 失敗制限
	 */
	init(param){

		param = this._setParamIfEmpty(param);

		this.tDiv = jQuery('#' + param.div_xid); // トップ要素
		
		var html = this._buildHtml(); // HTMLを組み立てる
		this.tDiv.html(html);
		
		this.startBtnY = this.tDiv.find('#bllby_start_btn'); // Yahoo版スタートボタン
		this.showChkG = this.tDiv.find('#bllbg_show_check'); // Google版機能表示チェックボックス
		this.startBtnG = this.tDiv.find('#bllbg_start'); // Google版スタートボタン
		
		
		// 一括緯度経度取得・バッチ処理 | ReqBatch.js | リクエストを1件ずつ、実行するバッチ処理 | Yahoo API版
		this.bulkLatlngBatY = new BulkLatlngBatY();
		this.bulkLatlngBatY.init(param.paramY, this.tDiv);
		
		// 一括緯度経度取得・バッチ処理 Google API版
		this.bulkLatlngBatG = new BulkLatlngBatG();
		this.bulkLatlngBatG.init(param.paramG);
		
		this._addClickStartBtnY(this.startBtnY);// Yahoo版スタートボタンにクリックイベントを追加
		this._addClickShowChkG(this.showChkG);// Google版機能表示チェックボックスにクリックイベントを追加
		this._addClickStartBtnG(this.startBtnG);// Google版スタートボタンにクリックイベントを追加
		
		this.param = param;
	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};
		if(param['div_xid'] == null) param['div_xid'] = 'bulk_latlng_bat';
		if(param['paramY'] == null) throw new Error("'paramY' is empty!");
		if(param['paramG'] == null) throw new Error("'paramY' is emptG!");
		
		
		return param;
	}
	
	
	/**
	 * HTMLを組み立てる
	 */
	_buildHtml(){
		let html = `
	<button type="button" onclick="$('#bulk_latlng_bat_w').toggle(300);" class="btn btn-secondary btn-xs" title="一括緯度経度取得・バッチ処理   緯度経度が空の求人データに対し、住所から緯度経度を取得する">
		一括緯度経度</button>
	<div id="bulk_latlng_bat_w" style="min-width:500px;border:solid 3px #207144;padding:15px;display:none">
		<div id="bllby_w"><!-- Yahoo API版 -->
			<strong>一括緯度経度取得・バッチ処理</strong> 
			<input type="button" value="閉" class="btn btn-secondary btn-xs" onclick="jQuery('#bulk_latlng_bat_w').hide();" /><br>
			<input type="button" id="bllby_start_btn" value="バッチ処理開始" class="btn btn-success" title="YahooのAPIを利用して緯度経度が未設定のデータに緯度経度をセットしていきます。&#13;一度に処理できる件数は最大20000件です。" />
			<div id="blly_res" class="text-success" style="display:none"></div>
			<div id="bulk_latlng_bat_y" class="console" style="display:none"></div>
		</div>
		
		<!-- Google API版 -->
		<label for="bllbg_show_check" style="font-weight:normal">
			<input id="bllbg_show_check" type="checkbox"  >
			Google版の一括緯度経度取得機能を表示する。
		</label>
		<div id="bllbg_now_loding" class="text-primary" style="display:none">Now loding ...</div>
		<div id="bllbg_w" style="display:none;background-color:#dfebfd;padding:10px;border-radius:5px;">
			一括緯度経度取得・バッチ処理 <strong>Google版</strong>
			<div class="text-danger">
				一組の緯度経度を1回取得するごとに$0.006の利用料金が発生します。<br>
				月$200までの無料枠がありますが、他のサービスの利用料金を含めた無料枠になります。<br>
			</div>
			
			<div class="row" style="margin-top:5px;display:none">
				<div class="col-md-2">今月の利用回数: <span id="bllbg_used_count" title="住所から緯度経度を取得した回数。今月分のみ。一回ごとに$0.006の利用料金が発生。目安となる回数も併記する。">999999</span></div>
				<div class="col-md-2">今月の推定利用料金: $<span id="bllbg_used_fee" title="今月分の推定料金">0</span></div>
				<div class="col-md-8"></div>
			</div>
			<div>緯度経度・未設定件数: <span id="bllbg_data_count" title="緯度または経度が0や空であるデータの件数" style="font-weight:bold">100000</span>件</div>
			<div class="row" style="margin-top:5px;">
				<div class="col-md-12">
					実行数: <input id="bllbg_exe_count" type="number" value="100" min="0" max="100" step="1" style="width:6em" title="実行するデータ数">
					推定料金: $<span id="bllbg_fee">9999</span>
					<input id="bllbg_start" type="button" value="バッチ処理開始" class="btn btn-danger btn-xs" title="Google版・一括緯度経度取得処理を開始する">
				</div>
			</div>
			<div id="bllbg_bat" class="console" style="display:none"></div>
		</div>
	</div>
		`;
		
		return html;
	}
	
	
	/**
	 * Yahoo版スタートボタンにクリックイベントを追加
	 * @param jQuery startBtnY Yahoo版スタートボタン
	 */
	_addClickStartBtnY(startBtnY){
		startBtnY.click((evt)=>{
			this.startBtnY.hide();
			this.bulkLatlngBatY.start();
		});
	}
	
	
	/**
	 * Google版機能表示チェックボックスにクリックイベントを追加
	 * @param jQuery showChkG Google版機能表示チェックボックス
	 */
	_addClickShowChkG(showChkG){
		showChkG.click((evt)=>{
			var cb = jQuery(evt.currentTarget);
			this.bulkLatlngBatG.openAndGetData(cb);
		});
	}
	
	
	/**
	 * Google版スタートボタンにクリックイベントを追加
	 * @param jQuery startBtnG Google版スタートボタン
	 */
	_addClickStartBtnG(startBtnG){
		startBtnG.click((evt)=>{
			this.startBtnG.hide();
			this.bulkLatlngBatG.start();
		});
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