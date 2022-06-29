/**
 * Google翻訳API・キャッシュ機能拡張
 * 
 * @note
 * Google Transrate APIのキャッシュ機能付き拡張クラス
 * 
 * @date 2019-1-27 | 2019-2-2
 * @version 1.0.2
 * @licens MIT
 */
class CbGtaCash{
	
	/**
	 * コンストラクタ
	 * @param object param
	 * - slt 翻訳言語SELECT要素のセレクタ
	 * - ajax_url AJAX URL
	 * - changed_select_callback SELECT変更コールバック
	 */
	constructor(param){
		param = this._setParamIfEmpty(param);
		this.param = param;
		this.jaTextList = {}; // 日本語テキストリスト
	}
	
	/**
	 * 初期化
	 * @param string page_code ページコード  ページごとに指定された一意コード
	 * @param array xids 翻訳テキスト区分のID属性リスト
	 * @param object param 省略可（コンストラクタで設定している場合）
	 */
	init(page_code, xids, param){
		if(param) jQuery.extend(this.param, param);
		param = this.param;
		this.xids = xids;
		this.page_code = page_code;

		// 言語データを取得
		var langData = this._getLangData();
		this.langData = langData;
		// 言語データからSELECT要素の選択肢HTMLを生成し、SELECT要素に埋め込む。
		var select_option_html = this._createSelectOptionHtml(langData);
		var selElm = jQuery(param.slt);
		selElm.html(select_option_html);
		
		// 翻訳SELECTのチェンジイベントを組み込み
		selElm.change((evt) => {
			var selElm = jQuery(evt.currentTarget);
			var lang = selElm.val();
			if(lang == '') return;
			this.cashTransExe(this, lang); // キャッシュ翻訳実行
			
			if(this.param.changed_select_callback){
				this.param.changed_select_callback(selElm);
			}
		});
		
	}
	
	/**
	 * キャッシュ翻訳実行
	 * @param string lang 言語コード
	 */
	cashTransExe(self, lang){
		
		var data = [];
		for(var i in self.xids){
			var xid = self.xids[i];
			if(xid == null || xid=='') return;
			// ▼ 日本語テキストを取得する
			xid = self._setSharp(xid); // 「#」が付いていなければ付加する。
			
			// ▼ 日本語テキストリストを取得する
			if(self.jaTextList[xid] == null){
				var jaTextElm = jQuery(xid);
				if(jaTextElm[0] == null) continue;
				self.jaTextList[xid] = jQuery(xid).html(); // ID属性に紐づく日本語テキストを取得
			}
			var ja_text = self.jaTextList[xid];
			
			var ent = {
				'lang':lang,
				'xid':xid,
				'ja_text':ja_text,
			};
			
			data.push(ent);
			
		}
		
		// キャッシュ翻訳実行AJAX
		self._cashTransExeAjax(self.page_code, lang, data);
	}
	
	/**
	 * キャッシュ翻訳実行AJAX
	 * @param string page_code ページコード
	 * @param string lang 言語コード
	 * @param array data 
	 */
	_cashTransExeAjax(page_code, lang, data){
		// PHPのJSONデコードでエラーになるので、＆だけ変換しておく。
		for(var i in data){
			var ent = data[i];
			ent.ja_text = ent.ja_text.replace(/&/g, '%26'); 
		}
		
		// 送信データ
		var sendData={
				'action_code':'get_cash',
				'page_code':page_code,
				'lang':lang,
				'data':data,
			};
		
		//sendData={'action_code':'get_cash'};
		
		var send_json = JSON.stringify(sendData);//データをJSON文字列にする。
		var ajax_url = this.param.ajax_url;
		
		// AJAX
		jQuery.ajax({
			type: "POST",
			
			url: ajax_url,
			data: "key1=" + send_json,
			cache: false,
			dataType: "text",
		})
		.done((res_json, type) => {
			
			var res;
			try{
				res =jQuery.parseJSON(res_json);//パース
			}catch(e){
				jQuery("#err").append(res_json);
				return;
			}
			this._cashTrans(res); // キャッシュ翻訳レスポンス
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			jQuery('#err').append('アクセスエラー');
			jQuery('#err').append(jqXHR.responseText);
			
		});
	}
	
	
	/**
	 * キャッシュ翻訳レスポンス
	 */
	_cashTrans(data){

		// 翻訳ボタンをすべて非表示にする
		jQuery('.cb_gta_cash_btn').hide();

		for(var i in data){
			var ent = data[i];
			if(ent.t_cash_flg == 1){
				// 翻訳キャッシュフラグがONである場合、翻訳テキストをID属性に紐づく要素にセットする。
				jQuery(ent.xid).html(ent.trans_text);
			}else{
				// 翻訳ボタンの作成とイベント組み込み
				this._createCbGtaCashBtn(ent);
			}
		}
	}
	
