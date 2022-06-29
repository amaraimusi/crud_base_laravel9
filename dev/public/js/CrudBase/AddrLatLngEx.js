/**
 * 住所緯度経度・編集機能【拡張】 | AddrLatLngのラッパークラス 
 * 
 * @note
 * Yahoo ジオコーダに対応
 * 
 * @date 2019-8-2 | 2019-8-16
 * @license MIT
 * @version 1.0.1
 */
class AddrLatLngEx{
	

	/**
	 * 初期化
	 * 
	 * @param object param
	 * - div_xid 当機能埋込先区分のid属性
	 * - wrap_slt ラッパー要素のセレクタ
	 * - map_slt 地図要素のセレクタ
	 * - address_tb_slt 住所テキストボックスのセレクタ
	 * - lat_tb_slt 緯度テキストボックスのセレクタ
	 * - lng_tb_slt 経度的巣tボックスのセレクタ
	 * - err_slt エラー要素のセレクタ
	 * - zoom Mapsの初期ズーム
	 * - ajax_url_y_auto_set Yahoo版住所取得URL
	 * - address_field 住所フィールド
	 */
	init(param){
		
		this.param = this._setParamIfEmpty(param);
		this.tDiv = jQuery('#' + this.param.div_xid); //  This division
		
		// 当機能のHTMLを作成および埋込
		let html = this._createHtml(this.param); 
		this.tDiv.html(html);
		
		// 住所緯度経度・編集機能
		this.addrLatLng = new AddrLatLng(this.param);
		
		this.fShowBtn = this.tDiv.find('.allex_f_show_btn'); // 機能表示ボタン要素
		this.funcDiv = this.tDiv.find('.allex_func_div'); // 機能区分
		this.resDiv = this.tDiv.find('.allex_res'); // 結果区分
		this.errDiv = this.tDiv.find('.allex_err'); // エラー区分
		
		this.yAutoSetBtn = this.tDiv.find('.allex_y_auto_set_btn'); // Yahoo版住所自動設定ボタン
		this.byGApiBtn = this.tDiv.find('.allex_by_g_api_btn'); // Google APIモード表示ボタン
		this.gApiDiv = this.tDiv.find('.allex_g_api_div'); // Google API区分
		this.showMapBtn = this.tDiv.find('.allex_show_map_btn'); // 地図表示アクションボタン
		this.autoSetBtn = this.tDiv.find('.allex_auto_set_btn'); // 住所自動設定ボタン
		this.mapWrap = this.tDiv.find('.allex_map_w'); // 地図ラッパー区分
		this.mapCloseBtn = this.tDiv.find('.allex_map_close_btn'); // 地図閉じるボタン
		
		this.addrElm = this.tDiv.find(param.address_tb_slt); // 住所テキストボックス
		this.latElm = this.tDiv.find(param.lat_tb_slt); // 緯度テキストボックス
		this.lngElm = this.tDiv.find(param.lng_tb_slt); // 経度テキストボックス
		
		this._addClickYAutoSetBtn(this.yAutoSetBtn); // Yahoo版住所自動設定ボタンのクリックイベント
		this._addClickByGApiBtn(this.byGApiBtn); // Google APIモード表示ボタンのクリックイベント
		this._addClickFShowBtn(this.fShowBtn); // 機能表示ボタンのクリックイベント
		this._addClickShowMapBtn(this.showMapBtn); // 地図表示アクションボタンのクリックイベント
		this._addClickAutoSetBtn(this.autoSetBtn); // 住所自動設定ボタンのクリックイベント
		this._addClickMapCloseBtn(this.mapCloseBtn); // 地図閉じるボタンのクリックイベント
		
		
	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};

		if(param['div_xid'] == null) param['div_xid'] = 'addr_lat_lng_ex';
		if(param['wrap_slt'] == null) param['wrap_slt'] = '.allex_map_w';// ラッパー要素セレクタ
		if(param['map_slt'] == null) param['map_slt'] = '.allex_map';

		if(param['address_tb_slt'] == null) param['address_tb_slt'] = '.allex_address';
		if(param['lat_tb_slt'] == null) param['lat_tb_slt'] = '.allex_lat';
		if(param['lng_tb_slt'] == null) param['lng_tb_slt'] = '.allex_lng';
		if(param['err_slt'] == null) param['err_slt'] = '.allex_err';

		if(param['ajax_url_y_auto_set'] == null) throw "'ajax_url_y_auto_set' is empty!";
		if(param['address_field'] == null) param['address_field'] = 'address';
		

