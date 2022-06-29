/**
 * CrudBaseバリデーション・jQuery版
 * 
 * @date 2020-8-26
 * @version 1.0.0
 * @license MIT
 * 
 */
class CrudBaseValidationJQuery{
	
	/**
	 * コンストラクタ
	 * @param string per_xid 親要素のid属性値（親要素のセレクタ）
	 * @param {} crudBaseData
	 * @param [function] バリデーションメソッド群
	 */
	constructor(per_xid, crudBaseData, validMethods, option){
		
		this.validMethods = validMethods;
		let kjFields = Object.keys(validMethods);
		
		// CrudBaseバリデーションの生成または取得
		if(typeof cbv == 'undefined'){
			this.cbv = new CrudBaseValidation();
		}else{
			this.cbv = cbv;
		}
		
		let perElm = jQuery(per_xid);
		if(!perElm[0]) throw new Error(per_xid + ' is none.')
		
		let inpElms0 = this._getInpElms(perElm, kjFields); // 検索条件・入力要素リストを取得する
		let errElms = this._getErrElms(perElm, kjFields); // エラー要素リストを取得する
		let inpTypeWhiteList = ['text', 'number'];
		let inpElms = this._filterInpElms(inpElms0, inpTypeWhiteList); // 検索条件・入力要素リストを条件チェック対象だけするフィルタリング
		this._addChangeEvent(inpElms); // 入力要素にチェンジイベントを追加
		
		this.perElm = perElm;
		this.kjFields = kjFields;
		this.inpElms = inpElms;
		this.errElms = errElms;
	
	}
	
	/**
	 * 入力要素にチェンジイベントを追加
	 * @param {フィールド} inpElms 検索条件・入力要素リスト
	 * @param {フィールド} validMethods バリデーションメソッド群
	 */
	_addChangeEvent(inpElms, validMethods){
		for(let field in inpElms){
			let inpElm = inpElms[field];

			inpElm.change((evt)=>{
				let elm = jQuery(evt.currentTarget);
				
				this._validationEvent(elm); // バリデーションを実行する

			});
		}
	}
	
	/**
	 * バリデーションイベント
	 * @param jQuery elm 検索条件入力要素
	 */
	_validationEvent(elm){
		let kj_field = elm.attr('id');
		let value = elm.val();
		
		let validFunc = this.validMethods[kj_field]; // バリデーションメソッドを取得する
		let err_msg = '';
		if(validFunc != null){
			err_msg = validFunc(this.cbv, value); // バリデーションメソッドを実行する
		}else{
			throw new Error('バリデーションメソッドがありません。' + kj_field);
		}

		// エラーメッセージが存在する場合、エラー要素に出力セットする。
		let errElm = this.errElms[kj_field];
		errElm.html(err_msg);
		
		return err_msg;
	}
	
	
	/**
	 * 検索条件・入力要素リストを条件チェック対象だけするフィルタリング
	 * @param {フィールド}  全・検索条件・入力要素リスト
	 * @param [] inpTypeWhiteList ホワイトリスト
	 */
	_filterInpElms(inpElms0, inpTypeWhiteList){
		
		let inpElms = {};
		for(let field in inpElms0){
			let inpElm = inpElms0[field];
			if(!inpElm[0]) continue;
			
			// ホワイトリストにtypeは存在するか？
			let type = inpElm.attr('type');
			let pre_flg = inpTypeWhiteList.indexOf(type); 
			if(pre_flg == -1) continue;
			
			inpElms[field] = inpElm;
		}
		
		return inpElms;
	}
	
	
	/**
	 * 検索条件・入力要素リストを取得する
	 * @param jQuery 親要素
	 * @param [] kjFields フィールドリスト
	 * @return {フィールド} 検索条件・入力要素要素リスト
	 */
	_getInpElms(perElm, kjFields){
		let inpElms = {};
		
		for(let i in kjFields){
			let field = kjFields[i];
			let slt = '#' + field;
			inpElms[field] = perElm.find(slt);
		}
		
		return inpElms;
	}
	
	
	/**
	 * エラー要素リストを取得する
	 * @param jQuery 親要素
	 * @param [] kjFields フィールドリスト
	 * @return {フィールド} エラー要素リスト
	 */
	_getErrElms(perElm, kjFields){
		let errElms = {};
		
		for(let i in kjFields){
			let field = kjFields[i];
			let slt = '#' + field + '_err';
			errElms[field] = perElm.find(slt);
		}
		
		return errElms;
	}
	
	
	/**
	 * 検索入力のバリデーション
	 * @return バリデーション可否 false:正常, エラー文字列：エラー
	 */
	checkAll(){
		let err_msg_all = '';
		for(let kj_field in this.inpElms){
			let elm = this.inpElms[kj_field];
			let err_msg = this._validationEvent(elm); // バリデーションを実行
			err_msg_all += err_msg;
		}
		
		if(this._empty(err_msg_all)){
			err_msg_all = false;
		}
		return err_msg_all;
		
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