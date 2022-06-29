
/**
 * 静的テーブルをページネーション化する。ページネーションはBootstrap4に対応
 * @since 2022-1-20 | 2022-3-3
 * @version 1.0.2
 * @license MIT
 * @auther amaraimusi
 */
class PaginationRain{
	
	/**
	 * 静的テーブルをページネーション化する
	 * @param xid string テーブル要素のid属性値
	 * @param {} param パラメータ
	 * - visible_row_count 表示行数
	 * - pn_position ページネーションの位置 top:テーブルの上, bottom:テーブルの下(デフォルト)
	 * - search_cols_str 検索対象列番リスト文字列　’0,3,5’と入力するとテーブルの1列目、4列名、6列目が検索対象になる。
	 * - last_page_flg 最後ページフラグ  1をセットすると初期表示または検索直後のページが末尾ページになる。
	 * - search_box_flg 検索ボックス表示フラグ 0:非表示, 1:表示(デフォルト)
	 * - search_box_w_xid 検索ボックスラッパーのxid
	 */
	constructor(xid, param){
		
		// パラメータにデフォルトをセット
		if(param == null) param = {};
		if(param.visible_row_count == null ) param.visible_row_count = 8; // 表示行数
		if(param.cur_page_num == null) param.cur_page_num = 0; // 初期カレント行番号
		if(param.pn_position == null ) param.pn_position = 'bottom'; // ページネーションの位置 top:テーブルの上、bottomテーブルの下
		if(param.search_cols_str == null ) param.search_cols_str = '1,2'; // 検索対象列番リスト文字列
		if(param.last_page_flg == null ) param.last_page_flg = 0; // 最後ページフラグ  0:先頭ページ, 1:末尾ページ
		if(param.search_box_flg == null ) param.search_box_flg = 1; 
		if(param.search_box_w_xid == null ) param.search_box_w_xid = null; // 検索ボックスラッパーのxid
		
		
		param['xid'] = xid;
		param.searchCols = this._makeSearchCols(param.search_cols_str); // 検索対象列番リストを作成

		this.tbl = jQuery('#' + xid);
		
		if(param.search_placeholder == null){
			param.search_placeholder = this._getSearchPlaceholder(this.tbl, param.searchCols); // 検索テキストボックスのplaceholderを作成
		}
		
		
		
		this._initSearchBox(param); // 検索ボックスの初期化
		// 検索ボックスのラッパー要素を作成

		this.param = param;
		
		this.refresh();
		

	}
	
	// 検索ボックスの初期化
	_initSearchBox(param){

		if(param.search_box_w_xid){
			this.jq_search_box_w = jQuery('#' + param.search_box_w_xid);
			if(this.jq_search_box_w[0] == null) throw new Error('search_box_w_xid is empty!');
		}else{
			this.tbl.before(`<div id="${param.xid}_search_box_w"></div>`);
			this.jq_search_box_w = jQuery(`#${param.xid}_search_box_w`);
		}
		
		
		// 検索ボックスの表示/非表示
		if(param.search_box_flg == 1){
			this.jq_search_box_w.show();
		}else{
			this.jq_search_box_w.hide();
		}
		
	}
	
	
	/**
	 * リフレッシュ | HTMLテーブルが動的に変更された後に呼び出す。
	 */
	refresh(){
		let param = this.param;
		let tbl = this.tbl;
		let trs = tbl.find('tbody tr');
		
		let num_rows = trs.length;
		if(num_rows == 0) return; //行数が0件ならページネーション作成を中断

		let visible_row_count = param.visible_row_count;
		
		param.num_rows = num_rows; // 全行数
		param.all_page_count = Math.ceil(num_rows / visible_row_count); // 全ページ数
		
				
		// 初期カレントページにlast(最終ページ)が指定されている場合、最終ページ番号をセットする
		param.cur_page_num = 0;
		if(param.last_page_flg){
			param.cur_page_num = param.all_page_count - 1;
		}
		
		// データをHTMLテーブルから作成する
		this.data = this._createDataFromHtmltable(trs);

		// 検索ボックスを生成する
		this._createSearchBox(param, tbl);
		
		// ページネーションをデータに反映する
		this.data = this._reflectPagenationInData(this.data, param);

		// テーブルに適用する
		this._applyToTable(this.data, param);
		
		// ページネーション目次区分を作成する。
		this._createPagenationDiv(tbl, this.data, param);

		this.trs =trs;
	}
	

