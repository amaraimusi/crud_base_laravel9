
var changePw; // パスワード変更の制御クラス

jQuery(()=> {
	init();//初期化
	
});


var crudBase;//AjaxによるCRUD

/**
 *  パスワード変更画面の初期化
 * 
 * @version 1.0.0
 * @since 2022-1-25
 */
function init(){
	let csrf_token = jQuery('#csrf_token').val(); // CSRFトークンを取得（Ajaxで必要）

	let crud_base_json = jQuery('#crud_base_json').val();
	let crudBaseData = jQuery.parseJSON(crud_base_json);
	crudBaseData['csrf_token'] = csrf_token;

	// CRUD基本クラス
	crudBase = new CrudBase(crudBaseData);

	changePw = new ChangePw();

	crudBase.newVersionReload(); // 新バージョンリロード
}

function reg(){
	changePw.reg();
}


