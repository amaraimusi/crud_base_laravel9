/**
 * 外部名称クラス： 外部idに紐づく外部テーブルの名前要素を制御
 * @since 2021-6-2 | 2021-6-5
 * @license MIT
 * @version 1.0.1
 */
class CrudBaseOuterName{

	/**
	 * 初期化
	 * @param {} crudBaseData
	 * @param [{}] data 外部名称データ
	 * 	- string unique_code 一意コード：
	 *		「フォーム種別_IDフィールド」のパターンで書くと下記パラメータを省略できる。例→kj_en_sp_id, edit_en_sp_id, ni_en_sp_id
	 * 	- string outer_id_field 外部IDフィールド（省略可）
	 * 	- string outer_name_field 外部名称フィールド（省略可）
	 * 	- string wamei 和名
	 * 	- string outer_id_slt	外部ID要素のセレクタ（省略可）。例→#slt-kj_en_sp_id-outer_id
	 * 	- string outer_name_slt	外部名称要素のセレクタ（省略可）。例→#kj_en_sp_id-outer_name
	 * 	- string outer_show_btn_slt	外部名称表示母田ののセレクタ（省略可）。例→#kj_en_sp_id-outer_show_btn
	 * 	- string form_type	フォーム種別（省略可）。例→kj, edit, ni(new_inp)
	 */
	init(crudBaseData, data, option){
		
		this.crudBaseData = crudBaseData;
		this.csrf_token = crudBaseData.csrf_token;
		
		// 省略されている値をセットする。
		data = this._setValueIfEmpty(data);
		
		this.data = data;
		
		if(option == null) option = {};
		if(option['ajax_action_method'] == null ) option['ajax_action_method'] = 'getOuterName';
		this.option = option;
		
		this.box = this._createBox(data);

	}
	
	
	_createBox(data){
		let box = {};
		
		for(let i in data){
			let ent = data[i];
			let unique_code = ent['unique_code'];
			let boxEnt = {};
			
			boxEnt['ent'] = ent;

			let outerIdElm = jQuery(ent['outer_id_slt']);
			if(outerIdElm[0] == null) throw new Error('CBCN0604F nothing→' + ent['outer_id_slt']);
			boxEnt['outerIdElm'] = outerIdElm;

			let outerNameElm = jQuery(ent['outer_name_slt']);
			if(outerNameElm[0] == null) throw new Error('CBCN0604F nothing→' + ent['outer_name_slt']);
			boxEnt['outerNameElm'] = outerNameElm;

			let outerShowBtnElm = jQuery(ent['outer_show_btn_slt']);
			if(outerShowBtnElm[0] == null) throw new Error('CBCN0604F nothing→' + ent['outer_show_btn_slt']);
			boxEnt['outerShowBtnElm'] = outerShowBtnElm;
			
			box[unique_code] = boxEnt;
			
		}

		return box;
	}
	
	
	// 省略されている値をセットする。
	_setValueIfEmpty(data){
		
		for(let i in data){
			let ent = data[i];
			if(ent['unique_code'] == null) throw new Error('CBON0604D i=' + i);
			let unique_code = ent['unique_code'];
			if(ent['outer_id_field'] == null) ent['outer_id_field'] = this._extractIdField(unique_code);
			if(ent['outer_name_field'] == null) ent['outer_name_field'] = this._extractOuterNameField(ent['outer_id_field']);
			if(ent['wamei'] == null) ent['wamei'] = '';
			if(ent['outer_id_slt'] == null) ent['outer_id_slt'] = '.OuterName-' + unique_code + '-outer_id';
			if(ent['outer_name_slt'] == null) ent['outer_name_slt'] = '.OuterName-' + unique_code + '-outer_name';
			if(ent['outer_show_btn_slt'] == null) ent['outer_show_btn_slt'] = '.OuterName-' + unique_code + '-outer_show_btn';
			if(ent['form_type'] == null) ent['form_type'] = this._extactFromType(unique_code);

		}
		return data;
	}
	
	// 外部名称フィールドを取得する
	_extractOuterNameField(id_field){
		
		let fEnt = this._getFieldEnt(id_field);
		if(fEnt.outer_alias == null) throw new Error('CBON210605B'); 
		return fEnt.outer_alias;
	}
	
	// フィールドデータからフィールドエンティティを取得する
	_getFieldEnt(field){
		let fEnt = null;
		let fieldData = this.crudBaseData.fieldData;
		for(let i in fieldData){
			let fEnt2 = fieldData[i];
			if(fEnt2.id == field){
				fEnt = fEnt2;
				break;
			}
		}
		
		if(fEnt == null) throw new Error('システムエラー CBON210605A');
		return fEnt;
	}
	
	
	// IDフィールド名を取得する
	_extractIdField(unique_code){
		return this._stringRight(unique_code, '_');
	}
	
