/**
 * 一括削除クラス
 * @date 2019-7-27 | 2019-8-16
 * @license MIT
 * @version 1.0.1
 */
class BulkDelete{
	
	/**
	 * 初期化
	 * 
	 * @param object delCnds 削除条件情報
	 * @param object param
	 * - div_xid 当機能埋込先区分のid属性
	 */
	init(delCnds, param){
		
		this.param = this._setParamIfEmpty(param);
		this.tDiv = jQuery('#' + this.param.div_xid); //  This division
		
		// 当機能のHTMLを作成および埋込
		let html = this._createHtml(delCnds); 
		this.tDiv.html(html);
		
		this.fShowBtn = this.tDiv.find('.bulk_del_f_show_btn'); // 機能表示ボタン要素
		this.funcDiv = this.tDiv.find('.bulk_del_func_div'); // 機能区分
		this.resDiv = this.tDiv.find('.bulk_del_res'); // 結果区分
		this.errDiv = this.tDiv.find('.bulk_del_err'); // エラー区分
		this.startBtn = this.tDiv.find('.bulk_del_start_btn'); // 削除スタートボタン要素
		this.inpsDiv = this.tDiv.find('.bulk_del_inps'); // 入力区分
		
		
		this._addClickFShowBtn(this.fShowBtn); // 機能表示ボタンのクリックイベント
		this._addClickStartBtn(this.startBtn); // 削除スタートボタンのクリックイベント
		
		this.delCnds = delCnds;
		
	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};

		if(param['div_xid'] == null) param['div_xid'] = 'bulk_delete';
		if(param['ajax_url'] == null) throw new Error("'ajax_url' is empty!");
		