		return param;
	}
	
	
	/**
	 * 当機能のHTMLを作成および埋込
	 * @param object param
	 */
	_createHtml(param){
		
		let html = `
		<input class='allex_f_show_btn btn btn-primary btn-sm' type="button" value='住所緯度経度・編集' />
		<div class='allex_func_div' style="display:none">
			<div style="width:100%">
				住所: <input type="text" name="${param.address_field}" class="allex_address valid" value=""  maxlength="200" title="200文字以内で入力してください" style="width:100%;" />
				<label class="text-danger" for="${param.address_field}"></label>
			</div>
			<div class='cbf_input' style="margin-right:8px">
				緯度: <input type="text" name="lat" class="allex_lat valid" value=""  pattern="[+-]?[0-9]+[\.]?[0-9]*([eE][+-])?[0-9]*" maxlength="64" title="数値を入力してください" />
				<label class="text-danger" for="lat"></label>
			</div>
			<div class='cbf_input' style="margin-right:8px">
				経度: <input type="text" name="lng" class="allex_lng valid" value=""  pattern="[+-]?[0-9]+[\.]?[0-9]*([eE][+-])?[0-9]*" maxlength="64" title="数値を入力してください" />
				<label class="text-danger" for="lng"></label>
			</div>
			
			<input type="button" class="allex_y_auto_set_btn btn btn-success btn-sm" value="緯度経度取得【Yahoo版】" title="Yahoo APIを利用して住所から緯度経度を取得します。無料機能ですが失敗率は高めです。" />
			<input type="button" class="allex_by_g_api_btn btn btn-info btn-sm" value="Google APIモード" title="Google APIによる緯度経度取得機能を表示します。" />
			<div class="allex_g_api_div" style="display:none;padding:15px;border:solid 3px #FF7373;border-radius:5px;background-color:#FFEEEE">
				<div class='cbf_input' style="margin-right:8px">
					<input type="button" class="allex_auto_set_btn btn btn-danger btn-sm" value="緯度経度設定【Google版】" title="Google APIを利用して住所から緯度経度を取得します。ボタンを押すごとに$0.005の利用料金が発生します。（無料枠あり。2019年時点）" />
					<input type="button" class="allex_show_map_btn btn btn-primary btn-sm" value="地図から設定" title="地図上をクリックして緯度経度の設定ができます。" />
				</div>
			
				<div class="allex_map_w" style="display:none;">
					<input type="button" class="allex_map_close_btn btn btn-secondary btn-sm" value="閉じる" title="地図閉じるボタン" />
					<div class="allex_map" style="width:100%;height:400px;"></div>
				</div>
			</div>
			
			<div class="allex_err text-danger" style="color:red"></div>
			<div class="allex_res text-success"></div>
			
		</div>
		`;

		return html;
	}
	
	
	/**
	 * メッセージを表示
	 * @param string err_msg エラーメッセージ
	 */
	_showMsg(msg){
		this.resDiv.html(msg);
	}
	
	
	/**
	 * エラーを表示
	 * @param string err_msg エラーメッセージ
	 */
	_showErr(err_msg){
		this.errDiv.html(err_msg + '<br>');
	}
	
	
	/**
	 * 機能表示ボタンのクリックイベント
	 * @param jQuery btn 機能表示ボタン
	 */
	_addClickFShowBtn(btn){
		
		btn.click((evt)=>{
			
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
	 * Yahoo版住所自動設定ボタンのクリックイベント
	 * @param jQuery btn Yahoo版住所自動設定ボタン
	 */
	_addClickYAutoSetBtn(btn){
		
		btn.click((evt)=>{
			this.clickYAutoSetBtn(); // Yahoo版住所取得処理
		});
	}


	/**
	 * Google APIモード表示ボタンのクリックイベント
	 * @param jQuery btn Google APIモード表示ボタン
	 */
	_addClickByGApiBtn(btn){
		
		btn.click((evt)=>{
			this.gApiDiv.toggle(100);
		});
	}


	/**
	 * 地図表示アクションのクリックイベント
	 * @param jQuery btn 地図表示アクション
	 */
	_addClickShowMapBtn(btn){
		btn.click((evt)=>{
			this.addrLatLngShowMap(btn); // 住所緯度経度・編集機能 :地図表示アクション
		});
	}


	/**
	 * 住所自動設定のクリックイベント
	 * @param jQuery btn 住所自動設定
	 */
	_addClickAutoSetBtn(btn){
		btn.click((evt)=>{
			this.addrLatLngAutoSet(btn); // 住所緯度経度・編集機能 :住所から自動設定
		});
	}
	
	
	/**
	 * 住所緯度経度・編集機能 :地図表示アクション
	 */
	addrLatLngShowMap(btnElm){
		var btnElm = jQuery(btnElm);
		this.addrLatLng.addrLatLngShowMap(btnElm);
	}


	/**
	 * 住所緯度経度・編集機能 :住所から自動設定
	 * @param btnElm
	 */
	 addrLatLngAutoSet(btnElm){
		var btnElm = jQuery(btnElm);
		this.addrLatLng.addrLatLngAutoSet(btnElm);
		
	}


	/**
	 * 地図閉じるボタンのクリックイベント
	 * @param jQuery btn 地図閉じるボタン
	 */
	_addClickMapCloseBtn(btn){
		
		btn.click((evt)=>{
			this.mapWrap.hide(); // 地図ラッパー区分
			this.gApiDiv.hide(); // Google API区分
		});
	}


	/**
	 * 住所緯度経度・編集機能 :編集フォーム表示時に呼び出される
	 */
	addrLatLngEditShow(){
		this.addrLatLng.addrLatLngEditShow();
	}
	
	
	/**
	 * Yahoo版住所取得処理
	 */
	clickYAutoSetBtn(){
		
		this._showMsg('住所から緯度経度を取得中です...');
		
		// 住所を取得する
		let address = this.addrElm.val();
		address = address.trim();
		if(this._empty(address)){
			this._showErr('住所を入力してください。');
			return;
		}
		address = address.replace(/&/g, '%26'); // PHPのJSONデコードでエラーになるので、＆だけ変換しておく。
		
		// 送信データにセット
		let sendData={address:address};
		var send_json = JSON.stringify(sendData);//データをJSON文字列にする。

		// AJAX
		jQuery.ajax({
			type: "POST",
			url: this.param.ajax_url_y_auto_set,
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
			this._showMsg('');

			if(res.lat == 0 || res.lng == 0){
				this._showErr('入力の住所からは緯度経度は取得できませんでした。Google API版をお試しください。');
				return;
			}
			
			// 緯度と経度のテキストボックスに反映
			this.latElm.val(res.lat);
			this.lngElm.val(res.lng);
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			this._showMsg('');
			this._showErr(jqXHR.responseText);
			alert(statusText);
		});
	}
	
}