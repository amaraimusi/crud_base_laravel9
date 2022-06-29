
/**
 * メッセージボードクラス
 *
 * @since 2021-5-7 | 2021-12-9
 * @version 1.0.1
 * @license MIT
 * @auther Kenji Uehara
 */
class MsgBoard{
	
	
	init(){
		
		// テキストエリアの高さを自動調整する。
		this._automateTextareaHeight('textarea');
		
		this.crudBaseData = this._getJson('crud_base_json');
		this.csrf_token = this.crudBaseData.csrf_token;
		
		this.evals = this.crudBaseData.evals; //  評価データ
		this.evalTypeHm = this.crudBaseData.evalTypeHm; // 評価種別ハッシュマップ
		this.userInfo = this.crudBaseData.userInfo;
		this.kjs = this.crudBaseData.kjs;
		
		this.nickname = this.userInfo.nickname;
		if(this.userInfo.nickname==null){
			this.nickname = 'none';
		}
		
		// ファイルアップロード
		this.fileUploadK = new FileUploadK();
		this.fileUploadK.addEvent('attach_fn');
	}
	
	/** メッセージ追加アクション
	 */
	addMsg(){
		
		let user_id = -1;
		if(this.userInfo.id != null) user_id = this.userInfo.id;
		let user_type = this.crudBaseData.user_type;
		let message = jQuery('#ni_message').val();
		let file_val = jQuery('#attach_fn').val();
		
		message = message.trim();
		if(message == '' && file_val == '') return;
		
		let sendData={
			message:message, 
			user_id:user_id,
			user_type:user_type,
			attach_fn:'',
			};
		
		// データ中の「&」と「%」を全角の＆と％に一括エスケープ(&記号や%記号はPHPのJSONデコードでエラーになる)
		sendData = this._escapeAjaxSendData(sendData);

		let fd = new FormData();
		
		let send_json = JSON.stringify(sendData);//データをJSON文字列にする。
		fd.append( "key1", send_json );
		
		let regParam = {form_type: 'new_inp'};
		let reg_param_json = JSON.stringify(regParam);//データをJSON文字列にする。
		fd.append( "reg_param_json", reg_param_json );
		
		// ▼メール通知チェックフラグを取得し、送信メール情報にセット
		let send_mail_check = jQuery('#send_mail_check:checked').val();
		if(send_mail_check == null) send_mail_check = 0;
		let sendMailInfo = this.crudBaseData.sendMailInfo;
		sendMailInfo['send_mail_check'] = send_mail_check;
		let send_mail_info_json = JSON.stringify(sendMailInfo);
		fd.append( "send_mail_info_json", send_mail_info_json );
		
		// ファイルアップロード
		fd.append( "attach_fn", $("#attach_fn").prop("files")[0] );
		
		// CSRFトークンを取得
		let csrf_token = this.crudBaseData.csrf_token;
		fd.append( "csrf_token", csrf_token );
		
		let crud_base_project_path = this.crudBaseData.crud_base_project_path;
		let ajax_url = crud_base_project_path + '/msg_board/ajax_new_reg';

		// AJAX
		jQuery.ajax({
			type: "post",
			url: ajax_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType : false,
		})
		.done((res_json, type) => {
			let res;
			try{
				res =jQuery.parseJSON(res_json);//パース
				
			}catch(e){
				jQuery("#err").append(res_json);
				return;
			}
			
			if(this.crudBaseData.data_count == 0){
				location.reload(true);
			}else{
				this._addNewEntityToBoardDiv(res); // 新エンティティをボードdivの先頭要素に表示
				this._clearNewInput(res);
				this._reactSendMail(res);
			}
		})
		.fail((jqXHR, statusText, errorThrown) => {
			let errElm = jQuery('#err');
			errElm.append('アクセスエラー');
			errElm.append(jqXHR.responseText);
			alert(statusText);
		});
		
	}
	
	// リアクティブ的にメール通知関連要素に反映
	_reactSendMail(res){
		// デバッグ・メールテキストを要素にセット（開発環境用の処理）
		let sendMailInfo = res.sendMailInfo;
		let debug_mail_text = sendMailInfo.debug_mail_text; // デバッグ・メールテキスト
		if(!this._empty(debug_mail_text)){
			let dmtwElm = jQuery('#send_mail_debug_mail_text_w');
			dmtwElm.show();
			dmtwElm.find('#send_mail_debug_mail_text').html(debug_mail_text);
		}else{
			jQuery('#send_mail_debug_mail_text_w').hide();
		}
		
		this._reactMailSendCont(sendMailInfo.mail_send_cont); // リアクティブ的に送信メール数を要素にセット
		
		jQuery('#send_mail_check:checked').prop('checked', false);
	}
	
