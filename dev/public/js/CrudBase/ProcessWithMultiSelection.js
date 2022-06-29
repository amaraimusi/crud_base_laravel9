/**
 * 一覧のチェックボックス複数選択による一括処理
 * Check box in list Batch processing with multiple selection.
 * ProcessWithMultiSelection.js
 * 
 * @note
 * 当クラスは、一覧を複数選択して一括処理を行う処理をサポートする。
 * 一括無効化、一括有効化などの機能を備えている。
 * 複数選択の方法はチェックボックスにのみ対応している。
 * 
 * @version 2.0.1
 * @date 2016-2-5 | 2021-5-31
 * 
 */
class ProcessWithMultiSelection{

	/**
	 * コンストラクタ
	 * @param param
	 * - tbl_slt HTMLテーブルのセレクタ
	 * - cb_slt チェックボックスのセレクタ（class属性名 or name属性名）	省略時："pwms"
	 * - id_slt IDのセレクタ（class属性名 or name属性名）	省略時："id"
	 * - ajax_url AJAX送信先URL
	 * - csrf_token CSRFトークン
	 */
	constructor(param){

		// If Option property is empty, set a value.
		this.param = this._setOptionIfEmpty(param);
		
	}
	
	
	// If Option property is empty, set a value.
	_setOptionIfEmpty(param){
		
		if(param == undefined) param = {};
		
		if(param['tbl_slt'] == undefined){
			param['tbl_slt'] = 'tbl1';
		}
		
		if(param['cb_slt'] == undefined){
			param['cb_slt'] = 'pwms';
		}
		
		if(param['id_slt'] == undefined){
			param['id_slt'] = 'id';
		}
		
		if(param['ajax_url'] == undefined){
			throw new Error("'ajax_url' is nothing");
		}
		
		if(param['csrf_token'] == undefined){
			throw new Error("'csrf_token' is nothing");
		}
		
		return param;
	};
	
	
	
	/**
	 * 一括アクション
	 * @param kind_no アクション種別番号 10:有効化,  11:無効化
	 */
	action(kind_no){
		
		// チェックされた行のIDをリストで取得する
		let ids = this._getIdLintInChecked();
		
		// IDリストが0件なら処理抜け
		if(ids.length == 0) return;

		// 無効化である場合、確認ダイアログを表示する
		if(kind_no == '11'){
			let rs = confirm('チェックした行を削除してもよろしいですか？');
			if(!rs){
				return;
			}
		}
		
		let fd = new FormData(); // 送信フォームデータ
		let data={'ids':ids, 'kind_no':kind_no};// Ajaxへ送信するデータをセットする
		let json = JSON.stringify(data);
		fd.append( "key1", json );
		
		// CSRFトークンを送信フォームデータにセットする。
		let token = this.param.csrf_token;
		fd.append( "_token", token );

		//☆AJAX非同期通信
		jQuery.ajax({
			type: "post",
			url: this.param.ajax_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType: false,
			success: (res, type) =>{

				if(res=='success'){
					
					// ブラウザをリロードする
					location.reload(true);
					
				}else{
					jQuery("#err").html(res);
				}
				

			},
			error: function(xmlHttpRequest, textStatus, errorThrown){
				jQuery('#err').html(xmlHttpRequest.responseText);//詳細エラーの出力
				alert(textStatus);
			}
		});
	};

	
	
	
	/**
	 * チェックされた行のIDをリストで取得する
	 * 
	 * @return IDリスト
	 * 
	 */
	_getIdLintInChecked(){
		let ids = []; // IDリスト
		
		let slt = '#' + this.param.tbl_slt + ' tbody tr';
		jQuery(slt).each((i, elm)=>{
			let tr = jQuery(elm);
			
			// TR要素内からname属性またはclass属性を指定してチェックボックス要素を取得する
			let cb = this._getElmByNameOrClass(tr, this.param.cb_slt);
			
			// チェックされている場合のみIDを取得してリストに追加する
			let checked = cb.prop('checked');
			if(checked){

				// TR要素内からname属性またはclass属性を指定してID値を取得する
				let id = this._getValueByNameOrClass(tr,this.param.id_slt);
				ids.push(id);
			}
			
		});

		return ids;
	}
	
	/**
	 * 親要素内からname属性またはclass属性を指定して要素を取得する
	 * @param parElm 親要素
	 * @param key name属性名またはclass属性名
	 * @return 要素<jquery object>
	 */
	_getElmByNameOrClass(parElm, key){
		let elm = parElm.find("[name='" + key + "']");
		if(!elm[0]){
			elm = parElm.find('.' + key);
		}
		return elm;
		
	}
	
	/**
	 * 親要素内からname属性またはclass属性を指定して値を取得する
	 * @param parElm 親要素
	 * @param key name属性名またはclass属性名
	 * @return 値
	 */
	_getValueByNameOrClass(parElm, key){
		let v = undefined;
		let elm = parElm.find("[name='" + key + "']");
		if(elm[0]){
			v = elm.val();
		}else{
			elm = parElm.find('.' + key);
			if(elm[0]){
				v = elm.text();
			}
		}
		return v;
	}
	
	
	
	
	
	
	/**
	 * 全選択の切替
	 * @param triggerCb トリガーチェックボックス
	 */
	switchAllSelection(triggerCb){

		// トリガーチェックボックスのチェックを取得する
		let trigCb = jQuery(triggerCb);
		let trigChecked = trigCb.prop('checked');
		
		// 一覧をループして全行のチェック切替を行う
		let slt = this.param.tbl_slt + ' tbody tr';
		if(slt.charAt(0)!= '#') slt = '#' + slt; // 先頭に「#」がついていないなら付加
		
		jQuery(slt).each((i, elm)=>{
			
			let tr = jQuery(elm);
			
			// TR要素内からname属性またはclass属性を指定してチェックボックス要素を取得する
			let cb = this._getElmByNameOrClass(tr, this.param.cb_slt);
			
			// チェックを切り替える
			cb.prop('checked', trigChecked);
			
		});
		
	}
	
}