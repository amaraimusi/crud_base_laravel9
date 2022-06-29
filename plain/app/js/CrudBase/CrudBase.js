/**
 *  CRUD基本クラス | CrudBase.js
 * 
 * @note
 * CRUDのベース。
 * デフォルトでは、削除、編集、新規追加するたびにAjax通信を行う仕様である。
 * 削除、編集、新規追加するたびに更新するのが重い場合、適用ボタンで一括適用するモードも備える。
 * 
 * 
 * @license MIT
 * @since 2016-9-21 | 2021-6-14
 * @version 3.1.8
 * @histroy
 * 2019-6-28 v2.8.3 CSVフィールドデータ補助クラス | CsvFieldDataSupport.js
 * 2018-10-21 v2.8.0 ボタンサイズ変更機能にボタン表示切替機能を追加
 * 2018-10-21 v2.6.0 フォームをアコーディオン形式にする。
 * 2018-10-2 v2.5.0 フォームドラッグとリサイズ
 * 2018-9-18 v2.4.4 フォームフィット機能を追加
 * v2.0 CrudBase.jsに名称変更、およびES6に対応（IE11は非対応）
 * v1.7 WordPressに対応
 * 2016-9-21 v1.0.0
 * 
 */
class CrudBase{

	/**
	 * コンストラクタ
	 * 
	 * @param {} param crudBaseData
	 *  - src_code	画面コード（スネーク記法）
	 *  - src_code_c	画面コード（キャメル記法）
	 *  - tbl_slt	CRUD対象テーブルセレクタ
	 *  - edit_form_slt	編集フォームセレクタ
	 *  - new_form_slt	新規フォームセレクタ
	 *  - delete_form_slt	削除フォームセレクタ
	 *  - contents_slt	コンテンツセレクタ	コンテンツ全体を表すセレクタでフォームの位置調整で利用する。省略時すると画面windowを基準に位置調整する。
	 *  - edit_reg_url	編集登録サーバーURL
	 *  - new_reg_url	新規登録サーバーURL
	 *  - delete_reg_url	削除登録サーバーURL
	 *  - auto_save_url	自動保存サーバーURL
	 *  - form_position	フォーム位置 auto:自動, left:左側表示, center:中央表示, right:右側表示,max:横幅いっぱい
	 *  - form_width	フォーム横幅	数値で指定。未指定（null)である場合、autoと同様になる。ただしform_positionがmaxなら横幅最大になる。
	 *  - form_height	フォーム縦幅	上記と同じ
	 *  - form_z_index	重なり順序(cssのz-indexと同じ)
	 *  - valid_msg_slt	バリデーションメッセージセレクタ
	 *  - auto_close_flg	自動閉フラグ	0:自動で閉じない（デフォルト）  1:フォームの外側をクリックすると自動的に閉じる
	 *  - ni_tr_place	新規入力追加場所フラグ 0:末尾(デフォルト） , 1:先頭
	 *  - drag_and_resize_flg フォームドラッグとリサイズのフラグ 0:OFF , 1:ON(デフォルト)
	 *  - form_mode フォームモード 0:ダイアログモード , 1:アコーディオンモード(デフォルト）
	 *  - midway_dp リソース配置先用の中間ディレクトリパス
	 *  - configData CrudBaseConfigの設定データ
	 *  - fukParam				FileUploadK::コンストラクタのparam
	 *  - fukAddEventOption		FileUploadK::addEventのoption
	 *  - その他多数...
	 */
	constructor(param){
		// --- 初期化: CrudBaseBaseクラスのメンバを初期化する ----
		
		// パラメータに空プロパティがあれば、デフォルト値をセットする
		this.param = this._setParamIfEmpty(param);

		this.crudBaseData = param;

		// フォーム情報の取得と初期化
		this.formInfo = this._initFormInfo(this.param);
		
		// フィールドデータにプロパティを追加する
		this.fieldData = this._addMoreFieldData(this.param.tbl_slt,this.fieldData);
		
		// フィールドデータへフォーム内の要素情報をセットする
		this.fieldData = this._setFieldDataFromForm(this.fieldData,this.formInfo,'new_inp');
		this.fieldData = this._setFieldDataFromForm(this.fieldData,this.formInfo,'edit');
		this.fieldData = this._setFieldDataFromForm(this.fieldData,this.formInfo,'delete');

		// フォーム要素オブジェクトを取得する
		var editForm = this.getForm('edit');
		var newInpForm = this.getForm('new_inp');
		
		// フィールドハッシュテーブルをフィールドデータから生成する。
		this.fieldHashTable = this._createFieldHashTable(this.fieldData);

		// デフォルト新規入力エンティティを新規入力フォームから取得する
		this.defNiEnt = this._getEntByForm('new_inp');
		
		// テーブルオブジェクト
		this.tbl = jQuery('#' + this.param.tbl_slt);
		
		// 行入替機能・コンポーネント(※バグがあるので_factoryCrudBaseConfigより上で実行する）
		this.rowExchange = this._factoryCrudBaseRowExchange();
		
		// CrudBase設定・コンポーネント
		this.crudBaseConfig = this._factoryCrudBaseConfig(this.param);

		// ボタンサイズ変更コンポーネント
		this.cbBtnSizeChanger = this.crudBaseConfig.cbBtnSizeChanger;
		
		// 自動保存機能・コンポーネント
		this.autoSave = this._factoryCrudBaseAutoSave(); 

		// 列表示切替機能・コンポーネント
		this.csh = this._factoryClmShowHide(); 

		// CrudBase・ファイルアップロードコンポーネント
		this.cbFileUploadComp = this._factoryCbFileUploadComponent();
		
		// カレンダー日付ピッカー・ラッパーコンポーネント
		this.datepickerWrap = this._factoryDatepickerWrap();

		// カレンダービュー
		this.calendarViewK = this._factoryCalendarViewK();
		
		// CrudBase用リアクティブ機能
		this.crudBaseReact = this._factoryCrudBaseReact();
		
		// 一括追加機能
		this.crudBaseBulkAdd = new CrudBaseBulkAdd(this.fieldData);
		
		// パスワード編集機能
		this.crudBasePasswordEdit = new CrudBasePasswordEdit(newInpForm, editForm);
		
		// Google翻訳API・キャッシュ機能拡張
		this.cbGtaCash = new CbGtaCash({
			'slt':'#cb_gta_cash',
			'ajax_url':'cb_gta_cash',
		});
		
		// CSVフィールドデータ補助クラス
		this.csvFieldDataSupport = new CsvFieldDataSupport();
		
		// ページネーションジャンプ
		let pagenationJumpT = new PagenationJump(); // 上側ページネーション
		pagenationJumpT.init();
		let pagenationJumpB = new PagenationJump(); // 下側ページネーション
		pagenationJumpB.init({xid:'pagenation_jump_b'});
		
		// 年月による日付範囲入力【拡張】 | RangeYmEx.js
		let rngYmEx = new RangeYmEx();
		rngYmEx.init();
		
		// クラスの骨組み 外部名称クラス：外部idに紐づく外部テーブルの名前要素を制御
		this.crudBaseOuterName = new CrudBaseOuterName();
		
		// テキストエリア高さ自動調整クラス
		this.crudBaseTaAutoHeightSize = new CrudBaseTaAutoHeightSize();
		this.crudBaseTaAutoHeightSize.init();
		
		
		
		
		// -----------------------------------------------
		this.fueIdCash; // file要素のid属性データ（キャッシュ）
		
		// 折り畳みテキストエリア | FoldingTa.js
		this.foldingTaE = new FoldingTa();
		this.foldingTaE.init({'form_slt':'#ajax_crud_edit_form'});
		this.foldingTaN = new FoldingTa();
		this.foldingTaN.init({'form_slt':'#ajax_crud_new_inp_form'});
		
		// テーブル変形
		if(this.param.device_type == 'sp') this.tableTransform(1);
		
		// フォームをドラッグ移動およびリサイズできるようにする。
		this._formDragAndResizeSetting();
		
		// エラータイプリストによるエラー処理
		this._errByErrTypes();

		this.actEditForm; // アクティブ編集フォームオブジェクト
		
		this.activeTr; // アクティブTR要素
		
		this.hiddensElm; // 埋込データ要素
		
		this.formKjsElm; // 検索条件フォーム要素
	
		// 初期戻しボタンにURLをセットする
		this._iniRtnSetUrl();
		
		// 検索関連の入力要素にEnterイベントを組み込む
		this._addEventForKjsEnter();
		
		// 一覧のチェックボックス複数選択による一括処理
		this.pwms = new ProcessWithMultiSelection({
				tbl_slt:this.param.tbl_slt,
				ajax_url:this.param.pwms_ajax_url,
				csrf_token:this.param.csrf_token,
		});
		
	
		


	}
	
	/**
	 * 新バージョンリロード
	 */
	newVersionReload(){
		// 新バージョンである場合、強制的にセッションクリア
		let new_version_flg =this.param.new_version_flg;
		if(new_version_flg != 0){
			this._clear();
			location.reload(true);
		}
	}


	/**
	 * パラメータに空プロパティがあれば、デフォルト値をセットする
	 * @param object param パラメータ
	 */
	_setParamIfEmpty(param){

		if(param == null){
			param = {};
		}
		
		if(param['csrf_token'] == null){
			let csrf_token = jQuery('#csrf_token').val();
			if(csrf_token == null) throw new Error('csrf_token is empty!');
			param['csrf_token'] = csrf_token;
		}

		// 画面コード（スネーク記法）
		if(param['src_code'] == null){
			param['src_code'] = param.model_name_s;
		}

		// 画面コード （キャメル）
		if(param['src_code_c'] == null){
			param['src_code_c'] = this._snakeToCamel(param.src_code);
		}
		
		// CRUD対象テーブルセレクタ
		if(param['tbl_slt'] == null){
			param['tbl_slt'] = param.src_code + '_tbl';
		}

		// 編集フォームセレクタ
		if(param['edit_form_slt'] == null){
			param['edit_form_slt'] = 'ajax_crud_edit_form';
		}

		// 新規フォームセレクタ
		if(param['new_form_slt'] == null){
			param['new_form_slt'] = 'ajax_crud_new_inp_form';
		}

		// 削除フォームセレクタ
		if(param['delete_form_slt'] == null){
			param['delete_form_slt'] = 'ajax_crud_delete_form';
		}

		// 抹消フォームセレクタ
		if(param['eliminate_form_slt'] == null){
			param['eliminate_form_slt'] = 'ajax_crud_eliminate_form';
		}

		// コンテンツセレクタ
		if(param['contents_slt'] == null){
			param['contents_slt'] = null;
		}

		// 編集登録サーバーURL
		if(param['edit_reg_url'] == null){
			param['edit_reg_url'] = param.src_code + '/ajax_reg';
		}

		// 新規登録サーバーURL
		if(param['new_reg_url'] == null){
			param['new_reg_url'] = param.src_code + '/ajax_reg';
		}

		// 削除登録サーバーURL
		if(param['delete_reg_url'] == null){
			param['delete_reg_url'] = param.src_code + '/ajax_delete';
		}

		// 自動保存サーバーURL
		if(param['auto_save_url'] == null){
			param['auto_save_url'] = param.src_code + '/auto_save';
		}

		// ファイルアップロードデータ
		if(param['file_uploads'] == null){
			param['file_uploads'] = null;
		}

		// フォーム横幅
		if(param['form_width'] == null){
			param['form_width'] = null; // nullはフォーム幅がauto
		}

		// フォーム縦幅
		if(param['form_height'] == null){
			param['form_height'] = null; // nullはフォーム幅がauto
		}

		// フォーム位置
		if(param['form_position'] == null){
			param['form_position'] = 'auto';
		}


		// フォームの前面深度(z-index)
		if(param['form_z_index'] == null){
			param['form_z_index'] = 9;
		}

		// バリデーションメッセージセレクタ
		if(param['valid_msg_slt'] == null){
			param['valid_msg_slt'] = '.err';
		}

		// 自動閉フラグ
		if(param['auto_close_flg'] == null){
			param['auto_close_flg'] = 0;
		}

		// 新規入力追加場所フラグ
		if(param['ni_tr_place'] == null){
			param['ni_tr_place'] = 0;
		}

		// 表示フィルターデータ
		if(param['disFilData'] == null){
			param['disFilData'] = null;
		}

		// 検索条件情報
		if(param['kjs'] == null){
			param['kjs'] = null;
		}

		// デバイスタイプ
		if(param['device_type'] == null){
			param['device_type'] = this.judgDeviceType(); // デバイスタイプ（PC/SP）の判定
		}

		if(param['drag_and_resize_flg'] == null) param['drag_and_resize_flg'] = 1;
		
		// フォームモード
		if(param['form_mode'] == null) param['form_mode'] = 1
		
		if(param['midway_dp'] == null) param['midway_dp'] = '';
		
		if(param['configData'] == null) param['configData'] = {};
		
		if(param['pwms_ajax_url'] == null) param['pwms_ajax_url'] = param.main_model_name_s + '/ajax_pwms';
		
		// FileUploadK関連
		if(param['fukParam'] == null) param['fukParam'] = {}; // FileUploadK::コンストラクタのparam
		if(param['fukAddEventOption'] == null) param['fukAddEventOption'] = {}; // FileUploadK::addEventのoption
		

		return param;
	}
	

	/**
	 * CrudBase設定
	 * @param {} crudBaseData
	 * @return CrudBaseConfig CrudBase設定・コンポーネント
	 */
	_factoryCrudBaseConfig(crudBaseData){

		// 自動保存機能の初期化
		let crudBaseConfig = new CrudBaseConfig();
		crudBaseConfig.init(null, crudBaseData);
		
		return crudBaseConfig;
		
	}
	
	
	/**
	 * 自動保存機能・コンポーネントのファクトリーメソッド
	 * @return CrudBaseAutoSave 自動保存機能・コンポーネント
	 */
	_factoryCrudBaseAutoSave(){
		var autoSave;
		
		// クラス（JSファイル）がインポートされていない場合、「空」の実装をする。
		var t = typeof CrudBaseAutoSave;
		if(t == null || t == 'undefined'){
			// 「空」実装
			autoSave = {
					'saveRequest':function(){},
			}
			return autoSave
		}
		
		// 自動保存機能の初期化
		autoSave = new CrudBaseAutoSave(this);
		
		return autoSave;
		
	}
	
	
	/**
	 * 行入替機能・コンポーネントのファクトリーメソッド
	 * @reutrn CrudBaseRowExchange 行入替機能・コンポーネント
	 */
	_factoryCrudBaseRowExchange(){
		let rowExchange;
		
		// クラス（JSファイル）がインポートされていない場合、「空」の実装をする。
		let t = typeof CrudBaseRowExchange;
		if(t == null || t == 'undefined'){
			// 「空」実装
			rowExchange = {
					'showForm':function(){},
			}
			return rowExchange
		}
		
		// 行入替機能の初期化
		rowExchange = new CrudBaseRowExchange(this,null,()=>{
			this.rowExchangeAfter();
		});
		
		// 行入替機能のボタン表示切替
		let row_exc_flg =this.param.row_exc_flg;
		this.rowExcBtnShow(row_exc_flg);
		
		return rowExchange;
	}
	
