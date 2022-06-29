
/**
 * ファイルアップロードの拡張クラス
 * 
 * @note
 * DnD（ドラッグ&ドロップに対応。
 * アップロード区分のドレスアップ。
 * エンティティなどのデータも一緒に送信。
 * 複数のファイルをアップロードできる。
 * 複数のファイルアップロード要素に対応。
 * 進捗バーの表示
 * ファイルの初期表示
 * 
 * @license MIT
 * @version 1.3.7
 * @date 2018-7-6 | 2021-6-11
 * @history 
 *  - 2021-04-29 var 1.3.0 大幅なバージョンアップ
 *  - 2018-10-2 var 1.2.6 「Now Loading...」メッセージを表示する
 *  - 2018-9-18 var 1.2.5 コールバックパラメータを追加（pacb_param)
 *  - 2018-9-18 var 1.2.4 fuk_preview要素のstyle属性を修正
 *  - 2018-9-18 var 1.2.3 クリアのバグを修正
 *  - 2018-8-27 ver 1.2.2 setFilePaths:ファイル名空に対応
 *  - 2018-8-14 ver 1.2.0 ファイルの初期表示
 *  - 2018-8-11 ver 1.1
 *  - 2018-8-7 リリース
 *  - 2018-7-6 新規作成
 * 
 */