	/**
	* データをHTMLテーブルから作成する
	* @param trs TR群jQuery要素
	* @return data
	*/
	_createDataFromHtmltable(trs){
		let data = [];
		trs.each((i,elm) => {
			let tr = $(elm);
			let row_index = tr.index();
			let ent = {
				'row_index':i,
				'search_flg':1, // 検索行表示フラグ 0:未一致, 1:一致
				'show_flg':0, // 表示フラグ 0:行を非表示, 1:行を表示
				'trElm':tr,
			};
			data.push(ent);
		});
		return data;
	}
		
	
	/**
	* 検索
	*/
	search(){
		this.param.cur_page_num = 0; // 最初のページに戻す
		
		// 検索文字列を取得する
		let search_str = this.jq_search_tb.val();
		search_str = search_str.trim();

		// 検索をデータに反映する
		this.data = this._reflectSearchInData(this.data, search_str);
		
		// ページネーションをデータに反映する
		this.data = this._reflectPagenationInData(this.data, this.param);
		
		// テーブルに適用する
		this._applyToTable(this.data, this.param);
		
		// 目次を再生成する
		this._createPagenationDiv(this.tbl, this.data, this.param);

	}
	
	
	/**
	* 検索をデータに反映する
	* Reflect the search in data
	* @param data
	* @param search_str 検索文字列
	* @return data
	*/
	_reflectSearchInData(data, search_str){
		for(let i in data){
			let ent = data[i];
			let tr = ent.trElm;
			ent.search_flg　= this._judgSearch(tr, search_str);　
			if(ent.search_flg){
				ent.show_flg = 1;
			}else{
				ent.show_flg = 0;
			}
		}
		return data;
	}
	
	/**
	* ページネーションをデータに反映する
	* @param data
	* @return data
	*/
	_reflectPagenationInData(data, param){
		
		let visible_row_count = param.visible_row_count;// 表示行数
		let cur_page_num = param.cur_page_num; // カレント行番号
		
		// 数値変換
		visible_row_count = visible_row_count * 1;
		cur_page_num = cur_page_num * 1;
		
		let threshold_start = cur_page_num * visible_row_count; // 閾値・スタート
		let threshold_end = (cur_page_num + 1) * visible_row_count; // 閾値・終わり
		
		let counter = 0;
		for(let i in data){
			let ent = data[i];
			if(ent.search_flg){
				if(threshold_start <= counter & counter < threshold_end){
					ent.show_flg = 1;
				}else{
					ent.show_flg = 0;
				}
				counter++;
			}else{
				ent.show_flg = 0;
			}

		}
		return data;
	}
	
	
	/**
	* 検索対象列番リストを作成
	* @param string search_cols_str 検索対象列番リスト文字列
	* @return [] 検索対象列番リスト
	*/
	_makeSearchCols(search_cols_str){
		if(this._empty(search_cols_str)) return [];
		let searchCols = [];
		
		if(isNaN(search_cols_str)){
			let ary = search_cols_str.split(',');
			for(let i in ary){
				let v = ary[i];
				v = v.trim();
				v = v * 1;
				searchCols.push(v);
			}
			
		}else{
			searchCols.push(search_cols_str);
		}
		
		return searchCols;
		
	}
	
	/*
	* 検索テキストボックスのplaceholderを作成
	*/
	_getSearchPlaceholder(tbl, searchCols){
		if(this._empty(searchCols)) return '';
		let ths = tbl.find('th');
		let str = '';
		for(let i in searchCols){
			let col_index = searchCols[i];
			let th_name = ths.eq(col_index).text();
			if(i == 0) {
				str += th_name;
			}else{
				str += ', ' + th_name;
			}
		}
		
		return str;
		
	}
	
	
	/**
	 * テーブルに適用する
	 * @param data
	 * @param param
	 * @param visible_row_count 表示行数
	 * @param search_str 検索文字列
	 */
	_applyToTable(data, param){
		
		for(let i in data){
			let ent = data[i];
			let tr = ent.trElm;
			if(ent.show_flg){
				tr.show();
			}else{
				tr.hide();
			}
		}


	}
	
