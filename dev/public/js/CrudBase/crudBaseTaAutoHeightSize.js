/**
 * テキストエリア高さ自動調整クラス
 * @date 2021-6-10
 * @license MIT
 * @version 1.0.0
 */
class CrudBaseTaAutoHeightSize{
	
	/**
	 * 初期化
	 * 
	 */
	init(){
		
		jQuery('.auto_height_size').each((i,elm) => {
			let taElm = jQuery(elm);
			
			// 文字入力した時に高さ自動調整
			taElm.attr("rows", 1).on("input", e => {
				jQuery(e.target).height(0).innerHeight(e.target.scrollHeight);
			});
			
			// クリックしたときに自動調整
			taElm.attr("rows", 1).click("input", e => {
				jQuery(e.target).height(0).innerHeight(e.target.scrollHeight);
			});
		
		});
	}
	
	editShow(form){
		form.find('.auto_height_size').each((i,elm) => {
			let taElm = jQuery(elm);
			taElm.click();
		});
	}
	
	copyShow(form){
		form.find('.auto_height_size').each((i,elm) => {
			let taElm = jQuery(elm);
			taElm.click();
		});
	}
	
	newInpShow(form){
		form.find('.auto_height_size').each((i,elm) => {
			let taElm = jQuery(elm);
			taElm.click();
		});
	}
	
	
	
	
}