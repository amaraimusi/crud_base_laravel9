
/**
 * 年月による日付範囲入力【拡張】 | RangeYmEx.js
 * 
 * @note
 * RangeYm.jsが必要。
 * 
 * @date 2019-8-17
 * @license MIT
 * @version 1.0.0
 */
class RangeYmEx{
	
	/**
	 * 初期化
	 * 
	 */
	init(param){
		
		let boxs = {};
		jQuery('.range_ym_ex').each((i, elm)=>{
			
			elm = jQuery(elm);
			
			// 各種属性を取得
			let xid = elm.attr('id');
			let field=elm.attr('data-field');
			let wamei = elm.attr('data-wamei');
			if(field == null) field = xid;
			
			// 「年月による日付範囲入力」オブジェクト
			let rngYm = new RangeYm();
			rngYm.init({
				div_xid:elm,
				field:field,
				wamei:wamei,
			});

			let box = {
					elm:elm,
					field:field,
					wamei:wamei,
					rngYmObj:rngYm,
					};
			boxs[field] = box;
		});
		
		this.boxs = boxs;
	}

	
	
}