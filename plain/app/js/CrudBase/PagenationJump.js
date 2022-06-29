/**
 * ページネーションジャンプ
 * 
 * @note
 * ページネーションにジャンプ機能を付ける
 * 
 * 使い方
 * 下記のような要素をHTMLに埋め込む
 * <div class="pagenation_jump" data-count="1271" data-hina-url="/animal_park/neko?page_no=1&row_limit=50&sort_field=Neko.sort_no&sort_desc=0&act_flg=2&kj_delete_flg=0&row_limit=50" style="display:inline-block"></div>
 * 
 * @date 2019-7-26 | 2020-8-13
 * @license MIT
 * @version 1.0.1
 */
class PagenationJump{
	
	/**
	 * 初期化
	 * 
	 * @param param
	 * - div_xid 当機能埋込先区分のid属性
	 */
	init(param){
		
		this.param = this._setParamIfEmpty(param);
		this.tDiv = jQuery('#' + this.param.xid); //  This division
		if(!this.tDiv[0]) return; 
		
		// 当機能のHTMLを作成および埋込
		let html = this._createHtml(); 
		this.tDiv.html(html);
		
		this.showBtn = this.tDiv.find('.cbpjump_show_btn'); // 表示ボタン
		this.div1 = this.tDiv.find('.cbpjump_div1'); // 区分1
		this.tb = this.tDiv.find('.cbpjump_tb'); // テキストボックス
		this.jumpBtn = this.tDiv.find('.cbpjump_jump_btn'); // ジャンプボタン
		
		let row_limit = this.tDiv.attr('data-row-limit'); // 表示件数とを取得する
		let data_count = this.tDiv.attr('data-count'); // データ件数とを取得する
		
		// 最大ページ件数を算出する
		let max_page_count = 1;
		if(!this._empty(row_limit)){
			max_page_count = Math.ceil(data_count / row_limit);
		}
		
		// 雛型URLの取得
		let hina_url = this.tDiv.attr('data-hina-url');
		if(this._empty(hina_url)) return;
		hina_url = hina_url.replace(/page_no=[0-9]*/g, 'page_no=%0');
		
		this.param['row_limit'] = row_limit;
		this.param['data_count'] = data_count;
		this.param['max_page_count'] = max_page_count;
		this.param['hina_url'] = hina_url;
		
		this.addClickShowBtn(this.showBtn); // 表示ボタンクリックイベントを追加
		this.addClickJumpBtn(this.jumpBtn); // ジャンプボタンクリックイベントを追加
		this.addEnterTb(this.tb); // テキストボックスにEnterイベントを追加
		

		
	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};

		if(param['xid'] == null) param['xid'] = 'pagenation_jump';
		
		return param;
	}
	
	
	/**
	 * 当機能のHTMLを作成および埋込
	 */
	_createHtml(){
		// テキストボックス cbpjump_tb、ジャンプボタン cbpjump_btn
		let html = `
	<button class="cbpjump_show_btn btn btn-outline-primary btn-sm" title="ページジャンプ">
			⇒
	</button>
	<div style="display:inline-block">
		<div class="cbpjump_div1" style="margin-right:16px;display:none">
			<input class="cbpjump_tb" type="textbox" style="width:60px">
			<input class="cbpjump_jump_btn btn btn-warning btn-sm" type="button" value='ページジャンプ' />
		</div>
	</div>
		`;
		return html;
	}
	
	
	/**
	 * 表示ボタンクリックイベントを追加
	 * @param jQuery btn 表示ボタン
	 */
	addClickShowBtn(btn){
		
		btn.click((evt)=>{
			this._clickShowBtn();
		});

	}
	
	
	/**
	 * 表示ボタンクリックイベント
	 */
	_clickShowBtn(){
		this.div1.toggle(100);
	}
	
	
	/**
	 * ジャンプボタンクリックイベントを追加
	 * @param jQuery btn 表示ボタン
	 */
	addClickJumpBtn(btn){
		
		btn.click((evt)=>{
			this._clickJumpBtn();
		});

	}
	
	
	/**
	 * ジャンプボタンクリックイベント
	 */
	_clickJumpBtn(){
		
		let page_no = this.tb.val(); // ページ番号を取得する
		page_no += ''; // 文字列扱いにする
		page_no = this._toHalfWidth(page_no);
		page_no = page_no.trim();
		
		// 入力チェック
		if(page_no == '' || page_no == null){
			alert('ページ番号を入力してください');
			return;
		}
		if(isNaN(page_no)){
			alert('ページ番号は数値を入力してください');
			return;
		}
		
		page_no = page_no * 1; // 数値化する
		
		if(page_no < 1) page_no = 1; // ページ番号が1未満なら1にする。
		
		// ページ番号が最大ページ件数を超えるなら最大ページ件数をセットする。
		if(page_no > this.param.max_page_count) page_no = this.param.max_page_count; 
		
		page_no -= 1; // 0数え形式にする
		
		// ジャンプ先URLを組み立て
		let url = this.param.hina_url;
		url = url.replace('%0', page_no);

		// ジャンプ
		location.href = url;
		
	}
	
	
	/**
	 * テキストボックスにEnterイベントを追加
	 * @param object tb テキストボックス
	 */
	addEnterTb(tb){
		
		// テキストボックス要素にEnterキー押下イベントを組み込む
		tb.keypress((e) => {
			if(e.which==13){ // Enterキーが押下された場合
				this._clickJumpBtn(); // ジャンプボタンクリックイベントを実行する
			}
		});	
	}
	

	/**
	 * 全角を半角に変換する
	 * @param string str 全角文字
	 * @return string 半角文字
	 */
	_toHalfWidth(str) {
		return str.replace(/[Ａ-Ｚａ-ｚ０-９！-～]/g, (s) => {
			return String.fromCharCode(s.charCodeAt(0)-0xFEE0);
		});
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