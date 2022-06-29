
/**
 * インポート・ファイルアップロードクラス
 * 
 * @note
 * インポートに特化したファイルアップロード拡張クラス
 * 
 * @version 1.0.1
 * @date 2017-6-26 | 2017-7-2
 * 
 * @param param
 * - fu_slt: 		ファイルアップロード要素のセレクタ
 * - ajax_url: 	 	AJAX通信先のURL: WordPressの場合、省略可。
 * - preview_flg: 	プレビューフラグ: 0:プレビューを表示せず即座にアップロード  1(デフォルト):プレビューを表示する
 * - caption: 		見出し名: デフォルトの見出し → File Upload
 * - caption_color:  見出し文字色: ふちの色
 * - caption_color2: 見出し文字色: デフォルトは白
 * - back_color:	背景色
 * - backimg_fp: 	背景画像ファイルパス
 * - wrap_xid: 		ラッパーのID属性: ファイルアップロード要素のラッパーは当クラスで自動生成される。
 * - fw: 	フレームワーク識別子: wp:WordPress
 * - wp_ajax_action: 	AJAXアクション: WordPressの場合は必須。
 * - success_callback: 	成功コールバック: AJAXレスポンス後かつ成功時に呼び出されるコールバック関数: コールバックの引数は1つ存在する。その引数にはPHP側からのレスポンスが格納されている。
 * - suc_msg: 	成功メッセージ
 * - suc_toggle_sec: 	成功表示秒: 成功メッセージを表示する時間（秒）。 0を設定するとずっと表示しつづける。
 */
