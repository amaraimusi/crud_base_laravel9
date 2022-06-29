/**
 * Class of JavaScript for ES6
 * 
 * @date 2017-10-10
 * @version 1.0.0
 * 
 */
class CrudBasePasswordEdit{
	
	
	/**
	 * コンストラクタ
	 * 
	 * @param param
	 * - flg
	 */
	constructor(newInpForm, editForm, param){

		this.newInpForm = newInpForm;
		this.editForm = editForm;
		
		this.param = this._setParamIfEmpty(param);
		
		var data = [];
		data = this._getPwElmsFromNewInp(data, newInpForm, 'new_inp'); // 新規入力フォームからパスワード要素データを取得
		data = this._getPwElmsFromNewInp(data, editForm, 'edit'); // 編集フォームからパスワード要素データを取得
		
		// パスワード変更ボタン群を各パスワード要素の下に作成する。ついでにボタン要素も取得する
		data = this._createPwChgbtns(data);
		
		// 変更ボタンにクリックイベントをセットする
		this._setClickEventToBtn(data);
		
		this.data = data;
	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};

		return param;
	}
	
	/**
	 * フォームからパスワード要素データを取得
	 * @param array data
	 * @param jQuery form フォームの要素オブジェクト
	 * @param string form_type フォーム種別
	 */
	_getPwElmsFromNewInp(data, form, form_type){
		var pwElms = form.find("input[name='password']");
		if(!pwElms[0]) return data;
		
		pwElms.each((i, e) => {
			var pwElm = jQuery(e);
			var ent = {
					'pwElm':pwElm,
					'pw_index':i,
					'form_type':form_type,
					};
			data.push(ent);
		});
		return data;
	}
	
	
	/**
	 * パスワード変更ボタン群を各パスワード要素の下に作成する
	 * @param array data
	 * @return data;
	 */
	_createPwChgbtns(data){
		
		for(var i in data){
			var ent = data[i];
			var form_type = ent.form_type;
			var pw_index = ent.pw_index;
			var pwElm = ent.pwElm;
			
			// 変更ボタン要素のHTMLを組み立て
			var xid = 'cbpe_' + form_type + pw_index;
			var html = `<input type="button" id="${xid}" value="パスワード変更" data-form-type="${form_type}" data-pw-index="${pw_index}" class="btn btn-warning btn-sm" />`;
			
			// パスワード要素の後ろに変更ボタン要素を追加
			pwElm.after(html);
			
			// 変更ボタン要素を取得する
			var btnElm = this._getBtnElm(form_type, pw_index);
			ent['btnElm'] = btnElm;
		}
		
		return data;
		
	}
	
	/**
	 * 変更ボタン要素を取得する
	 * @param string form_type フォーム種別
	 * @param int pw_index パスワード要素インデックス
	 * @return jQuery 変更ボタン要素
	 */
	_getBtnElm(form_type, pw_index){
		
		var form = null;
		if(form_type == 'new_inp') form = this.newInpForm;
		if(form_type == 'copy') form = this.newInpForm;
		if(form_type == 'edit') form = this.editForm;
		
		var xid = 'cbpe_' + form_type + pw_index;
		var btnElm = form.find('#' + xid);
		return btnElm;
	}
	
	
	/**
	 * 変更ボタンにクリックイベントをセットする
	 * @param array data
	 */
	_setClickEventToBtn(data){
		for(var i in data){
			var ent = data[i];
			var btnElm = ent.btnElm;
			btnElm.click( (evt)=>{
				this.clickPwChgbtn(this, evt.currentTarget);
			});
		}
	}
	
	/**
	 * 変更ボタンクリックイベント
	 */
	clickPwChgbtn(self, btnElm){
		var btnElm = jQuery(btnElm);
		
		var form_type = btnElm.attr('data-form-type');
		var pw_index = btnElm.attr('data-pw-index');
		
		var ent = this._getEntity(form_type, pw_index);
		if(ent == null) return;
		
		// パスワード要素には暗号化文字列が入力されているのでクリアしてから表示する。
		var pwElm = ent.pwElm;
		pwElm.val('');
		pwElm.show();
		
		// 変更ボタン要素を隠す
		var btnElm = ent.btnElm;
		btnElm.hide();

	}
	
	/**
	 * データからフォーム種別とパスワード要素インデックスを指定してエンティティを取得する。
	 */
	_getEntity(form_type, pw_index){
		
		for(var i in this.data){
			var ent = this.data[i];
			if(ent.form_type == form_type && ent.pw_index == pw_index){
				return ent;
			}
		}
		return null;
	}
	
	
	
	/**
	 * フォーム表示イベント
	 * @param form_type フォーム種別
	 */
	showForm(form_type){
		if(this.data.length == 0) return;
		
		if(form_type=='new_inp'){
			this._changeForNewInp(form_type); // 変更ボタンを隠し、パスワード要素を表示する
		}else{
			this._changeForEditAndCopy(form_type); // 変更ボタンを表示し、パスワード要素を隠す
		}
		
	}
	
	/**
	 * 変更ボタンを隠し、パスワード要素を表示する
	 */
	_changeForNewInp(form_type){
		
		for(var i in this.data){
			var ent = this.data[i];
			if(ent.form_type == form_type){
				
				// 変更ボタンを隠す
				var btnElm = ent.btnElm;
				btnElm.hide();
				
				// パスワードテキスト要素を表示する
				var pwElm = ent.pwElm;
				pwElm.show();
				
			}
		}
	}
	
	/**
	 * 変更ボタンを表示し、パスワード要素を隠す
	 */
	_changeForEditAndCopy(form_type){
		
		for(var i in this.data){
			var ent = this.data[i];

			// 変更ボタンを表示する。
			var btnElm = ent.btnElm;
			btnElm.show();
			
			// パスワードテキスト要素を隠す
			var pwElm = ent.pwElm;
			pwElm.hide();

		}
	}
	
}