	/**
	* 検索判定
	* @param tr TR要素
	* @param search_str 検索文字
	* @return 検索判定 0:未一致, 1:一致
	*/
	_judgSearch(tr, search_str){
		if(search_str == null || search_str == '') return 1;
		
		// 空 + 空　	1
		// 空 + 在り	1
		// 空　+ 無し	0
		// 在 + 無	1

		let tds = tr.find('td');
		let join_text = '';
		for(let i in this.param.searchCols){
			let col_index = this.param.searchCols[i];
			let td_text = tds.eq(col_index).text();
			join_text += td_text;
		}
		
		if(join_text.indexOf(search_str) != -1) {
			return 1;
		}
		
		return 0;
		
	}
	
	
	/**
	* ページネーション目次区分を作成する
	* @param tbl HTMLテーブル要素
	* @param data
	* @param param
	*/
	_createPagenationDiv(tbl, data, param){
		
		// ページネーション目次区分が未作成なら作成する。
		if(this.pagenationDiv == null){
			let pagenation_div = param.xid + '_patination_div';
			let pagenation_div_html = `<div id='${pagenation_div}'></div>`;
			if(param.pn_position == 'top'){
				tbl.before(pagenation_div_html);
			}else{
				tbl.after(pagenation_div_html);
			}
			this.pagenationDiv = jQuery('#' + pagenation_div);
		}
		
		let items_html = '';
		let item_counter = 0; // 表示対象の項目カウンター
		let page_no = 0; // ページカウンター
		let visible_row_count = param.visible_row_count; // 表示行数
		let page_item_class = param.xid + '_page_item'; // 項目のclass属性値

		for(let i in data){
			let ent = data[i];
			if(ent.search_flg){
				if(item_counter % visible_row_count == 0){
					
					let active_str = '';
					if(page_no == param.cur_page_num) active_str = 'active';
			
					items_html += `
						<li class="page-item ${active_str} ${page_item_class}" data-page-no="${page_no}">
							<span class="page-link">${page_no + 1}</span>
						</li>
						`;
					page_no++;
				}
				item_counter++;
			}
			
		}
		
		if(this.toc){
			this.toc.remove();
		}
		
		let toc_xid = param.xid + '_toc'; // 目次要素のid属性値 table of contents
		let toc_html = `<ul id="${toc_xid}" class="pagination">${items_html}</ul>`;
		
		this.pagenationDiv.html(toc_html);
		this.jQPageItems = jQuery('.' + page_item_class); // 目次要素を取得
		
		
		this.jQPageItems.click((evt)=>{
			let jqItem = $(evt.currentTarget);
			this._clickPageItem(jqItem);
		});

	}
	
	/**
	* 項目クリックイベント
	*/
	_clickPageItem(jqItem){
		this.jQPageItems.removeClass('active');
		jqItem.addClass('active');
		
		let page_no = jqItem.attr('data-page-no');
		
		this.param.cur_page_num = page_no;
		
		//ページネーションをデータに反映する
		this.data = this._reflectPagenationInData(this.data, this.param);

		// テーブルに適用する
		this._applyToTable(this.data, this.param);
		
		
	}

	
	// 検索ボックスHTMLを作成する
	_createSearchBox(param, tbl){
		
		param.search_tb_xid = param.xid + '_textbox';
		param.search_btn_xid = param.xid + '_search_btn';
		
		let html = `
			<div style='margin-bottom:0.8em;' class='row'>
				<div class='col-12 col-md-8'>
					<input id='${param.search_tb_xid}' type='text' class='form-control' placeholder='${param.search_placeholder}' />
				</div>
				<div class='col-12 col-md-4'>
					<button id='${param.search_btn_xid}' class='btn btn-primary'>検索</button>
				</div>
			</div>
		`;
		
		this.jq_search_box_w.html(html);
		
		this.jq_search_tb = $('#' + param.search_tb_xid);
		$('#' + param.search_btn_xid).click((evt)=>{
			this.search();
		});	
		
		// 検索テキストボックス要素にEnterキー押下イベントを組み込む
		this.jq_search_tb.keypress((e)=>{
			if(e.which==13){ // Enterキーが押下された場合
				this.search();
			}
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