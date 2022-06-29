
/**
* パスワード変更の制御クラス
* @since 2022-2-23
* @version 1.0.0
*/
class ChangePw{
	
	/**
	* コンストラクタ
	*/
	constructor(){
		
		let formData = {
				old_pw: '',
				new_pw1: '',
				new_pw2: '',
		}
		
		this.app = new Vue({
			el: '#vue_app',
			data: {
				formData: formData,
				err_msg:'',
			}
		});
		
		// ポップアップ
		this.popupLion = new PopupLion(null, {set_timeout_time:3000});
		this.popupLion.releasePopup(); // 情報が追加されていればポップアップを時間差で出現させる。

	}
	
	/**
	* パスワード変更登録
	*/
	reg(){
		this.app.err_msg = ''; // エラーメッセージをクリア。
		
		if(this._validation() == false) return;
		

		let formData = this._getPlainDataFromVue(this.app, 'formData');
		let fd = new FormData(); // 送信フォームデータ
		let json = JSON.stringify(formData);
		fd.append( "key1", json );
		
		// CSRFトークンを送信フォームデータにセットする。
		let token = jQuery('#csrf_token').val();
		fd.append( "_token", token );
		
		let ajax_url = 'change_pw/ajax_reg';
		
		jQuery.ajax({
			type: "post",
			url: ajax_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType: false,
	
		}).done((str_json, status, xhr) => {
		
			// 419エラーならトークンの期限切れの可能性のためリロードする（トークンの期限は2時間）
			if(xhr.status == 419)  location.reload(true);
	
			let res = null;
			try{
				res =jQuery.parseJSON(str_json);//パース
			}catch(e){
				alert('バックエンド側のエラー');
				console.log(str_json);
				$('#err').html(str_json);
				return;
			}
			
			if(res.err_msg == 'logout') location.reload(true); // すでにログアウトになっているならブラウザをリロードする。
			if(res.err_msg){
				this.app.err_msg = res.err_msg;
				return;
			}
			
			this.popupLion.addPopup('change_pw_popup', []); // ポップアップ情報をセットする
			
			location.reload(true);
			
	
		}).fail((xhr, status, errorThrown) => {
		
			// 419エラーならトークンの期限切れの可能性のためリロードする（トークンの期限は2時間）
			if(xhr.status == 419)  location.reload(true);
			alert('通信エラー');
			console.log(status);
			console.log(xhr.responseText);
			$('#err').html(xhr.responseText);
		
		});
	}
	
	// バリデーション
	_validation(){
		let err_msg = '';
		if(!$('#old_pw')[0].checkValidity()){
			err_msg += '現在のパスワードは8文字以上の半角英数字で入力してください。';
		}else if(!$('#new_pw1')[0].checkValidity()){
			err_msg += '新しいパスワードは8文字以上の半角英数字で入力してください。';
		}else if($('#new_pw1').val() != $('#new_pw2').val()){
			err_msg += '新しいパスワードと再入力パスワードが一致しません。';
		}
		
		this.app.err_msg = err_msg;
		
		if(err_msg != '') return false;
		return true;
		
	}
	
	
	/**
	* Vueのappからバインドされていないプレーンなデータを取得する
	* ＠param app VueのApp
	* @param key データのキー省略可
	* @return {} プレーンなデータ
	*/
	_getPlainDataFromVue(app, key){
		let anyData = null;
		if(key==null){
			anyData = app._data;
		}else{
			anyData = app[key];
		}
		
		let plainData = {};
		for(let key2 in anyData){
			plainData[key2] = anyData[key2];
		}
		
		return plainData;
	}
}