/**
 * CrudBase一括追加機能
 * 
 * @date 2019-1-3 | 2020-8-25
 * @version 1.0.2
 * 
 */
class CrudBaseBulkAdd{
	
	
	/**
	 * コンストラクタ
	 * @param array fieldData
	 */
	constructor(fieldData){
		
		this.fieldData = fieldData;
		
	}
	
	
	/**
	 * 初期化
	 * @param array inpFields 入力フィールドリスト
	 *  - entity エンティティ
	 *   - field フィールド名
	 *   - inp_type 入力タイプ
	 *    - 'textarea' テキストエリア型
	 *    - 'select'   SELECT型
	 *    - 'date'     日付選択型
	 *    - 'text'     テキスト型
	 *   - list SELECTリスト 
	 *
	 * @param object param 
	 *  - string ajax_url			非同期通信先URL
	 *  - string csrf_token		CSRFトークン
	 *  - string ta_placeholder		テキストエリアのプレースホルダー
	 *  - string ta_height			テキストエリア縦幅
	 */
	init(inpFields, param){
		
		// フィールドデータから和名を取得して、入力フィールドリストにセットする。
		for(var i in inpFields){
			var ent = inpFields[i];
			ent['wamei'] = this._getWameiFromFieldData(ent.field);
		}
		
		this.inpFields = inpFields;
		
		this.param = this._initParam(param);
		
	}
	
	/**
	 * フィールドデータから和名を取得する
	 * @param string field フィールド
	 * @return string 和名
	 */
	_getWameiFromFieldData(field){
		var wamei = field;
		
		for(var i in this.fieldData){
			var fEnt = this.fieldData[i];
			if(field == fEnt.field){
				wamei = fEnt.wamei;
				break;
			}
		}
		
		return wamei;
	}

	/**
	 * パラメータの初期化
	 * @param object param
	 * @return 初期化したparam
	 */
	_initParam(param){
		
		if(param == null) param = {};
		
		if(param['ajax_url'] == null){
			throw new Error('Not empty ajax_url in param!');
		}
		
		if(param['csrf_token'] == null){
			throw new Error('Not empty csrf_token in param!');
		}
		
		if(param['ta_placeholder'] == null){
			param['ta_placeholder'] = "Excelからコピーした行列を貼り付けてください。\n(例)\nネコ名A\t100\nネコ名B\t101\n";
		}
		
		if(param['ta_height'] == null) param['ta_height'] ='20rem';
		
		if(param['test_mode'] == null) param['test_mode'] = 0;
		
		return param;
	}
	
	/**
	 * フォーム表示
	 */
	showForm(){
		if(this.form){
			this.form.show();
			this.form.find('#cbba_inps_div').show();
			this.form.find('#cbba_preview_div').hide();
			return;
		}
		
		var param = this.param;
		
		// 同適用の入力HTMLを作成
		var same_applys_html = this._makeSameApplysHtml();
		
		// テストモードがONであるならテスト用テキストを取得
		var test_text = '';
		if(this.param.test_mode) test_text = this._getTestText();
		
		var html = `
			<div id="cbba_div" >
				<div id="cbba_head" >
					<h4>一括追加</h4>
					<div id="cbba_close_btn_w" style="">
						<input id="cbba_close_btn" type='button' value="閉じる" class="btn btn-primary btn-sm" onclick="" />
					</div>
				</div>
				<div style="clear:both"></div>
				
				<div id="cbba_inps_div">
					<textarea id="cbba_ta" placeholder="${param.ta_placeholder}" style='height:${param.ta_height}'>${test_text}</textarea>
					<div id="cbba_same_applys_w">${same_applys_html}</div>
					<div id="cbba_preview_btn_w">
						<input id="cbba_preview_btn" type="button" value="プレビュー" class="btn btn-success" />
					</div>
				</div>
				
				<div id="cbba_preview_div" style="display:none">
					<div id="cbba_preview_div2">
					</div>
					<input id="cbba_reg_btn" type="button" value="一括追加" class="btn btn-danger" />
					<input id="cbba_rtn_btn" type="button" value="戻る" class="btn btn-primary" />
				</div>
				
				<div id="cbba_err" class="text-danger"></div>
			</div>
		`;
		
		var form = jQuery('#crud_base_bulk_add');
		form.html(html);
		
		// 閉じるボタンのイベントを組み込む
		var closeBtn = form.find('#cbba_close_btn');
		closeBtn.click( (e)=>{
			this.form.hide();
		});
		
		// 一括追加ボタンにイベントを組み込む
		var previewBtn = form.find('#cbba_reg_btn');
		previewBtn.click( (e)=>{
			this._bulkAdd();
		});
		
		// 戻るボタンにイベントを組み込む
		var rtnwBtn = form.find('#cbba_rtn_btn');
		rtnwBtn.click( (e)=>{
			this._returnToInput(); // 入力へ戻る
		});
		
		// プレビューボタンにイベントを組み込む
		var previewBtn = form.find('#cbba_preview_btn');
		previewBtn.click( (e)=>{
			this._preview();
		});
		
		this.form = form;
		this.form.show();
		
	}