		return param;
	}
	
	
	/**
	 * 当機能のHTMLを作成および埋込
	 * @param object delCnds 削除条件情報
	 */
	_createHtml(delCnds){
		
		// 削除条件情報から入力HTMLを作成する。
		let inps_html = this._makeInpsHtml(delCnds);
		
		let html = `
	<input class='bulk_del_f_show_btn btn btn-primary btn-sm' type="button" value='条件指定・一括削除' />
	<div class='bulk_del_func_div' style="display:none">
		<div style="display:inline-block;padding:10px;border:solid 4px #5bd59e;border-radius:5px;margin-bottom:10px">
			<p>条件指定・一括削除</p>
			<div class="bulk_del_inps" style="padding-bottom:16px">${inps_html}</div>
			<input class="bulk_del_start_btn btn btn-danger btn-sm" type='button' value="削除実行" />
			<div class="bulk_del_res text-success"></div>
			<div class="bulk_del_err text-danger"></div>
		</div>
	</div>
		`;
		return html;
	}
	
	/**
	 * 削除条件情報から入力HTMLを作成する
	 * @param array delCnds 削除条件情報
	 * @return string 入力HTML
	 */
	_makeInpsHtml(delCnds){
		
		let html = ''; // 入力HTML
		for(let i in delCnds){
			let ent = delCnds[i];
			switch(ent.inp_type){
			case 'text':
				html += this._makeInpHtmlText(ent); // テキストボックスの入力HTMLを作成する
				break;
			case 'select':
				html += this._makeInpHtmlSelect(ent); // セレクトボックスの入力HTMLを作成する
				break;
			}
		}
		return html;
	}
	
	
	/**
	 * テキストボックスの入力HTMLを作成する
	 * @param object ent 削除条件エンティティ
	 * @return string 入力HTML
	 */
	_makeInpHtmlText(ent){
		
		let html = `<input type="text" class="${ent.field}" placeholder="${ent.wamei}">`;
		return html;
	}

	
	/**
	 * セレクトボックスの入力HTMLを作成する
	 * @param object ent 削除条件エンティティ
	 * @return string 入力HTML
	 */
	_makeInpHtmlSelect(ent){

		// ハッシュマップからselectのoption部分を組み立てる
		let option_html = '';
		let hashmap = ent.hashmap;
		for(let id in hashmap){
			let name = hashmap[id];
			option_html += `<option value="${id}">${name}</option>`;
		}
		
		let html = `
			<select  class="${ent.id_field}">
				<option value=''>-- ${ent.wamei}(未選択) --</option>
				${option_html}
			</select>
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
				this.resDiv.html('入力した条件に一致するデータを削除します。');
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
	 * 削除スタートボタンのクリックイベントを追加する
	 * @param jQuery btn 削除スタートボタン
	 */
	_addClickStartBtn(btn){
		btn.click((evt)=>{
			
			// 「OK」時の処理開始 ＋ 確認ダイアログの表示
			if(window.confirm('削除を実行します。よろしいですか？')){
				this._clickStartBtn();
			}
			
		});
	}
	
	
	/**
	 * 削除スタートボタンのクリックイベント
	 */
	_clickStartBtn(){
		
		this.resDiv.html('削除中です。しばらくお待ちください...');
		
		// 入力区分から条件情報を取得する
		let kjs = this._getKjsFromInps();

		this.deleteByKjs(kjs); // 検索条件を指定して削除を実行する
		
	}

	
	/**
	 * 検索条件を指定して削除を実行する
	 * @param object kjs 検索条件情報
	 */
	deleteByKjs(kjs){
		let sendData = {kjs:kjs};
		sendData = this._escapeForAjax(sendData); // Ajax送信データ用エスケープ。実体参照（&lt; &gt; &amp; &）を記号に戻す。
		sendData = this._ampTo26(sendData); // PHPのJSONデコードでエラーになるので、＆を%26に一括変換する
		let send_json = JSON.stringify(sendData);//データをJSON文字列にする。

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
				this._showErr(res_json);
				return;
			}
			this.resDiv.html('削除が完了しました。');
			location.reload(true); // ブラウザをリロードする
		})
		.fail((jqXHR, statusText, errorThrown) => {
			this._showErr(jqXHR.responseText);
			alert(statusText);
		});
	}
	
	
	
	
	
	/**
	 * 入力区分から条件情報を取得する
	 * @return object 条件情報
	 */
	_getKjsFromInps(){
		
		let kjs = {}; // 条件情報
		for(let i in this.delCnds){
			let dcEnt = this.delCnds[i];
			let res = null;
			switch(dcEnt.inp_type){
			case 'text':
				res = this._getValueFromTextbox(dcEnt); // テキストボックスから値を取得する
				break;
			case 'select':
				res = this._getValueFromSelect(dcEnt); // テキストボックスから値を取得する
				break;
			}
			if(res != null) kjs[res.field] = res.value;
		}

		return kjs;
	}
	
	/**
	 * テキストボックスから値を取得する
	 * @param object dcEnt 削除条件エンティティ
	 * @return object
	 *  - field フィールド
	 *  - value 値
	 */
	_getValueFromTextbox(dcEnt){
		let field = dcEnt.field;
		let inp = this.inpsDiv.find('.' + field);
		let value = inp.val();
		return {
			field:field,
			value:value,
		}
	}
	

	/**
	 * テキストボックスから値を取得する
	 * @param object dcEnt 削除条件エンティティ
	 * @return object
	 *  - field フィールド
	 *  - value 値
	 */
	_getValueFromSelect(dcEnt){
		let field = dcEnt.id_field;
		let inp = this.inpsDiv.find('.' + field);
		let value = inp.val();
		return {
			field:field,
			value:value,
		}
	}

	/**
	 * Ajax送信データ用エスケープ。実体参照（&lt; &gt; &amp; &）を記号に戻す。
	 * 
	 * @param any data エスケープ対象 :文字列、オブジェクト、配列を指定可
	 * @returns エスケープ後
	 */
	 _escapeForAjax(data){
		if (typeof data == 'string'){
			if ( data.indexOf('&') != -1) {
				data = data.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
				return encodeURIComponent(data);
			}else{
				return data;
			}
		}else if (typeof data == 'object'){
			for(var i in data){
				data[i] = this._escapeForAjax(data[i]);
			}
			return data;
		}else{
			return data;
		}
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