	/**
	 * 列表示切替機能・コンポーネントのファクトリーメソッド
	 * @return ClmShowHide 列表示切替機能・コンポーネント
	 */
	_factoryClmShowHide(){
		
		let csh;
		
		// クラス（JSファイル）がインポートされていない場合、「空」の実装をする。
		let t = typeof ClmShowHide;
		if(t == null || t == 'undefined'){
			// 「空」実装
			csh = {}
			return csh
		}
		
		// 列表示切替機能の初期化
		csh=new ClmShowHide();//列表示切替
		let iniClmData = this.param.csh_ary; //列表示配列  1:初期表示   0:初期非表示
		
		let csh_unique_key = 'rkt_' + this.param.src_code + '_index'; // 画面別ユニークキー
		csh.init(this.param.tbl_slt,'clm_cbs',iniClmData,csh_unique_key);
		return csh;
		
	}

	
	/**
	 * CrudBase・ファイルアップロードコンポーネントのファクトリーメソッド
	 * @return CbFileUploadComponent CrudBase・ファイルアップロードコンポーネント
	 */
	_factoryCbFileUploadComponent(){
		
		var cbFileUploadComp;
		
		// クラス（JSファイル）がインポートされていない場合、「空」の実装をする。
		var t = typeof CbFileUploadComponent;
		if(t == null || t == 'undefined'){
			// 「空」実装
			cbFileUploadComp = {
					'addEvent':function(){},
					'getFileParams':function(){},
					'uploadByAjax':function(){},
					'getFileNames':function(){},
					'setFilePaths':function(){},
			}
			return cbFileUploadComp;
		}
		
		// フォームからfile要素のid属性
		var nFuIds = this._getFueIds('new_inp');
		var eFuIds = this._getFueIds('edit');
		var fuIds = nFuIds.concat(eFuIds);// 配列結合
		

		var param = this.param.fukParam; // FileUploadK::コンストラクタのparam
		var option = this.param.fukAddEventOption; // FileUploadK::addEventのoption
		
		// オプションに「ファイルプレビュー後コールバック」をセットする
		option['pacb'] = this._fukPrevAfterCallback;
		option['pacb_param'] = {'self':this};
		
		cbFileUploadComp = new CbFileUploadComponent(fuIds, param, option);
		
		return cbFileUploadComp;
	}
	
	
	/**
	 * カレンダー日付ピッカー・ラッパーコンポーネントのファクトリーメソッド
	 * @return DatepickerWrap カレンダー日付ピッカー・ラッパーコンポーネント
	 */
	_factoryDatepickerWrap(){
		var datepickerWrap;
		
		// クラス（JSファイル）がインポートされていない場合、「空」の実装をする。
		var t = typeof DatepickerWrap;
		if(t == null || t == 'undefined'){
			// 「空」実装
			datepickerWrap = {
					'tukishomatu':function(){},
			}
			return datepickerWrap
		}
		
		// 自動保存機能の初期化
		datepickerWrap = new DatepickerWrap(this);
		
		return datepickerWrap;
		
	}
	
	
	/**
	 * カレンダービューのファクトリーメソッド
	 * @return CalendarViewK カレンダービュー
	 */
	_factoryCalendarViewK(){
		var calendarViewK;
		
		// クラス（JSファイル）がインポートされていない場合、「空」の実装をする。
		var t = typeof CalendarViewK;
		if(t == null || t == 'undefined'){
			// 「空」実装
			calendarViewK = {
					'create':function(){},
			}
			return calendarViewK
		}
		
		// 自動保存機能の初期化
		calendarViewK = new CalendarViewK();
		
		return calendarViewK;
		
	}
	
	
	/**
	 * CrudBase用リアクティブ機能のファクトリーメソッド
	 * @return CrudBaseReact CrudBase用リアクティブ機能
	 */
	_factoryCrudBaseReact(){
		var crudBaseReact;
		
		// クラス（JSファイル）がインポートされていない場合、「空」の実装をする。
		var t = typeof CrudBaseReact;
		if(t == null || t == 'undefined'){
			// 「空」実装
			crudBaseReact = {
					'init':function(){},
					'reactivatingOfRow':function(){},
			}
			return crudBaseReact
		}
		
		// 自動保存機能の初期化
		crudBaseReact = new CrudBaseReact();
		
		return crudBaseReact;
		
	}
	
	/**
	 * 新規入力フォームからfile要素のid属性
	 * @param string form_type フォーム種別
	 * @param object option
	 *  - cash_flg キャッシュフラグ 0:キャッシュから取得しない , 1 キャッシュから取得する（デフォルト）
	 * @return array fueIds:file要素のid属性リスト
	 */
	_getFueIds(form_type,option){
		
		if(option == null) option = {};
		if(option['cash_flg'] == null) option['cash_flg'] = 1;
		
		// キャッシュがあるならそれを返す。
		if(option['cash_flg'] == 1 && this.fueIdCash){
			if(this.fueIdCash[form_type] != null){
				return this.fueIdCash[form_type];
			}
		}
		
		var fuIds = []; // id属性リスト
		for(var i in this.fieldData){
			var fEnt = this.fieldData[i];
			var inp_key = 'inp_' + form_type;
			if(fEnt[inp_key] == null) continue;
			var inp = fEnt[inp_key];
			
			if(inp['type_name'] == null) continue;
			if(inp['type_name'] != 'file') continue;
			if(inp['elm'] == null) continue;
			
			var elm = inp['elm'];
			var xid = elm.attr('id');
			
			fuIds.push(xid);
		}
		
		// キャッシュとして保存する。
		if(this.fueIdCash == null) this.fueIdCash = {};
		this.fueIdCash[form_type] = fuIds;
		
		return fuIds;
	}
	


	/**
	 * 新規入力フォームを表示
	 * @param option オプション
	 * - ni_tr_place 新規行の追加場所 add_to_top:一覧の上に新規行を追加 , add_to_bottom:一覧の下に新規行を追加
	 * @param callBack フォームに一覧の行データを自動セットしたあとに呼び出されるコールバック関数(省略可）
	 */
	newInpShow(elm,option,callBack){
		
		if(option == null) option = {};
		
		// 新規行を上に追加するか、下に追加するかを決定する。
		if(option['ni_tr_place'] == 'add_to_top'){
			this.param.ni_tr_place = 1;
		}else if(option['ni_tr_place'] == 'add_to_bottom'){
			this.param.ni_tr_place = 0;
		}
		
		var info = this.formInfo['new_inp'];

		info.show_flg=1; // 表示制御フラグを表示中にする

		// デフォルト新規入力エンティティを新規入力フォームにセットする
		this.setFieldsToForm('new_inp',this.defNiEnt);

		var form = this.getForm('new_inp');// フォーム要素を取得

		// フォーム種別をフォーム内の指定入力要素へセット
		this.setValueToFrom(form,'form_type','new_inp');

		// バリデーションエラーメッセージをクリアする
		this._clearValidErr(form);

		// コールバックを実行する
		if(callBack){
			var c_param ={'form':form};
			callBack(c_param);
		}

		if(this.param.form_mode == 1){
			
			// フォームのcolspan属性に列数をセットする。
			form = this._setColspanToForm(form);
			

			// tdのcolspan属性に表示中の列数をセットする
			var td = form.find('td');
			
			// ▼ SPモードの場合はblock, PCモードの場合はtable系にする。
			if(this.param.device_type == 'sp'){
				td.attr('colspan', 1);
				td.css('display','block');
				form.css('display','block');
			}else{
				// 現在表示中の列数を取得する
				var clm_cnt = this._getClmCntByActive();
				td.attr('colspan', clm_cnt);
				td.css('display','table-cell');
				form.css('display','table-row');
			}
			
			// ▼ フォームの位置を指定場所に移動する
			if(option['ni_tr_place'] == 'add_to_top'){
				var firstTr = this.tbl.find('tbody tr').eq(0); // 一覧テーブルから先頭行を取得する
				form.insertBefore(firstTr); // 先頭行の上にフォームを表示する
				
			}else if(option['ni_tr_place'] == 'add_to_bottom'){
				var endTr = this.tbl.find('tbody tr').eq(-1); // 一覧テーブルから末尾行を取得する
				form.insertAfter(endTr); // 末尾行の下にフォームを表示する
			
			}else{			
				// 表示とついでにtrとtd要素をblockにする。
				td.css('display','block');
				form.css('display','block');
				form.insertAfter('#new_inp_form_point');
				
			}

		}else{
			// triggerElm要素の下付近に入力フォームを表示する。
			this._showForm(form,elm,option);
			
		}
		
		this.crudBasePasswordEdit.showForm('new_inp'); // パスワード編集機能
		this.foldingTaN.reflection(); // 折り畳み式テキストエリアに反映
		this.crudBaseOuterName.newInpShow(); // 外部名称・クリア
		this.crudBaseTaAutoHeightSize.newInpShow(form); // テキストエリア高さ自動調整クラス・高さ自動調整

		
	}


	/**
	 * 編集フォームを表示
	 * 
	 * @param elm 編集ボタン要素
	 * @param option オプション（省略可）
	 * @param callBack フォームに一覧の行データを自動セットしたあとに呼び出されるコールバック関数(省略可）
	 */
	editShow(elm,option,callBack){

		if(option == null) option = {};

		var tr = jQuery(elm).parents('tr'); // 先祖をさかのぼりtr要素を取得する

		this.activeTr = tr; // アクティブTR要素にセット

		var info = this.formInfo['edit'];

		info.show_flg=1; // 表示制御フラグを表示中にする

		// TR要素からエンティティを取得する
		var ent = this.getEntityByTr(tr);

		// フォームに親要素内の各フィールド値をセットする。
		this.setFieldsToForm('edit',ent,option);
		
		// 編集フォーム要素を取得
		var form = this.getForm('edit');
		form.show();
		
		// バリデーションエラーメッセージをクリアする
		this._clearValidErr(form);

		// コールバックを実行する
		if(callBack){
			callBack(tr,form,ent);
		}

		
		if(this.param.form_mode == 1){
			
			// フォームのcolspan属性に列数をセットする。
			form = this._setColspanToForm(form);
			
			// TR要素の下に編集フォームを移動する
			form.insertAfter(tr);
		}
		else{
			// triggerElm要素の下付近に入力フォームを表示する。
			this._showForm(form,elm,option);			
		}

		
		this.crudBasePasswordEdit.showForm('edit'); // パスワード編集機能
		this.foldingTaE.reflection(); // 折り畳み式テキストエリアに反映
		
		this.crudBaseOuterName.editShow(ent); // 外部名称・クリア
		this.crudBaseTaAutoHeightSize.editShow(form); // テキストエリア高さ自動調整クラス・高さ自動調整
		

	}


	/**
	 * 複製による新規入力フォーム表示
	 * 
	 * @note
	 * 複製元のデータがあらかじめ入力された状態で新規入力フォームを表示する。
	 * 
	 * @param elm 複製ボタン要素
	 * @param option オプション（省略可）
	 *           -  upload_file_dirアップロードファイルディレクトリ
	 * @param callBack フォームに一覧の行データを自動セットしたあとに呼び出されるコールバック関数(省略可）
	 * 
	 */
	copyShow(elm,option,callBack){

		var tr=jQuery(elm).parents('tr'); // 先祖をさかのぼりtr要素を取得する
		this.activeTr = tr;; // アクティブTR要素にセット

		var info = this.formInfo['new_inp'];

		info.show_flg=1; // 表示制御フラグを表示中にする

		// TR要素からエンティティを取得する
		var ent = this.getEntityByTr(tr);

		var form = this.getForm('copy');

		// フォーム種別をフォーム内の指定入力要素へセット
		this.setValueToFrom(form,'form_type','copy');

		// 行番を取得し、要素にセットする
		var row_index = tr.index(); // 行番（インデックス）を取得する
		this.setValueToFrom(form,'row_index',row_index);

		// フォームにエンティティの値をセットする
		this.setFieldsToForm('new_inp',ent,option);

		// バリデーションエラーメッセージをクリアする
		this._clearValidErr(form);

		// コールバックを実行する
		if(callBack){
			callBack(tr,form,ent);
		}
		
		if(this.param.form_mode == 1){
			
			// フォームのcolspan属性に列数をセットする。
			form = this._setColspanToForm(form);
			

			// tdのcolspan属性に表示中の列数をセットする
			var td = form.find('td');
			
			// SPモードの場合はblock, PCモードの場合はtable系にする。
			if(this.param.device_type == 'sp'){
				td.attr('colspan', 1);
				td.css('display','block');
				form.css('display','block');
			}else{
				// 現在表示中の列数を取得する
				var clm_cnt = this._getClmCntByActive();
				td.attr('colspan', clm_cnt);
				td.css('display','table-cell');
				form.css('display','table-row');
			}
			
			form.insertAfter(tr);
			
		}else{
			// triggerElm要素の下付近に入力フォームを表示する。
			this._showForm(form,elm,option);
			
		}
		
		// パスワード編集機能
		this.crudBasePasswordEdit.showForm('copy');
		this.crudBaseOuterName.newInpShow(ent); // 外部名称・クリア
		this.crudBaseTaAutoHeightSize.copyShow(form); // テキストエリア高さ自動調整クラス・高さ自動調整


	}


	/**
	 * 削除アクション
	 * @param elm 削除ボタン要素
	 * @param option
	 *  - upload_file_dirアップロードファイルディレクトリ
	 *  - form_show_flg 削除フォーム表示フラグ 0:削除フォームを表示しない（デフォ） , 1:表示する
	 *  - cbBeforeFormShow(tr,form,ent)   削除フォームを表示する前に実行するコールバック
	 *  - cbBeforeReg(ent) 削除登録前に実行するコールバック
	 *  - cbAfterReg(ent) 削除登録後に実行するコールバック
	 */
	deleteAction(elm,option){
		
		// 削除アラートの表示
		if(this.crudBaseConfig.data.delete_alert_flg == 1){
			if(!window.confirm('削除しますがよろしいですか？')) return;
		}
		
		if(!(elm instanceof jQuery)) elm = jQuery(elm);

		if(option == null) option = {};
		if(option['form_show_flg'] == null) option['form_show_flg'] = 0;

		var tr = elm.parents('tr'); // 先祖をさかのぼりtr要素を取得する
		this.activeTr = tr;; // アクティブTR要素にセット

		// 削除フォーム表示フラグが1(表示）であるなら、削除フォームを表示する
		if(option['form_show_flg'] == 1){
			option['tr'] = tr;
			this.deleteShow(elm,option); // 削除フォーム表示
		}else{
			option['caller_type'] = 1; // 呼び出し元タイプ   1:直接呼出し
			this.deleteReg(option); // 削除登録
		}
	}


	/**
	 * 有効アクション
	 * @param elm 有効ボタン要素
	 * @param option
	 *  - cbBeforeReg(ent) 有効登録前に実行するコールバック
	 *  - cbAfterReg(ent) 有効登録後に実行するコールバック
	 */
	enabledAction(elm,option){
		
		if(!(elm instanceof jQuery)) elm = jQuery(elm);

		if(option == null) option = {};

		var tr = elm.parents('tr'); // 先祖をさかのぼりtr要素を取得する
		this.activeTr = tr;; // アクティブTR要素にセット

		this.enabledReg(option); // 有効登録
	}


	/**
	 * 抹消フォーム表示
	 * 
	 * @param elm 抹消ボタン要素
	 * @param option オプション（省略可）
	 *           -  upload_file_dirアップロードファイルディレクトリ
	 * @param callBack フォームに一覧の行データを自動セットしたあとに呼び出されるコールバック関数(省略可）
	 * 
	 */
	eliminateShow(elm,option,callBack){
		
		if(!(elm instanceof jQuery)) elm = jQuery(elm);
		var tr = elm.parents('tr'); // 先祖をさかのぼりtr要素を取得する
		this.activeTr = tr;; // アクティブTR要素にセット

		var info = this.formInfo['eliminate'];

		info.show_flg=1; // 表示制御フラグを表示中にする

		// TR要素からエンティティを取得する
		var ent = this.getEntityByTr(tr);

		var form = jQuery(info.slt);// 抹消フォーム要素を取得

		// フォームに親要素内の各フィールド値をセットする。
		this.setFieldsToForm('eliminate',ent,option);

		// コールバックを実行する
		if(callBack) callBack(tr,form,ent);

		// triggerElm要素の下付近に入力フォームを表示する。
		this._showForm(form,elm,option);

	}