	/**
	 * 入力へ戻る
	 */
	_returnToInput(){
		
		this.form.find('#cbba_preview_div').hide();
		this.form.find('#cbba_inps_div').show();
	}
	
	
	/**
	 * テスト用テキストを取得する
	 * @return string テスト用テキスト
	 */
	_getTestText(){
		return "ロイヤルアナロスタン\t101\nロード・ゴート\t102\nツィッツァ\t103\nイッパイアッテナ\t104\n<input />\t105\nおキャット様.'\"\t106";
	}
	

	/**
	 * 同適用の入力HTMLを作成
	 */
	_makeSameApplysHtml(){
		
		var html = ''; // 同適用の入力HTML
		
		var inpFields = this.inpFields;// 入力フィールドリスト
		for(var i in inpFields){
			var ent = inpFields[i];
			switch(ent.inp_type){
			case 'text':
				html += this._makeSameApplyTypeText(ent);
				break;
			case 'date':
				html += this._makeSameApplyTypeDate(ent);
				break;
			case 'select':
				html += this._makeSameApplyTypeSelect(ent);
				break;
			case 'sort_no':
				html += this._makeSameApplyTypeSortNo(ent);
				break;
			}
		}
		
		return html;
	}
	
	/**
	 * 同適用の入力HTML作成：text型
	 * @parma object ent 入力フィールドエンティティ
	 */
	_makeSameApplyTypeText(ent){
		
		var def = '';
		if(ent['def'] != null) def = ent.def;
		
		var html = `
			<div class="same_apply_w">
				<label>${ent.wamei}</label>
				<input type="text" class="same_apply ${ent.field}" value="${def}" />
			</div>
		`;
		
		return html;
	}
	
	/**
	 * 同適用の入力HTML作成：date型
	 * @parma object ent 入力フィールドエンティティ
	 */
	_makeSameApplyTypeDate(ent){
		
		var def = '';
		if(ent['def'] != null){
			def = ent.def;
			def = this._convDateTo_yyyymmdd(def);
		}

		var html = `
			<div class="same_apply_w">
				<label>${ent.wamei}</label>
				<input type="date" class="same_apply ${ent.field}" value="${def}" />
			</div>
		`;
		
		return html;
	}
	
	/**
	 * 同適用の入力HTML作成：select型
	 * @parma object ent 入力フィールドエンティティ
	 */
	_makeSameApplyTypeSelect(ent){

		// 初期値
		var def = null;
		if(ent['def'] != null) def = ent.def;
		
		// SELECTのoption部分を組み立てる
		var sel_opt_html = '';
		for(var value in ent.list){
			var name = ent.list[value];
			
			var selected = '';
			if(def == value) selected = 'selected';

			sel_opt_html += `<option value='${value}' ${selected}>${name}</option>`;
		}

		var html = `
			<div class="same_apply_w">
				<label>${ent.wamei}</label>
				<select class="same_apply ${ent.field}">${sel_opt_html}</select>
			</div>
		`;
		
		return html;
	}
	