class FileUploadK{
	
	
	/**
	 * コンストラクタ
	 * 
	 * @param param
	 * - ajax_url 通信先URL
	 * - style_flg 専用スタイルフラグ デフォルトON
	 * - unit_slt まとまり要素のセレクタ  省略時はbody
	 * - prog_slt 進捗バー要素のセレクタ
	 * - err_slt  エラー要素のセレクタ
	 * - img_width プレビュー画像サイスX　（画像ファイルのみ影響）
	 * - img_height プレビュー画像サイスY
	 * - adf    補足データフラグリスト (Ancillary Data Flgs)
	 *     - fn_flg ファイル名・表示フラグ (デフォ:1 以下同じ)
	 *     - size_flg 容量・表示フラグ
	 *     - mime_flg MIME・表示フラグ
	 *     - modified 更新日時・表示フラグ
	 * - valid_ext バリデーション拡張子
	 *      指定方法
	 *          グループ指定： audio,image,
	 *          拡張子単体指定: jpg
	 *          拡張子配列指定: array('jpg','png')
	 *          拡張子コンマ連結: 'jpg,png,gif'
	 * - valid_mime_flg バリデーションMIMEフラグ 0:バリデーション行わない(デフォ) , 1:バリデーションを行う
	 * - max_size 最大容量
	 * 
	 * @param callbacks
	 * - function fileputEvent(box) ファイル配置イベント    DnD直後およびファイル選択直後のイベント
	 */
	constructor(param, callbacks){
		
		// コールバック関数群
		if(callbacks == null) callbacks = {};
		this.callbacks = callbacks;
		
		this.active_fue_id;// ファイルアップロード要素のid属性(イベント中）
		
		this.box = {}; // データボックス   ファイル要素、ファイルオブジェクト、各種パラメータを格納
		
		this.mimeMap = this._getMimeMapping(); // MIMEマッピングデータ
		
		this.param = this._setParamIfEmpty(param);
		
		this.unit = jQuery(this.param.unit_slt);
		
		this.cbAsynsEnd; // 複数非同期・全終了後コールバック・データ
		
	}

	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};
		
		if(param['ajax_url'] == null) param['ajax_url'] = null;
		
		if(param['style_flg'] == null) param['style_flg'] = 1;
		
		if(param['unit_slt'] == null) param['unit_slt'] = 'body';
		
		if(param['err_slt'] == null) param['err_slt'] = '#err';
		
		if(param['valid_mime_flg'] == null) param['valid_mime_flg'] = 0;
		
		if(param['img_width'] == null) param['img_width'] = null;
		if(param['img_height'] == null) param['img_height'] = null;
		
		// 補足データフラグリスト
		if(param['adf'] == null){
			param['adf'] = {
					'fn_flg':1,
					'size_flg':1,
					'mime_flg':1,
					'modified_flg':1,
			};
		}
		
		if(param['max_size'] == null) param['max_size'] = 5000000; // 5MB
		
		
		// バリデーション情報を作成する。
		var valid_ext = null;
		if(param['valid_ext'] != null) valid_ext = param['valid_ext'];
		param['validData'] = this._createValidData(valid_ext, param['max_size']);

		return param;
	}
	
	
	
	/**
	 * ファイルアップロード関連のイベントを追加する。
	 * 
	 * @note
	 * ファイルチェンジイベントの追加。
	 * DnDイベントの追加
	 * 
	 * @param fue_id ファイルアップロード要素のid属性
	 * @param option 
	 *  - valid_ext バリデーション拡張子(詳細はconstructor()の引数を参照）
	 *  - pacb プレビュー後コールバック関数
	 *  - pacb_param pacbに渡すパラメータ
	 *  - img_width プレビュー画像サイスX　（画像ファイルのみ影響）
	 *  - img_height プレビュー画像サイスY
	 *  - midway_dp 中間ディレクトリパス
	 */
	addEvent(fue_id,option){
		
		if(option == null) option = {};
		
		// ファイルアップロード要素の親ラベル（DnD要素）を取得する
		var parLabel = this._getElement(fue_id,'label');
		
		// 親ラベル要素にfue_idを属性として追加する。
		parLabel.attr('data-fue-id',fue_id);
		
		// 各要素から値を取ってきて、データボックスに格納する。
		var box = this._setToBox(fue_id,this.box,option);
		
		// 親ラベル要素にいくつかの関連要素を追加する。
		this._addRelatedElements(parLabel,fue_id,box);
		
		// 関連要素にCSSスタイルを適用する
		this._applyStyle(fue_id);
		
		// DnDイベントをラッパー要素に追加
		parLabel[0].addEventListener('drop',(evt) => {
			evt.stopPropagation();
			evt.preventDefault();

			// ボックスデータにアップロードファイル情報を追加
			var files = evt.dataTransfer.files; 
			this.box[fue_id]['files'] = files;
			this._preview(fue_id, 'files', 'dnd', option); // プレビュー表示

			// コールバックを実行する
			if(this.callbacks.fileputEvent != null){
				this.callbacks.fileputEvent(this.box);
			}
			
		},false);
		// ドラッグオーバーイベントを発動させないようにする。
		parLabel[0].addEventListener('dragover',(evt) => {
			evt.preventDefault();
		},false);
		
		// ファイルアップロード要素のチェンジイベントを追加する。
		var fue = this._getElement(fue_id,'fue');
		fue.change((e) => {

			// ボックスデータにアップロードファイル情報を追加
			var files = e.target.files; // ファイルオブジェクト配列を取得（配列要素数は選択したファイル数を表す）
			if(files == null || files.length == 0) return;// ファイル件数が0件なら処理抜け
			this.box[fue_id]['files'] = files;
			this._preview(fue_id, 'files', 'change', option); // プレビュー表示
			
			// コールバックを実行する
			if(this.callbacks.fileputEvent != null){
				this.callbacks.fileputEvent(this.box);
			}
			
		});
		
		// クリアボタンにイベントを実装する
		var clearBtn = this._getElement(fue_id,'clear_btn');
		clearBtn.click((e) => {
			this._clearBtnClick(e);
		});
	}
	
	
	/**
	 * file要素にファイルパスをセットする
	 * @param string fue_id file要素のid
	 * @param array fps ファイルパスリスト（ ファイル名一つを文字列指定可）
	 * @param object option addEventのoptionと同じ
	 */
	setFilePaths(fue_id,fps,option){

		if(option == null) option = {};
		
		this._clearBtnAction(fue_id); // クリアボタンアクション

		if(typeof fps == 'string'){
			let ext0 = this._getExtension(fps);
			if(ext0 == '') return;
		}
		

		if(fps == null || fps == '' || fps == 0) return;
		if(typeof fps == 'string') fps = [fps];

		var bData = [];
		option['pacb'] = () => {
			//複数非同期・全終了後コールバック
			// プレビュー表示
			this.box[fue_id]['bData'] = bData;
			this._preview(fue_id, 'blob', 'set_file_path', option);
		}
		
		// 複数非同期・全終了後コールバック・初期化
		this._cbAsynsEndInit(fps.length,option);

		// 中間ディレクトリパス
		var midway_dp = '';
		if(option['midway_dp']) midway_dp = option['midway_dp'];
		
		// ファイルをXHRでプリロードする
		for(var i in fps){
			var fp = midway_dp + fps[i];
			this._preloadByXhr(fp,bData);
		}
	}
	
	
	
	/**
	 * XHRによってファイルをプリロードする Preloaded by XHR
	 * @param string fp ファイルパス
	 * @param array bData BLOB関連データ
	 */
	_preloadByXhr(fp,bData){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', fp, true);
		xhr.responseType = 'blob';
		xhr.onload = (e) => {
			
			if(e.currentTarget.status == '404'){
				throw new Error('ファイルが見つかりません。パスを確認してください。');
			} 
			
			// プリロードのonloadイベント処理： ファイル関連情報をbDataにセットする。
			this._xhrOnload(e,xhr,bData);

		};
		xhr.send();
	}
	
	/**
	 * プリロードのonloadイベント処理： ファイル関連情報をbDataにセットする。
	 * @param object e onloadイベント
	 * @param XMLHttpRequest xhr
	 * @param array bData BLOB関連データ
	 */
	_xhrOnload(e,xhr,bData){
		// Blobを取得する
		var blob = e.target.response;
		
		var r_url = e.target.responseURL;
		var fn = this._stringRightRev(r_url,'/');

		var mime_type = xhr.getResponseHeader("Content-Type");
		var size = xhr.getResponseHeader("Content-Length");
		var server = xhr.getResponseHeader("server");
		var modified = xhr.getResponseHeader("Last-Modified");
		
		
		var bEnt = {
				'fn':fn,
				'mime_type':mime_type,
				'size':size,
				'modified':modified,
				'blob':blob
		};
		
		bData.push(bEnt);

		// 複数非同期・全終了後コールバック・アクション
		this._cbAsynsEndAction('exe1');
	}
	
	
	/**
	 * 親ラベル要素にいくつかの関連要素を追加する。
	 * @param jQuery parLabel 親ラベル要素
	 * @param int fue_id FU要素ID
	 * @param object box データボックス
	 */
	_addRelatedElements(parLabel,fue_id,box){
		
		
		
		let html = `
			<div class='fuk_box1'>
				<div class='fuk_preview' style='display:inline-block'></div>
				<div class='fuk_clear_btn_w'>
					<input type='button' value='Clear' class='btn btn-secondary btn-sm fuk_clear_btn' data-fue-id='${fue_id}' />
				</div>
			</div>
		`;
		
		parLabel.append(html);
		
	}
	
	
	/**
	 * 関連要素にCSSスタイルを適用する
	 * 
	 * @param int fue_id FU要素ID
	 */
	_applyStyle(fue_id){
		if(!(this.param.style_flg)) return;
		
		var parLabel = this._getElement(fue_id,'label'); // 親ラベル要素
		parLabel.addClass('fuk'); // CSSスタイルの適用
		
	}
	
	
	/**
	 * プレビュー表示
	 * @param string fue_id ファイルアップロード要素のid属性
	 * @param bin_type 'files' or 'blob'
	 * @param comefrom 出身コード dnd:ドラッグ＆ドロップ, change:ファイル選択, set_file_path:ファイルパスのセット
	 * @param object option オプション（addEventメソッドの引数と同じ）
	 *  -  BLOBフラグ ファイル初期表示から呼び出し時はtrue
	 */
	_preview(fue_id, bin_type, comeform, option){

		this.active_fue_id = fue_id;
		
		var files = null;
		var bData = null;
		var fileData = [];
		if(bin_type == 'files'){
			// filesからファイル名などのファイルデータを取得する
			var files = this.box[fue_id]['files'];
			fileData = this._getFileDataFromFiles(files);
			
		}else if(bin_type == 'blob'){
			// BLOBの関連データからファイルデータを取得する
			bData = this.box[fue_id]['bData'];
			fileData = this._getFileDataFromBData(bData);
		}else{
			throw new Error("Unknown 'bin_type'");
		}
		
		if(this._checkFnsEmpty(fileData)) return; // ファイルデータ中のファイル名がすべて空であるなら中断。
		
		// 親ラベル要素を内部要素に合わせてフィットさせるため幅をautoにする。
		var parLbl = this._getElement(fue_id,'label');
		parLbl.css({'width':'auto','height':'auto'});
		

		// クリアボタンを表示する
		var clearBtnW = this._getElement(fue_id,'clear_btn_w');
		clearBtnW.show();
		
		// バリデーション確認
		fileData = this._validCheck(fue_id, fileData, comeform); 
		this.box[fue_id]['fileData'] = fileData;
		
		
		var preview_html = ''; // プレビューHTML
		
		// ファイルユニットHTMLを作成して、プレビューHTMLに連結する。
		for(var i in fileData){
			var fEnt = fileData[i];
			preview_html += this._makeFileUnitHtml(fue_id,fEnt,option); 
		}
		
		// プレビュー区分要素にプレビューHTMLをセットする。
		var prvElm = this._getElement(fue_id,'preview');
		if(prvElm[0]) prvElm.html(preview_html);
		
		// リソースプレビュー要素を取得する。リソースプレビュー要素はプレビュー区分要素内に複数存在するDIV要素群のこと。
		var rpElms = {}; // リソースプレビュー要素リスト
		prvElm.children('div').each((i,elm)=>{
			elm = jQuery(elm);
			var rpElm = elm.find('.fuk_rp');
			if(rpElm[0]){
				rpElms[i] = rpElm;
				
			}else{
				rpElms[i] = null;
			}
		});
		
		// ファイルデータのフィルタリング：0サイズとバリデーションエラーのエンティティを取り除く。
		fileData = this._filteringFileData(fileData,rpElms);
		
		if(bin_type == 'files'){
			// プレビュー後コールバックアクションの初期化
			this._cbAsynsEndInit(fileData.length,option);
		
			// リソース（画像など）をリソースプレビュー要素に表示させる。（非同期処理あり）
			for(var i in fileData){
	
				var fEnt = fileData[i];
				var index = fEnt.index;
				var file = files[index];
				
				// リソース（ファイル）のレンダリングを行い、リソースプレビュー要素に画像などを表示する。
				this._setupRender(file,rpElms,index);
	
			}
			
			this._cbAsynsEndAction('exe2'); // プレビュー後コールバックアクション：制御と実行2
		
		}else if(bin_type == 'blob'){
			// リソース（画像など）をリソースプレビュー要素に表示させる。
			for(var i in fileData){
				var fEnt = fileData[i];
				var index = fEnt.index;
				var blob = bData[index]['blob'];
				var blob_url = window.URL.createObjectURL(blob);
				var rpElm = rpElms[index];
				rpElm.attr('src',blob_url);
	
			}
			
			this._cbAsynsEndAction('exe2'); // プレビュー後コールバックアクション：制御と実行2
		}
	}
	
	/**
	 * ファイルデータ中のファイル名がすべて空であるか？
	 * @reutrn false:空でないファイル名が存在 , true:すべてのファイル名が空である
	 */
	_checkFnsEmpty(fileData){
		
		for(var i in fileData){
			var fEnt = fileData[i];
			if(fEnt.fn){
				return false; // false:空でないファイル名が存在
			}
		}
		
		return true; //  true:すべてのファイル名が空である
		
	}
	
	
	/**
	 * ファイルデータのフィルタリング：0サイズとバリデーションエラーのエンティティを取り除く。
	 * @param array fileData ファイルデータ
	 * @param array rpElms リソースプレビュー要素リスト
	 * @return array フィルタリング後のファイルデータ
	 */
	_filteringFileData(fileData,rpElms){
		var fileData2 = [];
		
		for(var i in fileData){
			if(rpElms[i]==null) continue;
			var fEnt = fileData[i];

			if(fEnt.err_flg == true) continue;
			if(fEnt.size == null || fEnt.size == 0) continue;
			
			fEnt['index'] = i;
			
			fileData2.push(fEnt);

		}
		
		return fileData2;
	}
	
	
	/**
	 * リソース（ファイル）のレンダリングを行い、リソースプレビュー要素に画像などを表示する。
	 * @param object file ファイルデータ
	 * @param array rpElms リソースプレビュー要素群
	 * @param int i インデックス
	 */
	_setupRender(file,rpElms,i){
		var reader = new FileReader();
		reader.readAsDataURL(file);
		
		// After conversion of the event.
		reader.onload = (evt) => {

			var rpElm = rpElms[i];
			rpElm.attr('src',reader.result);
			
			this._cbAsynsEndAction('exe1'); // プレビュー後コールバックアクション：制御と実行1
		}
	}
	
	
	/**
	 * filesからファイル名などのファイルデータを取得する
	 * 
	 * @note
	 * サイズ0のファイルデータは取得しない。
	 * 
	 * @param array アップロードファイルリスト
	 * @return array ファイルデータ
	 */
	_getFileDataFromFiles(files){
		
		var fileData = []; // ファイルデータ
		
		for(var i in files){
			var file = files[i];
			if(file.size == null) continue;
			var fEnt = {};
			
			// MIME
			var mime = file.type; 
			fEnt['mime'] = mime;
			
			// MIMEからファイル種別を判別する。
			var file_type = '';
			if(mime != null){
				if(mime.indexOf('image') >= 0) file_type = 'image';
				if(mime.indexOf('audio') >= 0) file_type = 'audio';
				//if(mime.indexOf('video') >= 0) file_type = 'video';
			}
			fEnt['file_type'] = file_type;
			
			// ファイル名
			var fn = ''; 
			if(file.name != null) fn = file.name;
			fEnt['fn'] = fn;
			
			// サイズ
			fEnt['size'] = file.size;
			
			// 単位表示付きサイズ
			var size_str = 0; // サイズ（ファイル容量）
			if(file.size != null) size_str = file.size;
			if(!isNaN(size_str)){
				size_str = this._convSizeUnit(size_str); // 単位付き表示に変換
			}
			fEnt['size_str'] = size_str;
			
			// 更新日
			var modified = ''; 
			if(file.lastModifiedDate != null){
				modified = file.lastModifiedDate.toLocaleString();
			}
			fEnt['modified'] = modified;
			
			fileData.push(fEnt);

		}
		
		return fileData;
		
	}
	
	
	/**
	 * bDataからファイル名などのファイルデータを取得する
	 * 
	 * @note
	 * サイズ0のファイルデータは取得しない。
	 * 
	 * @param array アップロードファイルリスト
	 * @return array ファイルデータ
	 */
	_getFileDataFromBData(bData){
		
		var fileData = []; // ファイルデータ
		
		for(var i in bData){
			var bEnt = bData[i];
			if(bEnt.size == null || bEnt == 0) continue;
			var fEnt = {};
			
			// MIME
			fEnt['mime'] = bEnt.mime_type;
			
			// MIMEからファイル種別を判別する。
			var file_type = '';
			if(fEnt.mime != null){
				if(fEnt.mime.indexOf('image') >= 0) file_type = 'image';
				if(fEnt.mime.indexOf('audio') >= 0) file_type = 'audio';
				//if(fEnt.mime.indexOf('video') >= 0) file_type = 'video';
			}
			fEnt['file_type'] = file_type;
			
			// ファイル名
			fEnt['fn'] = bEnt.fn;
			
			// サイズ
			fEnt['size'] = bEnt.size;
			
			// 単位表示付きサイズ
			var size_str = 0; // サイズ（ファイル容量）
			if(bEnt.size != null) size_str = bEnt.size;
			if(!isNaN(size_str)){
				size_str = this._convSizeUnit(size_str); // 単位付き表示に変換
			}
			fEnt['size_str'] = size_str;
			
			// 更新日
			var modified = ''; 
			if(bEnt.modified != null){
				modified = new Date(modified).toLocaleString();
			}
			fEnt['modified'] = modified;
			
			fileData.push(fEnt);

		}
		
		return fileData;
		
	}
	
	/**
	 * バリデーション確認
	 * @param string fue_id ファイルアプロード要素のID属性値
	 * @param fileData ファイルデータ
	 * @param comefrom 出身コード
	 * @return エラーフラグをセットしたファイルデータ
	 */
	_validCheck(fue_id,fileData, comefrom){

		if(fue_id == null) return fileData;
		
		var validData = this.box[fue_id]['validData']; // バリデーションデータ
		var validExts = validData.validExts; // バリデーション拡張子リスト

		// バリデーション実行フラグ
		var valid_flg = true;
		if(validExts == null || validExts == 0) valid_flg = false;

		for(var i in fileData){
			var fEnt = fileData[i];

			// 出身コードがファイルパスのセットであるなら、バリデーション対象外
			if(comefrom == 'set_file_path'){
				fEnt['err_flg'] = false;
				continue;
			}

			// バリデーション実行フラグがOFFならチェックをしない。
			if(valid_flg == false){
				fEnt['err_flg'] = false;
				continue;
			}

			var fn = fEnt.fn;
			
			// ファイル名が空である場合
			if(fn == '' || fn == null){
				fEnt['err_flg'] = true;
				fEnt['err_msg'] = 'ファイル名が空です。';
				fEnt['fn_empty'] = true;
				continue;
			}
			
			var ext = this._getExtension(fEnt.fn);// ファイル名から拡張子を取得する。

			// 拡張子チェック
			var res = validExts.indexOf(ext);

			if(res == -1){ // 対象外の拡張子である場合
				fEnt['err_flg'] = true;
				fEnt['err_msg'] = fn + 'の拡張子は対象外です。';
				continue;
			}else{
				fEnt['err_flg'] = false;
			}
			
			// MIMEチェック
			fEnt = this._validCheckMime(fue_id,fEnt);
			
			// 最大容量チェック
			let size = Number(fEnt['size']);
			let max_size = Number(validData['max_size']);
			if(size > max_size){
				fEnt['err_flg'] = true;
				let max_size_str = this._convSizeUnit(max_size, 0);
				fEnt['err_msg'] = `ファイルサイズが制限を超えています。(最大${max_size_str}まで)`;
			}else{
				fEnt['err_flg'] = false;
			}
			
		}
		
		return fileData;
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
	 * MIMEチェック
	 * @param string fue_id
	 * @param object fEnt
	 * @return fEnt
	 */
	_validCheckMime(fue_id,fEnt){
		
		if(this.param.valid_mime_flg == 0) return fEnt;
		if(fEnt.err_flg == true) return fEnt;
		
		var validData = this.box[fue_id]['validData']; // バリデーションデータ
		var validMimes = validData.validMimes; // バリデーションMIMEリスト
		
		var mime = fEnt.mime;
		
		// チェック
		var res = validMimes.indexOf(mime);
		if(res == -1){ // 対象外のMIMEである場合
			fEnt['err_flg'] = true;
			fEnt['err_msg'] = fEnt.fn + 'のMIME(' + mime + ')は対象外です。';
		}else{
			fEnt['err_flg'] = false;
		}
		return fEnt;
	}
	
	
	
	/**
	 * ファイルユニットHTML
	 * @param int fue_if FU要素ID
	 * @param array fEnt ファイルエンティティ
	 * @param object option オプション（addEventメソッドの引数と同じ）
	 * @return string プレビューユニットHTML
	 */
	_makeFileUnitHtml(fue_id,fEnt,option){

		var p_unit_html = ""; // プレビューユニットHTML
		
		// エラーである場合
		if(fEnt.err_flg == true){
			p_unit_html = "<div class='fuk_err_msg'>" + fEnt.err_msg + "</div>";
			p_unit_html = "<div class='fuk_file_unit' >" + p_unit_html + '</div>';
			return p_unit_html;
		}

		// 画像要素と音楽要素の作成
		if(fEnt.file_type == 'image'){
			p_unit_html += "<img src='' class='fuk_rp' style='width:100%;height:100%' />";
		}else if(fEnt.file_type == 'audio'){
			p_unit_html += "<audio src='' class='fuk_rp' controls />";
		}

		var adf = this.param.adf;// 付属データフラグリスト
	
		// 通常パラメータの表示
		var paramData = [
			{'label':'ファイル名','val':fEnt.fn,'flg':adf.fn_flg},
			{'label':'サイズ','val':fEnt.size_str,'flg':adf.size_flg},
			{'label':'MIME','val':fEnt.mime,'flg':adf.mime_flg},
			{'label':'更新日','val':fEnt.modified,'flg':adf.modified_flg},
		];
		
		let params_html = '';

		// パラメータ区分のHTMLを組み立てる
		for(var i in paramData){
			var pEnt = paramData[i];
			if(pEnt.flg != 1) continue;
			params_html += 
				`
					<div><label class='fuk_param_label'>${pEnt.label}</label>
					<val class='fuk_param_val'>${pEnt.val}</val></div>
				`;

		}

		p_unit_html = `
			<div class='fuk_file_unit' >
				<div class='fuk_file_view'>${p_unit_html}</div>
				<div class='fuk_params'>${params_html}</div>
			</div>
			`;

		return p_unit_html;
		
	}
	
	/**
	 * プレビュー画像サイズを取得
	 * @return プレビュー画像サイズ
	 */
	_getImgSize(fue_id,option){
		
		var width = 0;
		var height = 0;
		
		if(option['img_width']){
			width = option['img_width'];
		}else if(this.param['img_width']){
			width = this.param['img_width'];
		}else if(this.box[fue_id]['label_width']){
			width = this.box[fue_id]['label_width'];
		}else{
			width = 160;
		}
		
		if(option['img_height']){
			height = option['img_height'];
		}else if(this.param['img_height']){
			height = this.param['img_height'];
		}else if(this.box[fue_id]['label_height']){
			height = this.box[fue_id]['label_height'];
		}else{
			height = 160;
		}
		
		var imgSize ={'width':width,'height':height};
		return imgSize;
		
	}
	
	
	
	
	/**
	 * クリアボタンのクリックイベント
	 */
	_clearBtnClick(e){
		
		// クリアボタン要素を取得、そのクリアボタン要素から要素ID(fue_id)を取得。ついでにクリアボタンも隠す。
		var clickBtn = jQuery(e.currentTarget);
		var fue_id = clickBtn.attr('data-fue-id');

		this._clearBtnAction(fue_id);
		
	}
	
	/**
	 * クリアボタンアクション
	 * @param string fue_id file要素のid属性
	 */
	_clearBtnAction(fue_id){
		// クリアボタンラッパー要素を隠す
		var clearBtnW = this._getElement(fue_id,'clear_btn_w');
		clearBtnW.hide();
		
		// FU要素を取得し、中身をクリアする。
		var fue = this._getElement(fue_id,'fue');
		fue.val('');
		fue.attr('data-fp', ''); // 既存も空にする

		// 初期メッセージ要素を再表示する。
		var fukMsg = this._getElement(fue_id,'fuk_msg');
		fukMsg.show();
		
		// プレビュー要素を取得し、中身をクリアする。
		var preview = this._getElement(fue_id,'preview');
		preview.html('');

		var parLbl = this._getElement(fue_id,'label');
		parLbl.css({'width':'100%','height':'100%'});

		// ファイルデータもクリアする。
		this.box[fue_id]['fileData'] = [];
	}
	
	/**
	 * 複数非同期・全終了後コールバック・初期化
	 * @param int count 非同期処理の件数
	 * @param object option 
	 *  - pacb ファイルプレビュー後コールバック
	 *  - pacb_param コールバックパラメータ 
	 */
	_cbAsynsEndInit(count,option){

		var pacb = function(){};
		if(option['pacb'] != null) pacb = option['pacb'];
		
		var pacb_param = {};
		if(option['pacb_param'] != null) pacb_param = option['pacb_param'];
		
		this.cbAsynsEndData = {
			'index':0,
			'count':count,
			'callback':pacb,
			'cbParam':pacb_param,
		};
		
	}
	
	/**
	 * 複数非同期・全終了後コールバック
	 * @note
	 * 複数の非同期処理がすべて終了したらコールバックを実行する。
	 * 
	 * @param string action アクションコード
	 *  - exe1 非同期処理がすべて終了したらコールバック関数を実行する。
	 *  - exe2 非同期処理が0件であるならコールバック関数を実行する。
	 * @param string fue_id FU要素のID属性
	 */
	_cbAsynsEndAction(action){
		switch (action) {
		case 'exe1':

			var cbAsynsEndData = this.cbAsynsEndData;
			if(cbAsynsEndData.index == cbAsynsEndData.count -1){
				if(cbAsynsEndData.callback != null){
					cbAsynsEndData.callback(this.active_fue_id,this.box,cbAsynsEndData.cbParam);
					this._endPreview();
				}
			}else{
				cbAsynsEndData.index ++;
			}
			break;

		case 'exe2':

			
			var cbAsynsEndData = this.cbAsynsEndData;
			if(cbAsynsEndData.count == 0){
				if(cbAsynsEndData.callback != null) {
					cbAsynsEndData.callback(this.active_fue_id,this.box,cbAsynsEndData.cbParam);
					this._endPreview();
				}
				
			}
			
			break;
		}
	}
	

	/**
	 * プレビュー最後の処理
	 */
	_endPreview(){

		// 初期メッセージ要素を隠す。
		var fukMsgElm = this._getElement(this.active_fue_id,'fuk_msg');
		fukMsgElm.hide();
		
	}
	
	
	/**
	 * AJAXによるアップロード
	 * 
	 * @param callback(res) ファイルアップロード後コールバック
	 * @param withData 一緒に送るデータ
	 * @param option 未使用
	 */
	uploadByAjax(callback,withData,option){

		var param = this.param;
	
		var fd = new FormData();
		
		var index = 0;
		for(var fu_id in this.box){
			var files = this.box[fu_id]['files'];
			var fileData = this.box[fu_id]['fileData'];
			for(var i in fileData){
				var fEnt = fileData[i];
				if(fEnt.err_flg == false){
					fd.append(index, files[i]);
					index ++;
				}
			}
		}

		// ファイル情報と一緒に送信するデータをセットする
		withData = this._escapeForAjax(withData); // Ajax送信データ用エスケープ
		var with_json = JSON.stringify(withData);
		fd.append( "key1", with_json );
	
		var prog1 = null; // 進捗バー要素
		if (param.prog_slt) prog1 = this.unit.find(param.prog_slt);
		
		
		// AJAXによるファイルアップロード
		jQuery.ajax({
			type: "POST",
			url: param.ajax_url,
			data: fd,
			cache: false,
			dataType: "text",
			processData : false,
			contentType : false,
			xhr : () => { // 進捗イベント
				var XHR = jQuery.ajaxSettings.xhr();
				if (XHR.upload) {
					XHR.upload.addEventListener('progress',
							(e) => {
								if(prog1){
									var prog_value = parseInt(e.loaded / e.total * 10000) / 100;
									prog1.val(prog_value);
								}
							}, false);
				}
				return XHR;
			},
	
		})
		.done((str_json, type) => {
			var res;
			try{
				res =jQuery.parseJSON(str_json);//パース
			}catch(e){
				jQuery(this.param.err_slt).html(str_json);
				return;
			}
			
			callback(res); // レスポンス出力
			
			
		})
		.fail((jqXHR, statusText, errorThrown) => {
			
			var err_res = jqXHR.responseText;
			console.log(err_res);
			jQuery(this.param.err_slt).html(err_res);
			alert(statusText);
		});
	}
	
	
	/**
	 * ファイル群のパラメータデータを取得する
	 * @return object ファイル群のパラメータデータ
	 */
	getFileParams(){
		
		var pData = [];
		for(var fu_id in this.box){
			var files = this.box[fu_id]['files'];
			var pEnt = {};
			for(var i in files){
				
				var file = files[i];
				if(file.size == null) continue;
				
				pEnt['fu_id'] = fu_id;
				pEnt['name'] = file.name;
				pEnt['size'] = file.size;
				pEnt['mime'] = file.type;
				pEnt['modified'] = file.lastModifiedDate.toLocaleString();
				
				pData.push(pEnt);
			}
		}
		return pData;
	}
	
	
	/**
	 * ファイルアップロード関連の要素を引数を指定して取得する
	 * @param fue_id ファイルアップロード要素のid属性
	 * @param key 要素を指定するキー　label,file,fuk_msg,preview
	 * @return jQuery 要素
	 */
	_getElement(fue_id,key){
		
		var box = this.box; // データボックス
		
		if(box[fue_id] == null) box[fue_id] = {};
		
		// ファイル要素を取得
		if(key == 'fue'){
			var elm = null;
			if(box[fue_id]['fue']){
				elm = box[fue_id]['fue'];
			}else{
				elm = this.unit.find('#' + fue_id);
				box[fue_id]['fue'] = elm;
			}
			return elm; 
		}
		
		// 親ラベル要素を取得。ついでにラベル幅も取得。
		else if(key == 'label'){
			var elm = null;
			if(box[fue_id]['label']){
				elm = box[fue_id]['label'];
			}else{
				var fileElm = this._getElement(fue_id,'fue');
				if(fileElm == null) return null;
				elm = fileElm.parents('label');
				box[fue_id]['label'] = elm;
				

			}
			return elm; 
		}
		
		// 初期メッセージ要素を取得
		else if(key == 'fuk_msg'){
			var elm = null;
			if(box[fue_id]['fuk_msg']){
				elm = box[fue_id]['fuk_msg'];
			}else{
				var label = this._getElement(fue_id,'label');
				if(label == null) return null;
				elm = label.find('.fuk_msg');
				box[fue_id]['fuk_msg'] = elm;
			}
			return elm; 
		}
		
		// プレビュー要素を取得
		else if(key == 'preview'){
			var elm = null;
			if(box[fue_id]['preview']){
				elm = box[fue_id]['preview'];
			}else{
				var label = this._getElement(fue_id,'label');
				if(label == null) return null;
				elm = label.find('.fuk_preview');
				box[fue_id]['preview'] = elm;
			}
			return elm; 
		}
		
		// クリアボタン要素を取得
		else if(key == 'clear_btn'){
			var elm = null;
			if(box[fue_id]['clear_btn']){
				elm = box[fue_id]['clear_btn'];
			}else{
				var label = this._getElement(fue_id,'label');
				if(label == null) return null;
				elm = label.find('.fuk_clear_btn');
				box[fue_id]['clear_btn'] = elm;
			}
			return elm; 
		}
		
		// クリアボタンラッパー要素を取得
		else if(key == 'clear_btn_w'){
			var elm = null;
			if(box[fue_id]['clear_btn_w']){
				elm = box[fue_id]['clear_btn_w'];
			}else{
				var label = this._getElement(fue_id,'label');
				if(label == null) return null;
				elm = label.find('.fuk_clear_btn_w');
				box[fue_id]['clear_btn_w'] = elm;
			}
			return elm; 
		}
		
		return null;

	}
	
	/**
	 * 各要素から値を取ってきてデータボックスにセットする。
	 * 
	 * @param int fue_id FU要素ID
	 * @param object box データボックス
	 * @param object option
	 *  - valid_ext バリデーション拡張子
	 * @return データボックス
	 */
	_setToBox(fue_id,box,option){
		if(option == null) option = {};
		
		var bEnt = {};
		if(box[fue_id]) bEnt = box[fue_id];
		
		// 親ラベル要素から幅を取得してセット
		var parLebel = this._getElement(fue_id,'label'); // 親ラベル要素
		bEnt['label_width'] = parLebel.width(); 
		bEnt['label_height'] = parLebel.height(); 
		
		// バリデーション情報をセットする
		if(option['valid_ext'] == null){
			bEnt['validData'] = this.param.validData;
		}else{
			bEnt['validData'] = this._createValidData(option.valid_ext);
		}

		box[fue_id] = bEnt;
		
		return box;
	}
	
	
	
	
	/**
	 * 容量サイズの数値を適切な単位表示に変換する（Byte,KB,MB,GB,TB)
	 * @param int value1 入力数値
	 * @param int n 小数点以下の桁（四捨五入）
	 * @returns string 単位表示
	 */
	_convSizeUnit(value1,n){
		
		if(n == null) n=1;
	
		var res = '';
		if(value1 < 1000){
			res = value1 + 'Byte';
		}else if(value1 < Math.pow(10,6)){
			value1 = Math.round( value1  * Math.pow(10,n - 3) ) / Math.pow(10,n); // 四捨五入
			res = value1 + 'KB';
		}else if(value1 < Math.pow(10,9)){
			value1 = Math.round( value1  * Math.pow(10,n - 6) ) / Math.pow(10,n);
			res = value1 + 'MB';
		}else if(value1 < Math.pow(10,12)){
			value1 = Math.round( value1  * Math.pow(10,n - 9) ) / Math.pow(10,n);
			res = value1 + 'GB';
		}else{
			value1 = Math.round( value1  * Math.pow(10,n - 12) ) / Math.pow(10,n);
			res = value1 + 'TB';
		}
		return res;
	}
	
	
	/**
	 * バリデーション情報を作成する。
	 * @param string valid_ext バリデーション拡張子
	 * @param int max_size 最大容量
	 * @return object バリデーション情報
	 */
	_createValidData(valid_ext, max_size){
		
		if(max_size == null) max_size = this.param.max_size;

		var validData = {
				'validExts':[],
				'validMimes':[],
		}
		
		if (valid_ext == null || valid_ext == '') return validData;
		
		var validExts = []; // バリデーション拡張子リスト
		
		// バリデーション拡張子が配列型である場合
		if(Array.isArray(valid_ext)){
			validExts = valid_ext;
		}
		
		else if(valid_ext == 'image'){
			validExts = ['jpg','jpeg','png','gif','bpg'];
		}
		
		else if(valid_ext == 'audio'){
			validExts = ['mp3','wav'];
		}
		
		else if(valid_ext == 'video'){
			validExts = ['mp4','avi','mov','webm'];
		}
		
		else if(valid_ext == 'often_use'){
			validExts = [
				'pdf',
				'jpg','jpeg','png','gif','bpg', 'tif', 'tiff',
				'zip','lzh', 'tar',
				'xls', 'xlsx', 'doc', 'docx',
				'txt', 'csv', 'xml', 
				'mp3', 'wav','ogg', 'm4a',
				'avi', 'mp4', 'mpg',
				'ppt', 'pptx', 
				'mdb', 'accdb',  
				];
		}
		
		// バリデーション拡張子が文字列型である場合
		else{
			validExts = valid_ext.split(',');
		}

		// トリミング
		for(var i in validExts){
			validExts[i] = validExts[i].trim();
		}
		
		// 重複を除く
		validExts = this._array_unique(validExts);
		
		// バリデーションMIMEを取得
		var validMimes = this._getValidMimes(validExts);
		
		validData['validExts'] = validExts;
		validData['validMimes'] = validMimes;
		validData['max_size'] = max_size;
		
		return validData;

	}
	
	/**
	* 配列から重複を除去する
	*/
	_array_unique(ary){
		var ary2= ary.filter(function (x, i, self) {
			return self.indexOf(x) === i;
		});
		
		return ary2;
	}
	
	/**
	 * バリデーションMIMEを取得
	 * @param array validExts バリデーション拡張子
	 * @return バリデーションMIME
	 */
	_getValidMimes(validExts){

		var mimeMap = this.mimeMap;// MIMEマッピングデータ

		var validMimes = [];// バリデーションMIME
		
		//  MIMEマッピングデータから拡張子に紐づくMIMEをバリデーションMIMEにセットする。
		for(var i in validExts){
			var ext = validExts[i];
			var mime = '';
			if(mimeMap[ext] != null) mime = mimeMap[ext];
			validMimes.push(mime);
		}
		
		return validMimes;
	}
	
	
	/**
	 * ファイル名リストを取得
	 * @param int fue_id ファイル要素のID属性値（省略可）
	 * @return array ファイル名リスト
	 */
	getFileNames(fue_id){
		
		var fns = [];
		if(fue_id == null){
			for(var fue_id in this.box){
				var fileData = this.box[fue_id]['fileData'];
				for(var i in fileData){
					var fEnt = fileData[i];
					fns.push(fEnt.fn);
				}
			}
		}else{
			var fileData = this.box[fue_id]['fileData'];
			for(var i in fileData){
				var fEnt = fileData[i];
				fns.push(fEnt.fn);
			}
		}
		return fns;
	}
	
	
	
	/**
	 * MIMEマッピングデータを取得
	 */
	_getMimeMapping(){
		
		var map = {};
		
		map['aac'] = 'audio/aac';
		map['abw'] = 'application/x-abiword';
		map['arc'] = 'application/octet-stream';
		map['avi'] = 'video/x-msvideo';
		map['azw'] = 'application/vnd.amazon.ebook';
		map['bin'] = 'application/octet-stream';
		map['bmp'] = 'image/bmp';
		map['bpg'] = 'image/bpg';
		map['bz'] = 'application/x-bzip';
		map['bz2'] = 'application/x-bzip2';
		map['csh'] = 'application/x-csh';
		map['css'] = 'text/css';
		map['csv'] = 'text/csv';
		map['doc'] = 'application/msword';
		map['docx'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
		map['eot'] = 'application/vnd.ms-fontobject';
		map['epub'] = 'application/epub+zip';
		map['es'] = 'application/ecmascript';
		map['gif'] = 'image/gif';
		map['htm'] = 'text/html';
		map['html'] = 'text/html';
		map['ico'] = 'image/x-icon';
		map['ics'] = 'text/calendar';
		map['jar'] = 'application/java-archive';
		map['jpeg'] = 'image/jpeg';
		map['jpg'] = 'image/jpeg';
		map['js'] = 'application/javascript';
		map['json'] = 'application/json';
		map['mid'] = 'audio/midi audio/x-midi';
		map['midi'] = 'audio/midi audio/x-midi';
		map['mp3'] = 'audio/mp3';
		map['mpeg'] = 'video/mpeg';
		map['mpkg'] = 'application/vnd.apple.installer+xml';
		map['odp'] = 'application/vnd.oasis.opendocument.presentation';
		map['ods'] = 'application/vnd.oasis.opendocument.spreadsheet';
		map['odt'] = 'application/vnd.oasis.opendocument.text';
		map['oga'] = 'audio/ogg';
		map['ogv'] = 'video/ogg';
		map['ogx'] = 'application/ogg';
		map['otf'] = 'font/otf';
		map['png'] = 'image/png';
		map['pdf'] = 'application/pdf';
		map['ppt'] = 'application/vnd.ms-powerpoint';
		map['pptx'] = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
		map['rar'] = 'application/x-rar-compressed';
		map['rtf'] = 'application/rtf';
		map['sh'] = 'application/x-sh';
		map['svg'] = 'image/svg+xml';
		map['swf'] = 'application/x-shockwave-flash';
		map['tar'] = 'application/x-tar';
		map['tif'] = 'image/tiff';
		map['tiff'] = 'image/tiff';
		map['ts'] = 'application/typescript';
		map['ttf'] = 'font/ttf';
		map['vsd'] = 'application/vnd.visio';
		map['wav'] = 'audio/wav';
		map['weba'] = 'audio/webm';
		map['webm'] = 'video/webm';
		map['webp'] = 'image/webp';
		map['woff'] = 'font/woff';
		map['woff2'] = 'font/woff2';
		map['xhtml'] = 'application/xhtml+xml';
		map['xls'] = 'application/vnd.ms-excel';
		map['xlsx'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
		map['xml'] = 'application/xml';
		map['xul'] = 'application/vnd.mozilla.xul+xml';
		map['zip'] = 'application/zip';
		map['3gp'] = 'video/3gpp';
		map['3g2'] = 'video/3gpp2';
		map['7z'] = 'application/x-7z-compressed';
		
		return map;
	}

	
	
	
	/**
	 * Ajax送信データ用エスケープ。実体参照（&lt; &gt; &amp; &）を記号に戻す。
	 * 
	 * @param any data エスケープ対象 :文字列、オブジェクト、配列を指定可
	 * @returns エスケープ後
	 */
	_escapeForAjax(data){
		if (typeof data == 'string'){
			if ( data.indexOf('&') != -1) {
				data = data.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
				return encodeURIComponent(data);
			}else{
				return data;
			}
		}else if (typeof data == 'object'){
			for(var i in data){
				data[i] = this._escapeForAjax(data[i]);
			}
			return data;
		}else{
			return data;
		}
	}
	
	/**
	 * 文字列を右側から印文字を検索し、右側の文字を切り出す。
	 * @param s 対象文字列
	 * @param mark 印文字
	 * @return 印文字から右側の文字列
	 */
	_stringRightRev(s,mark){
		if (s==null || s==""){
			return s;
		}
		
		var a=s.lastIndexOf(mark);
		var s2=s.substring(a+mark.length,s.length);
		return s2;
	}
	

}