	/**
	 * 新規入力登録
	 * @param beforeCallBack 引数(ent, fd) Ajax送信前のコールバック（送信データを編集できる）
	 * @param afterCallBack 引数(ent, tr) Ajax送信後のコールバック
	 * @param option オプション 
	 * - add_row_index 追加行インデックス :テーブル行の挿入場所。-1にすると末尾へ追加。-1がデフォルト。
	 * - wp_action WPアクション: WordPressでは必須
	 * - wp_nonce  WPノンス: WordPressのトークン的なもの（なくても動くがセキュリティが下がる）
	 */
	newInpReg(beforeCallBack,afterCallBack,option){

		var form = this.getForm('new_inp'); // 入力フォーム要素のオブジェクトを取得する

		// バリデーション
		var res = this._validationCheckForm('new_inp');
		if(res == false) return;

		if(this._empty(option)) option = {};

		// 登録ボタンを押せなくする
		this._toggleRegBtn('new_inp',0);
		
		// FDにファイルオブジェクトをセットする。
		var fd = new FormData();
		fd = this.cbFileUploadComp.setFilesToFd(fd,'new_inp');

		// 新規入力フォームからエンティティを取得およびJSON化し、FormDataにセットする
		var ent = this._getEntByForm('new_inp');

		// idに値がセットされ編集扱いとなっている場合、IDフラグをtrueにする。
		var id_flg = false;
		if(!this._empty(ent['id'])){
			id_flg = true;
		}

		// Ajax送信前のコールバックを実行する
		if(beforeCallBack){

			var bcRes = beforeCallBack(ent,fd);
			if(bcRes['err']){
				this._errShow(bcRes['err'],'new_inp');// エラーを表示
				return;
			}else if(bcRes['ent']){
				ent = bcRes['ent'];
				fd = bcRes['fd'];
			}else{
				ent = bcRes;
			}
		}

		var json = JSON.stringify(ent);//データをJSON文字列にする。
		fd.append( "key1", json );

		
		var regParam = {}; // 登録パラメータ
		
		// トークンの取得(Laravelなど）
		let token = this.param.csrf_token;
		fd.append( "_token", token );
		
		if(option['wp_action']){
			regParam['action'] = option['wp_action'];
			if(option['wp_nonce']) regParam['nonce'] = option['wp_nonce'];
		}

		// 登録パラメータにセット
		var form_type = this.getValueFromForm(form,'form_type');// フォーム種別 (新規入力 or 複製)
		regParam['form_type'] = form_type;
		regParam['ni_tr_place'] = this.param.ni_tr_place;// 新規入力追加場所フラグ
	
		var reg_param_json = JSON.stringify(regParam);
		fd.append('reg_param_json',reg_param_json);

		// 諸パラメータから追加行インデックスを決定する
		var add_row_index = this._decAddRowIndex(form,form_type,option);

		jQuery.ajax({
			type: "post",
			url: this.param.new_reg_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType : false,
		})
		.done((str_json, type) =>{
			this._toggleRegBtn('new_inp',1);// 登録ボタンを押せるようにする
			var ent;
			try{
				ent =jQuery.parseJSON(str_json);//パース

			}catch(e){
				alert('エラー');
				jQuery("#err").html(str_json);
				return;
			}

			if(ent['err']){

				// エラーをフォームに表示する
				this._showErrToForm(ent['err'],'new_inp');

			}else{

				// IDがセットされて、編集扱いとなっている場合はリロードする。
				if(id_flg==true){
					location.reload(true);
				}
				
				this.closeForm('new_inp');// フォームを閉じる

				// 新しい行を作成する
				var tr = this._addTr(ent,add_row_index);
				
				// 外部名称をTR要素にセットする。
				this._setOuterNameToTr(ent,tr);
				
				// ボタン群の表示切替
				this._switchBtnsDisplay(tr,ent)

				// 登録後にコールバック関数を非同期で実行する
				if(afterCallBack != null){
						afterCallBack(ent, tr);
				}


			}

		})
		.fail((jqXHR, statusText, errorThrown) =>{
			this._toggleRegBtn('new_inp',1);// 登録ボタンを押せるようにする
			jQuery('#err').html(jqXHR.responseText);//詳細エラーの出力
			alert(statusText);
		});

	}


	
	
	/**
	 * 編集登録
	 * @param beforeCallBack 引数(ent,fd) Ajax送信前のコールバック（送信データを編集できる）
	 * @param afterCallBack 引数(ent, tr) Ajax送信後のコールバック
	 * @param option オプション
	 * - wp_action :WPアクション	WordPressでは必須
	 * - wp_nonce  :WPノンス	WordPressのトークン的なもの（なくても動くがセキュリティが下がる）
	 * 
	 */
	editReg(beforeCallBack, afterCallBack, option){
		// バリデーション
		var res = this._validationCheckForm('edit');
		if(res == false) return;

		if(this._empty(option)) option = {};

		// 登録ボタンを押せなくする
		this._toggleRegBtn('edit',0);

		// 編集フォームからエンティティを取得する。
		var ent = this._getEntByForm('edit');

		// FDにファイルオブジェクトをセットする。
		var fd = new FormData();
		fd = this.cbFileUploadComp.setFilesToFd(fd,'edit');

		// Ajax送信前のコールバックを実行する
		if(beforeCallBack){

			var bcRes = beforeCallBack(ent,fd);
			if(bcRes['err']){
				this._errShow(bcRes['err'],'edit');// エラーを表示
				return;
			}else if(bcRes['ent']){
				ent = bcRes['ent'];
				fd = bcRes['fd'];
			}else{
				ent = bcRes;
			}
		}

		var regParam = {}; // 登録パラメータ
		
		var json = JSON.stringify(ent);//データをJSON文字列にする。
		fd.append( "key1", json );
		
		// トークンの取得(Laravelなど）
		let token = this.param.csrf_token;
		fd.append( "_token", token );

		// WordPressの場合
		if(option['wp_action']){
			regParam['action'] = option['wp_action'];
			if(option['wp_nonce']) regParam['nonce'] = option['wp_nonce'];
		}

		// 登録パラメータにセット
		regParam['form_type'] = 'edit';
		
		var reg_param_json = JSON.stringify(regParam);
		fd.append('reg_param_json',reg_param_json);
		
		jQuery.ajax({
			type: "post",
			url: this.param.edit_reg_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType: false,

		}).done((str_json, type) => {

			this._toggleRegBtn('edit',1);// 登録ボタンを押せるようにする
			
			var ent = null;
			try{
				var ent =jQuery.parseJSON(str_json);//パース

			}catch(e){
				alert('エラー:' + str_json);
				console.log(str_json);
				jQuery("#err").html(str_json);
			}
			
			// 編集中の行にエンティティを反映する。
			if(ent){
				if(ent['err']){

					// エラーをフォームに表示する
					this._showErrToForm(ent['err'],'edit');
					return;
				}

				// 編集中のTR要素を取得する
				var tr = this._getTrInEditing();
				
				// 削除フラグがONである場合、削除中の行を一覧から隠す
				if(this.param['kj_delete_flg'] == 0 && ent['delete_flg']==1){
					tr.hide();
				}

				// エンティティのIDとTR要素のIDが不一致である場合、ブラウザをリロードする
				if(ent['id'] !=tr.find('.id').text()){
					location.reload(true);
				}

				// TR要素にエンティティの値をセットする
				this._setEntityToEditTr(ent,tr);
				
				// 外部名称をTR要素にセットする。
				this._setOuterNameToTr(ent,tr);
				
				this._offNoteDetail(tr);

				// 登録後にコールバック関数を実行する
				if(afterCallBack != null){
					afterCallBack(ent, tr);
				}

				var kjs = this._getKjs(); // 検索条件情報を取得する
				if(kjs.kj_delete_flg != 1 && ent.delete_flg == 1){
					tr.css('background-color','#808080');
				}else{
					tr.css('background-color','#d7e6fd');// 編集後の行は青くする
				}

				this.closeForm('edit');// フォームを閉じる
			}

		}).fail((jqXHR, statusText, errorThrown) => {
			this._toggleRegBtn('edit',1);// 登録ボタンを押せるようにする
			jQuery('#err').html(jqXHR.responseText);//詳細エラーの出力
			alert(statusText);
		});
	}

	_offNoteDetail(tr){
		tr.find('.note_detail').each((i,elm)=>{
			
			elm = jQuery(elm);
			let td =elm.parent('td');
			elm.hide();
			let field = elm.attr('data-field');
			td.find('.' + field).show(); // フィールド要素を表示
			
			td.find('.note_detail_open_btn').hide(); // 「閉じる」ボタンを隠す
			
			
		});
	}

	/**
	 * 行番号を指定して削除登録を行う。
	 * @param row_index 行番号
	 * @param option
	 *  - cbBeforeReg(ent) 削除登録前に実行するコールバック
	 *  - cbAfterReg(ent) 削除登録後に実行するコールバック
	 */
	deleteRegByRowIndex(row_index,option){

		// HTMLテーブルから行番を指定してエンティティを取得する
		var ent = this.getEntity(row_index);

		// 削除を実行
		var delete_flg = 1;
		this._deleteRegBase(ent,delete_flg,option)

	}



	/**
	 * 抹消登録
	 * 
	 * @param option オプション
	 *  - caller_type 呼び出し元タイプ 0:抹消フォールから呼び出し（デフォ） , 1:直接呼出し , 
	 *  - wp_action :WPアクション	WordPressでは必須
	 *  - wp_nonce  :WPノンス	WordPressのトークン的なもの（なくても動くがセキュリティが下がる）
	 *  - cbBeforeReg(ent) 抹消登録前に実行するコールバック
	 *  - cbAfterReg(ent) 抹消登録後に実行するコールバック
	 */
	eliminateReg (option){

		if(option == null) option = {};

		var ent = this._getEntByForm('eliminate');// 抹消フォームからエンティティを取得する
		option['eliminate_flg'] = 1; // 抹消フラグをONにする
		
		// 抹消を実行
		var delete_flg = 1;
		this._deleteRegBase(ent,delete_flg,option);

	}


	/**
	 * フォームを閉じる
	 * @parma string form_type new_inp:新規入力 edit:編集 delete:削除
	 */
	closeForm(form_type){

		// フォーム情報を取得
		var fi = this.formInfo[form_type];

		// フォームのオブジェクトを取得する
		var form = fi.form;
		
		jQuery('#crud_base_forms').append(form);

		// フォームを隠す
		form.hide();

	}
	
	
	/**
	 * 行入替機能のフォームを表示
	 * @param btnElm ボタン要素
	 */
	rowExchangeShowForm(btnElm){
		this.rowExchange.showForm(btnElm);
	}
	
	/**
	 * 行入替ボタンの表示切替
	 * @param int row_exc_flg 行入替機能フラグ 0:ボタン非表示 , 1:ボタン表示
	 */
	rowExcBtnShow(row_exc_flg){
		
		if(row_exc_flg == 1){
			jQuery('.row_exc_btn').show();
		}else{
			jQuery('.row_exc_btn').hide();
		}
	}
	
	
	/**
	 * 検索条件をリセット
	 * 
	 * すべての検索条件入力フォームの値をデフォルトに戻します。
	 * リセット対象外を指定することも可能です。
	 * @param array exempts リセット対象外フィールド配列（省略可）
	 */
	resetKjs(exempts){

		if(exempts==null) exempts=[];
		
		//デフォルト検索条件JSONを取得およびパースする。
		let defKjs = this.param.defKjs; // デフォルト検索条件データ
		
		for(let key in defKjs){
			
			//リセット対象外でなければ、検索条件入力フォームをリセットする。
			if(exempts.indexOf(key) < 0){
				jQuery('#' + key).val(defKjs[key]);
			}
			
		}
		
		// 検索条件要素の各種ガシェットをリセットする
		if(this.cbGadgetKj) this.cbGadgetKj.reset();
		
		// 外部名称クラス：表示中の外部名称をクリアする。
		this.crudBaseOuterName.clear();
		
	}
	
	
	/**
	 * コンテナのGetter
	 * 
	 * @note コンテナには当クラスのメンバを格納している。
	 * 
	 * @return コンテナ
	 */
	getContainer(){
		var container = {
				'param':this.param , //  パラメータ
				'fieldData':this.fieldData , //  フィールドデータ
				'fieldHashTable':this.fieldHashTable , //  フィールドハッシュテーブル key:フィールド名  val:列インデックス
				'formInfo':this.formInfo , //  フォーム情報
				'defNiEnt':this.defNiEnt , //  デフォルト新規入力エンティティ
				'formNewInp':this.formNewInp , // 新規入力フォーム
				'formEdit':this.formEdit , // 編集フォーム
				'formDelete':this.formDelete , // 削除フォーム
				'showFormStrategy':this.showFormStrategy , //  入力フォーム表示ストラテジー
				'react':this.react , //  CrudBaseのリアクティブ機能クラス | CrudBaseReact.js
		}
		return container;
	}


	/**
	 * テーブルの行数を取得する
	 * 
	 * @note
	 * 入れ子のテーブルが存在していても正確に行数を数える。
	 * 
	 */
	getTblRowCount(){
		var tbl = jQuery('#' + this.param.tbl_slt);
		var tBody = tbl.children('tbody');
		var rowCnt = tBody.children('tr').length;
		return rowCnt;
	}



	/**
	 * 諸パラメータから追加行インデックスを決定する
	 * @param form フォーム要素
	 * @param form_type フォーム種別
	 * @param option
	 * @returns 追加行インデックス
	 */
	_decAddRowIndex(form,form_type,option){

		// オプション内の追加行インデックスがセット済みでならそれを返す。
		if(option['add_row_index'] != null){
			return option['add_row_index'];
		}

		var add_row_index = -1;// 末尾行への追加を表す
		if(this.param.ni_tr_place == 1){
			add_row_index = 0;// 先頭行への追加を表す
		}
		
		// フォーム種別が複製である場合、フォームから行番を取得してセットする。
		if(form_type == 'copy'){
			add_row_index = this.getValueFromForm(form,'row_index');
			add_row_index = add_row_index * 1;
			add_row_index++;
		}

		return add_row_index;

	}
	
	
	
	
	/**
	 * 削除フォーム表示
	 * 
	 * @param elm 削除ボタン要素
	 * @param option オプション（省略可）
	 *  - upload_file_dirアップロードファイルディレクトリ
	 *  - cbBeforeFormShow(tr,form,ent)   削除フォームを表示する前に実行するコールバック）
	 * 
	 */
	deleteShow(elm,option){
		
		if(!(elm instanceof jQuery)) elm = jQuery(elm);

		var tr = option['tr'];
		if(tr==null) tr=jQuery(elm).parents('tr'); // 先祖をさかのぼりtr要素を取得する
		
		var info = this.formInfo['delete'];

		info.show_flg=1; // 表示制御フラグを表示中にする

		// TR要素からエンティティを取得する
		var ent = this.getEntityByTr(tr);

		var form = jQuery(info.slt);// 削除フォーム要素を取得

		// フォームに親要素内の各フィールド値をセットする。
		this.setFieldsToForm('delete',ent,option);
		
		// コールバックを実行する
		var callback = option['cbBeforeFormShow'];
		if(callback) callback(tr,form,ent);

		// triggerElm要素の下付近に入力フォームを表示する。
		this._showForm(form,elm,option);

	}



	/**
	 * 削除登録
	 * 
	 * @param option オプション
	 *  - caller_type 呼び出し元タイプ 0:削除フォームから呼び出し（デフォ） , 1:直接呼出し , 
	 *  - wp_action :WPアクション	WordPressでは必須
	 *  - wp_nonce  :WPノンス	WordPressのトークン的なもの（なくても動くがセキュリティが下がる）
	 *  - cbBeforeReg(ent) 削除登録前に実行するコールバック
	 *  - cbAfterReg(ent) 削除登録後に実行するコールバック
	 */
	deleteReg (option){

		if(option == null) option = {};
		if(option['caller_type']==null) option['caller_type'] = 0;

		var ent;
		if(option['caller_type'] == 0){
			ent = this._getEntByForm('delete');// 削除フォームからエンティティを取得する
		}else{
			ent = this.getEntity();
		}

		// 削除を実行
		var delete_flg = 1;
		this._deleteRegBase(ent,delete_flg,option);

	}



