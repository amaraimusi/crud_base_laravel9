/**
 * サインX
 * @date 2021-4-1 | 2021-4-28
 * @license MIT
 * @version 1.0.1
 */
class SigninX{
	
	constructor(){
		this.crudBaseConfig = this._getCrudBaseConfig();
	}
	
	/**
	 * 初期化
	 * 
	 * @param param
	 * - div_xid 当機能埋込先区分のid属性
	 */
	init(param){
		
		this.param = this._setParamIfEmpty(param);
		
	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};

		return param;
	}
	
	
	_getCrudBaseConfig(){
		let json = jQuery('#crudBaseConfig').val();
		let crudBaseConfig = JSON.parse(json);
		return crudBaseConfig;
	}
	

	/**
	 * step1:メールアドレス入力画面表示の初期化
	 */
	step1(){
		$('#app1').show();
		
		this.app = new Vue({
			el: '#app1',
			data: {
				email: '',
				form_visible:1, // フォーム表示 0:非表示, 1:表示
				send_mail_msg_visible:0, // メール送信メッセージ表示 0:非表示, 1:表示
				repw_visible:0, // パスワード再発行区分表示 0:非表示, 1:表示
			},
			methods: {
				tempRegAction: ()=>{
					this.tempRegAction(); // 仮登録アクション
				}
			}
		});
		
		// jquery.validate.min.jsの拡張
		this._exJQueryValidator();
		
		// step1のバリデーションルール設定
		this._validStep1();
		
		
	}
	
	
	/*
	 * step1のバリデーションルール設定
	*/
	_validStep1(){
		var rules; // バリデーションルール
		var messages; // バリデーションのエラーメッセージ（固有指定用）
		
		rules = {
			'email': {required: true, email: true},
		};
		
		messages = {}; // カスタムメッセージ

		// jquery.validate.min.jsによるバリデーション実行イベント
		$('#step1_form').validate({
			rules: rules,
			messages: messages,
	
			//エラーメッセージ出力箇所を調整
			errorPlacement: function(error, element){
				if (element.is(':radio')) {
					error.appendTo(element.parent());
				}else if (element.is(':checkbox')) {
					error.appendTo(element.parent());
				}else {
					error.insertAfter(element);
				}
			}
		});
	}
	
	
	/**
	 * 仮登録アクションの起動
	 */
	tempRegAction(){

		// jquery.validate.min.jsによるバリデーションを実行
		let valid_res = $('#step1_form').valid();
		if(!valid_res) return;
		
		let csrf_token = $('#csrf_token').val();
		let email =this.app['email'];
		
		var sendData={
			email:email,
		};
	
		var send_json = JSON.stringify(sendData);//データをJSON文字列にする。
		
		var fd = new FormData();
		fd.append( "key1", send_json );
		fd.append( "csrf_token", csrf_token );
		
		let prj_path = this.crudBaseConfig.crud_base_project_path;
		let ajax_url = prj_path + '/signin_x/tempRegAction';
		
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
		.done((res_json) => {
			var res;
			try{
				res =jQuery.parseJSON(res_json);//パース
			}catch(e){
				jQuery("#err").append(res_json);
				return;
			}
			
			// パスワード再設定フラグがONである場合、パスワード再設定リンクボタンを表示する。
			if(res.is_repw == 1){
				this.app.repw_visible = 1;
			}
			
			// 仮登録メール送信フラグがONならメール送信メッセージを表示する
			if(res.send_mail_flg == 1){
				this.app.send_mail_msg_visible = 1; // メール送信メッセージを表示する

				// ローカル開発環境であるなら、代替メールテキストを表示する。
				if(res.dev_flg == 1){
					let devElm = $('#dev_mailtext');
					devElm.show();
					devElm.html(res.dev_mailtext);
				}
				
			}
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			jQuery('#err').append('アクセスエラー');
			jQuery('#err').append(jqXHR.responseText);
			alert(statusText);
		});
		
	
	}
	
	
	
	/**
	 * プロパティ値を取得する
	 * @param string key プロパティのキー
	 * @param mixed init_value 初期値
	 * @param object param
	 * @param object lsParam ローカルストレージから取得したパラメータ
	 * @return プロパティ値
	 */
	_getProperty(key, init_value, param, lsParam){

		// ローカルストレージ、引数、デフォルトを優先順にプロパティ値を取得する。
		let prop_v = null; // プロパティ値
		if(lsParam[key] != null){
			prop_v = lsParam[key];
		}else if(param[key] != null){
			prop_v = param[key];
		}else{
			prop_v = init_value;
		}
		return prop_v;
	}
	
	
	/**
	 * jquery.validate.min.jsの拡張
	 * @returns
	 */
	_exJQueryValidator(){
		// 標準エラーメッセージの変更
		$.extend($.validator.messages, {
			email: '正しいメールアドレスの形式で入力して下さい',
			required: '入力必須です',
			phone: "正しい電話番号の形式で入力してください",
		});
	
		// 独自ルールを追加
		jQuery.validator.addMethod("katakana", function(value, element) {
				return this.optional(element) || /^([ァ-ヶー]+)$/.test(value);
			}, "全角カタカナを入力してください"
		);
		jQuery.validator.addMethod("kana", function(value, element) {
				return this.optional(element) || /^([ァ-ヶーぁ-ん]+)$/.test(value);
			}, "全角ひらがな･カタカナを入力してください"
		);
		jQuery.validator.addMethod("hiragana", function(value, element) {
				return this.optional(element) || /^([ぁ-ん]+)$/.test(value);
			}, "全角ひらがなを入力してください"
		);
		jQuery.validator.addMethod("phone", function(value, element) {
				return this.optional(element) || /^(?:\+?\d+-)?\d+(?:-\d+){2}$|^\+?\d+$/.test(value);
			}, "正しい電話番号を入力してください"
		);
		jQuery.validator.addMethod("postcode", function(value, element) {
				return this.optional(element) || /^\d{3}\-?\d{4}$/.test(value);
			}, "郵便番号を入力してください（例:123-4567）"
		);
		jQuery.validator.addMethod("password_strength", function(value, element) {
				return this.optional(element) || /^(?=.*?[a-z])(?=.*?\d)[a-z\d]{6,100}$/.test(value);
			}, "英数字を組み合わせたパスワードを入力してください"
		);
	}
	
	
	
	/**
	 * 本登録アクション
	 * @param {} param
	 * - def_role string 権限
	 * - roleOptions [] SELECT用・権限リスト
	 * 
	 */
	step2(param){
		
		if(param == null) param = {};
		if(param['def_role'] == null) param['def_role'] = 'oparator'; // デフォルト権限
		
		// 権限リスト
		if(param['roleOptions'] == null){
			param['roleOptions']= [
						{ text: 'オペレータ', value: 'oparator' },
						{ text: 'クライアント', value: 'client' },
					];
		}
				
		$('#app1').show();
		
		// 埋め込みからユーザーエンティティを取得する
		let user_json = $('#user_json').val();
		let ent = JSON.parse(user_json);
		
		let role = ent.role;
		if(role == null || role == ''){
			role = param.def_role;
		} else{
			// 権限リストに存在しない権限である場合、デフォルト権限をセットする。
			if(!this._isRoleInOptions(role, param.roleOptions)){
				role = param.def_role;
			}
		}
		
		this.app = new Vue({
			el: '#app1',
			data: {
				nickname: ent.nickname, // 名前
				password: '',
				role: role,
				roleOptions:param.roleOptions, // SELECT用権限リスト
				form_visible:1, // フォーム表示 0:非表示, 1:表示
				send_mail_msg_visible:0, // メール送信メッセージ表示 0:非表示, 1:表示
				repw_visible:0, // パスワード再発行区分表示 0:非表示, 1:表示
				success:0, // 登録成功フラグ
			},
			methods: {
				pwReg: ()=>{
					this.pwReg(); // パスワード登録アクション
				}
			}
		});
		
		// jquery.validate.min.jsの拡張
		this._exJQueryValidator();
		
		// step1のバリデーションルール設定
		this._validStep2();
	}
	
	
	// 権限リストに存在する権限か？
	_isRoleInOptions(role, roleOptions){
		let flg = false;
		for(let i in roleOptions){
			let optionEnt = roleOptions[i];
			if(role == optionEnt.value){
				flg = true;
				break;
			}
		}
		return flg;
	}
	
	
	/*
	 * step2のバリデーションルール設定
	*/
	_validStep2(){
		var rules; // バリデーションルール
		var messages; // バリデーションのエラーメッセージ（固有指定用）
		
		rules = {
			'nickname': {required: true, maxlength: 50},
			'password': {required: true,  minlength: 8, maxlength: 100, password_strength: true},
			'password_confirm': {equalTo: '[name=password]' },
		};
		
		// 入力項目ごとのエラーメッセージ定義
		messages = {
			password: {
				required: 'パスワードを入力してください',
				minlength: 'パスワードは8文字以上で入力してください',
			},
			password_confirm: {
				required: '確認のため再度入力してください',
				equalTo: '同じパスワードをもう一度入力してください。'
			}
		};

		// jquery.validate.min.jsによるバリデーション実行イベント
		$('#step2_form').validate({
			rules: rules,
			messages: messages,
	
			//エラーメッセージ出力箇所を調整
			errorPlacement: function(error, element){
				if (element.is(':radio')) {
					error.appendTo(element.parent());
				}else if (element.is(':checkbox')) {
					error.appendTo(element.parent());
				}else {
					error.insertAfter(element);
				}
			}
		});
	}
	
	
	/**
	 * パスワード登録アクション
	 */
	pwReg(){
		
		// jquery.validate.min.jsによるバリデーションを実行
		let valid_res = $('#step2_form').valid();
		if(!valid_res) return;
		
		let csrf_token = $('#csrf_token').val();
		
		// ユーザーエンティティを取得し、入力値をセットする
		let user_json = $('#user_json').val();
		let ent = JSON.parse(user_json);
		ent.nickname = this.app.nickname;
		ent.password = this.app.password;
		ent.role = this.app.role;

		let repw_flg = $('#repw_flg'); // パスワード再発行フラグを取得
		
		// 送信データ
		let sendData = {
			ent:ent,
			repw_flg:repw_flg,
		}
		
		var send_json = JSON.stringify(sendData);//データをJSON文字列にする。
		
		var fd = new FormData();
		fd.append( "key1", send_json );
		fd.append( "csrf_token", csrf_token );
		
		let prj_path = this.crudBaseConfig.crud_base_project_path;
		let ajax_url = prj_path + '/signin_x/pwReg';
		
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
		.done((res_json) => {
			var res;
			try{
				res =jQuery.parseJSON(res_json);//パース
			}catch(e){
				jQuery("#err").append(res_json);
				return;
			}
			
			// 仮登録メール送信フラグがONならメール送信メッセージを表示する
			if(res.success == 1){
				this.app.success = 1; // 成功メッセージを表示
				this.app.form_visible = 0;
				this.app.send_mail_msg_visible = 1; // メール送信メッセージを表示する

				// ローカル開発環境であるなら、代替メールテキストを表示する。
				if(res.dev_flg == 1){
					let devElm = $('#dev_mailtext');
					devElm.show();
					devElm.html(res.dev_mailtext);
				}
				
				// トップページへジャンプ
				let top_path = this.crudBaseConfig.crud_base_project_path;
				location.href = top_path;
				
			}
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			jQuery('#err').append('アクセスエラー');
			jQuery('#err').append(jqXHR.responseText);
			alert(statusText);
		});
		
	}
	

	/**
	 * パスワード再発行・メール入力画面の初期化
	 */
	repw(){
		$('#app1').show();
		
		this.app = new Vue({
			el: '#app1',
			data: {
				email: '',
				form_visible:1, // フォーム表示 0:非表示, 1:表示
				send_mail_msg_visible:0, // メール送信メッセージ表示 0:非表示, 1:表示
			},
			methods: {
				tempRegActionForRepw: ()=>{
					this.tempRegActionForRepw(); // パスワード再発行・仮登録アクション
				}
			}
		});
		
		// jquery.validate.min.jsの拡張
		this._exJQueryValidator();
		
		// repwのバリデーションルール設定
		this._validRepw();
		
		
	}
	
	
	/*
	 * repwのバリデーションルール設定
	*/
	_validRepw(){
		var rules; // バリデーションルール
		var messages; // バリデーションのエラーメッセージ（固有指定用）
		
		rules = {
			'email': {required: true, email: true},
		};
		
		messages = {}; // カスタムメッセージ

		// jquery.validate.min.jsによるバリデーション実行イベント
		$('#form1').validate({
			rules: rules,
			messages: messages,
	
			//エラーメッセージ出力箇所を調整
			errorPlacement: function(error, element){
				if (element.is(':radio')) {
					error.appendTo(element.parent());
				}else if (element.is(':checkbox')) {
					error.appendTo(element.parent());
				}else {
					error.insertAfter(element);
				}
			}
		});
	}
	
	
	/**
	 * パスワード再発行・仮登録アクション
	 */
	tempRegActionForRepw(){

		// jquery.validate.min.jsによるバリデーションを実行
		let valid_res = $('#form1').valid();
		if(!valid_res) return;
		
		let csrf_token = $('#csrf_token').val();
		let email =this.app['email'];
		
		var sendData={
			email:email,
			repw_flg:1,
		};
	
		var send_json = JSON.stringify(sendData);//データをJSON文字列にする。
		
		var fd = new FormData();
		fd.append( "key1", send_json );
		fd.append( "csrf_token", csrf_token );
		
		let prj_path = this.crudBaseConfig.crud_base_project_path;
		let ajax_url = prj_path + '/signin_x/tempRegAction';
		
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
		.done((res_json) => {
			var res;
			try{
				res =jQuery.parseJSON(res_json);//パース
			}catch(e){
				jQuery("#err").append(res_json);
				return;
			}
			
			// パスワード再設定フラグがONである場合、パスワード再設定リンクボタンを表示する。
			if(res.repw_flg == 1){
				this.app.repw_visible = 1;
			}
			
			// 仮登録メール送信フラグがONならメール送信メッセージを表示する
			if(res.send_mail_flg == 1){
				this.app.send_mail_msg_visible = 1; // メール送信メッセージを表示する

				// ローカル開発環境であるなら、代替メールテキストを表示する。
				if(res.dev_flg == 1){
					let devElm = $('#dev_mailtext');
					devElm.show();
					devElm.html(res.dev_mailtext);
				}
				
			}
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			jQuery('#err').append('アクセスエラー');
			jQuery('#err').append(jqXHR.responseText);
			alert(statusText);
		});
		
	
	}
	
	

	
}