/**
 * 折り畳み式テキストエリア
 * 
 * @date 2019-4-12 | 2019-4-15
 * @version 1.1.0
 * 
 */
class FoldingTa{
	
	
	/**
	 * 初期化
	 * 
	 * @param param
	 * - form_slt フォームセレクタ
	 * - midasi_length 見出し文字数
	 */
	init(param){
		param = this._setParamIfEmpty(param);
		this.param = param;
		this.formElm = jQuery(param.form_slt); // フォーム要素

		var boxs = this._initBoxs(); // ボックスリスト     テキストエリア要素などが詰めこまれている。
		boxs = this._addPreviewElms(boxs); // プレビュー要素を作成し、その要素をボックスリストに追加する。
		this._addEventTenkaiClick(boxs); // 展開ボタンのクリックイベントを追加
		
		this.boxs = boxs;
		
	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};
		if(param['form_slt'] == null) throw new Error("Empty 'form_slt' !");
		if(param['midasi_length'] == null) param['midasi_length']=20;
		
		return param;
	}
	
	
	/**
	 * ボックスリストの初期化
	 * 
	 * @note
	 * class属性が「folding_ta」であるテキストエリア要素を取得してボックスリストに詰める。
	 * @return array ボックスリスト
	 */
	_initBoxs(){
		var boxs = [];
		this.formElm.find('[data-folding-ta]').each((i, elm)=>{
			var taElm = jQuery(elm); // テキストエリア要素を取得
			
			// テキストエリア要素から見出し文字数を取得する
			var midasi_len = taElm.attr('data-folding-ta');
			if(midasi_len == null || midasi_len=='' ) midasi_len = this.param.midasi_length;
			var box = {'taElm': taElm, 'midasi_len':midasi_len};
			boxs.push(box);
		});

		return boxs;
	}
	
	
	/**
	 * 見出しテキストを取得する
	 * @param string full_text		フルテキスト（テキストエリアから取得した元のテキスト）
	 * @param string midasi_len 見出し文字数
	 * @return string 見出しテキスト		見出し用に短くしたテキスト
	 */
	_getMidasiText(full_text, midasi_len){
		if(full_text == '' | full_text==null) return '';
		
		var midasi_text = '';
		if(full_text.length > this.param.midasi_length){
			midasi_text = full_text.substring(0, midasi_len); // 見出し文字数文だけ切り出し、見出しテキストにセットする。
		}else{
			midasi_text = full_text;
		}
		
		midasi_text = this._xss_sanitize(midasi_text); // XSSサニタイズ
		
		return midasi_text;
	}
	
	
	/**
	 * プレビュー要素を作成し、その要素をボックスリストに追加する。
	 * @return array ボックスリスト
	 */
	_addPreviewElms(boxs){
		
		// プレビュー要素を作成し、テキストエリアの上に挿入する
		for(var i in boxs){
			var box = boxs[i];
			var taElm = box.taElm;
			
			// 見出しテキストを取得する
			var midasi_text = this._getMidasiText(taElm.val(), box.midasi_len);
				
			var preview_html = `
				<div class="folding_ta_preview" data-folding-ta-p-i="${i}" ">
					<div class="folding_ta_midasi" style="display:inline-block;margin-right:5px">${midasi_text}</div>
					<input type="button" value='...' class="folding_ta_tenkai btn btn-secondary btn-sm" data-folding-ta-p-i="${i}" style="margin-top:0px" />
				</div>
			`;
			
			taElm.before(preview_html);
		}
		
		// ▼プレビュー要素、見出し要素、展開ボタン要素を取得し、ボックスにセットする。
		this.formElm.find('.folding_ta_preview').each((i, elm)=>{
			var previewElm = jQuery(elm);
			var index = previewElm.attr('data-folding-ta-p-i');
			var box = boxs[index];
			box['previewElm'] = previewElm;
			
			var midasiElm = previewElm.find('.folding_ta_midasi');
			box['midasiElm'] = midasiElm;
			
			var tenkaiElm = previewElm.find('.folding_ta_tenkai');
			box['tenkaiElm'] = tenkaiElm;
			
		});

		return boxs;
	}
	
	
	/**
	 * 展開ボタンのクリックイベントを追加
	 * @param array boxs ボックスリスト
	 */
	_addEventTenkaiClick(boxs){
		
		for(var i in boxs){
			var box = boxs[i];
			box.tenkaiElm.click(evt=>{
				var btnElm = jQuery(evt.currentTarget);
				this.clickTenkai(btnElm); // 展開ボタンクリックイベント
			});
			
			box.taElm.hide(); // テキストエリアを隠す
			
		}		
	}
	
	
	/**
	 * 展開ボタンクリックイベント
	 * @param jQuery btnElm 展開ボタン要素
	 * 
	 */
	clickTenkai(btnElm){
		
		var index = btnElm.attr('data-folding-ta-p-i'); // ボックスリストのインデックスを取得する
		
		var box = this.boxs[index];
		if(box.taElm.css('display') == 'none'){
			box.taElm.show();
			box.midasiElm.hide();
			box.tenkaiElm.attr('value', '閉じる');
			
		}else{
			
			var midasi_text = this._getMidasiText(box.taElm.val(), box.midasi_len);// 見出しテキストを取得する
			box.midasiElm.html(midasi_text);
			box.taElm.hide();
			box.midasiElm.show();
			box.tenkaiElm.attr('value', '...');
			
		}
		
	}
	
	
	/**
	 * 一括反映
	 * @note
	 * 外部によりテキストエリアが書き換えられた時に、このメソッドを呼び出すと、プレビューの見出しに一括で反映させる。
	 */
	reflection(){
		for(var i in this.boxs){
			var box = this.boxs[i];
			var text = box.taElm.val();
			var midasi_text = this._getMidasiText(text, box.midasi_len);
			box.midasiElm.html(midasi_text);
		}
	}
	
	
	/**
	 * XSSサニタイズ
	 * 
	 * @note
	 * 「<」と「>」のみサニタイズする
	 * 
	 * @param any data サニタイズ対象データ | 値および配列を指定
	 * @returns サニタイズ後のデータ
	 */
	_xss_sanitize(data){
		if(typeof data == 'object'){
			for(var i in data){
				data[i] = this._xss_sanitize(data[i]);
			}
			return data;
		}
		
		else if(typeof data == 'string'){
			return data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}
		
		else{
			return data;
		}
	}
	
	
	
}