	/**
	 * 有効登録
	 * 
	 * @param option オプション
	 *  - wp_action :WPアクション	WordPressでは必須
	 *  - wp_nonce  :WPノンス	WordPressのトークン的なもの（なくても動くがセキュリティが下がる）
	 *  - cbBeforeReg(ent) 有効登録前に実行するコールバック
	 *  - cbAfterReg(ent) 有効登録後に実行するコールバック
	 */
	enabledReg (option){

		if(option == null) option = {};
		var ent = this.getEntity();

		// 有効を実行
		var delete_flg = 0;
		this._deleteRegBase(ent,delete_flg,option);

	}
	
	
	

	/**
	 * 基本的な削除機能
	 * 
	 * @param ent idを含むエンティティ
	 * @param delete_flg 削除フラグ
	 * @param cbBeforeReg Ajax送信前(削除前）のコールバック（送信データを編集できる）
	 * @param afterCallBack 削除後に実行するコールバック関数（省略可）
	 * @param option オプション
	 * - cbBeforeReg Ajax通信前コールバック
	 * - cbAfterReg Ajax通信後のコールバック
	 * - wp_action :WPアクション	WordPressでは必須
	 * - wp_nonce  :WPノンス	WordPressのトークン的なもの（なくても動くがセキュリティが下がる）
	 * - eliminate_flg :抹消フラグ
	 * @returns void
	 */
	_deleteRegBase(ent, delete_flg, option){

		if(!ent['id']) throw new Error('Not id');
		
		// 抹消フラグ
		var eliminate_flg = 0;
		if(option['eliminate_flg']) eliminate_flg = option['eliminate_flg'];
		
		// フォーム種別を取得する
		var form_type = 'delete';
		if(eliminate_flg) form_type = 'eliminate';
		
		ent['delete_flg'] = delete_flg;
		if(option==null) option = {};
		
		// ファイルアップロード関連のエンティティをFormDataに追加する
		var fd = new FormData();
		

		// 登録パラメータに各種値をセット
		var regParam = {}; // 登録パラメータ
		regParam['form_type'] = form_type; // フォーム種別
		if(option['wp_action']){// WordPress関連
			regParam['action'] = option['wp_action'];
			if(option['wp_nonce']) regParam['nonce'] = option['wp_nonce'];
		}
		if(eliminate_flg) regParam['eliminate_flg'] = eliminate_flg; // 抹消フラグ
		var reg_param_json = JSON.stringify(regParam);
		fd.append('reg_param_json',reg_param_json);
		
		// Ajax送信前のコールバックを実行する
		var beforeCallBack = option['cbBeforeReg'];
		if(beforeCallBack){

			var bcRes = beforeCallBack(ent,fd);
			if(bcRes['err']){
				this._errShow(bcRes['err'],form_type);// エラーを表示
				return;
			}else if(bcRes['ent']){
				ent = bcRes['ent'];
				fd = bcRes['fd'];
			}else{
				ent = bcRes;
			}
		}

		var json = JSON.stringify(ent);//データをJSON文字列にする。
		fd.append( "key1", json );
		
		// トークンの取得(Laravelなど）
		let token = this.param.csrf_token;
		fd.append( "_token", token );
		
		jQuery.ajax({
			type: "post",
			url: this.param.delete_reg_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData: false,
			contentType: false,

		}).done((str_json, type) => {

			var ent;
			try{
				ent =jQuery.parseJSON(str_json);//パース

			}catch(e){
				alert('エラー');
				jQuery("#err").html(str_json);
			}

			if(!ent){return;}

			// 削除フラグが0(有効)である場合、HTMLテーブルの行を削除する
			if(this.param.kjs.kj_delete_flg === 0 || this.param.kjs.kj_delete_flg === '0' || eliminate_flg == 1){

				this.activeTr.remove(); // アクティブ行を削除
			}else{
				
				var tr = this._getTrInEditing();// 削除中の行要素を取得する
				this._setEntityToEditTr(ent,tr);// TR要素にエンティティの値をセットする
			}

			// 登録後にコールバック関数を非同期で実行する
			var afterCallBack = option['cbAfterReg'];
			if(afterCallBack){
				window.setTimeout(()=>{
					afterCallBack(ent);
					}, 1);
			}

			this.closeForm(form_type);// フォームを閉じる

		}).fail((jqXHR, statusText, errorThrown) => {
			jQuery('#err').html(jqXHR.responseText);//詳細エラーの出力
			alert(statusText);
		});

	}


	/**
	 * 行番を指定してTR要素を取得する
	 * @param row_index 行番 (-1を指定すると末尾を取得）
	 * @return TR要素
	 */
	getTr(row_index){
		
		if(row_index == null) return this.activeTr;
		
		var slt = '#' + this.param.tbl_slt + ' tbody tr';
		var tr = jQuery(slt).eq(row_index);

		return tr;
	}


	/**
	 * 末尾のTR要素を取得する
	 * @return TR要素
	 */
	getLastTr(){

		var slt = '#' + this.param.tbl_slt + ' tbody tr';
		var tr = jQuery(slt).eq(-1);

		return tr;
	}


	/**
	 * 現在編集中の行要素を取得する
	 * @return TR要素
	 */
	_getTrInEditing(){

		var tr = this.activeTr;

		return tr;
	}


	/**
	 * 行番とフィールド名からTD要素を取得する
	 * @param row_index 行番(-1で末行を指定）
	 * @param field フィールド名
	 * @return TD要素
	 */
	getTd(row_index,field){

		var tr = this.getTr(row_index); // 行番を指定してTR要素を取得する

		var elm = tr.find('.' + field);
		if(!elm[0]){
			return null;
		}

		var td = elm.parents('td');

		return td;

	}


	/**
	 * 現在編集中の行から、指定したフィールドに紐づくTD要素を取得する
	 * @param フィールド
	 * @return TD要素
	 */
	getTdInEditing(field){

		var tr = this._getTrInEditing(); // 現在編集中のTR要素を取得する

		var elm = tr.find('.' + field);
		if(!elm[0]){
			return null;
		}

		var td = elm.parents('td');

		return td;
	}


	/**
	 * 一覧テーブルの行番からエンティティを取得する
	 * @param row_index 行番(-1は末行) 省略時はアクティブTR要素を取得
	 * @return object エンティティ
	 */
	getEntity(row_index){

		// 行番を指定してTR要素を取得する
		var tr = this.getTr(row_index);

		// TR要素からエンティティを取得する
		var ent = this.getEntityByTr(tr);

		return ent;
	}


	/**
	 * TR要素からエンティティを取得する
	 * @param TR要素
	 * @return object エンティティ
	 */
	getEntityByTr(tr){

		var ent = {};
		for(var i in this.fieldData){
			var f = this.fieldData[i].field;
			var elm = tr.find("[name='" + f + "']");
			ent[f] = elm.val();
		}

		return ent;
	};


	/**
	 * 行中の任意要素を指定して、エンティティを取得する
	 * @param elm 行内（TD要素内部）の任意要素
	 * @return エンティティ
	 */
	getEntityByInnerElm(elm){

		// 先祖をさかのぼりtr要素を取得する
		var tr=jQuery(elm).parents('tr');

		// 行番（インデックス）を取得する
		var index = tr.index();

		// 一覧行から行番にひもづくエンティティを取得する
		var ent = this.getEntity(index);

		return ent;
	};

	/**
	 * Htmlテーブルからデータを取得する
	 * 
	 * @note
	 * 旧メソッド名:getDataHTbl
	 * 
	 * @param tbl HTMLテーブル要素(省略可)
	 * @return object データ
	 */
	getDataFromTbl(tbl){
		
		if(tbl == null){
			tbl = this.tbl;
		}
		if(!(tbl instanceof jQuery)){
			tbl = jQuery(tbl);
		}
		var trs = tbl.find('tbody tr');
		var data = [];

		// テーブルの行をループする
		trs.each((i,elm) => {
			var tr = jQuery(elm);
			
			// TR要素からエンティティを取得する
			var ent = this.getEntityByTr(tr);

			data.push(ent);
		});

		return data;
	};

	/**
	 * フィールドリストを指定して、Htmlテーブルからデータを取得する
	 * @return object データ
	 */
	getDataFromTblByFields(fields){

		var slt = '#' + this.param.tbl_slt + ' tbody tr';

		var data = [];

		// テーブルの行をループする
		jQuery(slt).each((i,elm)=>{
			var tr = jQuery(elm);

			// TR要素からフィールド名を検索し、値を取得する
			var ent = {};
			for(var i in fields){
				var f = fields[i];
				var elm = tr.find('.' + f);
				ent[f] = this._getValueEx(elm);

			}

			data.push(ent);
		});

		return data;
	};

	/**
	 * タグ種類を問わずに要素から値を取得する
	 * @param elm 要素
	 * @returns 要素の値
	 */
	_getValueEx(elm){
		var tagName = elm.prop("tagName"); 

		if(tagName == 'INPUT' || tagName == 'SELECT' || tagName=='TEXTAREA'){
			return elm.val();
		}else{
			return elm.html();
		}
	}

	/**
	 * フォーム内のフィールドで指定した入力要素から、値を取得する。
	 * @param form フォーム要素
	 * @param field フィールド： 入力要素のフィールド名(name属性名あるいはclass属性名）
	 * @returns フィールドで指定した入力要素からの値。
	 *  - 入力要素が存在しない場合はnullを返す
	 */
	getValueFromForm(form,field){

		var inpElm = this._formFind(form,field); // 入力要素を取得
		var v = null;
		if(inpElm[0]){
			v = this._getValueEx(inpElm); // 入力要素から値を取得
		}

		return v;
	}


	/**
	 * フォーム内のフィールドで指定した入力要素へ値をセットする。
	 * @param form フォーム要素
	 * @param field フィールド： 入力要素のフィールド名(name属性名あるいはclass属性名）
	 * @param value セットする値
	 */
	setValueToFrom(form,field,value){
		var inpElm = this._formFind(form,field); // 入力要素を取得
		if(inpElm[0]){
			this._setValueEx(inpElm,value); // 要素の種類を問わずに値をセットする
		}
	}



	/**
	 * エラーをフォームに表示する
	 * @param err エラー情報
	 * @param form_type フォーム種別 new_inp:新規入力 edit:編集
	 * 
	 */
	_showErrToForm(err,form_type){

		// エラー情報が配列であれば、値を改行で連結して１つのエラーメッセージにする。
		var err1 = err;
		if(Array.isArray(err1)){
			err1 = err1.join('<br>');
		}

		// フォーム種別からフォーム要素を取得
		var info = this.formInfo[form_type];
		var form = jQuery(info.slt);

		// フォーム要素からエラー要素を取得
		var errElm = form.find('.err');

		// エラー要素にエラーメッセージを埋め込む。
		errElm.html(err1);
	}


	/**
	 * バリデーションエラーメッセージをクリアする
	 * @param form_type フォーム種別 new_inp:新規入力 edit:編集
	 */
	_clearValidErr(form){

		var errElm = form.find(this.param.valid_msg_slt);
		errElm.html("");

		for(var i in this.fieldData){
			var field = this.fieldData[i]['field'];
			var label = form.find("[for='" + field + "']");
			if(label[0]){
				label.html("");
				label.hide();
			}
		}
	}


	/**
	 * フォームのバリデーション
	 * @param form_type フォーム種別 new_inp:新規入力 edit:編集
	 * @return validFlg バリデーションフラグ true:正常 false:入力エラー
	 */
	_validationCheckForm(form_type){

		var validFlg = true; // バリデーションフラグ

		// フォーム種別からフォーム要素を取得
		var info = this.formInfo[form_type];
		var form = jQuery(info.slt);

		form.find('.valid').each((i,elm)=>{
			var elm = jQuery(elm);
			var field = this._getFieldByNameOrClass(elm);

			// 入力要素単位でバリデーションを行う
			var res = this._validationCheck(elm,field);

			if(res == false){
				validFlg = false;
			}

		});

		return validFlg;
	};


	/**
	 * 入力要素単位でバリデーションを行う
	 * @param elm 入力要素
	 * @param field 入力要素のフィールド名
	 * @return validFlg バリデーションフラグ true:正常 false:入力エラー
	 */
	_validationCheck(elm,field){

		var validFlg = true; // バリデーションフラグ

		var label = jQuery("[for='" + field + "']");
		var title = elm.attr('title');

		try{
			validFlg=elm[0].checkValidity();

			if(validFlg == true){
				label.attr('class','text-success');
				label.html('');
			}else{
				label.attr('class','text-danger');
				label.html(title);
				label.show();
			}

		}catch( e ){

			throw e;
		}

		return validFlg;
	}


	// ファイルアップロード要素のクリア
	_resetFileUpload(fuEnt){
		fuEnt.evt = null;
		var fileElm = fuEnt.elm;
		try {
			fileElm.val("");
		} catch (e) {
			console.log('It can not be reset in IE ');
		}

		// Reset a thubnail preview.
		var imgElm = jQuery('#' + fuEnt.preview_slt);
		imgElm.attr('src','');
		imgElm.hide();

		return fuEnt;
	}
	
	/**
	 * 新しい行を作成する。 | 外部公開用のメソッド
	 * @param ent 行エンティティ
	 * @param add_row_index 追加行インデックス :テーブル行の挿入場所。-1にすると末尾へ追加。-1がデフォルト。
	 * @param option 拡張予定
	 * @return jQuery_Object 新行要素
	 */
	addTr(ent,add_row_index,option){
		this._addTr(ent,add_row_index,option)
	}


	/**
	 * 新しい行を作成する
	 * @param ent 行エンティティ
	 * @param add_row_index 追加行インデックス :テーブル行の挿入場所。-1にすると末尾へ追加。-1がデフォルト。
	 * @param option 拡張予定
	 * @return jQuery_Object 新行要素
	 */
	_addTr(ent,add_row_index,option){

		if(add_row_index == null) add_row_index = -1;
		add_row_index *= 1; // 数値型に変換する。
		
		if(!option) option = {};

		// テーブルのtbody要素を取得する
		var tbl_slt = '#' + this.param.tbl_slt;
		var trs = jQuery(tbl_slt + ' tbody tr'); // TR群要素

		// 先頭行が空ならブラウザリロードを行う。
		if(trs.length == 0){
			location.reload(true);
		}
		
		var tr0 = trs.eq(0);// 先頭行を取得

		// 先頭行から新行を作成する
		var new_tr_html = "<tr style='background-color:#fdeaea'>" + tr0.html() + "</tr>";

		// TR要素をテーブルの指定行に挿入する
		var newTr = this._insertTr(tbl_slt,add_row_index,new_tr_html);

		// 新行要素にエンティティをセットする
		option['form_type'] = 'new_inp';
		this.setEntityToTr(newTr,ent,option);
		
		return newTr;

	}

	
	/**
	 * TR要素をテーブルの指定行に挿入する
	 * @note
	 * tbodyは必須
	 * 
	 * @param string tbl_slt テーブル要素のセレクタ
	 * @param int row_index 挿入行インデックス (1行目に挿入する場合は0を指定する。末尾に追加する場合は行数以上の数字を指定）
	 * @param string tr_html 挿入TR要素
	 * @returns 新規追加TR要素
	 */
	_insertTr(tbl_slt,row_index,tr_html){
		var tbody = jQuery(tbl_slt + " tbody");
		var trs = tbody.find("tr");
		var tr_len = trs.length;
		var new_index = null;
	
		// 行数が1件以上である場合
		if(tr_len > 0){
			
			// 追加行番が行数未満である場合
			if(row_index < tr_len && row_index > -1){
				// 行番にひもづくTR要素を取得
				var tr = trs[row_index];
				
				// TR要素の上に新TR要素を追加
				jQuery(tr).before(tr_html);// × → tr.before(tr_html);
				new_index = row_index;
			}
			// 追加行番が行数以上である場合
			else{
				// 最後のTR要素を取得
				var tr = trs[tr_len-1];
				
				// TR要素の下に新TR要素を追加する
				jQuery(tr).after(tr_html);
				new_index = tr_len;
			}
		}
		// 行数が0件である場合,tbody要素にtr要素を追加する。
		else{
			tbody.append(tr_html);
			new_index = 0;
		}
		
		trs = tbody.find("tr");
		var newTr = trs[new_index];
		
		return jQuery(newTr); 
	}


