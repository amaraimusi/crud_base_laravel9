
/**
 * ポップアップ化ライブラリ
 * @note 
 *     id属性で指定した要素をポップアップ化する。
 *     「登録完了」時の通知用ポップアップとして活用できる。
 *     ポップ発布は左上、右上、右下、左下の4方向に設定可能。
 *     ポップアップが消えるタイミングでコールバックを実行できる。
 *     ポップアップをクリックするとポップアップは消える。
 * @since 2022-1-28
 * @version 1.0.0
 * @auther amaraimusi
 * @license MIT
 */
class PopupCat{
	
	/**
	 * ポップアップ化する
	 * @param xid ポップアップ化する要素のID属性
	 * @param param
	 *      - direction_type     方向タイプ left_top:左上,  right_top:右上,  left_bottom:左下,  right_bottom:右下, 
	 *      - z_index     ポップアップ要素の深度
	 *      - fadein_time     フェードイン時間（ms)
	 *      - set_timeout_time     ポップアップ表示後から消えるまでの時間(ms)
	 *      - popupClickCallback     ポップアップクリックコールバック
	 * 
	 */
	popupize(xid, param){
		this.popupElm = jQuery('#' + xid);
		if(param == null) param = {};
		if(param.direction_type==null) param.direction_type='right_bottom';
		if(param.z_index==null) param.z_index='2';
		if(param.fadein_time==null) param.fadein_time=1000;
		if(param.set_timeout_time==null) param.set_timeout_time=3500;
		this.popupClickCallback = param.popupClickCallback;

		let css_left = '0px';
		let css_top = '0px';
		let css_right = '0px';
		let css_bottom = '0px';
		
		switch(param.direction_type){
			case 'left_top':
				css_right = 'auto';
				css_bottom = 'auto';
				break;
			case 'right_top':
				css_left = 'auto';
				css_bottom = 'auto';
				break;
			case 'left_bottom':
				css_right = 'auto';
				css_top = 'auto';
				break;
			case 'right_bottom':
				css_left = 'auto';
				css_top = 'auto';
				break;
			default:
				throw Error('PopupCat Error PCAT220129A')
			
		}
		this.popupElm.css({
			display: 'none',
			position: 'fixed',
			'left': css_left,
			'top': css_top,
			'right': css_right,
			'bottom': css_bottom,
			'z-index': param.z_index,
		});
		
		this.after_cb_flg = false;
		
		this.popupElm.click((evt)=>{
			let elm = $(evt.currentTarget);
			if(this.popupClickCallback){
				this.popupClickCallback();
			}

			elm.hide();
		});
		
		
		this.param = param;
		
		
	}
	
	/** ポップアップ要素を取得
	 */
	getPopupElm(){
		return this.popupElm;
	}
	
	/** ポップアップ要素を取得
	 * @param callback function ポップアップが消えたときに実行するコールバック
	 */
	pop(callback){
		
		this.afterCallback = callback;
		this.after_cb_flg = false;
		
		this.popupElm.hide();
		this.popupElm.fadeIn(this.param.fadein_time, ()=>{
			window.setTimeout(()=>{
				this.popupElm.hide();
				if(this.afterCallback){
					this.afterCallback();
				} 
				
			}, this.param.set_timeout_time);
		});
	}
	
	
	
}