	/**
	 * 同適用の入力HTML作成：ソート型
	 * @parma object ent 入力フィールドエンティティ
	 */
	_makeSameApplyTypeSortNo(ent){

		
		var checked0 = '';
		var checked1 = '';
		if(ent['def'] == 1){
			checked1 = 'checked';
		}else{
			checked0 = 'checked';
		}
		
		var html = `
			<div class="same_apply_w">
				<label>追加場所</label>
				<label class='cbba_sort_no_label'>
					<input type="radio" name="cbba_sort_no" value="0" ${checked0}>
					先頭に追加
				</label>
				<label class='cbba_sort_no_label'>
					<input type="radio" name="cbba_sort_no" value="1" ${checked1}>
					末尾に追加
				</label>
			</div>
		`;
		
		return html;
	}
	
	/**
	 * 日付の書式を「yyyy-mm-dd」形式に変換する
	 * @param mixed date1 日付
	 * @returns string 「yyyy-mm-dd」形式の日付文字列
	 */
	_convDateTo_yyyymmdd(date1){
		
		// 引数が文字列型であれば日付型に変換する
		if((typeof date1) == 'string'){
			date1 = new Date(date1);
			if(date1 == 'Invalid Date'){
				return null;
			}
		}
		
		var year = date1.getFullYear();
		var month = date1.getMonth() + 1;
		month = ("0" + month).slice(-2); // 2桁の文字列に変換する
		var day = date1.getDate();
		day = ("0" + day).slice(-2);
		var date_str = year + '-' + month + '-' + day;
		return date_str;
	}
	
	
	/**
	 * プレビュー
	 */
	_preview(){

		var data = [];
		
		// テキストエリアからデータを取得する
		data = this._getDataFromTextArea(data);
		
		this._err(''); // エラー表示をクリア
		if(data.length == 0){
			this._err('テキストエリアが空です。');
			return;
		}
		
		// 同適用・入力からデータを取得する。
		data = this._getDataFromSameApplys(data);
		
		var data2 = jQuery.extend(true, {}, data);// データのクローン
		data2 = this._xss_sanitize(data2); // クローンしたデータにXSSサニタイズ
		
		// プレビューHTMLを作成する
		var html = this._makePrviewHtml(data2);

		// プレビュー区分の表示
		var previewDiv = this.form.find('#cbba_preview_div');
		previewDiv.find('#cbba_preview_div2').html(html);
		previewDiv.show();
		this.form.find('#cbba_inps_div').hide(); // 入力区分は隠す
		

		this.data = data;
		
	}
	
	
	/**
	 * テキストエリアからデータを取得する
	 * @param array data
	 * @return data
	 */
	_getDataFromTextArea(data){
		
		// ▼ テキストエリアのテキストからアルファデータを作成する。
		var ta_text = this.form.find('#cbba_ta').val();
		var aData = this._makeADataFromTaText(ta_text);
		
		// ▼ 入力フィールドリストから「入力タイプ=textarea」の条件でフィルタリングし、TA入力フィールドにセット。
		var taInpFields = this._filteringToTaInpFields();

		// ▼ アルファデータとTA入力リストからデータを組み立てる
		for(var i in aData){
			var aEnt = aData[i];
			var ent = {}; // データのエンティティ
			
			for(var f_i in taInpFields){
				var field = taInpFields[f_i].field;
				
				if(aEnt[f_i] == null){
					ent[field] = '';
				}else{
					ent[field] = aEnt[f_i];
				}
			}

			data.push(ent);
		}
		
		return data;
	}
	
