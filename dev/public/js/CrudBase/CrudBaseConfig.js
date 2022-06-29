/**
 * CrudBase設定クラス
 * @date 2019-7-17 | 2020-8-25
 * @version 1.0.2
 * @license MIT
 */
class CrudBaseConfig{
	
	/**
	 * 初期化
	 * 
	 * @param param
	 * - div_xid 当機能埋込先区分のid属性
	 * - crudBaseData 
	 *  - delete_alert_flg 削除アラートフラグ    1:一覧行の削除ボタンを押したときアラートを表示する
	 */
	init(param, crudBaseData){
		
		this.param = this._setParamIfEmpty(param);
		this.tDiv = jQuery('#' + this.param.div_xid); //  This division
		this.crudBaseData = crudBaseData;
		
		
		// 設定データをローカルストレージや定義から取得
		this.data = this._getData(crudBaseData.configData);

		// 当機能のHTMLを作成および埋込
		let html = this._createHtml(); 
		this.tDiv.html(html);
		
		this.fShowBtn = this.tDiv.find('.cb_conf_f_show_btn'); // 機能表示ボタン要素
		this.fCloseBtn = this.tDiv.find('#cb_conf_f_close_btn'); // 機能閉じるボタン要素
		this.funcDiv = this.tDiv.find('.cb_conf_func_div'); // 機能区分
		this.resDiv = this.tDiv.find('.cb_conf_res'); // 結果区分
		this.errDiv = this.tDiv.find('.cb_conf_err'); // エラー区分
		this.applyBtn = this.tDiv.find('.cb_conf_apply_btn'); // 適用ボタン要素
		this.defBtn = this.tDiv.find('.cb_conf_def_btn'); // 初期戻しボタン
		this.form = this.tDiv.find('.cb_conf_form'); // フォーム要素
		
		this._addClickFShowBtn(this.fShowBtn); // 機能表示ボタンのクリックイベント
		this._addClickFCloseBtn(this.fCloseBtn); // 機能閉じるボタンのクリックイベント
		this._addClickApplyBtn(this.applyBtn); // 適用ボタンのクリックイベント
		this._addClickDefBtn(this.defBtn); // 初期戻しボタンのクリックイベント
		
		
		// ボタンサイズ変更コンポーネント
		this.cbBtnSizeChanger = new CbBtnSizeChanger(crudBaseData);
		
		// UIに設定データを反映する。
		this.setDataToUi(this.data);
		
	}
	
	
	/**
	 * 設定データをローカルストレージや定義から取得
	 * @param pData 初期指定・設定データ
	 * @return object cnfs
	 */
	_getData(pData){
		if(pData == null) pData = [];
		let defData = $.extend(true, {}, pData);
		
		// 削除アラートフラグ    1:一覧行の削除ボタンを押したときアラートを表示する
		if(defData['delete_alert_flg'] == null) defData['delete_alert_flg'] = 0;
		
		let data = $.extend(true, {}, defData);
		let lsData = this._getDataFromLs(); // ローカルストレージから設定データを取得する
		data = $.extend(data, lsData); // 設定データにローカルストレージからのデータをマージする。
		
		this.defData = defData;
		this.lsData = lsData;
		this.data = data;

		return data;

	}
	
	
	/**
	 * 設定データ：フラグ系のセット
	 * @param object defData 初期設定データ
	 * @param string key 設定キー
	 * @param mixed def デフォルト値
	 * @return mixed 設定値
	 */
	_setFlg(defData, key, def){
		
		let value = def;
		
		if(defData[key] != null) value = defData[key];
		
		return value;

	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};

		if(param['div_xid'] == null) param['div_xid'] = 'crud_base_config';
		

