
/**
 * モーダル化ライブラリ
 * @since 2022-1-21 | 2022-2-22
 * @version 1.1.2
 * @auther amaraimusi
 * @license MIT
 */
class ModalCat{
	
	/**
	 * モーダル化する
	 * @param xid モーダル化する要素のid属性値
	 * @param 
	 *    - width_rate モーダルの幅率 60～80くらいの範囲で指定する
	 *    - z_index モーダル画面の深度：モーダルより前面に表示される要素があるなら数値をあげることで解決できるかもしれない。
	 *    - closeBackCallback 背景と閉じたときに実行するコールバック関数（省略可】
	 */
	modalize(xid, param){
		
		if(param==null) param ={};
		if(param.width_rate==null) param.width_rate = 80;
		if(param.z_index==null) param.z_index = 999;
		
		let main_xid = xid + '_js_main'; // xidで指定した要素のラップ要素（指定要素の親要素）
		let close_xid = xid + '_js_modal_close';// id属性名：背景クリックによる閉じる

		let content = jQuery('#' + xid);
		this.content = content;
		content.wrap(`<div id='${main_xid}'></div>`); // モーダル化制御のためmain要素でラッピング
		let main = jQuery('#' + main_xid);
		
		let bg_close_html = `<div id='${close_xid}'></div>`;
		main.prepend(bg_close_html);
		
		let bgClose = jQuery(main.find('#' + close_xid)); // 背景クリック閉じる用要素
		
		this.openCallback = param.openCallback; // モーダルオープン・コールバック
		this.closeBackCallback = param.closeBackCallback; // 背景閉じるコールバック
		this.closeCallback = param.closeCallback; // 閉じるコールバック
		
		let z_index = String(param.z_index);
		
		main.css({
			display: 'none',
			height: '100vh',
			position: 'fixed',
			top: '0',
			left: '0',
			width: '100vw',
			'z-index':z_index,
		});
		
		bgClose.css({
			background: 'rgba(0,0,0,0.8)',
			height: '100vh',
			position: 'absolute',
			width: '100vw',
			'z-index':z_index,
		});
		
		content.css({
			background: '#fff',
			left: '50%',
			padding: '40px',
			position: 'absolute',
			top: '50%',
			transform: 'translate(-50%,-50%)',
			width: param.width_rate + '%',
			'z-index':z_index,
		});

		this.main = main;

		bgClose.on('click',()=>{
			this.main.fadeOut();
			if(this.closeBackCallback){
				this.closeBackCallback();
			}
			if(this.closeCallback){
				this.closeCallback(); // 閉じるコールバック → 実行
			}
			return false;
		});
		
	}
	
	open(param){
		this.openParam = param;
		this.content.show();
		this.main.fadeIn(
			"slow",
			()=>{
				if(this.openCallback){
					this.openCallback(this.openParam); // モーダルオープン・コールバック → 実行
				}
			});
		
	}
	
	close(param){
		this.closeParam = param;
		this.main.fadeOut(
			"slow",
			()=>{
				if(this.closeCallback){
					this.closeCallback(this.closeParam); // 閉じるコールバック → 実行
				}
			});
	}
}