	/**
	 * テキストエリアのテキストからアルファデータを作成する。
	 * @param string ta_text テキストエリアのテキスト
	 * @return array アルファデータ
	 */
	_makeADataFromTaText(ta_text){
		
		var aData = [];
		var list = ta_text.split("\n");

		for(var i in list){
			var line = list[i];
			if(line == '') continue;
			var row = line.split("\t");
			aData.push(row);
		}

		return aData;
		
	}
	
	/**
	 * 入力フィールドリストから「入力タイプ=textarea」の条件でフィルタリングしたデータである、TA入力フィールドを取得する。
	 */
	_filteringToTaInpFields(){
		var inpFields = this.inpFields; // 入力フィールドリスト
		var taInpFields = []; // TA入力フィールド
		for(var i in inpFields){
			var ent = inpFields[i];
			if(ent.inp_type == 'textarea'){
				taInpFields.push(ent);
			}
		}
		return taInpFields;
	}
	
	
	/**
	 * 同適用・入力からデータを取得する。
	 * @param array data
	 * @return data
	 */
	_getDataFromSameApplys(data){
		
		// 同適用・入力リスト
		var inpTypes = ['text', 'date', 'select'];
		
		// 入力フィールドリストを同適用・入力リストで絞り込み、SA入力フィールドリストをして取得する。
		var saInpFields = this._filteringInpFieldsByInpTypes(inpTypes);
		
		// ▼ 同適用・入力からデータを取得する。
		for(var i in saInpFields){
			var field = saInpFields[i].field;

			// 入力フォームから値を取得する。
			var value = '';
			var inpElm = this.form.find('.' + field);
			if(inpElm[0]){
				value = inpElm.val();
			}
			
			// dataの縦要素に値をセットする。
			for(var d_i in data){
				var ent = data[d_i];
				ent[field] = value;
			}
		}
		
		return data;
	}
	
	/**
	 * 入力フィールドリストを入力タイプリストで絞り込む
	 * @param array inpTypes 入力タイプリスト
	 * @return array 絞り込んだ入力フィールドリスト
	 */
	_filteringInpFieldsByInpTypes(inpTypes){
		var inpFields = this.inpFields; // 入力フィールドリスト
		var filList = []; // 絞り込んだ入力フィールドリスト
		for(var i in inpFields){
			var ent = inpFields[i];
			if(inpTypes.indexOf(ent.inp_type) >= 0){
				filList.push(ent);
			}
		}
		return filList;
	}
	
	/**
	 * プレビューHTMLを作成する
	 * @param array data
	 * @return string プレビューHTML
	 */
	_makePrviewHtml(data){
		if(data.length==0) return '';
		
		// 列名リストを取得する
		var theads = this._getTHeads(data[0]);
		
		var html = "<table class='tbl2'>";
		
		// 0件目のエンティティからtheadを作成
		html += "<thead><tr>";
	
		var ent0 = data[0];
		for(var field in ent0){
			var wamei = theads[field];
			html += "<th>" + wamei + "</th>";
		}
		html += "</tr></thead>";
		
		// tbodyの部分を作成
		for(var i in data){
			var ent = data[i];
			html += "<tr>";
			for(var f in ent){
				html += "<td>" + ent[f] + "</td>"
			}
			html += "</tr>";
			
		}
		
		html+= "</table>";
	
		return html;
	}
	