	/**
	 * 編集中の行にエンティティを反映する。
	 * @param ent 行エンティティ
	 * @param <jQuery object> tr 編集中の行要素
	 * @param option 拡張予定
	 */
	_setEntityToEditTr(ent,tr,option){

		if(ent==null) return;
		if(!option) option = {};

		// 現在編集中の行要素を取得する
		if(tr==null){
			var tr = this._getTrInEditing();
		}

		// TR要素にエンティティをセットする
		option['form_type'] = 'edit';
		this.setEntityToTr(tr,ent,option);
		
		// ボタン群の表示切替
		this._switchBtnsDisplay(tr,ent);

	};
	
	/**
	 * ボタン群の表示切替
	 * @param tr 行要素
	 * @param ent 行エンティティ
	 */
	_switchBtnsDisplay(tr,ent){
		// 削除状態のボタン表示切替
		if(ent['delete_flg'] == 1){
			this._switchBtnDisp(tr,'.row_delete_btn',0);
			this._switchBtnDisp(tr,'.row_enabled_btn',1);
			this._switchBtnDisp(tr,'.row_eliminate_btn',1);
		}
		
		// 有効状態のボタン表示切替
		else{
			this._switchBtnDisp(tr,'.row_delete_btn',1);
			this._switchBtnDisp(tr,'.row_enabled_btn',0);
			this._switchBtnDisp(tr,'.row_eliminate_btn',0);
		}
	}
	
	/**
	 * ボタン表示切替
	 * @param jQuery_Object tr 行要素
	 * @param string btn_slt ボタン要素セレクタ
	 * @param int show_flg 表示フラグ    0:非表示 , 1:表示
	 */
	_switchBtnDisp(tr,btn_slt,show_flg){
		var btn = tr.find(btn_slt);
		if(!btn[0]) return;
		
		if(show_flg){
			btn.show();
		}else{
			btn.hide();
		}
	}
	
	
	
	/**
	 * テーブル要素にデータをセットする
	 * 
	 * @note
	 * 少々、重い処理なので注意。
	 * 
	 * @param tbl テーブル要素（省略可）
	 * @param data セットするデータ
	 * @param option
	 *  - form_type フォーム種別 new_inp,edit,del
	 * 
	 */
	setDataToTbl(tbl,data,option){
		
		if(tbl == null) tbl = this.tbl;
		
		var trs = tbl.find('tbody tr');
		trs.each((i,tr)=>{

			if(data[i] == null) return; // 次のループへ
			tr = jQuery(tr);
			var ent = data[i];
			this.setEntityToTr(tr,ent,option); // TR要素にエンティティをセットする
		});
	}


	/**
	 * TR要素にエンティティをセットする
	 * @param tr TR要素オブジェクト
	 * @param ent エンティティ
	 * @param option
	 *  - form_type フォーム種別 new_inp,edit,del
	 *  - xss_flg XSSサニタイズフラグ 0:実行しない , 1:実行する(デフォ）
	 */
	setEntityToTr(tr,ent,option){

		if(ent==null) return;
		if(option == null) option = {};
		
		// XSSサニタイズ
		var xss_flg = 1;
		if(option['xss_flg'] != null) xss_flg = option['xss_flg'];
		
		if(xss_flg == 1){
			ent = this._xssSanitaizeEncode(ent);
		}

		this.entToBinds(tr,ent,'class',option);// エンティティをclass属性バインド要素群へセットする
		this.entToBinds(tr,ent,'name',option);// エンティティをname属性バインド要素群へセットする

	}

	_nl2brEx(v){
		if(v == null || v == '' || v=='0'){
			return v;
		}

		if (typeof v != 'string'){
			return v;
		}

		v = v.replace(/\r\n|\n\r|\r|\n/g,'<br>');
		return v;
	}


	/**
	 * フォームからエンティティを取得する
	 * @param string form_type フォーム種別  edit,new_inp,delete
	 * @return エンティティ
	 */
	_getEntByForm(form_type){

		// 現在編集中の行要素を取得する
		var tr = this._getTrInEditing();

		// TR要素からエンティティを取得する
		var ent = {};

		// フォーム要素を取得する
		var form = this.getForm(form_type);

		if(form_type=='edit' || form_type=='delete'){
			ent = this.getEntityByTr(tr);
		}

		// フォームからエンティティを取得
		var ent2 = {};
		for(var i in this.fieldData){

			// フィールドデータからフィールド名を取得する
			var f = this.fieldData[i].field;

			// name属性またはclass属性を指定して入力要素を取得する。
			var inps = this._formFind(form,f);

			// 該当する入力要素の件数を取得する
			var cnt=inps.length;

			var v = null;// 取得値

			// 0件である場合、該当する入力要素は存在しないため、何もせず次へ。
			if(cnt==0){
				continue;
			}
			// 入力要素が1件である場合、その要素から値を取得する。
			else if(cnt==1){
				v = this._getEntByForm2(inps,form,f);
			}
			// 入力要素が2件以上である場合、最初の1件のみ取得
			else{
				inps.each((i,elm)=>{
					var inp = jQuery(elm);
					v = this._getEntByForm2(inp,form,f);
					return;
				});
			}

			ent2[f] = v;
		}

		jQuery.extend(ent, ent2);

		return ent;
	}

	/**
	 * フォーム要素を取得する
	 * @param form_type フォーム種別
	 * @param cache キャッシュフラグ 0:キャッシュから取得しない , 1:キャッシュがあればそこから取得(デフォルト）
	 * @returns フォーム要素
	 */
	getForm(form_type,cache){

		if(cache == null) cache = 1;

		var form;
		if(form_type=='new_inp' || form_type=='copy'){
			if(cache == 1){
				if(this.formNewInp != null){
					form = this.formNewInp;
				}else{
					form = jQuery('#' + this.param.new_form_slt);
				}
			}else{
				form = jQuery('#' + this.param.new_form_slt);
			}
			this.formNewInp = form;

		}else if(form_type=='edit'){

			if(cache == 1){
				if(this.formEdit != null){
					form = this.formEdit;
				}else{
					form = jQuery('#' + this.param.edit_form_slt);
				}
			}else{
				form = jQuery('#' + this.param.edit_form_slt);
			}
			this.formEdit = form;
			
			

		}else if(form_type=='delete'){

			if(cache == 1){
				if(this.formDelete != null){
					form = this.formDelete;
				}else{
					form = jQuery('#' + this.param.delete_form_slt);
				}
			}else{
				form = jQuery('#' + this.param.delete_form_slt);
			}
			this.formDelete = form;

		}else if(form_type=='eliminate'){

			if(cache == 1){
				if(this.formEliminate != null){
					form = this.formEliminate;
				}else{
					form = jQuery('#' + this.param.eliminate_form_slt);
				}
			}else{
				form = jQuery('#' + this.param.eliminate_form_slt);
			}
			this.formEliminate = form;

		}else{
			throw new Error('Uknown form_type!');
		}

		return form;
	}


	/**
	 * 様々な入力要素から値を取得する
	 * @param inp 入力要素<jquery object>
	 * @param form フォーム要素<jquery object>
	 * @param f フィールド名
	 * @return 入力要素の値
	 */
	_getEntByForm2(inp,form,f){

		var tagName = inp.get(0).tagName; // 入力要素のタグ名を取得する
		
		// 入力拡張コードを取得する
		var inp_ex = inp.attr('data-inp-ex');
		
		if(inp_ex){
			switch(inp_ex){
				case 'image1': // 画像1型
					return inp.attr('data-fp');
				case 'image_fuk': // 画像1型
					return inp.attr('data-fp');
			}
		}

		// 値を取得する
		var v = null;
		if(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA'){

			// type属性を取得する
			var typ = inp.attr('type');

			if(typ=='file'){

				var fue_id = inp.attr('id');
				if(this.cbFileUploadComp){
					// file要素のidを指定してファイル名を取得する。
					var fns = this.cbFileUploadComp.getFileNames(fue_id);
					if(fns[0] != null) v = fns[0];
				}
				
			}

			else if(typ=='checkbox'){
				v = 0;
				if(inp.prop('checked')){
					v = 1;
				}
			}

			else if(typ=='radio'){
				var opElm = form.find("[name='" + f + "']:checked");
				v = 0;
				if(opElm[0]){
					v = opElm.val();
				}
			}

			else{
				v = inp.val();
			}
		}

		// IMGタグへのセット
		else if(tagName == 'IMG'){

			//IMG系である場合、ひもづいているlabel要素から値を取得する。
			v = this._getValFromLabel(form,f);

		}

		else{
			v = inp.html();
		}

		return v;
	}




	/**
	 * フィールドを指定してlabel要素から値を取得する
	 * @param form フォーム要素オブジェクト
	 * @param field フィールド名
	 * @return labelから取得した値
	 */
	_getValFromLabel(form,field){
		var v = null;
		var label = form.find("[for='" + field + "']");
		if(label[0]){
			v = label.html();
		}

		return v;
	}

	/**
	 * name属性またはclass属性でフォーム内を探し、入力要素を取得する
	 * @param form	フォーム要素オブジェクト
	 * @param string フィールド名（name属性またはclass属性でもある）
	 * @return jquery_object 入力要素
	 */
	_formFind(form,feild){

		var inp = form.find("[name='" + feild + "']");
		if(inp[0]==null){
			inp = form.find('.' + feild);
		}

		return inp;
	}


	/**
	 * 入力フォームをダイアログ化する
	 * @param formInfo フォーム情報
	 * @param form_z_index 深度 
	 * @returns
	 */
	_convertFormToDlg(formInfo,form_z_index){
		var param = this.param;

		if(form_z_index==null){
			form_z_index = param.form_z_index
		}

		// フォームのオブジェクトを取得する
		var form = formInfo.form;

		//デフォルトCSSデータ
		var cssData = {
			'z-index':form_z_index,
			'position':'absolute',

		}

		// フォームにCSSデータをセットする
		form.css(cssData);

		//ツールチップの外をクリックするとツールチップを閉じる
		if(this.param.auto_close_flg==1){
			jQuery(document).click(
					 ()=>{

						// フォーム表示ボタンが押されたときは、フォームを閉じないようにする。（このイベントはフォームボタンを押した時にも発動するため）
						if(formInfo.show_flg==1){
							formInfo.show_flg=0;
						}else{
							jQuery(formInfo.slt).hide();
						}

					});

			//領域外クリックでツールチップを閉じるが、ツールチップ自体は領域内と判定させ閉じないようにする。
			form.click((e) => {
				e.stopPropagation();
			});
		}

		form.hide();//フォームを隠す

	}
	
	
	/**
	 * デバイスタイプ（PC/SP）の判定
	 * @return string デバイスタイプ pc,sp
	 */
	judgDeviceType(){
		var device = 'pc';
		if (screen.width <= 480) {
			device = 'sp';
		}
		return device;
	}
	


	/**
	 * フィールドデータへ新規入力フォーム内の要素情報をセットする
	 * @param fieldData フィールドデータ
	 * @param formInfo フォーム情報
	 * @param form_type フォームタイプ new_inp,edit
	 * @return フィールドデータ
	 */
	_setFieldDataFromForm(fieldData,formInfo,form_type){

		// フォーム要素オブジェクトを取得する
		var info = formInfo[form_type];
		var form = info.form;

		for(var i in fieldData){

			// エンティティからフィールドを取得する
			var ent = fieldData[i];
			var f = ent.field;

			// 入力要素エンティティ
			var inp_ent = {
					'elm':null,
					'tag_name':null,
					'type_name':null,
					'accept':'',
			};

			// name属性またはclass属性を指定して入力要素を取得する。
			var inp = this._formFind(form,f);
			inp_ent['elm'] = inp;

			// 入力要素が取得できなければcontinueする。
			if(inp[0]==null){
				continue;
			}

			var tag_name = inp.get(0).tagName; // 入力要素のタグ名を取得する
			inp_ent['tag_name'] = tag_name;

			// 値を取得する
			var v = null;
			if(tag_name == 'INPUT' || tag_name == 'SELECT' || tag_name == 'TEXTAREA'){

				// type属性を取得する
				var typ = inp.attr('type');
				inp_ent['type_name'] = typ;

				if(typ=='file'){

					// 受け入れファイルタイプを取得
					var accept = inp.attr('accept');
					inp_ent['accept'] = accept;

				}

			}

			ent['inp_' + form_type] = inp_ent;

		}

		return fieldData;
	}

	
	
	
	/**
	 * TRからDIVへ反映
	 * @param par(string or jQuery object) 親要素オブジェクトまたはセレクタ
	 * @parma row_index 行インデックス	省略した場合アクティブTRの行インデックスになる。
	 * @param option
	 *  - form_type フォーム種別
	 *  - xss サニタイズフラグ 0:サニタイズしない , 1:xssサニタイズを施す（デフォルト）
	 */
	trToDiv(par,row_index,option){
		var ent = this.getEntity(row_index); // アクティブTR要素からエンティティを取得する
		this.entToBinds(par,ent,'class',option);// エンティティをclass属性バインド要素群へセットする
		this.entToBinds(par,ent,'name',option);// エンティティをname属性バインド要素群へセットする
		
	}
	
	/**
	 * エンティティをバインド要素群へセットする
	 * 
	 * @note
	 * entのフィールドに紐づく値がundefinedならバインド要素にセットしない。nullならセットする。
	 * 
	 * @param par(string or jQuery object) 親要素オブジェクトまたはセレクタ
	 * @param ent エンティティ
	 * @param bind_attr バインド属性	'class' or 'name'
	 * @param option
	 *  - form_type フォーム種別
	 *  - xss サニタイズフラグ 0:サニタイズしない , 1:xssサニタイズを施す（デフォルト）
	 *  - disFilData object[フィールド]{フィルタータイプ,オプション} 表示フィルターデータ
	 */
	entToBinds(par,ent,bind_attr,option){
		var bindElms = this.getBindElms(par,bind_attr,option); // class属性に紐づくバインド要素リストを親要素から取得する
		
		if(!option) option = {};
		
		// class属性である場合、表示フィルターをONにする。name属性であるならOFFにする。
		if(bind_attr == 'class'){
			option['dis_fil_flg'] = 1;
		}else if (bind_attr == 'name'){
			option['dis_fil_flg'] = 0;
		}

		// バインド要素リストにエンティティをセットする
		for(var i in this.fieldData){
			var field = this.fieldData[i].field;
			if(ent[field] === undefined) continue;

			var elms = bindElms[field];
			for(var e_i in elms){
				var elm = elms[e_i];
				this.setValueToElement(elm,field,ent[field],ent,option); // バインド要素リストを取得する
			}
		}
	}
	
	
	/**
	 * バインド要素リストを取得する
	 * @param par(string or jQuery object) 親要素
	 * @param bind_attr バインド属性	'class' or 'name'
	 * @return object[s][n] バインド属性リスト  
	 */
	getBindElms(par,bind_attr){
		
		
		var bindElms = {}; 
		
		if(!(par instanceof jQuery)){
			par = jQuery(par);
		}
		
		for(var i in this.fieldData){
			
			var fEnt = this.fieldData[i];
			
			//要素を取得する
			var bElms;
			if(bind_attr == 'class'){
				bElms = par.find('.' + fEnt.field);
			}else if(bind_attr == 'name'){
				bElms = par.find(`[name='${fEnt.field}']`);
			}else{
				continue;
			}

			if(!bElms[0]) continue;// 要素が取得できなかったら次へ
			
			// 2層構造でバインド要素リストに取得要素をセットする
			var bElms2 = [];
			for(var be_i=0;be_i<bElms.length;be_i++){
				bElms2.push(bElms.eq(be_i));
			}
			bindElms[fEnt.field] = bElms2;
		}
		return bindElms;
	}