var ImportFu =function(param){

	this.param = param;
	
	// ファイルアップロード要素のラッパー要素
	this.fu_wrap; 
	
	// ファイルオブジェクト
	this.files;
	
	var self=this; // Instance of myself.

	/**
	 * initialized.
	 */
	this.constract=function(){
		
		// If Param property is empty, set a value.
		this.param = _setParamIfEmpty(this.param);
		
		// ファイルアップロード要素をラベル等でラップ、および画像要素の追加
		_wrapFu(this.param);
		
		// ファイルアップロードイベントを追加する
		_addFileuploadEvent(this.param);
		
		// DnDイベントを追加する（DnD→ドラッグアンドドロップイベント）
		_addDnDEvent(this.param);

	}
	
	// If Param property is empty, set a value.
	function _setParamIfEmpty(param){
		
		if(param == undefined){
			param = {};
		}
		
		if(param['fu_slt'] == undefined){
			throw new Error('The fu_slt in param is empty!');
		}
		var fu_slt2 = _sltToCode(param['fu_slt']); // セレクタから識別子「#」「.」を取り外す
		
		if(param['ajax_url'] == undefined){
			param['ajax_url'] = '';
		}
		
		if(param['preview_flg'] == undefined){
			param['preview_flg'] = 1;
		}
		
		if(param['caption'] == undefined){
			param['caption'] = 'File upload';
		}
		
		if(param['caption_color'] == undefined){
			param['caption_color'] = '#a698c9';
		}
		
		if(param['caption_color2'] == undefined){
			param['caption_color2'] = '#FFFFFF';
		}
		
		if(param['back_color'] == undefined){
			param['back_color'] = '#e3dfee';
		}
		
		if(param['caption_font_size'] == undefined){
			param['caption_font_size'] = '40px';
		}
		
		if(param['backimg_fp'] == undefined){
			param['backimg_fp'] = '';
		}
		
		if(param['wrap_xid'] == undefined){
			param['wrap_xid'] = fu_slt2 + '_wrap';
		}

		if(param['fw'] == undefined){
			param['fw'] = '';
		}
		
		if(param['wp_ajax_action'] == undefined){
			if(param['fw']=='wp'){
				throw Error('The wp_ajax_action in param is empty! (WordPress only)');
			}
			param['wp_ajax_action'] = '';
		}

		if(param['success_callback'] == undefined){
			param['success_callback'] = null;
		}

		if(param['suc_msg_xid'] == undefined){
			param['suc_msg_xid'] = fu_slt2 + '_suc_msg';
		}

		if(param['suc_msg'] == undefined){
			param['suc_msg'] = '読込が終わりました。';
		}

		if(param['suc_toggle_sec'] == undefined){
			param['suc_toggle_sec'] = 3000;
		}
		
		
		
		// ▽▽ 以下は隠し設定
		
		if(param['fuWrapCss'] == undefined){
			param['fuWrapCss'] = {
					'background-color':param['back_color'],
					'border-radius':'5px',
					'display':'inline-block',
				};
		}
		
		if(param['label_xid'] == undefined){
			param['label_xid'] = fu_slt2 + '_label';
		}
		
		if(param['caption_xid'] == undefined){
			param['caption_xid'] = fu_slt2 + '_caption';
		}
		
		if(param['preview_xid'] == undefined){
			param['preview_xid'] = fu_slt2 + '_preview';
		}
		
		if(param['captionCss'] == undefined){
			var caption_color = param['caption_color'];
			var caption_color2 = param['caption_color2'];
			var caption_font_size = param['caption_font_size'];
			param['captionCss'] = {
					'padding' : '0px 20px 0px 20px',
					'color' : caption_color2,
					'font-size' : caption_font_size,
					'font-weight' : 'bold',
					'text-shadow' : '2px 2px 1px ' + caption_color + ',-2px 2px 1px ' + caption_color + ',2px -2px 1px ' + caption_color + ',-2px -2px 1px ' + caption_color + '',
				};
		}

		if(param['err_xid'] == undefined){
			param['err_xid'] = fu_slt2 + '_err';
		}
		
		
		
		
		
		return param;
	}
	
	
	
	
	
	
	/**
	 * ファイルアップロード要素をラベル等でラップ、および画像要素の追加
	 * @param param
	 */
	function _wrapFu(param){
		
		var fu_slt = param.fu_slt;
		var fu = jQuery(fu_slt);
		var fu_xid = _sltToCode(fu_slt); // セレクタから識別子「#」「.」を取り外したコードを取得する
		fu.hide();
		

		// ファイルアップロード要素をラベル要素でラッピングする。
		fu.wrap("<div id='" + param.wrap_xid + "'  ><label id = '" + param.label_xid + "' for='" + fu_xid + "' ></label></div>");
		
		
		// ラッパー要素へCSSスタイルを適用する
		var fu_wrap = jQuery('#' + param.wrap_xid);
		fu_wrap.css(param.fuWrapCss);
		
		
		// 見出しを追加する
		var label = fu_wrap.find('#' + param.label_xid);
		var caption_html = "<div id='" + param.caption_xid + "' class='imp_fu_caption'>" + param.caption + "</div>";
		label.append(caption_html);
		var caption = fu_wrap.find('#' + param.caption_xid);
		
		caption.css(param.captionCss);
		
		
		// 背景画像要素を追加する
		if(!_empty(param.backimg_fp)){
			var img_html = "<img src='" + param.backimg_fp + "' />";
			fu_wrap.append(img_html);
		}
		
		
		// プレビュー要素を作成する。
		var preview_html = 
			"<div id='" + param.preview_xid + "' style='display:none;margin:0px 20px 20px 20px;'>" + 
			"	<div id='" + param.pre_fn_xid + "' class='imp_fu_pre_fn'></div>" + 
			"	<div class='imp_fu_pre_btns' style='margin-top:10px'>" +
			"		<input type='button' class='imp_fu_pre_exe_btn btn btn-success btn' value='アップロード' />" +
			"		<input type='button' class='imp_fu_pre_cancel_btn btn btn-secondary btn' value='キャンセル' />" +
			"	</div>" + 
			"</div>";
		fu_wrap.append(preview_html);
		
		
		// ローディングGIFを埋め込む
		var gifBase64 = _getLodingGifBase64();
		var loding_gif = 
			"<div class='loding_gif' style='display:none;padding:20px;'>" +
			"	<img src='" + gifBase64 + "' /> 読み込み中・・・" +
			"</div>";
		fu_wrap.append(loding_gif);
		
		
		// プレビュー要素のアップロード実行ボタンにイベントを組み込む
		var imp_fu_pre_exe_btn = fu_wrap.find('.imp_fu_pre_exe_btn');
		imp_fu_pre_exe_btn.click(function(e){
			_clickPreExeBtn(); // アップロード実行ボタンの実行処理
		});
		
		// プレビュー要素のキャンセルボタンにイベントを組み込む
		var cancel_btn = fu_wrap.find('.imp_fu_pre_cancel_btn');
		cancel_btn.click(function(e){
			_showBeginning(); // 初めに戻す
		});
		
		
		// 成功メッセージ要素を追加する
		var suc_msg_html = "<div id='" + param.suc_msg_xid + "' class='text-success' style='display:none'>" + param.suc_msg + "</div>";
		fu_wrap.after(suc_msg_html);
		
		
		// エラー要素を追加する
		var err_html = "<div id='" + param.err_xid + "' class='text-danger' ></div>";
		fu_wrap.after(err_html);

		self.fu_wrap = fu_wrap;

	}
	
	
	
	
	
	
	
	
	/**
	 * ファイルアップロードイベントを追加する
	 * @param param
	 */
	function _addFileuploadEvent(param){

		//ファイルアップロードイベント
		jQuery(param.fu_slt).change(function(e) {
			
			var files = e.target.files;
			
			if(param.preview_flg){
				// プレビューを表示する
				_showPreview(files);
				
			}else{
				// AJAXによるアップロード
				_uploadByAjax(files);
			}

		});		
	}
	
	
	/**
	 * DnDイベントを追加する（DnD→ドラッグアンドドロップイベント）
	 * @param param
	 */
	function _addDnDEvent(param){
		var wrapElm = jQuery('#' + param.wrap_xid);
		
		wrapElm[0].addEventListener('drop',function(evt){
			evt.stopPropagation();
			evt.preventDefault();
	
			var files = evt.dataTransfer.files; 
			
			if(param.preview_flg){
				// プレビューを表示する
				_showPreview(files);
				
			}else{
				// AJAXによるアップロード
				_uploadByAjax(files);
			}
	
	
		},false);
		
		wrapElm[0].addEventListener('dragover',function(evt){
			// evt.stopPropagation();
			evt.preventDefault();
		},false);
		

	}
	
	
	
	
	/**
	 * AJAXによるアップロード
	 * @param files ファイルオブジェクト
	 */
	function _uploadByAjax(files){
		
		var param = self.param;

		_showLoading(); // ローディング表示
		
		var oFile = files[0];
		
		// IEはファイル要素にnullが入っていてもチェンジイベントが発生するため対策する。
		if(oFile==null){return;}

		var reader = new FileReader();
		reader.readAsDataURL(oFile);
	
		//ファイル読込成功イベント
		reader.onload = function(evt) {
			
			// AJAXのURLを取得
		    var url = _getAjaxUrl();

		    var fu_slt = param.fu_slt;
		    var fd = new FormData();
		    fd.append( "upload_file", jQuery(fu_slt).prop("files")[0] );
		    
			// WordPressのAjaxで必要なパラメータをセットする
			if(param.fw=='wp'){
				fd = _setFormDataForWp(fd,param.wp_ajax_action);
			}
			
			jQuery.ajax({
				type: "POST",
				url: url,
				data: fd,
				cache: false,
				dataType: "text",
				processData : false,
				contentType : false,


			}).done(function(str_json, type) {
				
				var data;
				try{
					data = JSON.parse(str_json);

					// エラーメッセージが空である場合（成功時）
					if(_empty(data['err_msg'])){
						
						_showSuccess(); // 成功の表示
						
						// 成功コールバックが設定されていれば実行する
						if(!_empty(param.success_callback)){
							param.success_callback(data);
						}
					}
					
					// エラーメッセージが送信されてきた場合
					else{
						jQuery('#' + param.err_xid).html(data['err_msg']);
					}
					
					_hideLoading(); // ローディング非表示
					
					_showBeginning(); // 初めの状態に戻す

				}catch(e){
					console.log(str_json);
					jQuery('#' + param.err_xid).html(str_json);
					_hideLoading(); // ローディング非表示
					_showBeginning(); // 初めの状態に戻す
					throw e;
				}
				
				
			})
			.fail(function(jqXHR, statusText, errorThrown) {
				console.log(jqXHR);
				var err_res = jqXHR.responseText;
				console.log(err_res);
				jQuery('#' + param.err_xid).html(err_res);
				alert(statusText);
				_hideLoading(); // ローディング非表示
			});

		}
	}
	
	

	

	/**
	 * AJAX URLを取得する
	 * @returns string Ajax URL
	 */
	function _getAjaxUrl(){
		
		var fw = self.param.fw;
		var ajax_url = self.param.ajax_url;
		
		if(fw=='' && ajax_url!=''){
			return ajax_url;
		}
		
		else if(fw=='' && ajax_url==''){
			throw new Error('Empty ajax_url !')
		}
		
		else if(fw=='wp' && ajax_url!=''){
			return ajax_url;
		}
		
		else if(fw=='wp' && ajax_url==''){
			return jQuery('#admin-ajax-url').val();;
		}
		
	}
	
	
	/**
	 * WordPressのAjaxで必要なパラメータをセットする
	 * @param fd FormDataオブジェクト
	 * @param action WordPressのAjaxアクションコード
	 * @returns セット後のFormDataオブジェクト
	 */
	function _setFormDataForWp(fd,action){
		var nonce = jQuery('#nonce').val();
		fd.append('action',action);
		fd.append('nonce',nonce);
		return fd;
		
	}
	
	
	/**
	 * アップロード実行ボタンの実行処理
	 */
	function _clickPreExeBtn(){
		
		// AJAXによるアップロード
		_uploadByAjax(self.files);
		
	}
	
	
	
	/**
	 * 初めに戻す
	 */
	function _showBeginning(){

		// ファイルオブジェクトをクリア
		self.files = null;
		
		// 見出しを表示
		var imp_fu_caption = self.fu_wrap.find('.imp_fu_caption');
		imp_fu_caption.show();
		
		// プレビュー要素のファイル名をクリアする
		var preview = self.fu_wrap.find('#' + param.preview_xid);
		var imp_fu_pre_fn = preview.find('.imp_fu_pre_fn');
		imp_fu_pre_fn.html('');
		
		// プレビュー要素を隠す
		preview.hide();
		
		// ファイルアップロード要素のクリア
		var fu_slt = self.param.fu_slt;
		var fu = jQuery(fu_slt);
		fu.val('');
		

	}
	
	
	
	
	/**
	 * プレビューを表示する
	 * @param files ファイルオブジェクト
	 */
	function _showPreview(files){
		var param = self.param;
		
		// プレビュー要素を表示する
		var preview = self.fu_wrap.find('#' + param.preview_xid);
		preview.show();
		
		// プレビュー要素にファイル名を表示する
		var imp_fu_pre_fn = preview.find('.imp_fu_pre_fn');
		var fn = files[0].name;
		imp_fu_pre_fn.html(fn);
		
		// 見出しを隠す
		var imp_fu_caption = self.fu_wrap.find('.imp_fu_caption');
		imp_fu_caption.hide();
		
		// ファイルオブジェクトをメンバへセット（アップロード実行ボタンで必要になる）
		self.files = files;
		
		// 成功メッセージを隠す
		var sucMsgElm = jQuery('#' + self.param.suc_msg_xid);
		sucMsgElm.hide();
		
		
	}
	
	
	/**
	 * 成功の表示
	 */
	function _showSuccess(){
		var elm = jQuery('#' + self.param.suc_msg_xid);
		elm.show();
		if(self.param.suc_toggle_sec != 0){
			elm.fadeOut(self.param.suc_toggle_sec);
		}
		
		
		
	}
	
	
	
	
	/**
	 * ローディング表示
	 */
	function _showLoading(){
		var param = self.param;
		
		// プレビュー要素を隠す
		var preview = self.fu_wrap.find('#' + param.preview_xid);
		preview.hide();
		
		var loding_gif = self.fu_wrap.find('.loding_gif');
		loding_gif.show();
	}
	
	
	/**
	 * ローディング非表示
	 */
	function _hideLoading(){
		var loding_gif = self.fu_wrap.find('.loding_gif');
		loding_gif.hide();
	}
	
	
	
	
	
	
	/**
	 * セレクタから識別子「#」「.」を取り外したコードを取得する
	 * 
	 * @note
	 * セレクタに空文字を指定すると空を返す。ただしnullを指定した場合はエラーになる。
	 * 
	 * @param slt セレクタ
	 * @returns コード
	 */
	function _sltToCode(slt){
		
		var code = slt;
		var s1 = code.charAt(0); // 先頭の一文字を取得
		if(s1=='#' || s1=='.'){
			code = code.substr(1);
		}
		return code;
	}


	
	// Check empty.
	function _empty(v){
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
	
	
	
	/**
	 * ローディングGIFのbase64文字列を取得する
	 * @returns ローディングGIFのbase64文字列
	 */
	function _getLodingGifBase64(){
		return "data:image/gif;base64,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";
	}
	
	
	
	
	
	
	
	

	// call constractor method.
	this.constract();
}