	/**
	 * 列名リストを取得する
	 * @param object ent0 データの先頭エンティティ
	 */
	_getTHeads(ent0){

		var tHeads = {}; // 列名リスト
		var fieldData = this.fieldData;
		
		for(var field in ent0){
			var wamei = field;
			for(var i in fieldData){
				var fEnt = fieldData[i];
				if(field == fEnt.field){
					wamei = fEnt.wamei;
					break;
				}
			}
			tHeads[field] = wamei;
		}
		return tHeads;
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
	 * 一括追加処理
	 */
	_bulkAdd(){
		
		// 一括追加ボタンを登録中および押下無効にする。
		this._anabledBulkAddBtn(false);
		
		// 追加位置を取得する。
		var add_position = this._getAddPosition();
		this.param['add_position'] = add_position;
		
		// Ajax送信データ
		var sendData = {'add_position':add_position};
		
		// Ajax:順番を取得
		this._ajax('cbba_get_sort_no', sendData, this._bulkAdd2);
		

	}
	
	/**
	 * 一括追加処理: 順番取得後
	 * @param object self 当クラス自身のインスタンス
	 * @param object res AJAXからのレスポンス
	 */
	_bulkAdd2(self, res){
		
		var next_sort_no = res.next_sort_no; // 次順番
		var add_position = self.param['add_position']; // 追加位置 0:先頭追加, 1:末尾追加
		
		// ▼データに順番をセットする
		var data = self.data;
		var sort_no = next_sort_no;
		for(var i in data){
			var ent = data[i];
			ent['sort_no'] = sort_no;
			
			if(add_position == 1){
				sort_no++;
			}else{
				sort_no--;
			}
		}
		
		// Ajax送信データ
		var sendData = {'data':data};

		// 一括追加登録
		self._ajax('cbba_add_reg', sendData, self._bulkAdd3);
		
	}
	
	/**
	 * 一括追加処理: DB登録後
	 * @param object self 当クラス自身のインスタンス
	 * @param object res AJAXからのレスポンス
	 */	
	_bulkAdd3(self, res){

		var newIds = res.newIds; // 新IDリスト
		
		// データに新IDをセット
		var data = self.data;
		for(var i in data){
			var ent = data[i];
			var new_id = newIds[i];
			ent['id'] = new_id;
		}
		
		var err_msg = res.err_msg;
		if(err_msg != ''){
			self._err(err_msg);
			var regBtn = self.regbtn;
			regBtn.val('一括追加');
			regBtn.prop('disabled',false);

			return;
		}
		
		location.reload(true);
		
	}
	

	/**
	 * AJAX
	 * @param string action_code アクションコード
	 * @param object sendData 送信データ
	 * @param function callback コールバック
	 */
	_ajax(action_code, sendData, callback){
		
		// AJAX通信先URL
		let ajax_url = this.param.ajax_url;
		
		// 送信データ
		sendData['action_code'] = action_code;
		var json_str = JSON.stringify(sendData);
		
		let fd = new FormData(); // 送信フォームデータ
		fd.append( "key1", json_str );
		
		// CSRFトークンを送信フォームデータにセットする。
		let token = this.param.csrf_token;
		fd.append( "_token", token );
		
		// AJAX
		jQuery.ajax({
			type: "post",
			url: ajax_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType: false,
		})
		.done((str_json, type) => {
			
			var res = null;
			try{
				var res = jQuery.parseJSON(str_json);
			}catch(e){
				this._err(str_json);
				return;
			}
			
			callback(this, res);
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			this._err(jqXHR.responseText);
		});
	}
	
	
	/**
	 * 一括追加ボタンを有効または無効にする。
	 * @param bool flg false:無効にする , true:有効にする
	 */
	_anabledBulkAddBtn(flg){
		if(flg==null) flg = false;
		if(this.regBtn == null){
			this.regbtn = this.form.find('#cbba_reg_btn');
		}
		var regBtn = this.regbtn;
		
		if(flg==true){
			regBtn.val('一括追加');
			regBtn.prop('disabled',false);
		}else{
			regBtn.val('追加中・・・');
			regBtn.prop('disabled',true);
			
		}

	}
	
	/**
	 * 追加位置を取得する。
	 * @return int 追加位置 　0:先頭に追加, 1:末尾に追加
	 */
	_getAddPosition(){
		var radio = this.form.find('input[name="cbba_sort_no"]:checked');
		var add_position = 1;
		if(radio[0]){
			add_position = radio.val();
		}
		
		return add_position;
	}
	
	/**
	 * エラー表示
	 * @param string err_text エラーテキスト
	 */
	_err(err_text){
		if(this.errElm == null){
			this.errElm = this.form.find('#cbba_err');
		}
		this.errElm.html(err_text);
		
	}
	
}