	/**
	 * フォームにエンティティをセットする
	 * @param string form_type フォーム種別
	 * @param object ent エンティティ
	 * @param option 省略可
	 *  - disFilData object[フィールド]{フィルタータイプ,オプション} 表示フィルターデータ
	 */
	setFieldsToForm(form_type,ent,option){

		var form = this.getForm(form_type);// フォーム要素を取得
		
		if(option==null) option = {};
		option['par'] = form;
		option['form_type'] = form_type;
		
		this.entToBinds(form,ent,'class',option);// エンティティをclass属性バインド要素群へセットする
		this.entToBinds(form,ent,'name',option);// エンティティをname属性バインド要素群へセットする
		
	}
	
	
	/**
	 * 様々なタイプの要素へ値をセットする
	 * @param elm(string or jQuery object) 要素オブジェクト、またはセレクタ
	 * @param field フィールド
	 * @param val1 要素にセットする値
	 * @param ent エンティティ
	 * @param option
	 *  - par 親要素(jQuery object)
	 *  - form_type フォーム種別
	 *  - xss サニタイズフラグ 0:サニタイズしない , 1:xssサニタイズを施す（デフォルト）
	 *  - disFilData object[フィールド]{フィルタータイプ,オプション} 表示フィルターデータ
	 *  - dis_fil_flg 表示フィルター適用フラグ 0:OFF(デフォルト) , 1:ON
	 */
	setValueToElement(elm,field,val1,ent,option){
		
		if(!(elm instanceof jQuery)) elm = jQuery(elm);// 要素がjQueryオブジェクトでなければ、jQueryオブジェクトに変換。
		
		// オプションの初期化
		if(option == null) option = {};
		
		// サニタイズフラグを取得する
		var xss = 0;
		if(option['xss']==null){
			xss = 1;
		}else{
			xss = option['xss'];
		}
		
		var tag_name = elm.get(0).tagName; // 入力要素のタグ名を取得する
		
	
		
		
		// 値に表示フィルターをかける
		if(option['dis_fil_flg']){
			var res = this.displayFilter(val1,field,option.disFilData,xss);
			val1 = res.val1;
			xss = res.xss;
		}
		
		
		// 拡張型の入力要素への反映
		var inp_ex = elm.attr('data-inp-ex');

		if(inp_ex){
			switch(inp_ex){
			case 'image1':
				this._setEntToImage1(elm, field, val1); // 画像1型
				break;
			case 'image_fuk':
				this._setEntToImageFuk(elm, field, val1); // 画像FUK型
				break;
			}
			return;
		}

		// 値を入力フォームにセットする。
		if(tag_name == 'INPUT' || tag_name == 'SELECT'){

			// type属性を取得
			var typ = elm.attr('type');

			if(typ=='checkbox'){
				if(val1 ==0 || val1==null || val1==''){
					elm.prop("checked",false);
				}else{
					elm.prop("checked",true);
				}

			}

			else if(typ=='radio'){
				var opElm = option.par.find("[name='" + field + "'][value='" + val1 + "']");
				if(opElm[0]){
					opElm.prop("checked",true);
				}else{
					// 値が空である場合、ラジオボタンのすべての要素からチェックをはずす。
					if(this._empty(val1)){
						var radios = option.par.find("[name='" + field + "']");
						radios.prop("checked",false);
					}
				}

			}

			else{

				// カスタム型のセット
				this._setForCustumType(elm,field,val1,ent,option);

			}

		}

		// テキストエリア用のセット
		else if(tag_name == 'TEXTAREA'){

			if(val1!="" && val1!=null){
				val1=val1.replace(/<br>/g,"\r");
				val1 = this._xssSanitaizeDecode(val1);
			}
			elm.val(val1);
		}

		
		else{
			if( typeof val1 == 'string'){
				val1=val1.replace(/<br>/g,"\r");
				// XSSサニタイズを施す
				if(xss == 1){
					val1 = this._xssSanitaizeEncode(val1); 
				}
				val1 = this._nl2brEx(val1);// 改行コートをBRタグに変換する
			}
			elm.html(val1);
		}
		
		
	}
	

	/**
	 * カスタム型のセット
	 * @param elm(string or jQuery object) 要素オブジェクト、またはセレクタ
	 * @param field フィールド
	 * @param val1 要素にセットする値
	 * @param ent エンティティ
	 * @param option
	 */
	_setForCustumType(elm,field,val1,ent,option){

		let val2 = this._xssSanitaizeDecode(val1);// XSSサニタイズを解除
		let custum_type = elm.attr('data-custum-type'); // カスタム型
		
		// リンク型である場合
		if(custum_type == 'link'){
			let td= elm.parents('td');
			let aElm = td.find('a');
			let url = aElm.attr('data-url-tmp');
			url = url.replace('%0', val2);
			aElm.attr('href', url);
			aElm.html(val1);
			elm.val(val2);
			return;
		}
		
		// その他
		elm.val(val2);
	}
	
	
	/**
	 * 画像1型
	 * @param jQuery elm 入力要素
	 * @param string field フィールド
	 * @param string fp 画像パス
	 */
	_setEntToImage1(elm, field, fp){

		let mode=0; // 0:ファイル空, 1:画像ファイル系, 2:その他ファイル（ダウンロード対象）
		
		if(fp==null || fp==''){
			mode=0;
		}else{
			let ext = this._getExtension(fp);
			let exts = ['jpg', 'jpeg', 'png', 'gif'];
			if(exts.indexOf(ext) == -1){
				mode = 2;
			}else{
				mode = 1;
			}
		}

		// 画像1型のHTML構造
		//<td>
		//	<input type='hidden' name='{$field}' value='{$fp}' data-inp-ex='image1'>
		//	<a class='image1_img_a' href='{$img_href}' target='_blank' style='width:100%;{$display_img_a}'><img src='{$thum_src}' ></a>
		//	<a class='image1_dl btn btn-success' href = '{$dl_href}' download style='{$display_dl}' title='{$fp}'><span class='oi' data-glyph='cloud-download'></span>DL</span></a>
		//	<img class='image1_none' src='img/icon/none.gif' style='{$display_none}' />
		//</td>
		
		let tdElm = elm.parents('td'); // 親要素
		let imgAElm = tdElm.find('.image1_img_a'); 
		let imgElm = tdElm.find('.image1_img'); 
		let dlElm = tdElm.find('.image1_dl'); 
		let noneElm = tdElm.find('.image1_none'); 
		
		imgAElm.attr('href', '');
		imgElm.attr('src', '');
		dlElm.attr('href', '');
		
		imgAElm.hide();
		dlElm.hide();
		noneElm.hide();
		
		let orig_fp = this.param.midway_dp + fp; // 中間パスをはさむ
		
		elm.val(fp);
		
		switch(mode){
			case 0: // ファイル空
				noneElm.show();
				break;
			case 1: // 画像系ファイル
				let thum_fp = orig_fp.replace('/orig/', '/thum/');
				imgElm.attr('src', thum_fp);
				imgAElm.attr('href', orig_fp);
				imgAElm.show();
				break;
			case 2: // その他ファイル
				dlElm.attr('href', orig_fp);
				dlElm.show();
				break;
			default:
				throw new Error('システムエラー CB210607A');
		}

	}
	
	/**
	 * ファイル名から拡張子を取得する。
	 * @param string fn ファイル名
	 * @return string 拡張子
	 */
	_getExtension(fn){
		if(fn==null || fn=='') return '';
		if(fn.indexOf('.') == -1) return '';

		let ary=fn.split(".");
		let ext=ary[ary.length-1];

		ext = ext.toLowerCase();//小文字化する

		return ext;
	}
	
	
	
	/**
	 * 画像FUK型
	 * @param jQuery elm 入力要素
	 * @param string field フィールド
	 * @param string fp 画像パス
	 */
	_setEntToImageFuk(elm, field, fp){

		let fue_id = elm.attr('id');
		let option = {'midway_dp':this.param.midway_dp};

		// file要素にファイルパスをセットする
		this.cbFileUploadComp.setFilePaths(fue_id, fp, option);
		
		elm.attr('data-fp', fp); // 「type='file'」に対応

	}
	
	
	/**
	 * 値に表示フィルターをかける
	 * @param val1 値
	 * @param field フィールド
	 * @param disFilData 表示フィルターデータ
	 * @param xss XSSサニタイズフラグ
	 * @return object
	 *  - [val1] フィルター後の値
	 *  - [xss] XSSサニタイズフラグ
	 */
	displayFilter(val1,field,disFilData,xss){
		
		
		 var res = {'val1':val1,'xss':xss};

		if(!disFilData) disFilData = this.param.disFilData;
		if(!disFilData) return res;
		if(!disFilData[field]) return res;
		
		var filEnt = disFilData[field];
		var xss = 0 ; // xssサニタイズフラグ
		
		switch (filEnt.fil_type) {
		case 'select':
			res.val1 = this.disFilSelect(val1,field,filEnt.option);// 表示フィルター・SELECTリスト
			break;
			
		case 'delete_flg':
			res.val1 = this.disFilDeleteFlg(val1,field,filEnt.option);// 表示フィルター・削除フラグ
			res.xss = 0;
			break;
			
		case 'flg':
			res.val1 = this.disFilFlg(val1,field,filEnt.option);// 表示フィルター・フラグ
			res.xss = 0;
			break;
			
		case 'money':
			res.val1 = this.disFilMoney(val1,field,filEnt.option);// 表示フィルター・金額
			res.xss =0;
			break;

		default:
			break;
		}
		
		return res;
	}
	
	/**
	 * 表示フィルターデータのSetter
	 * @param disFilData 表示フィルターデータ
	 */
	setDisplayFilterData(disFilData){
		this.param['disFilData'] = disFilData;
	}
	
	/**
	 * 表示フィルター・SELECTリスト
	 * @param val1 フィルターをかける値
	 * @param field フィールド
	 * @param option 
	 * 
	 */
	disFilSelect(val1,field,option){
		
		if(val1 == null) return val1;
		
		var list = {};
		if(option){
			if(option['list']){
				list = option['list'];
			}
		}

		var display_value = ""; // 表示する値
		if(list[val1] != null){
			display_value = list[val1];
		}
		return display_value;

	}
	
	/**
	 * 表示フィルター・削除フラグ
	 * @param val1 フィルターをかける値
	 * @param field フィールド
	 * @param option 
	 * 
	 */
	disFilDeleteFlg(val1,field,option){

		if(val1 == null) return val1;
		
		if(val1 == 1){
			return '<span style="color:#b4b4b4;">削除</span>';
		}else{
			return '<span style="color:#23d6e4;">有効</span>';
		}

	}
	
	/**
	 * 表示フィルター・フラグ
	 * @param val1 フィルターをかける値
	 * @param field フィールド
	 * @param option 
	 * 
	 */
	disFilFlg(val1,field,option){

		if(val1 == null || val1 == '' || val1 == false) val1 = 0;
		if(val1 > 0) val1 = 1;
		var val2 = option.list[val1];
		
		if(val1 == 1){
			return '<span style="color:#23d6e4;">' + val2 + '</span>';
		}else{
			return '<span style="color:#b4b4b4;">' + val2 + '</span>';
		}

	}
	
	/**
	 * 表示フィルター・金額
	 * @param val1 フィルターをかける値
	 * @param field フィールド
	 * @param option 
	 * 
	 */
	disFilMoney(val1,field,option){
		
		if(val1 == null) return val1;
		
		var currency = "&yen;";
		if(option){
			if(option['currency']){
				currency = option['currency'];
			}
		}
		return currency + String(val1).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');

	}


	/**
	 * フィールド名を指定してフィールドエンティティを取得する
	 */
	_getFieldEntByField(field){
		var index = this.fieldHashTable[field];
		var ent = this.fieldData[index];

		return ent;
	}


	/**
	 * 入力フォームを表示する
	 * 
	 * @param object form フォーム要素オブジェクト
	 * @param string triggerElm トリガー要素  ボタンなど
	 * @param option
	 *  - form_position フォーム位置フラグ:  auto(空）:基本位置 , left:トリガーの左側にフォームを表示 , center:横中央 , right:右側  , max:フルサイズ
	 *  - use_show_form_strategy 入力フォームストラテジーの使用:  入力フォームストラテジーがセットされている場合、利用するか。デフォルトは使用する。
	 */
	_showForm(form,triggerElm,option){

		if(option == null) option = {};
		
		// フォーム位置フラグをセットする。SP(スマホ）である場合は、max(横幅いっぱい）とする。
		if(option['form_position'] == null){
			option['form_position'] = this.param.form_position;
			if(this.param.device_type=='sp'){
				option['form_position'] = 'max';
			}
		}
		
		// SPである場合、ＳＰ版のスタイルを適用する
		if(this.param.device_type == 'sp'){
			var tblElm = form.find('table');
			tblElm.addClass('tbl_sp'); // ＳＰ版スタイルを適用
			tblElm.find('label.text-danger').hide(); // レイアウトが崩れるのでlabel要素を隠す
		}
		

		// 入力フォームストラテジーの使用
		if(option['use_show_form_strategy'] == null){
			option['use_show_form_strategy'] = 1;
		}

		// 複数のフォームを開いてフォームが重なった時、新しく開いたフォームが上になるようにする。
		if(this.param.auto_close_flg == 0){
			this.param.form_z_index ++;
			// ※ z_indexの最大値は32bit整数,あるいは64bit整数の最大値である。
			form.css('z-index',this.param.form_z_index);

		}

		form.show();

		// 入力フォームストラテジーがセットされている場合、こちらの処理を実行する。（ストラテジーパターンによる拡張である）
		if(option.use_show_form_strategy == 1 && this.showFormStrategy != null){
			var res = this.showFormStrategy.showForm(form,triggerElm);
			if(res==true){
				return;
			}
		}

		//トリガー要素の右上位置を取得
		if(!(triggerElm instanceof jQuery)){
			triggerElm = jQuery(triggerElm);
		}
		var offset=triggerElm.offset();
		var left = offset.left;
		var top = offset.top;

		var ww = jQuery(window).width();// Windowの横幅（ブラウザの横幅）

		// フォームのサイズを取得する。パラメータでサイズ指定されていない場合、フォームからサイズを取得する
		var form_width = this.param.form_width;// フォームの横幅
		var form_height = this.param.form_height;// フォームの縦幅
		if(this._empty(form_width)){
			form_width = form.outerWidth();
		}
		if(this._empty(form_height)){
			form_height = form.outerHeight();
		}

		// フォーム位置Yをセット
		var trigger_height = triggerElm.outerHeight();
		var tt_top = top + trigger_height;

		var tt_left=0;// フォーム初期位置X
		var full_w = ww; // コンテンツのフル横幅

		// コンテンツ要素が指定されている場合、コンテンツ要素の初期位置Xと横幅をセットする。
		if(!this._empty(this.param.contents_slt)){
			var conElm = jQuery(this.param.contents_slt);
			if(conElm[0]){
				tt_left = conElm.offset.left;
				full_w = conElm.width();
			}
		}


		// フォーム位置の種類毎にフォーム位置Xを算出する。
		switch (option.form_position) {

		case 'left':

			// トリガーの左側にフォームを表示する。
			tt_left=left - form_width;
			break;

		case 'center':

			// フォームを中央にする。
			tt_left=(full_w / 2) - (form_width / 2);
			break;

		case 'right':

			// トリガーの右側にフォームを表示する
			tt_left=left;
			break;

		case 'max':

			var  adjust_v = 2; // 調整値。 左右のborderの幅
			form_width = full_w - adjust_v;

			break;

		default:// auto

			// 基本的にトリガーの右側にフォームを表示する。
			// ただし、トリガーが右端付近にある場合、フォームは外側にでないよう左側へ寄せる。
			tt_left=left;
			if(tt_left + form_width > full_w){
				tt_left = full_w - form_width;
			}

			break;
		}

		if(tt_left < 0){
			tt_left = 0;
		}

		//フォーム要素に位置をセット
		form.offset({'top':tt_top,'left':tt_left });

		if(!this._empty(form_width)){
			form.width(form_width);
		}

		if(!this._empty(form_height)){
			form.height(form_height);
		}
		
		this._fitForm(form); // フォームを内容にフィットさせるようにリサイズする。
	}


