/**
 * CrudBase:indexページの共通JavaScript
 * 
 * @version 1.2.4
 * @date 2015-1-1 | 2017-9-25
 */

jQuery(function(){
	
	// もし入力エラーであるなら詳細要素を表示します。
	errShowDetail();
	
});

/**
 * もし入力エラーであるなら詳細要素を表示します。
 */
function errShowDetail(){
	
	// エラー要素および詳細要素が存在しなければ、処理をしません。
	if(!jQuery('#err')[0] || !jQuery('#detail_div')[0]) return;
	
	// エラーメッセージが空でない場合、詳細要素を表示します。
	var msg = jQuery('#err').html();
	msg = msg.trim();
	if(msg!=""){
		jQuery('#detail_div').show();
	}
	
	
}



/**
 * 検索条件をリセットする
 * 
 * リセット対象外フィールドを指定することができます。
 * @param array exempts リセット対象外フィールド配列（省略可）
 * @author k-uehara
 */
function resetKjs(exempts){
	
	if(exempts==null){
		exempts=[];
	}
	
	//デフォルト検索条件JSONを取得およびパースする。
	var def_kjs_json=jQuery('#def_kjs_json').val();
	var defKjs=$.parseJSON(def_kjs_json);
	
	for(var key in defKjs){
		
		//リセット対象外でなければ、検索条件入力フォームをリセットする。
		if(exempts.indexOf(key) < 0){
			jQuery('#' + key).val(defKjs[key]);
		}
		
	}
}



/**
 * 列並替画面に遷移する
 * @param page_code ページコード (モデル名のスネーク表示）
 */
function moveClmSorterBase(page_code){
	
	//列表示配列を取得して、URLクエリ用にエンコードする。
	var csh_ary=csh.getCshAry();
	
	var csh_json = null;
	if(csh_ary.length == 0){
		csh_json = jQuery('#csh_json').val();
	}else{
		csh_json = JSON.stringify(csh_ary);
	}
	
	var csh_u=encodeURIComponent(csh_json);

	//列並替画面に遷移する。
	var webroot = jQuery('#webroot').val();
	var url = webroot + 'clm_sorter?p=' + page_code + '&csh_u=' + csh_u;
	location.href=url;
	
}




/**
 * SVG画像ファイルを読み込んで指定要素に表示する（指定要素が空である場合のみ）
 * @param svg_fn SVG画像ファイル名
 * @param svg_slt SVG画像を表示する指定要素セレクタ
 */
function loadSvg(svg_fn,svg_slt){
	
	jQuery(svg_slt + ":empty").load(svg_fn, function(){
		
	});
	
	
	
	
}

/**
 * 
 * SVG画像ファイルを読込と表示切替機能
 * @param svg_fn SVG画像ファイル名
 * @param svg_slt SVG画像を表示する指定要素セレクタ
 * @returns
 */
function toggleSvg(svg_fn,svg_slt){
	
	// SVG画像ファイルを読み込んで指定要素に表示する（指定要素が空である場合のみ）
	loadSvg(svg_fn,svg_slt);
	
	var elm = jQuery(svg_slt);
	
	var display = elm.css('display');
	if(display=='none'){
		elm.show();
	}else{
		elm.hide();
	}
	
}





/**
 * 行データによるリンク
 * @param thisElm this要素
 * @param base_url 基本URL： 可変は%0とする（例：game_text?kj_scene_id=%0）
 * @param field フィールド：　基本URLの可変部分に適用する行のフィールド。省略時はid。
 * @returns
 */
function linkByRowdata(thisElm,base_url,field){
	
	thisElm = jQuery(thisElm);
	
	if(field==null){
		field = 'id';
	}
	
	//	this要素からTR要素を取得する
	var tr = thisElm.parents('tr');
	
	//	TR要素からフィールド要素を取得する
	var fElm = tr.find('.' + field);
	
	//	フィールド要素から可変値を取得する
	var v = fElm.text();
	
	//	基本URLに可変値を置換適用。
	base_url = base_url.replace( '%0' , v ) ;
	
	//	画面遷移
	location.href = base_url;
	
	
}