	/**
	 * 翻訳ボタンの作成とイベント組み込み
	 * @param object ent
	 */
	_createCbGtaCashBtn(ent){
		
		var lang_name = this._getLangName(ent.lang);// 言語コードから言語名（lang_name）を取得する
		var btn_name = lang_name;	// 言語名からボタン名を組み立てる。

		var ttElm = jQuery(ent.xid);// ID属性に紐づく要素を翻訳対象要素として取得する
		var cgcBtn = ttElm.find('.cb_gta_cash_btn'); // 翻訳対象要素から「.cb_gta_cash_btn」で翻訳ボタン要素を取得する
		
		// 翻訳ボタン要素が存在する場合,翻訳ボタンの属性をいくつか書き換え、表示する（翻訳ボタン作成済みである場合）
		if(cgcBtn[0]){
			cgcBtn.val(btn_name); // ボタン名を変更
			cgcBtn.attr('data-lang', ent.lang); // 言語コードは変更
			cgcBtn.show(); 
			return;
		}
		
		// ▼ 翻訳ボタン要素が存在しない場合
		

		
		// 翻訳ボタンHTMLを組み立てる。data_xid属性にID属性を、data_lang属性に言語コードをセット
		var cgc_btn_html = `<input type="button" value="${btn_name}" 
			class="cb_gta_cash_btn btn btn-success btn-sm" data-xid="${ent.xid}" data-lang="${ent.lang}"/>`;
		
		var wElm = ttElm.find('.cb_gta_cash_wb'); // 翻訳対象要素から翻訳ボタンラップを探す
		
		// 翻訳ボタンラップ要素が存在する場合
		if(wElm[0]){
			wElm.html(cgc_btn_html); // 翻訳ボタンラップ要素に翻訳ボタンHTMLをセットする
		}else{
		// 翻訳ボタンラップ要素が存在しない場合
			cgc_btn_html = "<div class='cb_gta_cash_wb'>" + cgc_btn_html + "</div>"; // 翻訳ボタンラップで翻訳ボタンHTMLを包む
			ttElm.prepend(cgc_btn_html); // 翻訳対象要素の先頭に翻訳ボタンHTMLを挿入する
			
		}
		
		cgcBtn = ttElm.find(`[data-xid='${ent.xid}']`); // data-xidに対し、翻訳ボタン要素を再取得する
		
		// 翻訳ボタン要素にクリックイベントを組み込む
		cgcBtn.click(evt=>{
			var btnElm = jQuery(evt.currentTarget);
			this.apiTranseAction(btnElm);
		});
	}
	
	
	/**
	 * API翻訳アクション
	 * @param jQuery btnElm 翻訳ボタン要素
	 */
	apiTranseAction(btnElm){
		
		// すべての翻訳ボタンを押せなくする。（Google Transe APIは数秒のインターバルを必要とするため）
		jQuery('.cb_gta_cash_btn').prop('disabled', true);
		
		// ボタン要素からID属性と言語コードを取得する
		var xid = btnElm.attr('data-xid');
		var lang = btnElm.attr('data-lang');
		var ja_text = this.jaTextList[xid]; // 日本語テキストを取得
		ja_text = ja_text.replace(/&/g, '%26'); // PHPのJSONデコードでエラーになるので、＆だけ変換しておく。
		
		// 送信データ
		var sendData={
				'action_code':'api_transe',
				'page_code':this.page_code,
				'lang':lang,
				'xid':xid,
				'ja_text':ja_text,
			};
		var send_json = JSON.stringify(sendData);//データをJSON文字列にする。
		var ajax_url = this.param.ajax_url;
		
		// AJAX
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: "key1=" + send_json,
			cache: false,
			dataType: "text",
		})
		.done((res_json, type) => {
			var res;
			try{
				res =jQuery.parseJSON(res_json);//パース
			}catch(e){
				jQuery("#err").append(res_json);
				return;
			}
			
			// 翻訳テキストをID属性に紐づく要素にセットする。
			jQuery(res.xid).html(res.trans_text);
			
			setTimeout(function(){jQuery('.cb_gta_cash_btn').prop('disabled', false);}, 3000);
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			jQuery('#err').append('アクセスエラー');
			jQuery('#err').append(jqXHR.responseText);
			
		});
	}
	
	
	
	/**
	 * 言語コードから言語名を取得する
	 * @param string lang 言語コード
	 * @reutrn string 言語名
	 */
	_getLangName(lang){
		
		var lang_name = 'none';
		var langData = this.langData;
		for(var i in langData){
			var ent = langData[i];
			if(ent['iso639-1'] == lang){
				lang_name = ent.lang_name;
				break;
			}
		}
		return lang_name;
	}
	
	
	/**
	 *  「#」が付いていなければ付加する
	 * @param string xid ID属性
	 * @return string 「#」付きのID属性
	 */
	_setSharp(xid){
		var s1 = xid.charAt(0);
		if(s1 != '#'){
			xid = '#' + xid;
		}
		return xid;
	}

	/**
	 * 言語データからSELECT要素の選択肢HTMLを生成し、SELECT要素に埋め込む。
	 * @param object langData 言語データ
	 */
	_createSelectOptionHtml(langData){
		var html = "<option value='' > -- Language -- </option>";
		for(var i in langData){
			var ent = langData[i];
			var lang_name = ent.wamei + '  ' + ent.lang_name;
			html += "<option value='" + ent['iso639-1'] + "' >" +  lang_name + "</option>";
		}
		
		return html;
	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param['slt'] == null) param['slt'] = '#cb_gta_cash';
		if(param['ajax_url'] == null) throw new Error('Empty ajax_url !');
		
		
		return param;
	}
	
	
	/**
	 * 言語データを取得
	 * @returns object 言語データ
	 */
	_getLangData(){
		
		var langData = [
			{"lang_nation":"インド・ヨーロッパ語族","wamei":"英語","lang_name":"English","iso639-1":"en","iso639-2T":"eng","iso639-2B":"eng","iso639-3":"eng","iso639-6":"engs","note":"","google_api":true},
//			{"lang_nation":"シナ・チベット語族","wamei":"中国語","lang_name":"中文,汉语,漢語","iso639-1":"zh","iso639-2T":"zho","iso639-2B":"chi","iso639-3":"zho","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"中国語繁体字","wamei":"中国語繁体字","lang_name":"中文,繁体字","iso639-1":"zh-TW","iso639-2T":"zh-TW","iso639-2B":"zh-TW","iso639-3":"zh-TW","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"朝鮮語族","wamei":"ハングル","lang_name":"한국어 (韓國語),조선어 (朝鮮語)","iso639-1":"ko","iso639-2T":"kor","iso639-2B":"kor","iso639-3":"kor","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ドイツ語","lang_name":"Deutsch","iso639-1":"de","iso639-2T":"deu","iso639-2B":"ger","iso639-3":"deu","iso639-6":"deus","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"フランス語","lang_name":"français","iso639-1":"fr","iso639-2T":"fra","iso639-2B":"fre","iso639-3":"fra","iso639-6":"fras","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"スペイン語","lang_name":"español,castellano","iso639-1":"es","iso639-2T":"spa","iso639-2B":"spa","iso639-3":"spa","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ポルトガル語","lang_name":"português","iso639-1":"pt","iso639-2T":"por","iso639-2B":"por","iso639-3":"por","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ベンガル語","lang_name":"বাংলা","iso639-1":"bn","iso639-2T":"ben","iso639-2B":"ben","iso639-3":"ben","iso639-6":"","note":"","google_api":true},

//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ギリシア語","lang_name":"ελληνικά","iso639-1":"el","iso639-2T":"ell","iso639-2B":"gre","iso639-3":"ell","iso639-6":"ells","note":"","google_api":true},

//			{"lang_nation":"北西コーカサス語族","wamei":"アブハズ語","lang_name":"аҧсуа бызшәа,аҧсшәа","iso639-1":"ab","iso639-2T":"abk","iso639-2B":"abk","iso639-3":"abk","iso639-6":"abks","note":"","google_api":false},
//			{"lang_nation":"アフロ・アジア語族","wamei":"アファル語","lang_name":"Qafár af","iso639-1":"aa","iso639-2T":"aar","iso639-2B":"aar","iso639-3":"aar","iso639-6":"aars","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"アフリカーンス語","lang_name":"Afrikaans","iso639-1":"af","iso639-2T":"afr","iso639-2B":"afr","iso639-3":"afr","iso639-6":"afrs","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"アカン語","lang_name":"Akan","iso639-1":"ak","iso639-2T":"aka","iso639-2B":"aka","iso639-3":"aka","iso639-6":"","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"アルバニア語","lang_name":"Gjuha shqipe","iso639-1":"sq","iso639-2T":"sqi","iso639-2B":"alb","iso639-3":"sqi","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"アフロ・アジア語族","wamei":"アムハラ語","lang_name":"አማርኛ","iso639-1":"am","iso639-2T":"amh","iso639-2B":"amh","iso639-3":"amh","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"アフロ・アジア語族","wamei":"アラビア語","lang_name":"العربية","iso639-1":"ar","iso639-2T":"ara","iso639-2B":"ara","iso639-3":"ara","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"アラゴン語","lang_name":"aragonés","iso639-1":"an","iso639-2T":"arg","iso639-2B":"arg","iso639-3":"arg","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"アルメニア語","lang_name":"Հայերեն","iso639-1":"hy","iso639-2T":"hye","iso639-2B":"arm","iso639-3":"hye","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"アッサム語","lang_name":"অসমীয়া","iso639-1":"as","iso639-2T":"asm","iso639-2B":"asm","iso639-3":"asm","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"北東コーカサス語族","wamei":"アヴァル語","lang_name":"Авар мацӀ,МагӀарул мацӀ","iso639-1":"av","iso639-2T":"ava","iso639-2B":"ava","iso639-3":"ava","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"アヴェスター語","lang_name":"―","iso639-1":"ae","iso639-2T":"ave","iso639-2B":"ave","iso639-3":"ave","iso639-6":"","note":"古代言語","google_api":false},
//			{"lang_nation":"アイマラ語族","wamei":"アイマラ語","lang_name":"Aymar aru","iso639-1":"ay","iso639-2T":"aym","iso639-2B":"aym","iso639-3":"aym","iso639-6":"","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"テュルク語族","wamei":"アゼルバイジャン語","lang_name":"Azərbaycanca,تورک دیلی‎","iso639-1":"az","iso639-2T":"aze","iso639-2B":"aze","iso639-3":"aze","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"バンバラ語","lang_name":"bamanankan","iso639-1":"bm","iso639-2T":"bam","iso639-2B":"bam","iso639-3":"bam","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"テュルク語族","wamei":"バシキール語","lang_name":"башҡорт теле","iso639-1":"ba","iso639-2T":"bak","iso639-2B":"bak","iso639-3":"bak","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"孤立した言語","wamei":"バスク語","lang_name":"euskara","iso639-1":"eu","iso639-2T":"eus","iso639-2B":"baq","iso639-3":"eus","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ベラルーシ語","lang_name":"беларуская мова","iso639-1":"be","iso639-2T":"bel","iso639-2B":"bel","iso639-3":"bel","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ビハール語","lang_name":"―","iso639-1":"bh","iso639-2T":"bih","iso639-2B":"bih","iso639-3":"–","iso639-6":"","note":"集合的言語","google_api":false},
//			{"lang_nation":"クレオール言語","wamei":"ビスラマ語","lang_name":"Bislama","iso639-1":"bi","iso639-2T":"bis","iso639-2B":"bis","iso639-3":"bis","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ボスニア語","lang_name":"bosanski jezik","iso639-1":"bs","iso639-2T":"bos","iso639-2B":"bos","iso639-3":"bos","iso639-6":"boss","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ブルトン語","lang_name":"brezhoneg","iso639-1":"br","iso639-2T":"bre","iso639-2B":"bre","iso639-3":"bre","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ブルガリア語","lang_name":"български език","iso639-1":"bg","iso639-2T":"bul","iso639-2B":"bul","iso639-3":"bul","iso639-6":"buls","note":"","google_api":true},
//			{"lang_nation":"シナ・チベット語族","wamei":"ビルマ語","lang_name":"မြန်မာဘာသာ","iso639-1":"my","iso639-2T":"mya","iso639-2B":"bur","iso639-3":"mya","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"カタルーニャ語、バレンシア語","lang_name":"català,valencià","iso639-1":"ca","iso639-2T":"cat","iso639-2B":"cat","iso639-3":"cat","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"チャモロ語","lang_name":"Fino' Chamoru","iso639-1":"ch","iso639-2T":"cha","iso639-2B":"cha","iso639-3":"cha","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"北東コーカサス語族","wamei":"チェチェン語","lang_name":"нохчийн мотт","iso639-1":"ce","iso639-2T":"che","iso639-2B":"che","iso639-3":"che","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"チェワ語","lang_name":"Chicheŵa,Chichewa","iso639-1":"ny","iso639-2T":"nya","iso639-2B":"nya","iso639-3":"nya","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"テュルク語族","wamei":"チュヴァシ語","lang_name":"Чăвашла","iso639-1":"cv","iso639-2T":"chv","iso639-2B":"chv","iso639-3":"chv","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"コーンウォール語","lang_name":"Kernowek","iso639-1":"kw","iso639-2T":"cor","iso639-2B":"cor","iso639-3":"cor","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"コルシカ語","lang_name":"corsu,lingua corsa","iso639-1":"co","iso639-2T":"cos","iso639-2B":"cos","iso639-3":"cos","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"アルゴンキン語族","wamei":"クリー語","lang_name":"Nēhiyawēwin,ᓀᐦᐃᔭᐍᐏᐣ","iso639-1":"cr","iso639-2T":"cre","iso639-2B":"cre","iso639-3":"cre","iso639-6":"","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"クロアチア語","lang_name":"hrvatski","iso639-1":"hr","iso639-2T":"hrv","iso639-2B":"hrv","iso639-3":"hrv","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"チェコ語","lang_name":"čeština,český jazyk","iso639-1":"cs","iso639-2T":"ces","iso639-2B":"cze","iso639-3":"ces","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"デンマーク語","lang_name":"dansk","iso639-1":"da","iso639-2T":"dan","iso639-2B":"dan","iso639-3":"dan","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ディベヒ語","lang_name":"ދިވެހި","iso639-1":"dv","iso639-2T":"div","iso639-2B":"div","iso639-3":"div","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"オランダ語","lang_name":"Nederlands","iso639-1":"nl","iso639-2T":"nld","iso639-2B":"dut","iso639-3":"nld","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"シナ・チベット語族","wamei":"ゾンカ語","lang_name":"རྫོང་ཁ","iso639-1":"dz","iso639-2T":"dzo","iso639-2B":"dzo","iso639-3":"dzo","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"人工言語","wamei":"エスペラント","lang_name":"Esperanto","iso639-1":"eo","iso639-2T":"epo","iso639-2B":"epo","iso639-3":"epo","iso639-6":"","note":"ルドヴィコ・ザメンホフが1887年に発表","google_api":true},
//			{"lang_nation":"ウラル語族","wamei":"エストニア語","lang_name":"eesti keel","iso639-1":"et","iso639-2T":"est","iso639-2B":"est","iso639-3":"est","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"エウェ語","lang_name":"Eʋegbe","iso639-1":"ee","iso639-2T":"ewe","iso639-2B":"ewe","iso639-3":"ewe","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"フェロー語","lang_name":"føroyskt","iso639-1":"fo","iso639-2T":"fao","iso639-2B":"fao","iso639-3":"fao","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"オーストロネシア語族","wamei":"フィジー語","lang_name":"Na vosa vaka-Viti","iso639-1":"fj","iso639-2T":"fij","iso639-2B":"fij","iso639-3":"fij","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ウラル語族","wamei":"フィンランド語","lang_name":"suomi,suomen kieli","iso639-1":"fi","iso639-2T":"fin","iso639-2B":"fin","iso639-3":"fin","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"フラニ語","lang_name":"Fulfulde,Pulaar,Pular","iso639-1":"ff","iso639-2T":"ful","iso639-2B":"ful","iso639-3":"ful","iso639-6":" ","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ガリシア語","lang_name":"galego","iso639-1":"gl","iso639-2T":"glg","iso639-2B":"glg","iso639-3":"glg","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"南コーカサス語族","wamei":"グルジア語","lang_name":"ქართული","iso639-1":"ka","iso639-2T":"kat","iso639-2B":"geo","iso639-3":"kat","iso639-6":"","note":"","google_api":true},

//			{"lang_nation":"トゥピ語族","wamei":"グアラニー語","lang_name":"avañe'ẽ","iso639-1":"gn","iso639-2T":"grn","iso639-2B":"grn","iso639-3":"grn","iso639-6":" ","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"グジャラート語","lang_name":"ગુજરાતી","iso639-1":"gu","iso639-2T":"guj","iso639-2B":"guj","iso639-3":"guj","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"クレオール言語","wamei":"ハイチ語","lang_name":"Kreyòl ayisyen","iso639-1":"ht","iso639-2T":"hat","iso639-2B":"hat","iso639-3":"hat","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"アフロ・アジア語族","wamei":"ハウサ語","lang_name":"Hausa,هَوُسَ","iso639-1":"ha","iso639-2T":"hau","iso639-2B":"hau","iso639-3":"hau","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"アフロ・アジア語族","wamei":"ヘブライ語","lang_name":"עברית","iso639-1":"he","iso639-2T":"heb","iso639-2B":"heb","iso639-3":"heb","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ヘレロ語","lang_name":"Otjiherero","iso639-1":"hz","iso639-2T":"her","iso639-2B":"her","iso639-3":"her","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ヒンディー語","lang_name":"हिन्दी","iso639-1":"hi","iso639-2T":"hin","iso639-2B":"hin","iso639-3":"hin","iso639-6":"hins","note":"","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"ヒリモツ語","lang_name":"Hiri Motu","iso639-1":"ho","iso639-2T":"hmo","iso639-2B":"hmo","iso639-3":"hmo","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ウラル語族","wamei":"ハンガリー語","lang_name":"magyar","iso639-1":"hu","iso639-2T":"hun","iso639-2B":"hun","iso639-3":"hun","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"人工言語","wamei":"インターリングア","lang_name":"Interlingua","iso639-1":"ia","iso639-2T":"ina","iso639-2B":"ina","iso639-3":"ina","iso639-6":" ","note":"国際補助語協会が1951年に発表","google_api":false},
//			{"lang_nation":"オーストロネシア語族","wamei":"インドネシア語","lang_name":"Bahasa Indonesia","iso639-1":"id","iso639-2T":"ind","iso639-2B":"ind","iso639-3":"ind","iso639-6":" ","note":"","google_api":true},
//			{"lang_nation":"人工言語","wamei":"インターリング","lang_name":"Interlingue","iso639-1":"ie","iso639-2T":"ile","iso639-2B":"ile","iso639-3":"ile","iso639-6":" ","note":"エドガー・フォン・ヴァールが1922年に発表","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"アイルランド語","lang_name":"Gaeilge","iso639-1":"ga","iso639-2T":"gle","iso639-2B":"gle","iso639-3":"gle","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"イボ語","lang_name":"asụsụ Igbo","iso639-1":"ig","iso639-2T":"ibo","iso639-2B":"ibo","iso639-3":"ibo","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"エスキモー・アレウト語族","wamei":"イヌピアック語","lang_name":"Iñupiak,Iñupiatun","iso639-1":"ik","iso639-2T":"ipk","iso639-2B":"ipk","iso639-3":"ipk","iso639-6":" ","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"人工言語","wamei":"イド語","lang_name":"Ido","iso639-1":"io","iso639-2T":"ido","iso639-2B":"ido","iso639-3":"ido","iso639-6":"idos","note":"ルイ・ド・ボーフロンが1907年に発表","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"アイスランド語","lang_name":"íslenska","iso639-1":"is","iso639-2T":"isl","iso639-2B":"ice","iso639-3":"isl","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"イタリア語","lang_name":"Italiano","iso639-1":"it","iso639-2T":"ita","iso639-2B":"ita","iso639-3":"ita","iso639-6":"itas","note":"","google_api":true},
//			{"lang_nation":"エスキモー・アレウト語族","wamei":"イヌクティトゥット語","lang_name":"ᐃᓄᒃᑎᑐᑦ","iso639-1":"iu","iso639-2T":"iku","iso639-2B":"iku","iso639-3":"iku","iso639-6":" ","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"オーストロネシア語族","wamei":"ジャワ語","lang_name":"Basa Jawa,ꦧꦱꦗꦮ","iso639-1":"jv","iso639-2T":"jav","iso639-2B":"jav","iso639-3":"jav","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"エスキモー・アレウト語族","wamei":"グリーンランド語","lang_name":"kalaallisut","iso639-1":"kl","iso639-2T":"kal","iso639-2B":"kal","iso639-3":"kal","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ドラヴィダ語族","wamei":"カンナダ語","lang_name":"ಕನ್ನಡ","iso639-1":"kn","iso639-2T":"kan","iso639-2B":"kan","iso639-3":"kan","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ナイル・サハラ語族","wamei":"カヌリ語","lang_name":"Kanuri","iso639-1":"kr","iso639-2T":"kau","iso639-2B":"kau","iso639-3":"kau","iso639-6":" ","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"カシミール語","lang_name":"कॉशुर,کٲشُر‎","iso639-1":"ks","iso639-2T":"kas","iso639-2B":"kas","iso639-3":"kas","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"テュルク語族","wamei":"カザフ語","lang_name":"Қазақ тілі,Qazaq tili,قازاق ٴتىلى‎","iso639-1":"kk","iso639-2T":"kaz","iso639-2B":"kaz","iso639-3":"kaz","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"オーストロアジア語族","wamei":"クメール語","lang_name":"ភាសាខ្មែរ","iso639-1":"km","iso639-2T":"khm","iso639-2B":"khm","iso639-3":"khm","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"キクユ語","lang_name":"Gĩkũyũ","iso639-1":"ki","iso639-2T":"kik","iso639-2B":"kik","iso639-3":"kik","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ルワンダ語","lang_name":"Kinyarwanda","iso639-1":"rw","iso639-2T":"kin","iso639-2B":"kin","iso639-3":"kin","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"テュルク語族","wamei":"キルギス語","lang_name":"Кыргызча,Кыргыз тили,قىرعىز تىلى‎","iso639-1":"ky","iso639-2T":"kir","iso639-2B":"kir","iso639-3":"kir","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ウラル語族","wamei":"コミ語","lang_name":"Коми","iso639-1":"kv","iso639-2T":"kom","iso639-2B":"kom","iso639-3":"kom","iso639-6":" ","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"コンゴ語","lang_name":"Kikongo","iso639-1":"kg","iso639-2T":"kon","iso639-2B":"kon","iso639-3":"kon","iso639-6":" ","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"クルド語","lang_name":"Kurdî,كوردی‎","iso639-1":"ku","iso639-2T":"kur","iso639-2B":"kur","iso639-3":"kur","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"クワニャマ語","lang_name":"Oshikwanyama","iso639-1":"kj","iso639-2T":"kua","iso639-2B":"kua","iso639-3":"kua","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ラテン語","lang_name":"latina","iso639-1":"la","iso639-2T":"lat","iso639-2B":"lat","iso639-3":"lat","iso639-6":"lats","note":"古代言語","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ルクセンブルク語","lang_name":"Lëtzebuergesch","iso639-1":"lb","iso639-2T":"ltz","iso639-2B":"ltz","iso639-3":"ltz","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ルガンダ語","lang_name":"Luganda","iso639-1":"lg","iso639-2T":"lug","iso639-2B":"lug","iso639-3":"lug","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"リンブルフ語","lang_name":"Limburgs","iso639-1":"li","iso639-2T":"lim","iso639-2B":"lim","iso639-3":"lim","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"リンガラ語","lang_name":"Lingála","iso639-1":"ln","iso639-2T":"lin","iso639-2B":"lin","iso639-3":"lin","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"タイ・カダイ語族","wamei":"ラーオ語","lang_name":"ພາສາລາວ","iso639-1":"lo","iso639-2T":"lao","iso639-2B":"lao","iso639-3":"lao","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"リトアニア語","lang_name":"lietuvių","iso639-1":"lt","iso639-2T":"lit","iso639-2B":"lit","iso639-3":"lit","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ルバ・カタンガ語","lang_name":"Kiluba","iso639-1":"lu","iso639-2T":"lub","iso639-2B":"lub","iso639-3":"lub","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ラトビア語","lang_name":"latviešu","iso639-1":"lv","iso639-2T":"lav","iso639-2B":"lav","iso639-3":"lav","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"マン島語","lang_name":"Gaelg,Gailck","iso639-1":"gv","iso639-2T":"glv","iso639-2B":"glv","iso639-3":"glv","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"マケドニア語","lang_name":"македонски јазик","iso639-1":"mk","iso639-2T":"mkd","iso639-2B":"mac","iso639-3":"mkd","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"マダガスカル語","lang_name":"Malagasy","iso639-1":"mg","iso639-2T":"mlg","iso639-2B":"mlg","iso639-3":"mlg","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"マレー語","lang_name":"bahasa Melayu,بهاس ملايو‎","iso639-1":"ms","iso639-2T":"msa","iso639-2B":"may","iso639-3":"msa","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"ドラヴィダ語族","wamei":"マラヤーラム語","lang_name":"മലയാളം","iso639-1":"ml","iso639-2T":"mal","iso639-2B":"mal","iso639-3":"mal","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"アフロ・アジア語族","wamei":" マルタ語","lang_name":"Malti","iso639-1":"mt","iso639-2T":"mlt","iso639-2B":"mlt","iso639-3":"mlt","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"マオリ語","lang_name":"reo Māori","iso639-1":"mi","iso639-2T":"mri","iso639-2B":"mao","iso639-3":"mri","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"マラーティー語","lang_name":"मराठी","iso639-1":"mr","iso639-2T":"mar","iso639-2B":"mar","iso639-3":"mar","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"マーシャル語","lang_name":"Kajin M̧ajeļ","iso639-1":"mh","iso639-2T":"mah","iso639-2B":"mah","iso639-3":"mah","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"モンゴル語族","wamei":"モンゴル語","lang_name":"Монгол хэл,ᠮᠣᠨᠭᠭᠣᠯ ᠬᠡᠯᠡ","iso639-1":"mn","iso639-2T":"mon","iso639-2B":"mon","iso639-3":"mon","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"ナウル語","lang_name":"dorerin Naoero","iso639-1":"na","iso639-2T":"nau","iso639-2B":"nau","iso639-3":"nau","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ナ・デネ語族","wamei":"ナバホ語","lang_name":"Diné bizaad","iso639-1":"nv","iso639-2T":"nav","iso639-2B":"nav","iso639-3":"nav","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ノルウェー語(ブークモール)","lang_name":"norsk bokmål","iso639-1":"nb","iso639-2T":"nob","iso639-2B":"nob","iso639-3":"nob","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"北ンデベレ語","lang_name":"isiNdebele","iso639-1":"nd","iso639-2T":"nde","iso639-2B":"nde","iso639-3":"nde","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ネパール語","lang_name":"नेपाली भाषा","iso639-1":"ne","iso639-2T":"nep","iso639-2B":"nep","iso639-3":"nep","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ンドンガ語","lang_name":"Oshiwambo,Owambo","iso639-1":"ng","iso639-2T":"ndo","iso639-2B":"ndo","iso639-3":"ndo","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ノルウェー語(ニーノシュク)","lang_name":"norsk nynorsk","iso639-1":"nn","iso639-2T":"nno","iso639-2B":"nno","iso639-3":"nno","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ノルウェー語","lang_name":"norsk","iso639-1":"no","iso639-2T":"nor","iso639-2B":"nor","iso639-3":"nor","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"シナ・チベット語族","wamei":"四川彝語","lang_name":"ꆈꌠ꒿","iso639-1":"ii","iso639-2T":"iii","iso639-2B":"iii","iso639-3":"iii","iso639-6":" ","note":"彝語の北部方言","google_api":false},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"南ンデベレ語","lang_name":"isiNdebele","iso639-1":"nr","iso639-2T":"nbl","iso639-2B":"nbl","iso639-3":"nbl","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"オック語","lang_name":"occitan,lenga d'òc","iso639-1":"oc","iso639-2T":"oci","iso639-2B":"oci","iso639-3":"oci","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"アルゴンキン語族","wamei":"オジブウェー語","lang_name":"ᐊᓂᔑᓈᐯᒧᐎᓐ","iso639-1":"oj","iso639-2T":"oji","iso639-2B":"oji","iso639-3":"oji","iso639-6":"","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"古代教会スラヴ語、教会スラヴ語","lang_name":"словѣньскъ,ⰔⰎⰑⰂⰡⰐⰠⰔⰍⰟ","iso639-1":"cu","iso639-2T":"chu","iso639-2B":"chu","iso639-3":"chu","iso639-6":"","note":"古代言語","google_api":false},
//			{"lang_nation":"アフロ・アジア語族","wamei":"オロモ語","lang_name":"Afaan Oromoo","iso639-1":"om","iso639-2T":"orm","iso639-2B":"orm","iso639-3":"orm","iso639-6":"","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"オリヤー語","lang_name":"ଓଡ଼ିଆ","iso639-1":"or","iso639-2T":"ori","iso639-2B":"ori","iso639-3":"ori","iso639-6":"","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"オセット語","lang_name":"ирон æвзаг","iso639-1":"os","iso639-2T":"oss","iso639-2B":"oss","iso639-3":"oss","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"パンジャーブ語","lang_name":"ਪੰਜਾਬੀ,پنجابی‎","iso639-1":"pa","iso639-2T":"pan","iso639-2B":"pan","iso639-3":"pan","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"パーリ語","lang_name":"पालि","iso639-1":"pi","iso639-2T":"pli","iso639-2B":"pli","iso639-3":"pli","iso639-6":"","note":"古代言語","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ペルシア語","lang_name":"فارسی","iso639-1":"fa","iso639-2T":"fas","iso639-2B":"per","iso639-3":"fas","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ポーランド語","lang_name":"język polski,polszczyzna","iso639-1":"pl","iso639-2T":"pol","iso639-2B":"pol","iso639-3":"pol","iso639-6":"pols","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"パシュトー語","lang_name":"پښتو","iso639-1":"ps","iso639-2T":"pus","iso639-2B":"pus","iso639-3":"pus","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"ケチュア語族","wamei":"ケチュア語","lang_name":"runa simi,Qhichwa simi","iso639-1":"qu","iso639-2T":"que","iso639-2B":"que","iso639-3":"que","iso639-6":"","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ロマンシュ語","lang_name":"rumantsch","iso639-1":"rm","iso639-2T":"roh","iso639-2B":"roh","iso639-3":"roh","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ルンディ語","lang_name":"Ikirundi","iso639-1":"rn","iso639-2T":"run","iso639-2B":"run","iso639-3":"run","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ルーマニア語、モルドバ語[1]","lang_name":"moldovenească","iso639-1":"ro","iso639-2T":"ron","iso639-2B":"rum","iso639-3":"ron","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ロシア語","lang_name":"русский язык","iso639-1":"ru","iso639-2T":"rus","iso639-2B":"rus","iso639-3":"rus","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"サンスクリット","lang_name":"संस्कृतम्","iso639-1":"sa","iso639-2T":"san","iso639-2B":"san","iso639-3":"san","iso639-6":"","note":"古代言語（但し現在も話者がいる）","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"サルデーニャ語","lang_name":"sardu","iso639-1":"sc","iso639-2T":"srd","iso639-2B":"srd","iso639-3":"srd","iso639-6":"","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"シンド語","lang_name":"सिन्धी,سنڌي‎","iso639-1":"sd","iso639-2T":"snd","iso639-2B":"snd","iso639-3":"snd","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ウラル語族","wamei":"北部サーミ語","lang_name":"davvisámegiella","iso639-1":"se","iso639-2T":"sme","iso639-2B":"sme","iso639-3":"sme","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"オーストロネシア語族","wamei":"サモア語","lang_name":"Gagana fa'a Sāmoa","iso639-1":"sm","iso639-2T":"smo","iso639-2B":"smo","iso639-3":"smo","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"クレオール言語","wamei":"サンゴ語","lang_name":"sängö","iso639-1":"sg","iso639-2T":"sag","iso639-2B":"sag","iso639-3":"sag","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"セルビア語","lang_name":"српски језик,srpski jezik","iso639-1":"sr","iso639-2T":"srp","iso639-2B":"srp","iso639-3":"srp","iso639-6":"","note":"かつてはISO 639-2/Bコードに[scc]が使用されていた[2]。","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"スコットランド・ゲール語","lang_name":"Gàidhlig","iso639-1":"gd","iso639-2T":"gla","iso639-2B":"gla","iso639-3":"gla","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ショナ語","lang_name":"chiShona","iso639-1":"sn","iso639-2T":"sna","iso639-2B":"sna","iso639-3":"sna","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"シンハラ語","lang_name":"සිංහල","iso639-1":"si","iso639-2T":"sin","iso639-2B":"sin","iso639-3":"sin","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"スロバキア語","lang_name":"slovenčina,slovenský jazyk","iso639-1":"sk","iso639-2T":"slk","iso639-2B":"slo","iso639-3":"slk","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"スロベニア語","lang_name":"slovenščina,slovenski jezik","iso639-1":"sl","iso639-2T":"slv","iso639-2B":"slv","iso639-3":"slv","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"アフロ・アジア語族","wamei":"ソマリ語","lang_name":"af Soomaali","iso639-1":"so","iso639-2T":"som","iso639-2B":"som","iso639-3":"som","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ソト語","lang_name":"Sesotho","iso639-1":"st","iso639-2T":"sot","iso639-2B":"sot","iso639-3":"sot","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"スンダ語","lang_name":"Basa Sunda","iso639-1":"su","iso639-2T":"sun","iso639-2B":"sun","iso639-3":"sun","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"スワヒリ語","lang_name":"Kiswahili","iso639-1":"sw","iso639-2T":"swa","iso639-2B":"swa","iso639-3":"swa","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"スワジ語","lang_name":"siSwati","iso639-1":"ss","iso639-2T":"ssw","iso639-2B":"ssw","iso639-3":"ssw","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"スウェーデン語","lang_name":"svenska","iso639-1":"sv","iso639-2T":"swe","iso639-2B":"swe","iso639-3":"swe","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ドラヴィダ語族","wamei":"タミル語","lang_name":"தமிழ்","iso639-1":"ta","iso639-2T":"tam","iso639-2B":"tam","iso639-3":"tam","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ドラヴィダ語族","wamei":"テルグ語","lang_name":"తెలుగు","iso639-1":"te","iso639-2T":"tel","iso639-2B":"tel","iso639-3":"tel","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"タジク語","lang_name":"тоҷикӣ,tojikī,تاجیکی‎","iso639-1":"tg","iso639-2T":"tgk","iso639-2B":"tgk","iso639-3":"tgk","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"タイ・カダイ語族","wamei":"タイ語","lang_name":"ภาษาไทย","iso639-1":"th","iso639-2T":"tha","iso639-2B":"tha","iso639-3":"tha","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"アフロ・アジア語族","wamei":"ティグリニャ語","lang_name":"ትግርኛ","iso639-1":"ti","iso639-2T":"tir","iso639-2B":"tir","iso639-3":"tir","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"シナ・チベット語族","wamei":"チベット語","lang_name":"བོད་ཡིག","iso639-1":"bo","iso639-2T":"bod","iso639-2B":"tib","iso639-3":"bod","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"テュルク語族","wamei":"トルクメン語","lang_name":"Türkmençe,Türkmen dili,Түркмен дили","iso639-1":"tk","iso639-2T":"tuk","iso639-2B":"tuk","iso639-3":"tuk","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"オーストロネシア語族","wamei":"タガログ語","lang_name":"Wikang Tagalog","iso639-1":"tl","iso639-2T":"tgl","iso639-2B":"tgl","iso639-3":"tgl","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ツワナ語","lang_name":"Setswana","iso639-1":"tn","iso639-2T":"tsn","iso639-2B":"tsn","iso639-3":"tsn","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"オーストロネシア語族","wamei":"トンガ語","lang_name":"lea faka-Tonga","iso639-1":"to","iso639-2T":"ton","iso639-2B":"ton","iso639-3":"ton","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"テュルク語族","wamei":"トルコ語","lang_name":"Türkçe","iso639-1":"tr","iso639-2T":"tur","iso639-2B":"tur","iso639-3":"tur","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ツォンガ語","lang_name":"Xitsonga","iso639-1":"ts","iso639-2T":"tso","iso639-2B":"tso","iso639-3":"tso","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"テュルク語族","wamei":"タタール語","lang_name":"татар теле,tatar tele,تاتار تيلی‎","iso639-1":"tt","iso639-2T":"tat","iso639-2B":"tat","iso639-3":"tat","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"トウィ語","lang_name":"Twi","iso639-1":"tw","iso639-2T":"twi","iso639-2B":"twi","iso639-3":"twi","iso639-6":" ","note":"","google_api":false},
//			{"lang_nation":"オーストロネシア語族","wamei":"タヒチ語","lang_name":"reo Tahiti","iso639-1":"ty","iso639-2T":"tah","iso639-2B":"tah","iso639-3":"tah","iso639-6":"","note":"レオ・マーオヒの1つ","google_api":false},
//			{"lang_nation":"テュルク語族","wamei":"ウイグル語","lang_name":"Uyghur tili,ئۇيغۇرچە‎","iso639-1":"ug","iso639-2T":"uig","iso639-2B":"uig","iso639-3":"uig","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ウクライナ語","lang_name":"українська мова","iso639-1":"uk","iso639-2T":"ukr","iso639-2B":"ukr","iso639-3":"ukr","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ウルドゥー語","lang_name":"اردو","iso639-1":"ur","iso639-2T":"urd","iso639-2B":"urd","iso639-3":"urd","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"テュルク語族","wamei":"ウズベク語","lang_name":"Oʻzbek tili,Ўзбек тили,ئۇزبېك تیلى‎","iso639-1":"uz","iso639-2T":"uzb","iso639-2B":"uzb","iso639-3":"uzb","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ヴェンダ語","lang_name":"TshiVenḓa","iso639-1":"ve","iso639-2T":"ven","iso639-2B":"ven","iso639-3":"ven","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"オーストロアジア語族","wamei":"ベトナム語","lang_name":"Tiếng Việt","iso639-1":"vi","iso639-2T":"vie","iso639-2B":"vie","iso639-3":"vie","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"人工言語","wamei":"ヴォラピュク","lang_name":"Volapük","iso639-1":"vo","iso639-2T":"vol","iso639-2B":"vol","iso639-3":"vol","iso639-6":"","note":"ヨハン・シュライヤーが1879年に発表","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ワロン語","lang_name":"walon","iso639-1":"wa","iso639-2T":"wln","iso639-2B":"wln","iso639-3":"wln","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"ウェールズ語","lang_name":"Cymraeg","iso639-1":"cy","iso639-2T":"cym","iso639-2B":"wel","iso639-3":"cym","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ウォロフ語","lang_name":"Wolof","iso639-1":"wo","iso639-2T":"wol","iso639-2B":"wol","iso639-3":"wol","iso639-6":"","note":"","google_api":false},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"西フリジア語","lang_name":"Frysk","iso639-1":"fy","iso639-2T":"fry","iso639-2B":"fry","iso639-3":"fry","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"コサ語","lang_name":"isiXhosa","iso639-1":"xh","iso639-2T":"xho","iso639-2B":"xho","iso639-3":"xho","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"インド・ヨーロッパ語族","wamei":"イディッシュ語","lang_name":"ייִדיש","iso639-1":"yi","iso639-2T":"yid","iso639-2B":"yid","iso639-3":"yid","iso639-6":"","note":"マクロランゲージ","google_api":true},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ヨルバ語","lang_name":"èdè Yorùbá","iso639-1":"yo","iso639-2T":"yor","iso639-2B":"yor","iso639-3":"yor","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"タイ・カダイ語族","wamei":"チワン語","lang_name":"Vahcuengh","iso639-1":"za","iso639-2T":"zha","iso639-2B":"zha","iso639-3":"zha","iso639-6":"","note":"マクロランゲージ","google_api":false},
//			{"lang_nation":"ニジェール・コンゴ語族","wamei":"ズールー語","lang_name":"isiZulu","iso639-1":"zu","iso639-2T":"zul","iso639-2B":"zul","iso639-3":"zul","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"セブアノ語","lang_name":"Sinugboanon","iso639-1":"ceb","iso639-2T":"ceb","iso639-2B":"ceb","iso639-3":"ceb","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"ハワイ語","lang_name":"ʻŌlelo Hawaiʻi","iso639-1":"haw","iso639-2T":"haw","iso639-2B":"haw","iso639-3":"haw","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"ミャオ・ヤオ語族","wamei":"ミャオ語","lang_name":"Hmong","iso639-1":"hmn","iso639-2T":"hmn","iso639-2B":"hmn","iso639-3":"hmn","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"アフロ・アジア語族のセム語派","wamei":"ヘブライ語,iw","lang_name":"עברית, Ivrit","iso639-1":"iw","iso639-2T":"iw","iso639-2B":"iw","iso639-3":"iw","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"オーストロネシア語族","wamei":"ジャワ語","lang_name":"Basa Jawa、꧋ꦧꦱꦗꦮ","iso639-1":"jw","iso639-2T":"jav","iso639-2B":"jav","iso639-3":"jav","iso639-6":"","note":"","google_api":true},
//			{"lang_nation":"日本語族","wamei":"日本語","lang_name":"日本語","iso639-1":"ja","iso639-2T":"jpn","iso639-2B":"jpn","iso639-3":"jpn","iso639-6":"","note":"","google_api":true},

			];
		
		// google transrate apiに対応している言語のみにフィルタイングする。
		var langData2 = [];
		for(var i in langData){
			var ent = langData[i];
			if(ent.google_api == true){
				langData2.push(ent);
			}
		}
		return langData2;
	}
	
	
}