	// フィールドデータにプロパティを追加する
	_addMoreFieldData(tbl_slt,fieldData){

		// フィールドデータが空であるなら一覧テーブルのth要素からフィールド名を取得する
		if(!fieldData){
			fieldData = this._getFieldDataFromTh();

			if(!fieldData){
				throw new Error('fieldDataを取得できません。th要素のclass属性にフィールド名を指定してください。');
			}
		}

		var fieldData2 = [];

		// thループ
		var i=0;
		jQuery('#' + tbl_slt + ' th').each((i,elm)=>{

			var wamei = jQuery(elm).text();

			var field = null;
			if(fieldData[i]){
				field = fieldData[i];
			}

			if(field != null){
				var ent = {
						'index':i,
						'field':field,
						'wamei':wamei,
					};

				fieldData2.push(ent);

				i++;
			}
		});

		return fieldData2;
	}

	// th要素からフィールド情報を取得する
	_getFieldDataFromTh(){

		var fieldData = [];

		var slt = '#' + this.param.tbl_slt + ' th';
		jQuery(slt).each((i,elm)=>{
			var thElm = jQuery(elm);
			var field = this._getFieldByClassOrName(thElm);////class属性またはname属性からフィールド名を取得する
			if(field){
				fieldData.push(field);
			};
		});
		return fieldData;
	}


	// フィールドハッシュテーブルをフィールドデータから生成する。
	_createFieldHashTable(fieldData){

		var hashTable = {};

		for(var i in fieldData){
			var fEnt = fieldData[i];

			hashTable[fEnt.field] = i;

		}

		return hashTable;
	}


	// フォーム情報の初期化
	_initFormInfo(param){

		var formInfo = {};// フォーム情報

		// 新規フォーム情報の設定
		var res = this._classifySlt(param['new_form_slt']);
		var newInpForm = jQuery(res['slt']);
		formInfo['new_inp'] = {
			'xid':res['xid'],	// ID属性
			'slt':res['slt'],	// フォーム要素のセレクタ
			'show_flg':0,		// 表示制御フラグ（閉じるイベント制御用）
			'form':newInpForm,	// フォーム要素
		};
		// フォームモードがダイアログ型であるならフォームをダイアログ化する。
		if(this.param.form_mode == 0){
			this._convertFormToDlg(formInfo.new_inp);// フォームをダイアログ化する。
		}

		// 編集フォーム情報の設定
		res = this._classifySlt(param['edit_form_slt']);
		var editForm = jQuery(res['slt']);
		formInfo['edit'] = {
			'xid':res['xid'],	// ID属性
			'slt':res['slt'],	// フォーム要素のセレクタ
			'show_flg':0,		// 表示制御フラグ（閉じるイベント制御用）
			'form':editForm,	// フォーム要素
		};
		// フォームモードがダイアログ型であるならフォームをダイアログ化する。
		if(this.param.form_mode == 0){
			this._convertFormToDlg(formInfo.edit);
		}


		// 削除フォーム情報の設定
		var res = this._classifySlt(param['delete_form_slt']);
		var deleteForm = jQuery(res['slt']);
		formInfo['delete'] = {
			'xid':res['xid'],	// ID属性
			'slt':res['slt'],	// フォーム要素のセレクタ
			'show_flg':0,		// 表示制御フラグ（閉じるイベント制御用）
			'form':deleteForm,	// フォーム要素
		};
		this._convertFormToDlg(formInfo['delete']);// フォームをダイアログ化する。


		// 抹消フォーム情報の設定
		var res = this._classifySlt(param['eliminate_form_slt']);
		var eliminateForm = jQuery(res['slt']);
		formInfo['eliminate'] = {
			'xid':res['xid'],	// ID属性
			'slt':res['slt'],	// フォーム要素のセレクタ
			'show_flg':0,		// 表示制御フラグ（閉じるイベント制御用）
			'form':eliminateForm,	// フォーム要素
		};
		this._convertFormToDlg(formInfo['eliminate']);// フォームをダイアログ化する。

		return formInfo;

	};

	/**
	 * バリデーションによるエラーを表示する
	 * @param errData エラーデータ
	 *  - 文字列型<string>	エラーメッセージのみ
	 *  - エラー出力指定型(単一) <{'err_slt','err_msg'}>		出力先セレクタとエラーメッセージ
	 *  - エラー出力指定型（複数） <[{'err_slt','err_msg'}]>	上記の配列
	 * @param form_type フォーム種別
	 * @returns void
	 */
	_errShow(errData,form_type){

		// フォーム種別からフォーム要素を取得する
		var form = this.getForm(form_type);

		// 一旦、バリデーションエラーメッセージをクリアする
		this._clearValidErr(form);

		// エラーメッセージのみである場合
		if (typeof errData == 'string'){
			var errElm = form.find(this.param.valid_msg_slt);
			if(errElm[0]){
				if(errElm.length > 1){
					errElm = errElm.eq(0);
				}
				errElm.html(errData.err_msg);
			}
			errElm.html(errData);

		}

		// エラーセレクタによってエラー出力先が指定されている場合
		else{

			// 複数エラータイプである場合
			if(errData[0]){
				for(var i in errData){
					var errEnt = errData[i];
					var errElm = form.find(errEnt.err_slt);
					errElm.html(errEnt.err_msg);
				}
			}

			// 単一エラータイプである場合
			else{
				var errElm = form.find(errData.err_slt);
				errElm.html(errData.err_msg);
			}
		}
	}


	/**
	 * 検索実行
	 */
	searchKjs(){
		
		// 検索入力のバリデーション
		if(this.cbValidationJq.checkAll()){
			alert('検索入力に不備があります。確認してください。');
			return;
		}

		// URLからパラメータを取得する
		let param = this._getUrlQuery();

		let formElm = this._getFormKjsElm(); // 検索条件フォーム要素を取得する
		
		// form要素内の入力要素群をループする。
		let kjs = {}; // 検索条件情報
		let removes = []; // 除去リスト（入力が空の要素のフィールド）
		
		formElm.find('.kjs_inp').each((i,elm)=>{

			// 要素から選択値を取得する
			let kjsElm = jQuery(elm);
			
			let type = kjsElm.attr('type');
			
			let val = '';
			if(type == 'checkbox'){
				if(kjsElm.prop('checked')){
					val = 1;
				}else{
					val = 0;
				}
			}else{
				 val = kjsElm.val();
			}

			// 選択値が空でない場合（0も空ではない扱い）
			let field = kjsElm.attr('id'); // 要素のID属性から検索条件フィールドを取得する
			if(!this._emptyNotZero(val)){
				val = encodeURIComponent(val); // 要素の値をURLエンコードする
				kjs[field] = val; // 検索条件情報にセットする
			}else{
				removes.push(field);
			}
		});

		// パラメータに検索条件情報をマージする
		jQuery.extend(param, kjs);

		// パラメータから除去リストのフィールドを削除する。
		for(let i in removes){
			let rem_field = removes[i];
			delete param[rem_field];
		}

		// 1ページ目をセットする
		param['page_no'] = 0;

		// パラメータからURLクエリを組み立てる
		let query = '';
		for(let field in param){
			let val = param[field];
			query += field + '=' + val + '&';
		}

		// URLの組み立て
		let url;
		if(query != ''){
			query = query.substr(0,query.length-1); // 末尾の一文字を除去する
			url = '?' + query;
		}

		// URLへ遷移
		window.location.href = url;
	}



	/**
	 * 現在の検索条件がデフォルトの検索条件を比較し、検索初期状態であるかチェックする。
	 * 
	 * @param outFields 比較対象外フィールド配列
	 * @param kjs 検索条件情報(省略可）
	 * @param defKjs デフォルト検索条件（省略可）
	 * @returns 検索初期状態 0:初期状態でない , 1:初期状態
	 */
	isDefaultKjs(outFields,kjs,defKjs){

		// 検索条件情報が省略されている場合はHTMLの埋込JSONから取得する。
		if(kjs==null){
			kjs = this.param.kjs;
		}

		// デフォルト検索条件が省略されている場合はHTMLの埋込JSONから取得する。
		if(defKjs==null){
			let defKjs = this.param.defKjs; // デフォルト検索条件データ
		}

		// 比較対象外フィールドマッピング
		let outFieldMap = {};
		for(let i in outFields){
			let field = outFields[i];
			outFieldMap[field] = 1;
		}

		let is_def_flg = 1; // 検索初期状態

		for(let field in defKjs){

			// 対象外フィールドに存在するフィールドであればコンテニュー。
			if(outFieldMap[field]){
				continue;
			}

			if(kjs[field] === null){
				continue;
			}else{

				// null,null,空文字はnullとして扱う。
				let kjs_value = kjs[field];
				if(this._emptyNotZero(kjs_value)){
					kjs_value = null;
				}
				
				let def_value = defKjs[field];
				if(this._emptyNotZero(def_value)){
					def_value = null;
				}

				// 値が異なるのであれば検索初期状態 は初期状態でないと判定する。
				if(kjs_value != def_value){

					is_def_flg = 0;
					break
				}
				
			}

		}

		return is_def_flg;

	}



	/**
	* name属性またはclass属性からフィールド名を取得する
	* 
	* @note
	* class属性が複数である場合、先頭のclass属性を取得する
	*
	* @parma elm 入力要素オブジェクト
	* @return フィールド名
	*/
	_getFieldByNameOrClass(elm){

		var field = elm.attr('name');
		if(!field){
			field = elm.attr('class');
		}

		if(!field){
			return field;
		}

		field = field.trim();
		var a = field.indexOf(' ');
		if(a != -1){
			field = field.substr(0,field.length - a);
		}

		return field;
	}


	/**
	* class属性またはname属性からフィールド名を取得する
	* 
	* @note
	* class属性が複数である場合、先頭のclass属性を取得する
	*
	* @parma elm 入力要素オブジェクト
	* @return フィールド名
	*/
	_getFieldByClassOrName(elm){

		var field = elm.attr('class');
		if(!field){
			field = elm.attr('name');
		}

		if(!field){
			return field;
		}

		field = field.trim();
		var a = field.indexOf(' ');
		if(a != -1){
			field = field.substr(0,field.length - a);
		}

		return field;
	}

