/**
 * CakePHPによるAjax認証
 * 
 * @note
 * AjaxLoginWithCakeController.phpと連動
 * 
 * @date 2016-9-12 | 2020-8-5
 * @version 2.1.0 Laravel7に対応
 */

class AjaxLoginWithCake{
	
	/**
	 * コンストラクタ
	 * 
	 * @param param 省略可
	 * - btn_type ボタンタイプ  0:プレーンスタイル , 1:Bootstrapスタイル
	 * - login_check_url ログイン確認URL
	 * - login_url ログインURL
	 * - logout_url ログアウトURL
	 * - callback ログイン認証後によびだすコールバック関数
	 * - form_slt ボタン表示区分へのセレクタ  デフォルト→"#ajax_login_with_cake
	 * - csrf_token CSRFトークン（Ajaxに必要）
	 */
	constructor(param){
		this.param = this._setParamIfEmpty(param);
	}
	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};

		// ボタンタイプ  0:プレーンスタイル , 1:Bootstrapスタイル
		if(param['btn_type'] == null) param['btn_type'] = 1;
		
		if(param['login_check_url'] == null) param['login_check_url'] = "ajax_login_with_cake/login_check";
		
		if(param['login_url'] == null) param['login_url'] = "ajax_login_with_cake/login_rap";
		
		if(param['logout_url'] == null) param['logout_url'] = "users/logout";

		if(this._isEmpty(param['callback'])) param['callback'] = null;
		
		if(this._isEmpty(param['form_slt'])) param['form_slt'] = "#ajax_login_with_cake";
		
		if(this._isEmpty(param['csrf_token'])) param['csrf_token'] = null;
		
		return param;
	}
	
	/**
	 * パラメータのマージ
	 */
	_margeParam(param){
		this.param = Object.assign({}, this.param, param);
		return this.param
	}
	
	
	/**
	 * 認証フォーム付
	 * @param param constructorのparamと同じ
	 */
	loginCheckEx(param){

		let rGet = this._getUrlQuery();// GETパラメータを取得
		
//		// aパラメータがONの場合に認証機能を有効にする。
//		if(this._isSet(rGet['a'])){
//			this.loginCheck(param);
//		}
		
		this.loginCheck(param);

	}
	
	/**
	 * 認証チェック
	 */
	loginCheck(param){
		
		param = this._margeParam(param);

		let data={'dummy':1};
		let fd = new FormData(); // 送信フォームデータ
		let json_str = JSON.stringify(data);
		fd.append( "key1", json_str );
		
		// CSRFトークンを送信フォームデータにセットする。
		fd.append( "_token", param.csrf_token );
		
		// AJAX
		$.ajax({
			type: "post",
			url: param.login_check_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType: false,
		})
		.done((str_json, type) => {
			let res = {};
			try{
				res = jQuery.parseJSON(str_json);//パース
			}catch(e){
				alert('エラー' + str_json);
				throw new Error(str_json);
			}
			
			//formShowCb(res);//フォームにログインボタンやメッセージを表示する
			this._showBtns(res);

			// クライアントから指定されたコールバック関数を実行する
			if(param.callback != null){
				callBack(res.auth_flg);
			}
		})
		.fail((jqXHR, statusText, errorThrown) => {
			jQuery('#err').html(jqXHR.responseText);
			alert(statusText);
		});
		
	}
	
	
	/**
	 * ボタン表示区分にログインボタンやメッセージを表示する
	 */
	_showBtns(res){

		let form_slt = this.param.form_slt;
		let formElm = jQuery(form_slt);

		if(res.auth_flg == 1 ){
			let logout_btn_html = this._getLogoutBtnHtml(); // ログアウトボタンのＨＴＭＬを取得
			formElm.html(logout_btn_html);
		}
		
		else{
			let login_btn_html = this._getLoginBtnHtml(); // ログインボタンのＨＴＭＬを取得
			formElm.html(login_btn_html);
		}
		
	}
	
	/**
	 * ログアウトボタンのＨＴＭＬを取得
	 * @reutrn string ログアウトボタンのＨＴＭＬ
	 */
	_getLogoutBtnHtml(){
		
		let logout_url = this.param.logout_url;

		let btn_html = "";
		if(this.param.btn_type == 1){
			btn_html = "<span class='text-success'>認証中です </span><a href='" + logout_url + "' id='logout_btn' class='btn btn-secondary btn-sm'>ログアウト</a>";
		}else{
			btn_html = "<a href='" + logout_url + "' id='logout_btn'>ログアウト</a>";
		}
		return btn_html

	}
	
	/**
	 * ログインボタンのＨＴＭＬを取得
	 * @reutrn string ログインボタンのＨＴＭＬ
	 */
	_getLoginBtnHtml(){

		let login_url = this.param.login_url;

		let btn_html = "";
		if(this.param.btn_type == 1){
			btn_html = "<a id='login_btn' href='" + login_url + "' class='btn btn-primary' >ログイン</a>";
		}else{
			btn_html = "<a id='login_btn' href='" + login_url + "' >ログイン</a>";
		}
		return btn_html

	}
	
	/**
	 * URLクエリデータを取得する
	 * 
	 * @return object URLクエリデータ
	 */
	_getUrlQuery(){
		let query = window.location.search;
		
		if(query =='' || query==null){
			return {};
		}
		query = query.substring(1,query.length);
		let ary = query.split('&');
		let data = {};
		for(let i=0 ; i<ary.length ; i++){
			let s = ary[i];
			let prop = s.split('=');
			
			data[prop[0]]=prop[1];
	
		}	
		return data;
	}
	
	/**
	 * 空チェック
	 */
	_isEmpty(v){
		if(v =='' || v==null || v == false){
			return true;
		}else{
			return false;
		}
	}
	
	/**
	 * 値セットチェック
	 */
	_isSet(v){
		if(v =='' || v==null || v == false){
			return false;
		}else{
			return true;
		}
	}
	
	
}