		/**
	 * 文字列を左側から印文字を検索し、右側の文字を切り出す。
	 * @param s 対象文字列
	 * @param mark 印文字
	 * @return 印文字から右側の文字列
	 */
	_stringRight(s,mark){
		if (s==null || s==""){
			return s;
		}
		
		var a=s.indexOf(mark);
		var s2=s.substring(a+mark.length,s.length);
		return s2;
	}
	
	
	
	// フォーム種別を一意コードから抽出する。
	_extactFromType(unique_code){
		let ary = unique_code.split('_');
		let form_type = ary[0];
		
		switch(form_type){
			case 'kj':
				break;
			case 'edit':
				break;
			case 'ni':
				form_type = 'new_inp'
				break;
			case 'new_inp':
				break;
			default:
				throw new Error('CBON210604E');
		}
		
		return form_type;
	}
	
	
	
	/**
	 * 外部idに紐づく外部テーブルの名前フィールドを取得する
	 */
	getOuterName(unique_code){

		let boxEnt = this.box[unique_code];
		let outerIdElm = boxEnt['outerIdElm'];
		
		let outer_id = outerIdElm.val();
		outer_id = outer_id.trim();
		if(outer_id == '') return;
		outer_id = this._hankaku2Zenkaku(outer_id);
		if(isNaN(outer_id)){
			alert('半角数値を入力してください。');
			return ;
		}
		
		// IDフィールド名を取得する
		let outer_id_field = outerIdElm.attr('id');
		if(outer_id_field == null) outer_id_field = outerIdElm.attr('name');
		if(outer_id_field == null) throw new Exception('システムエラー CBON210604A');
		
		// 「kj_」がついていたら除去する
		let s3 = outer_id_field.substr( 0, 3);
		if(s3=='kj_'){
			outer_id_field = outer_id_field.substr(3);
		}
		
		let model_name_s = this.crudBaseData.model_name_s;
		let crud_base_project_path = this.crudBaseData.crud_base_project_path;
		let ajax_url = crud_base_project_path + '/' + model_name_s + '/getOuterName'

		let sendData={
			outer_id:outer_id,
			outer_id_field:outer_id_field
		};
		
		let fd = new FormData();
		
		let send_json = JSON.stringify(sendData);//データをJSON文字列にする。
		fd.append( "key1", send_json );
		
		// CSRFトークンを取得
		let csrf_token = this.crudBaseData.csrf_token;
		fd.append( "csrf_token", csrf_token );
		
		// AJAX
		jQuery.ajax({
			type: "post",
			url: ajax_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType : false,
		})
		.done((res_json, type) => {
			let res;
			try{
				res =jQuery.parseJSON(res_json);//パース
			}catch(e){
				jQuery("#err").append(res_json);
				return;
			}
			
			let outer_name = res.outer_name;
			outer_name = this._xss_sanitize(outer_name);
			
			if(outer_name == '') outer_name='一致はありません';
			
			let outerNameElm = boxEnt['outerNameElm'];
			outerNameElm.html(outer_name);
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			let errElm = jQuery('#err');
			errElm.append('アクセスエラー');
			errElm.append(jqXHR.responseText);
			alert(statusText);
		});
	}
	
	
	/**
	 表示中の外部名称をクリアする。
	 */
	clear(){
		jQuery(".OuterName-outer_name").each((index, elm)=> {
			jQuery(elm).html('');
		 });
		
	}
	
	// 全角を半角に変換する
	_hankaku2Zenkaku(str) {
		return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
			return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
		});
	}
	
	
	/**
	 * XSSサニタイズ
	 * 
	 * @note
	 * 「<」と「>」のみサニタイズする
	 * 
	 * @param any data サニタイズ対象データ | 値および配列を指定
	 * @returns サニタイズ後のデータ
	 */
	_xss_sanitize(data){
		if(typeof data == 'object'){
			for(var i in data){
				data[i] = this._xss_sanitize(data[i]);
			}
			return data;
		}
		
		else if(typeof data == 'string'){
			return data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}
		
		else{
			return data;
		}
	}
	
	/** 新規入力フォーム表示
	 */
	newInpShow(){
		this._show(null, 'new_inp');
	}
	
	/** 編集フォーム表示
	 */
	editShow(ent){
		this._show(ent, 'edit');
	}
	
	// フォーム表示
	_show(ent, form_type){
		for(let i in this.box){
			let boxEnt = this.box[i];
			let outerNameEnt = boxEnt['ent'];
			let outer_name_field = outerNameEnt.outer_name_field;
			if(outerNameEnt.form_type == form_type){
				let outerNameElm = boxEnt.outerNameElm;

				let outer_name = '';
				if(ent){
					outer_name = ent[outer_name_field];
				}
				
				if(outer_name == null) outer_name = '';
				outerNameElm.html(outer_name);
			}
		}
	}
	
	
	
}