		return param;
	}
	
	
	/**
	 * 当機能のHTMLを作成および埋込
	 */
	_createHtml(){
		let html = `
	<input class='cb_conf_f_show_btn btn btn-secondary btn-sm' type="button" value='設定' />
	<div class='cb_conf_func_div' style="display:none">
		<div style="display:inline-block;padding:10px;border:solid 4px #5bd59e;border-radius:5px;margin-bottom:10px">
			<table style="width:100%;"><tbody><tr>
				<td><div style="color:#5bd59e;font-weight:bold">設定</div></td>
				<td style="text-align:right"><button id="cb_conf_f_close_btn" type="button" class="btn btn-secondary btn-sm">閉じる</button></td>
			</tr></tbody></table>
			
			<input value="ボタン設定" type="button" class="btn btn-secondary btn-sm" onclick="jQuery('#CbBtnSizeChanger').toggle(300);" />
			<div id="CbBtnSizeChanger" style="display:none"></div>
			
			<table class='cb_conf_form tbl2' style="margin-top:8px"><tbody>
				<tr>
					<td><input class="cbcf_delete_alert_flg" type="checkbox" value='1'></td>
					<td>削除アラート: 一覧行の削除ボタンを押したときにアラートを表示する。</td>
				<tr>
			</tbody></table>
			
			<div style="margin-top:8px">
				<input class="cb_conf_apply_btn btn btn-success" type='button' value="適用" />
				<input class="cb_conf_def_btn btn btn-secondary btn-sm" type='button' value="初期に戻す" />
			</div>
			
			<div class="cb_conf_res text-success"></div>
			<div class="cb_conf_err text-danger"></div>
		</div>
	</div>
		`;
		return html;
	}
	
	
	/**
	 * ローカルストレージから設定データを取得する
	 */
	_getDataFromLs(){
		
		let ls_key = this._getLsKey(); // ローカルストレージキーを取得する
		let data_json = localStorage.getItem(ls_key);
		let data = JSON.parse(data_json);
		if(data == null) data = {};
		return data;
		
	}
	
	/**
	 * ローカルストレージで保存しているパラメータをクリアする
	 */
	clearlocalStorage(){
		let ls_key = this._getLsKey(); // ローカルストレージキーを取得する
		localStorage.removeItem(ls_key);
	}
	
	
	/**
	 * ローカルストレージに設定データを保存
	 */
	_saveData(key, val){
		this.data[key] = val;
		let ls_key = this._getLsKey(); // ローカルストレージキーを取得する
		var data_json = JSON.stringify(this.data);
		localStorage.setItem(ls_key, data_json);
	}
	
	/**
	 * ローカルストレージキーを取得する
	 */
	_getLsKey(){
		// ローカルストレージキーを取得する
		let ls_key = location.href; // 現在ページのURLを取得
		ls_key = ls_key.split(/[?#]/)[0]; // クエリ部分を除去
		ls_key += '_CrudBaseConfig';
		return ls_key;
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
			this._showToggle(); // 表示切替
		});
	}
	
	
	/**
	 * 機能閉じるボタンのクリックイベント
	 * @param jQuery fShowBtn 機能表示ボタン
	 */
	_addClickFCloseBtn(fCloseBtn){
		fCloseBtn.click((evt)=>{
			this._showToggle(); // 表示切替
		});
	}
	
	
	/**
	 * 表示切替
	 */
	_showToggle(){
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
	}
	
	
	/**
	 * 適用ボタンのクリックイベントを追加
	 * @param jQuery applyBtn 適用ボタン
	 */
	_addClickApplyBtn(applyBtn){
		applyBtn.click((evt)=>{
			this.clickApplyBtn();

		});
	}
	
	
	/**
	 * 適用ボタンのクリックイベント
	 */
	clickApplyBtn(){
		
		this.data['delete_alert_flg'] = this._getFromCheckbox('delete_alert_flg');
		
		// 設定データをローカルストレージに保存
		let ls_key = this._getLsKey(); // ローカルストレージキーを取得する
		var data_json = JSON.stringify(this.data);
		localStorage.setItem(ls_key, data_json);
	}
	
	
	/**
	 * チェックボックスから値を取得する
	 * @param string key キー
	 * @return mixed 値
	 */
	_getFromCheckbox(key){
		let value = this.form.find('.cbcf_' + key + ':checked').val();
		if(value == null) value = 0;
		return value;
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
	 * 初期戻しボタンのクリックイベントを追加
	 * @param jQuery defBtn 初期戻しボタン
	 */
	_addClickDefBtn(defBtn){
		defBtn.click((evt)=>{
			this.reset();
		});
	}
	
	
	/**
	 * 設定のリセット
	 */
	reset(){
		
		// 初期データのクローンを設定データにセットする
		this.data = $.extend(true, {}, this.defData);
		
		// UIに設定データを反映する。
		this.setDataToUi(this.data);
		
		// ストレージからクリアする
		let ls_key = this._getLsKey(); // ローカルストレージキーを取得する
		localStorage.removeItem(ls_key);
	}
	
	
	/**
	 * UIに設定データを反映する。
	 * @param object data 設定データ
	 */
	setDataToUi(data){
		this._setCheckbox(data, 'delete_alert_flg');
	}
	
	
	/**
	 * チェックボックスに設定データの値をセットする
	 * @param object data 設定データ
	 * @param string key 設定キー
	 */
	_setCheckbox(data, key){
		let cb = this.form.find('.cbcf_' + key);
		if(this._empty(data[key])){
			cb.prop('checked', false);
		}else{
			cb.prop('checked', true);
		}
		
	}
	
}