/**
 * CrudBase validation for Vue.js
 * @since 2020-4-4
 * @license MIT
 * @auther Kenji Uehara
 */
class CrudBaseValidationVue{
	

	/**
	 * 初回
	 * @param {} エンティティ
	 * @param {function()} methods バリデーションメソッド群
	 */
	init(ent, methods){
		this.ent = ent;
		this.methods = methods;
		this.valids = this._makeValidErrMsgs(ent);
	}
	
	
	/**
	 * VueAppのセッター
	 * @param object vueApp
	 */
	setVueApp(vueApp){
		this.vueApp = vueApp;
	}
	
	
	/**
	 * バリデーションエラーメッセージ群を作成する
	 * @param {} ent エンティティ
	 * @return {} バリデーションエラーメッセージ群
	 */
	_makeValidErrMsgs(ent){
		
		let valids = {};
		for(let field in ent){
			valids[field] = '';
		}
		return valids;
	}


	/**
	 * エンティティ内の全フィールドを一括バリデーション
	 * @param {} エンティティ
	 * @return bool true:エラーなし, false:一件以上のエラーあり
	 */
	validationAll(ent){

		for(let field in this.methods){
			let validFunction = this.methods[field];
			if(validFunction == null) continue;
			let value = ent[field];
			validFunction(value);
		}
		
		return this._judgErr();
	}
	
	/**
	 * 入力に1件以上のエラーが存在するか判定
	 * @return bool true:エラーなし, false:一件以上のエラーあり
	 */
	_judgErr(){
		let valids = this.vueApp.valids;
		for(let i in valids){
			let err = valids[i];
			if(!this._empty(err)){
				return false;
			}
		}
		return true;
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