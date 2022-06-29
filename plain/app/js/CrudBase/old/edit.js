
/**
 * リロード対策
 * 
 * ブラウザでリロードやF5キーを押した時の対策用です。
 * PHP側のCrudController.phpやReloadCheck.phpと連携して対策が行われています。
 * 
 * 新規登録系の登録完了画面で、リロードされたとき2重登録されないようにします。
 * もしリロードされた場合は、2重登録せず、一覧画面にリダイレクト遷移します。
 * 
 * @date 2010
 * 
 */
function reload2(){

	var d=new Date();
	$('#reload').val(d);
	return null;
}