	/** リアクティブ的に送信メール数を要素にセット
	 */
	_reactMailSendCont(mail_send_cont){
		let msg = `${mail_send_cont}件メールを送信しました。`;
		let elm = jQuery('#mail_send_cont');
		elm.html(msg);
		if(this._empty(mail_send_cont)){
			elm.hide();
		}else{
			elm.show();
		}
		
	}
	
	
	
	// メッセージ新規入力フォームをクリアする。
	_clearNewInput(){
		this.fileUploadK.setFilePaths('attach_fn', '');
		jQuery('#ni_message').val('');
		jQuery('#send_mail_flg').prop('checked', false);
		

		
	}
	
	
	// 新エンティティを一覧divの先頭要素に表示
	_addNewEntityToBoardDiv(res){

		let ent = res.ent;
		ent = this._xss_sanitize(ent);

		// ボードdivの先頭エンティティDIVを取得する。
		let one = jQuery('#msg_board_list').children().eq(0); 
		
		let new_ent_html = one[0].outerHTML; // 先頭エンティティDIVのHTMLを新エンティティ要素のHTMLとして取得
		
		one.before(new_ent_html); // 新エンティティ要素のHTMLを先頭に配置
		
		let newEntDiv = jQuery('#msg_board_list').children().eq(0); 

		// ニックネームのセット
		let nickname = this.userInfo.nickname;
		if(nickname=='') nickname = 'none';
		newEntDiv.find('.nickname').html(nickname);

		let message_xss = this._xss_sanitize(ent.message);
		newEntDiv.find('.message_div').html(message_xss);
		newEntDiv.find('.message_edit_ta').html(ent.message);
		newEntDiv.find('.nickname').html(this.nickname);
		newEntDiv.find('.edit_btn').show();
		newEntDiv.find('.delete_btn').show();
		newEntDiv.find('.menu_div').hide();
		
		let user_type = this.crudBaseData.user_type; // 当画面のユーザータイプ
		if(user_type == 'master' || user_type == 'login_user'){
			newEntDiv.find('.menu_btn').show();
		}else{
			newEntDiv.find('.menu_btn').hide();
		}
		
		newEntDiv.attr('data-id', ent.id);
		
		newEntDiv.show();
		
		this._setEntTo_filePreviewA(newEntDiv, ent);
		
		
	}
	
	
	/** ファイルプレビューAタイプ要素にパラメータをセットする。
	 * 
	 * @param jQuery newEntDiv 新エンティティ要素
	 * @param {} ent エンティティ
	 * @param string seg セグメント（省略可）
	 */
	_setEntTo_filePreviewA(newEntDiv, ent, seg){
		let fp = ent.attach_fn;
		if(fp == null) fp = '';
		
		if(seg == null) seg = 'filePreviewA';
		let fn = this._extractFileNameFromFp(fp); // ファイルパスからファイル名を取得する

		// ▽ ファイルタイプを取得する
		let ext = this._getExtension(fp);
		let file_type = ''; // ファイルタイプ img:画像系ファイル, pdf, other:その他
		let imgExts = ['jpg','jpeg','png','gif'];
		if(imgExts.includes(ext)){
			file_type = 'img';
		}else if(ext == 'pdf'){
			file_type = 'pdf';
		}else{
			file_type = 'other';
		}
		if(fp == '') file_type = 'empty';
		
		let fp2 = fp.replace('/orig/','/mid/');

//		// パスを取得
//		if(fp != ''){
//			//let dp = this.crudBaseData.crud_base_project_path;
//			let dp = this.crudBaseData.crud_base_storage_url;
//			fp = dp + '/' + fp;
//			fp2 = dp + '/' + fp2;
//		}

		let filePreviewA = newEntDiv.find('.' + seg);
		
		let img = filePreviewA.find('.' + seg + '_' + 'img'); // img要素
		let img_link = filePreviewA.find('.' + seg + '_' + 'img_link'); // imgアンカー要素
		let pdf = filePreviewA.find('.' + seg + '_' + 'pdf'); // pdfのobjectタグ要素
		let img_w = filePreviewA.find('.' + seg + '_' + 'img_w'); // img要素のラッパー要素
		let pdf_w = filePreviewA.find('.' + seg + '_' + 'pdf_w'); // pdf要素のラッパー要素
		let download_btn_w = filePreviewA.find('.' + seg + '_' + 'download_btn_w'); // ダウンロードラッパークラス
		let download_btn = filePreviewA.find('.' + seg + '_' + 'download_btn'); // downloadアンカー要素
		let download_fn = filePreviewA.find('.' + seg + '_' + 'download_fn'); // downloadファイル名要素
		
		if(file_type=='img'){
			img.attr('src', fp2);
			img_link.attr('href', fp);
			pdf.attr('data', '');
			img_w.show();
			pdf_w.hide();
			download_btn_w.show();
			download_btn.attr('href', fp);
			download_fn.html(fn)
		}else if(file_type=='pdf'){
			img.attr('src', '');
			img_link.attr('href', '');
			pdf.attr('data', fp);
			img_w.hide();
			pdf_w.show();
			download_btn_w.show();
			download_btn.attr('href', fp);
			download_fn.html(fn);
		}else if(file_type=='other'){
			img.attr('src', '');
			img_link.attr('href', '');
			pdf.attr('data', '');
			img_w.hide();
			pdf_w.hide();
			download_btn_w.show();
			download_btn.attr('href', fp);
			download_fn.html(fn);
		}else if(file_type=='empty'){
			img.attr('src', '');
			img_link.attr('href', '');
			pdf.attr('data', '');
			img_w.hide();
			pdf_w.hide();
			download_btn_w.hide();
			download_btn.attr('href', '');
			download_fn.html('');
		}else{
			throw new Error('システムエラー:210510A')
		}
		
		
		filePreviewA.show();
	}
	
	
	/**
	 * ファイルパスからファイル名を取得する
	 * 
	 * @param string fp ファイルパス
	 * @return string ファイル名
	 */
	_extractFileNameFromFp(fp){
		if(fp == null) return '';
		
		let ary = fp.split(/\/|\\/);
		let fn = ary[ary.length-1];
		
		return fn;
	}
	
	
	//ファイル名から拡張子を取得する。
	_getExtension(fn){
		if(fn==null){
			return '';
		}

		var ary=fn.split(".");
		var ext=ary[ary.length-1];

		ext=ext.toLowerCase();//小文字化する

		return ext;
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
	
	
	
	/**
	 * データ中の「&」と「%」を全角の＆と％に一括エスケープ
	 * 
	 * @note
	 * PHPのJSONデコードでエラーになるので、＆記号をエスケープ。％記号も後ろに数値がつくとエラーになるのでエスケープ
	 * これらの記号はMySQLのインポートなどでエラーになる場合があるのでその予防。
	 * @param mixed data エスケープ対象 :文字列、オブジェクト、配列を指定可
	 * @returns エスケープ後
	 */
	_escapeAjaxSendData(data){
		if (typeof data == 'string'){
			data = data.replace(/&/g, '＆');
			data = data.replace(/%/g, '％');
			return data;

		}else if (typeof data == 'object'){
			for(var i in data){
				data[i] = this._escapeAjaxSendData(data[i]);
			}
			return data;
		}else{
			return data;
		}
	}
	
	
	_getJson(xid){
		let json = jQuery('#' + xid).val();
		return JSON.parse(json);
	}
	
	
	// テキストエリアの高さを自動調整する。
	_automateTextareaHeight(slt){

		let taElm = $(slt);
		
		// 文字入力した時に高さ自動調整
		taElm.attr("rows", 1).on("input", e => {
			$(e.target).height(0).innerHeight(e.target.scrollHeight);
		});
		
		// クリックしたときに自動調整
		taElm.attr("rows", 1).click("input", e => {
			$(e.target).height(0).innerHeight(e.target.scrollHeight);
		});
	}
	
	
	/** メニューの表示、非表示
	 */
	showMenu(selfElm){
		
		let parElm = jQuery(selfElm).parents('.entity_box1');
		parElm.find('.menu_div').toggle(300);
	}
	
	
	/** 編集区分の表示、非表示
	 */
	showEditDiv(selfElm){
		
		let parElm = jQuery(selfElm).parents('.entity_box1');
		parElm.find('.edit_div').toggle(300);
	}
	
	
	/** 編集区分の「戻る」ボタンアクション
	 */
	returnEdit(selfElm){
		
		selfElm = jQuery(selfElm);
		
		// 編集区分を閉じる
		selfElm.parents('.edit_div').hide();
		
		// メニュー区分を閉じる
		let box1Elm = selfElm.parents('.entity_box1');
		box1Elm.find('.menu_div').hide();
		

	}
	
	// 削除アクション
	deleteAction(selfElm){
		let parElm = jQuery(selfElm).parents('.entity');
		let id = parElm.attr('data-id');

		let sendData={
			id: id, 
			};
		
		// データ中の「&」と「%」を全角の＆と％に一括エスケープ(&記号や%記号はPHPのJSONデコードでエラーになる)
		sendData = this._escapeAjaxSendData(sendData);

		let fd = new FormData();
		
		let send_json = JSON.stringify(sendData);//データをJSON文字列にする。
		fd.append( "key1", send_json );
		
		// CSRFトークンを取得
		let csrf_token = this.crudBaseData.csrf_token;
		fd.append( "csrf_token", csrf_token );
		
		let crud_base_project_path = this.crudBaseData.crud_base_project_path;
		let ajax_url = crud_base_project_path + '/msg_board/ajax_delete';

		// AJAX
		jQuery.ajax({
			type: "post",
			url: ajax_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType : false,
		})
		.done((res_json, type) => {
			let res;
			try{
				res = jQuery.parseJSON(res_json);//パース
				
			}catch(e){
				jQuery("#err").append(res_json);
				return;
			}
			
			parElm.hide();

		})
		.fail((jqXHR, statusText, errorThrown) => {
			let errElm = jQuery('#err');
			errElm.append('アクセスエラー');
			errElm.append(jqXHR.responseText);
			alert(statusText);
		});
		
	}
	
	
	// 編集登録アクション
	regEdit(selfElm){
		
		let parElm = jQuery(selfElm).parents('.entity'); 
		let id = parElm.attr('data-id'); // メッセージボードID
		
		let user_id = -1;
		if(this.userInfo.id != null) user_id = this.userInfo.id;
		let message = parElm.find('.message_edit_ta').val();

		message = message.trim();
		if(message == '') return;
		
		let sendData={
			id: id,
			message: message, 
			user_id: user_id,
			attach_fn: '',
			};
		
		// データ中の「&」と「%」を全角の＆と％に一括エスケープ(&記号や%記号はPHPのJSONデコードでエラーになる)
		sendData = this._escapeAjaxSendData(sendData);
		
		let fd = new FormData();
		
		let send_json = JSON.stringify(sendData);//データをJSON文字列にする。
		fd.append( "key1", send_json );
		
		let regParam = {form_type: 'edit'};
		let reg_param_json = JSON.stringify(regParam);//データをJSON文字列にする。
		fd.append( "reg_param_json", reg_param_json );
		
		// CSRFトークンを取得
		let csrf_token = this.crudBaseData.csrf_token;
		fd.append( "csrf_token", csrf_token );
		
		let crud_base_project_path = this.crudBaseData.crud_base_project_path;
		let ajax_url = crud_base_project_path + '/msg_board/ajax_edit_reg';

		// AJAX
		jQuery.ajax({
			type: "post",
			url: ajax_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType : false,
		})
		.done((res_json, type) => {
			let res;
			try{
				res =jQuery.parseJSON(res_json);//パース
				
			}catch(e){
				jQuery("#err").append(res_json);
				return;
			}
			
			res = this._xss_sanitize(res); // XSS対策
			parElm.find('.message_div').html(res.message);
			
			// 編集区分を閉じる
			parElm.find('.edit_div').hide();
			
			// メニュー区分を閉じる
			parElm.find('.menu_div').hide();

		})
		.fail((jqXHR, statusText, errorThrown) => {
			let errElm = jQuery('#err');
			errElm.append('アクセスエラー');
			errElm.append(jqXHR.responseText);
			alert(statusText);
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

	/**
	* 評価ユーザーの一覧を表示する
	* @param object btn 評価ユーザー表示ボタン要素
	* 
	*/
	openEvalUsers(btn){
		
		let jqbtn = jQuery(btn);
		let msg_board_id = jqbtn.attr('data-msg-board-id'); // メッセージボードID
		let eval_type_id = jqbtn.attr('data-eval-type-id'); // 評価種別ID
		
		// 評価種別ハッシュマップから評価種別IDを指定して評価種別エンティティを取得する。
		let evalTypeEnt = this.evalTypeHm[eval_type_id];
		
		// ユーザー表示フラグがONでないなら処理抜け。
		if (evalTypeEnt.users_show_flg != 1) return;

		//評価データからメッセージボードIDと評価種別IDを指定し、ユーザー評価データを取得する。
		let userEvals = this.evals[msg_board_id][eval_type_id];

		// ボタン要素から親要素を取得する。
		let parentElm = jqbtn.parents('.msg_board_eval_div');
		let usersDiv = parentElm.next(); // 評価ユーザーズ区分を取得する。
		
		// 評価ユーザーズ区分が非表示でないなら非表示にする。（表示中なら区分を隠して処理抜け）
		if(usersDiv.css('display') != 'none') {
			usersDiv.hide();
			return;
		}

		// 評価ユーザーズから評価ユーザーズHTMLを組み立てる。
		let eval_users_html = this._makeEvalUsersHtml(userEvals.users);
		
		// 評価ユーザーズ区分に評価ユーザーズHTMLを埋め込み、そして表示する。
		usersDiv.html(eval_users_html);
		usersDiv.show(300);
		
		
		
	}
	
	/**
	* 評価ユーザーズから評価ユーザーズHTMLを組み立てる。
	* @param [] users 評価ユーザーズ
	* @return string 評価ユーザーズHTML
	*/	
	_makeEvalUsersHtml(users){
		let html = '';
		for(let i in users){
			let uEnt = users[i];
			let nickname = uEnt.nickname;
			if(this._empty(nickname)) nickname = uEnt.user_name;
			nickname = this._xss_sanitize(nickname); // XSSサニタイズ

			html += `<span class="eval_user_a2">${nickname}</span>`;

		}
		
		html = `<div class="eval_user_a1">${html}</div>`;

		return html;
		
	}
	
	/**
	* 評価アクション
	* @param object btn 評価ユーザー表示ボタン要素
	* 
	*/	
	evaluate(btn){
		let jqbtn = jQuery(btn);
		let msg_board_id = jqbtn.attr('data-msg-board-id'); // メッセージボードID
		let eval_type_id = jqbtn.attr('data-eval-type-id'); // 評価種別ID
		
		let sendData={
			msg_board_id: msg_board_id,
			eval_type_id: eval_type_id, 
			};
		
		// データ中の「&」と「%」を全角の＆と％に一括エスケープ(&記号や%記号はPHPのJSONデコードでエラーになる)
		sendData = this._escapeAjaxSendData(sendData);
		
		let fd = new FormData();
		
		let send_json = JSON.stringify(sendData);//データをJSON文字列にする。
		fd.append( "key1", send_json );
		
		// CSRFトークンを取得
		let csrf_token = this.crudBaseData.csrf_token;
		fd.append( "csrf_token", csrf_token );
		
		let crud_base_project_path = this.crudBaseData.crud_base_project_path;
		let ajax_url = crud_base_project_path + '/msg_board/evaluate';

		// AJAX
		jQuery.ajax({
			type: "post",
			url: ajax_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType : false,
		})
		.done((res_json, type) => {
			let res;
			try{
				res =jQuery.parseJSON(res_json);//パース
				
			}catch(e){
				jQuery("#err_eval_" + msg_board_id).append(res_json);
				return;
			}

			res = this._xss_sanitize(res); // XSS対策

			// 評価ボタン押下後、評価ボタンの色を変更する。（スタイルを変更する）
			let perElm = jqbtn.parents('.msg_board_eval_w');
			this._reflectOnEvalBtn(perElm, res.userEvalEnt);
			this._reflectOnEvalBtn(perElm, res.converselyUserEvalEnt);
			
			// 評価データへレスポンスを反映する。
			this.evals = this._reflectToEvals(this.evals, res.userEvalEnt); 
			this.evals = this._reflectToEvals(this.evals, res.converselyUserEvalEnt); 
			
			// 評価ユーザー一覧表示ボタンの人数を変更する
			this._reflectOnEvalUserCountBtn(perElm, this.evals, res.userEvalEnt);
			this._reflectOnEvalUserCountBtn(perElm, this.evals, res.converselyUserEvalEnt);
			
			


		})
		.fail((jqXHR, statusText, errorThrown) => {
			let errElm = jQuery("#err_eval_" + msg_board_id);
			errElm.append('アクセスエラー');
			errElm.append(jqXHR.responseText);
			alert(statusText);
		});		
	}
	
	
	/**
	* 評価ボタン押下後、評価ボタンの色を変更する。（スタイルを変更する）
	* @param jQuery perElm 評価ボタンの親区分要素
	* @param {} userEvalEnt ユーザー評価エンティティ
	*/
	_reflectOnEvalBtn(perElm, userEvalEnt){

		if(this._empty(userEvalEnt)) return;
		
		let msg_board_id = userEvalEnt.msg_board_id;
		let eval_type_id = userEvalEnt.eval_type_id;
		
		let eval_btn_xid = `eval_btn_${msg_board_id}_${eval_type_id}`;
		let jqEvalBtn = perElm.find('#' + eval_btn_xid);
		
		// 無効フラグの値によって適用するCSSスタイルを変更する。
		if(userEvalEnt.delete_flg == 0){

			jqEvalBtn.removeClass('eval_btn_color_unpushed');
			jqEvalBtn.addClass('eval_btn_color_pushed');
		}else{
			
			jqEvalBtn.removeClass('eval_btn_color_pushed');
			jqEvalBtn.addClass('eval_btn_color_unpushed');
		}
		
		

	}
	
	/**
	* 評価データへレスポンスを反映する。
	* @param {} evals 評価データ
	* @param {} userEvalEnt ユーザー評価エンティティ
	* @return {} evals ユーザー評価エンティティを反映させた評価データ
	*/
	_reflectToEvals(evals, userEvalEnt){

		if(this._empty(userEvalEnt)) return evals;

		let msg_board_id = userEvalEnt.msg_board_id;
		let eval_type_id = userEvalEnt.eval_type_id;
		let user_id = userEvalEnt.user_id;
		let dataL3 = evals[msg_board_id][eval_type_id];
		
		if(dataL3 == undefined) return;
		let dataL4 = dataL3.users;

		if(userEvalEnt.delete_flg == 0){
			let entL5 = this._getUserEntityFormDataL4(dataL4, user_id);
			if(entL5 == null){
				entL5 = this._makeUserEntL5(userEvalEnt); // 評価データ用ユーザーエンティティを作成する。
				dataL4.push(entL5);
			}
	
		}else if(userEvalEnt.delete_flg == 1){
			dataL4 = this._delteMyUser(dataL4, user_id); // L4データに自分のユーザーIDに一致するレコードが見つかった場合削除する。
		}

		dataL3.eval_count = dataL4.length; // 人数を評価データへ反映
	
		return evals;
	
	}
	
	
	/**
	* L4データに自分のユーザーIDに一致するレコードが見つかった場合削除する。
	* @param {} dataL4 評価データ第4階層
	* @return {} my_user_id ログイン中ユーザーのユーザーID
	*/
	_delteMyUser(dataL4, my_user_id){
		for(let i in dataL4){
			if(dataL4[i].user_id == my_user_id){
				dataL4.splice(i);
				return　dataL4;
			}
		}
		return dataL4;
	}
	
	/**
	* 評価データ用ユーザーエンティティを作成する。
	* @param {} userEvalEnt ユーザー評価エンティティ
	* @return {} entL5 評価データの第5階層(ユーザーエンティティ)
	*/
	_makeUserEntL5(userEvalEnt){
		var now_time = new Date().toLocaleTimeString();
		let nickname = this.userInfo.nickname;
		if(this._empty(nickname)) nickname = this.userInfo.user_name;
		
		let entL5 = {
			eval_type_id: userEvalEnt.eval_type_id,
			modified: now_time,
			msg_board_id: userEvalEnt.msg_board_id,
			nickname: nickname,
			user_id: userEvalEnt.user_id,
			user_name: this.userInfo.user_name,
		};

		return entL5;
		
	}
	
	_getUserEntityFormDataL4(dataL4, my_user_id){
		
		for(let i in dataL4){
			let entL5 = dataL4[i];
			if(entL5.user_id == my_user_id){
				return entL5;
			}	
		}
		return null;
	}
			
	
	/**
	* 評価ユーザー一覧表示ボタンの人数を変更する
	* @param jQuery perElm 評価ボタンの親区分要素
	* @param {} evals 評価データ
	* @param {} converselyUserEvalEnt ユーザー評価エンティティ
	*/
	_reflectOnEvalUserCountBtn(perElm, evals, userEvalEnt){

		if(this._empty(userEvalEnt)) return;
		
		let msg_board_id = userEvalEnt.msg_board_id;
		let eval_type_id = userEvalEnt.eval_type_id;
		
		let dataL4 = evals[msg_board_id][eval_type_id]['users'];
		let eval_count = dataL4.length;
		
		let btn_xid = `eval_user_count_btn_${msg_board_id}_${eval_type_id}`;
		let jqBtn = perElm.find('#' + btn_xid); // 評価ユーザー一覧表示ボタン要素
		
		// ボタン要素に人数を表示。
		jqBtn.html(eval_count);
		
	}
	
	
	
}