	/**
	 * 対象文字列をID属性とセレクタに分類する
	 * @param slt 対象文字列
	 * @returns res
	 *  - xid ID属性
	 *  - slt セレクタ
	 */
	_classifySlt(slt){

		var xid='';
		var slt2 = '';

		if(!slt){
			return res = {
					'xid':xid,
					'slt':slt2
			}
		}

		var s1 = slt.charAt(0);
		if(s1=='#'){
			xid = slt.replace('#','');
			slt2 = slt;
		}else{
			xid = slt;
			slt2 = '#' + slt;
		}

		var res = {
				'xid':xid,
				'slt':slt2
		}

		return res;
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
	_xssSanitaizeEncode(data){
		if(typeof data == 'object'){
			for(var i in data){
				data[i] = this._xssSanitaizeEncode(data[i]);
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
	 * XSSサニタイズ・デコード
	 * 
	 * @note
	 * 「<」と「>」のサニタイズ化を元に戻す
	 * 
	 * @param any data サニタイズ対象データ | 値および配列を指定
	 * @returns サニタイズ後のデータ
	 */
	_xssSanitaizeDecode(data){
		if(typeof data == 'object'){
			for(var i in data){
				data[i] = this._xssSanitaizeDecode(data[i]);
			}
			return data;
		}
		
		else if(typeof data == 'string'){
			return data.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
		}
		
		else{
			return data;
		}
	}
	

	// 改行をBRタグに変換
	_nl2br(str) {
		if(typeof str == 'string'){
			return str.replace(/[\n\r]/g, "<br>");
		}else{
			return str;
		}
	}

	// 空判定
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
	 * 空判定 | ただし「0」はfalseを返す
	 * @param v
	 */
	_emptyNotZero(v){
		var res = this._empty(v);
		if(res){
			if(v===0 || v==='0'){
				res = false;
			}
		}
		return res;
	}

	/**
	 * URLクエリデータを取得する
	 * 
	 * @return object URLクエリデータ
	 */
	_getUrlQuery(){
		query = window.location.search;

		if(query =='' || query==null){
			return {};
		}
		var query = query.substring(1,query.length);
		var ary = query.split('&');
		var data = {};
		for(var i=0 ; i<ary.length ; i++){
			var s = ary[i];
			var prop = s.split('=');

			data[prop[0]]=prop[1];

		}	
		return data;
	}


	/**
	 * 入力フォームストラテジーのセッター
	 * @param obj 入力フォームストラテジーのオブジェクト
	 */
	setShowFormStrategy(obj){
		this.showFormStrategy = obj;
	}



	/**
	 * 要素の種類を問わずに値をセットする
	 * @param elm 要素(jQueryオブジェクト）
	 * @pramm v 値
	 * @version 1.0
	 */
	_setValueEx(elm,v){

		if(!elm[0]){
			return;
		}

		var tagName = elm.get(0).tagName; // 入力要素のタグ名を取得する

		// 値を入力フォームにセットする。
		if(tagName == 'INPUT' || tagName == 'SELECT'){

			// type属性を取得
			var typ = elm.attr('type');

			if(typ=='checkbox'){
				if(v ==0 || v==null || v==''){
					elm.prop("checked",false);
				}else{
					elm.prop("checked",true);
				}
			}

			else if(typ=='radio'){
				var f = elm.attr('name');
				var parElm = elm.parent();
				var opElm = parElm.find("[name='" + f + "'][value='" + v + "']");
				if(opElm[0]){
					opElm.prop("checked",true);
				}
			}
			else{

				if(typeof v == 'string'){
					v = v.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
				}
				elm.val(v);
			}
		}

		// テキストエリア用のセット
		else if(tagName == 'TEXTAREA'){

			if(v!="" && v!=null){
				v=v.replace(/<br>/g,"\r");

				if(typeof v == 'string'){
					v = v.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
				}
			}

			elm.val(v);

		}

		// IMGタグへのセット
		else if(tagName == 'IMG'){
			// IMG要素用の入力フォームセッター
			elm.attr('src',v);

		}

		// audioタグへのセット
		else if(tagName == 'AUDIO'){
			elm.attr('src',v);

		}else{
			if(v!="" && v!=null){
				v=v.replace(/<br>/g,"\r");
				if(typeof v == 'string'){
					v = v.replace(/</g, '&lt;').replace(/>/g, '&gt;');
				}
				v = v.replace(/\r\n|\n\r|\r|\n/g,'<br>');// 改行コートをBRタグに変換する
			}

			elm.html(v);
		}

	}
	
	
	/**
	 * 自動保存の依頼をする
	 * 
	 * @note
	 * バックグランドでHTMLテーブルのデータをすべてDBへ保存する。
	 * 二重処理を防止するメカニズムあり。
	 * 
	 * @param data 保存対象データ   省略した場合、HTMLテーブルのデータを保存する。
	 * @parma option 
	 *  - reflect_on_tbl 0:HTMLテーブルにdataを反映しない , 1:HTMLテーブルにdataを反映する
	 */
	saveRequest(data,option){
		this.autoSave.saveRequest(data,option);// 保存依頼
	}
	
	
	/**
	 * Ajax送信データ用エスケープ。実体参照（&lt; &gt; &amp; &）を記号に戻す。
	 * 
	 * @param any data エスケープ対象 :文字列、オブジェクト、配列を指定可
	 * @returns エスケープ後
	 */
	escapeForAjax(data){
		if (typeof data == 'string'){
			if ( data.indexOf('&') != -1) {
				data = data.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
				return encodeURIComponent(data);
			}else{
				return data;
			}
		}else if (typeof data == 'object'){
			for(var i in data){
				data[i] = this.escapeForAjax(data[i]);
			}
			return data;
		}else{
			return data;
		}
	}
	
	/**
	 * 行入替後の処理
	 */
	rowExchangeAfter(){

		let data = this.getDataFromTbl();// Htmlテーブルからデータを取得
		
		let page_no = this.param.pages.page_no * 1;
		let limit = this.param.pages.row_limit * 1;
		
		// データに順番をセットする
		let sort_no = (page_no * limit) + 1;
		
		for(let i in data){
			let ent = data[i];
			ent['sort_no'] = sort_no;
			sort_no ++;
		}
		
		this._btnsDisabledSwich(true);
		
		// 自動保存後のコーバック
		let afterCallBack = function(){
			this._btnsDisabledSwich(false);
		}.bind(this);
		
		let option = {
				'reflect_on_tbl':1, // 1:HTMLテーブルにdataを反映する
				'afterCallBack':afterCallBack,
		}
		this.saveRequest(data,option);// 自動保存の依頼をする
	}
	
	
	/**
	 * 行のボタン群の有効、無効を切替
	 */
	_btnsDisabledSwich(flg){
		jQuery(".row_edit_btn").prop('disabled', flg);
		jQuery(".row_copy_btn").prop('disabled', flg);
		jQuery(".row_delete_btn").prop('disabled', flg);
		jQuery(".row_enabled_btn").prop('disabled', flg);
		jQuery(".row_eliminate_btn").prop('disabled', flg);
	}
	
	
	/**
	 * 登録ボタン切替
	 * @param string フォーム種別 new_inp,edit
	 * @param int active_flg アクティブフラグ 0:押せなくする , 1:押せるようにする
	 */
	_toggleRegBtn(form_type,active_flg){
		
		var form = this.getForm(form_type);// フォーム要素を取得
		
		var regBtns = form.find('.reg_btn');
		var regBtnMsgs = form.find('.reg_btn_msg');
		if(active_flg == 0){
			regBtns.prop('disabled',true);
			regBtnMsgs.html('　登録中・・・');
			
		}else{
			regBtns.prop('disabled',false);
			regBtnMsgs.html('');
			
		}

	}
	
	/**
	 * スネーク記法をキャメル記法に変換する
	 * (例) big_cat_test → BigCatTest
	 */
	_snakeToCamel(str){
		//_+小文字を大文字にする(例:_a を A)
		str = str.replace(/_./g,
			(s) => {
				return s.charAt(1).toUpperCase();
			}
		);

		// 先頭を大文字化する
		str = str.charAt(0).toUpperCase() + str.slice(1);
		
		return str;
	};
	
	
	
	
	/**
	 * 検索条件入力要素リストを取得する
	 */
	getKjElms(){
		var kjElms = {};
		jQuery('.kj_wrap').each((i,elm) => {
			elm = jQuery(elm);
			var field = elm.attr('data-field');
			kjElms[field] = elm;
		});
		
		return kjElms;
	}
	
	/**
	 * テーブル変形
	 * @param mode_no モード番号  0:テーブルモード , 1:区分モード
	 * @returns
	 */
	tableTransform(mode_no){

		if(mode_no == 1){
			this.tbl.addClass('table_transform');
			jQuery("#table_transform_tbl_mode").show();
			jQuery("#table_transform_div_mode").hide();
		}else{
			this.tbl.removeClass('table_transform');
			jQuery("#table_transform_tbl_mode").hide();
			jQuery("#table_transform_div_mode").show();
		}
	}
	

	
	
	/**
	 * FileUploadK | ファイルプレビュー後コールバック
	 * @param object box データボックス（FileUploadK.jsのプロパティ）
	 */
	_fukPrevAfterCallback(fue_id,box,cbParam){

		if(fue_id == null) return;
		
		// fue_idの末尾の2文字からフォーム種別を判定する。
		var end_str = fue_id.slice(-2); // 末尾の2文字を取得
		var form_type = null; // フォーム種別
		if(end_str == '_n'){
			form_type = 'new_inp';
		}else if(end_str == '_e'){
			form_type = 'edit';
		}else{
			return;
		}
		
		var self = cbParam.self;
		self._fitFormByFormType(form_type); // フォームを内容にフィットさせるようにリサイズする。

	}
	
	/**
	 * フォームを内容にフィットさせるようにリサイズする。
	 * @param string form_type フォーム種別
	 */
	_fitFormByFormType(form_type){
		
		var form = this.getForm(form_type);
		this._fitForm(form);

	}
	
	/**
	 * フォームを内容にフィットさせるようにリサイズする。
	 * @param jQuery form フォームオブジェクト
	 */
	_fitForm(form){
		
		if(this.param.form_mode == 1){
			form.css({
				'width':'auto',
				'height':'auto',
			});
			
		}else{
			form.css({
				'width':'auto',
				'height':'auto',
				'display':'inline-block',
			});
			
		}
	}
	
	

	
	/**
	 * フォームをドラッグ移動およびリサイズできるようにする。
	 */
	_formDragAndResizeSetting(){
		

		if(this.param.form_mode == 0){
			this._formDragAndResizeSetting2('new_inp');
			this._formDragAndResizeSetting2('edit');
		}
		
		this._formDragAndResizeSetting2('delete');
		this._formDragAndResizeSetting2('eliminate');

	}
	

	/**
	 * フォームをドラッグ移動およびリサイズできるようにする。
	 * @param string form_type フォーム種別
	 */
	_formDragAndResizeSetting2(form_type){
		
		
		if(this.param['drag_and_resize_flg'] != 1) return;
		
		var form = this.getForm(form_type);
		if(form==null) return;
		if(form.draggable == null) return;
		
		// フォームのドラッグ移動を有効にする。
		var draggableDiv = form.draggable();
		
		//ドラッグ移動を組み込むとテキスト選択ができなくなるので、パネルボディ部分をテキスト選択可能にする。
		jQuery('.panel-body',draggableDiv).mousedown((ev) => {
			  draggableDiv.draggable('disable');
			}).mouseup((ev) => {
			  draggableDiv.draggable('enable');
			});
		
		//リサイズ機能を組み込む
		form.resizable();

	}
	
	/**
	 * エラータイプリストによるエラー処理
	 */
	_errByErrTypes(){

		// 検索条件エラーが存在する場合、詳細検索フォームを表示する
		if(this.param.errTypes.indexOf('kjs_err') >= 0){
			jQuery('.cb_kj_detail').show();
		}
	}
	
	/**
	 * ノート詳細を開く
	 * @param btnElm 詳細ボタン要素
	 */
	openNoteDetail(btnElm,field){
		
		if(!(btnElm instanceof jQuery)){
			btnElm = jQuery(btnElm);
		}
		
		if(field == null) field = 'note';
		
		// 親要素であるTD要素を取得する
		var td = btnElm.parents('td');
		
		// フィールド要素を取得する
		var fieldElm = td.find("[name='" + field + "']");
		
		// 短文要素を取得する
		var shortElm = td.find('.' + field);
		
		// ノート詳細要素を作成および取得する
		var maked = 1; // 作成済みフラグ  0:未作成 , 1:作成済み
		var noteDetailElm = td.find('.note_detail');
		if(!noteDetailElm[0]){
			maked = 0;
			var note_detail_html = `<div class='note_detail' data-field='${field}'></div>`;
			td.append(note_detail_html);
			noteDetailElm = td.find('.note_detail');
		}
		
		// 短文要素が隠れている場合（ノート詳細が開かれている状態である場合）
		if(shortElm.css('display') == 'none'){
			shortElm.show();
			noteDetailElm.hide();
			btnElm.val('...');
			return;
		}
		
		// ノート詳細が作成済みである場合
		if(maked){
			shortElm.hide();
			noteDetailElm.show();
			btnElm.val('閉じる');
			return;
		}

		// ノートのフルテキストを取得する
		var text1 = td.find("[name='" + field + "']").val();
		if(text1 == null || text1 == '') return;
		
		// XSSサニタイズ
		text1 = this._xssSanitaizeEncode(text1);
		
		// 改行コードをBRタグに変換する
		text1 = text1.replace(/\r\n|\n\r|\r|\n/g,'<br>');
		
		// ノート詳細にテキストをセットする
		noteDetailElm.html(text1);
		
		// 短文要素を隠し、詳細ボタン名も変更する
		shortElm.hide();
		btnElm.val('閉じる');
		
	}
	
	
	/**
	 * フォームのcolspan属性に列数をセットする
	 * @param jQuery form フォーム
	 * @return 列数をセット後のjQueryフォーム
	 */
	_setColspanToForm(form){

		// 現在表示中の列数を取得する
		var clm_cnt = this._getClmCntByActive();
		
		// フォーム内のTD要素・colspan属性に列数をセットする。
		form.find('td').attr('colspan',clm_cnt);
		
		return form;
	}
	
	/**
	 * 現在表示中の列数を取得する
	 * @return int 列数
	 */
	_getClmCntByActive(){
		// 表示中の列数を取得する
		var cshAry = this.csh.getCshAry();
		var clm_cnt = 1; // 列数 (最初の1はボタン類の列を表す）
		for(var i in cshAry){
			if(cshAry[i]) clm_cnt ++;
		}
		return clm_cnt;
	}
	
	/**
	 * フォームのcolspan属性に列数をセットする
	 * @param jQuery form フォーム
	 * @return 列数をセット後のjQueryフォーム
	 */
	_setColspanToTd(td){
		
		// 表示中の列数を取得する
		var cshAry = this.csh.getCshAry();
		var clm_cnt = 1; // 列数 (最初の1はボタン類の列を表す）
		for(var i in cshAry){
			if(cshAry[i]) clm_cnt ++;
		}
		
		// フォーム内のTD要素・colspan属性に列数をセットする。
		form.find('td').attr('colspan',clm_cnt);
		
		return form;
	}
	
	
	/**
	 * 初期戻しボタンにURLをセットする
	 */
	_iniRtnSetUrl(){
		
		var hiddensElm = this._getHiddensElm(); // hiddenデータ要素を取得（埋込データ要素）

		let referer_url = this.param.referer_url; // リファラURL
		let now_url = this.param.now_url; // 現在URL
		
		// GETクエリ部分を取り除いたURLを取得する
		var r_url_b = this._stringLeft(referer_url, '?', 1);
		var now_url_b = this._stringLeft(now_url, '?', 1);
		
		// ローカルストレージキーを取得する。当画面の固有のキーにする。
		var url = location.href; // 現在ページのURLを取得
		var url = url.split(/[?#]/)[0]; // クエリ部分を除去
		var ls_key = url + '-ini_rtn_url'; // ローカルストレージキー

		var ini_rtn_url = ''; // 初期戻りURL
		
		// クエリ部分を除いたリファラURLと現在URLが一致するなら、ローカルストレージに保存してある初期戻りURLを取得する。
		if(r_url_b == now_url_b){
			ini_rtn_url = localStorage.getItem(ls_key);
			if(ini_rtn_url == null) ini_rtn_url =  now_url;
		}else{
			// 一致しないなら現在URLを初期戻りURLとして取得。またローカルストレージに保存する。
			ini_rtn_url = now_url;
			localStorage.setItem(ls_key,ini_rtn_url);
		}
		
		// 初期戻りボタンに初期戻りURLをセットする
		jQuery('.ini_rtn').attr('href', ini_rtn_url);
		
	}
	
	/**
	 * hiddenデータ要素を取得（埋込データ要素）
	 */
	_getHiddensElm(){
		if(this.hiddensElm == null){
			this.hiddensElm = jQuery('#hiddens_data');
		}
		return this.hiddensElm;
	}
	
	/**
	 * 文字列を左側から印文字を検索し、左側の文字を切り出す。
	 * @date 2016-12-8 | 2018-11-28
	 * @version 1.1
	 * 
	 * @param s 対象文字列
	 * @param mark 印文字
	 * @param not_find_flg 0:印文字が見つからないなら空を返す[デフォルト] , 1:見つからないならそのまま対象文字列を返す
	 * @return 印文字から左側の文字列
	 */
	_stringLeft(s, mark, not_find_flg){

		if (s==null || s=="") return s;
		
		var a=s.indexOf(mark);
		if(a== -1){
			if(not_find_flg == 1) return s;
		}
		
		var s2=s.substring(0,a);
		return s2;
		
	}
	
	/**
	 * 検索関連の入力要素にEnterイベントを組み込む
	 */
	_addEventForKjsEnter(){
		
		var formKjsElm = this._getFormKjsElm(); // 検索条件フォーム要素を取得
		
		// 新規入力フォームのinput要素にEnterキー押下イベントを組み込む。
		formKjsElm.find('input').keypress((e) => {
			if(e.which==13){ // Enterキーが押下された場合
				this.searchKjs(); // 検索実行
			}
		});
		
		
	}
	
	/**
	 * 検索条件フォーム要素を取得
	 */
	_getFormKjsElm(){
		if(this.formKjsElm == null){
			this.formKjsElm = jQuery('.form_kjs');
		}
		return this.formKjsElm;
	}
	
	
	
	/**
	 * カレンダービューを生成
	 * @param string date_field 日付フィールド
	 */
	calendarViewCreate(date_field){

		// 一覧テーブルからデータを取得する
		var data = this.getDataFromTbl();
		
		// カレンダービューを生成
		this.calendarViewK.create(data, date_field);
		
	}
	
	/**
	 * リアクト機能の初期化
	 * @param string hyo_elm_id 表要素ID   複数の表IDを指定するときはコンマで連結する
	 */
	reactInit(hyo_elm_id){		

		var d1 = new Date();
		var t1 = d1.getTime();

		// フィールド配列を取得する
		var fields = this._getFields();
		
		this.crudBaseReact.init(fields, hyo_elm_id);

	}
	
	/**
	 * 行のリアクティビング
	 */
	reactivatingOfRow(){
		this.crudBaseReact.reactivatingOfRow();
	}

	/**
	 * フィールド配列を取得する
	 * @return array フィールド配列
	 */
	_getFields(){
		
		if(this.fields != null) return this.fields;
		
		var fields = [];
		for(var i in this.fieldData){
			var fEnt = this.fieldData[i];
			fields.push(fEnt.field);
		}
		this.fields = fields;
		return this.fields;

	}
	
	
	/**
	 * Google翻訳API・キャッシュ機能拡張の初期化
	 * @param string page_code ページコード
	 * @param string xids ID属性リスト
	 */
	initCbGtaCash(page_code, xids){
		if(this.cbGtaCash == null) return;
		this.cbGtaCash.init(page_code, xids);
	}
	
	/**
	 * 検索条件情報を取得する
	 */
	_getKjs(){
		if(this.kjs == null){
			this.kjs = this.param.kjs;
		}
		return this.kjs;
	}
	
	
	/**
	 * セッションクリア
	 * @param web_query_str string WEBクエリ（ 例→user_id=4&status=1 )
	 */
	sessionClear(web_query_str){
		
		// WEBクエリの先頭に「&」がついていなければ付加する。
		if(!this._empty(web_query_str)){
			let s1 = web_query_str.charAt(0);
			if(s1 != '&'){
				web_query_str = '&' + web_query_str;
			}
		}else{
			web_query_str = '';
		}
		
		
		this._clear();
		
		// リロード
		location.href = '?ini=1&sc=1' + web_query_str;
	}
	
	
	/***
	 * クリア
	 */
	_clear(){
		// 列表示切替機能を初期化
		this.csh.reset();
		
		// CrudBase設定をリセット
		this.crudBaseConfig.reset();
		
		this.cbBtnSizeChanger.clearReset();
	}
	
	/**
	 * 検索条件のバリデーション・jQuery版
	 * @param string per_xid 親要素のid属性値（親要素のセレクタ）
	 * @param {} crudBaseData
	 * @param [function] バリデーションメソッド群
	 */
	setKjsValidationForJq(per_xid, crudBaseData, validMethods){
		this.cbValidationJq = new CrudBaseValidationJQuery(per_xid, crudBaseData, validMethods);
	}
	
	
	// 外部名称をTR要素にセットする。
	_setOuterNameToTr(ent,tr){
		let fieldData = this.crudBaseData.fieldData;
		for(let i in fieldData){
			let fEnt = fieldData[i];
			if(fEnt.outer_tbl_name == null) continue;
			let outer_alias = fEnt.outer_alias;
			let outer_name = ent[outer_alias];
			outer_name = this._xssSanitaizeEncode(outer_name);
			if(outer_name == null) outer_name = '';
			let elm1 = tr.find('.' + outer_alias);
			if(elm1[0]){
				elm1.html(outer_name);
			}
			let elm2 = tr.find(`input[name='${outer_alias}']`);
			if(elm2[0]){
				elm2.val(outer_name);
			}
			
		}

	}
	
}


