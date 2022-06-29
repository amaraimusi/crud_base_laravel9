/**
 * CrudBase・ファイルアップロードコンポーネント | CrudBase File Upload Component
 * 
 * @note
 * CurdBase.jsのコンポーネントの一つ
 * 
 * @date 2018-8-24 | 2021-6-11
 * @version 1.2.2
 * @history
 * 2019-2-13 v1.2.0 経由パス関連を廃止
 * 2018-10-9 v1.1.3 経由ディレクトリパスに対応
 * 2018-9-19 v1.1.2 ファイルアップロード機能：DnDに対応
 * 2018-9-18 v1.1.1 コールバックパラメータを追加（pacb_param)
 * 2018-9-17 v1.1.0 画像ファイルが空の時に新規登録すると2行目のサムネイル画像が表示される
 * 2018-8-24 v1.0.0 開発
 * 
 */
class CbFileUploadComponent{
	
	
	/**
	 * コンストラクタ
	 * 
	 * @param param fuIds file要素idリスト
	 * @param {} param FileUploadK::コンストラクタのparam
	 * @param {} option FileUploadK:addEventのoption
	 * 
	 */
	constructor(fuIds,param, option){

		this.fileUploadK = this._factoryFileUploadK(fuIds, param, option); // 拡張ファイルアップロード・オブジェクト
		
		this.fuIds = fuIds; // file要素idリスト
		this.fields = this._fueIdsToFields(fuIds); // FUフィールドリスト
		this.none_img_fp = 'img/icon/none.gif';
		
	}
	
	
	/**
	 * file要素idリストからフィールドリストを取得する
	 * @param array fuIds file要素idリスト
	 * @return array フィールドリスト
	 */
	_fueIdsToFields(fuIds){
		
		var fields = [];
		
		for(var i in fuIds){
			var fue_id = fuIds[i];
			var field = this._fudIdToField(fue_id); // file要素idからフィールドに変換する。
			fields.push(field);
		}
		
		fields = this._array_unique(fields); // 重複を除去する

		return fields;
	}
	
	/**
	 * file要素idからフィールドに変換する
	 * @param string fue_id file要素ID
	 * @return string フィールド
	 */
	_fudIdToField(fue_id){
		
		var field = fue_id; // フィールド
		if(fue_id == null) return field;
		if(fue_id.length < 3) return field;
		
		var es2 = field.slice(-2); // ディレクトリパスから末尾の2文字を取得する。
		
		
		if(es2 == '_n' || es2 == '_e'){
			var field = field.substr(0,field.length - 2);
		}
		
		return field;
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
	 * 拡張ファイルアップロード・コンポーネントのファクトリーメソッド
	 * @param array fuIds file要素idリスト
	 * @param {} param FileUploadK::コンストラクタのparam
	 * @param {} option FileUploadK:addEventのoption
	 * @return FileUploadK 拡張ファイルアップロード・コンポーネント
	 */
	_factoryFileUploadK(fuIds, param, option){
		
		if(param['prog_slt'] == null ) param['prog_slt'] = '#prog1';
		if(param['err_slt'] == null ) param['err_slt'] = '#err';
		if(param['valid_ext'] == null ) param['valid_ext'] = 'often_use'; // 一般的な書類の拡張子 jpg,pdf,xlsxなど
		if(param['max_size'] == null ) param['max_size'] = 5000000; // 最大容量5MB
		if(param['img_width'] == null ) param['img_width'] = 120;
		if(param['img_height'] == null ) param['img_height'] = 120;
		
		// 拡張ファイルアップロードクラスの生成
		var fileUploadK = new FileUploadK(param);
		
		// file要素を拡張
		for(var i in fuIds){
			var fue_id = fuIds[i];
			fileUploadK.addEvent(fue_id, option);
		}

		return fileUploadK;
		
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
	 *  - img_width プレビュー画像サイスX　（画像ファイルのみ影響）
	 *  - img_height プレビュー画像サイスY
	 */
	addEvent(fue_id,option){
		return this.fileUploadK.addEvent(fue_id,option);
	}
	
	
	/**
	 * ファイル群のパラメータデータを取得する
	 * @return object ファイル群のパラメータデータ
	 */
	getFileParams(){
		return this.fileUploadK.getFileParams();
	}
	
	
	/**
	 * AJAXによるアップロード
	 * 
	 * @param callback(res) ファイルアップロード後コールバック
	 * @param withData 一緒に送るデータ
	 * @param option 未使用
	 */
	uploadByAjax(callback,withData,option){
		return this.fileUploadK.uploadByAjax(callback,withData,option);
	}
	
	
	/**
	 * ファイル名リストを取得
	 * @param int fue_id ファイル要素のID属性値（省略可）
	 * @return array ファイル名リスト
	 */
	getFileNames(fue_id){
		return this.fileUploadK.getFileNames(fue_id);
	}
	
	
	/**
	 * file要素にファイルパスをセットする
	 * @param string fue_id file要素のid
	 * @param array fps ファイル名リスト（ ファイル名一つを文字列指定可）
	 * @param object option addEventのoptionと同じ
	 */
	setFilePaths(fue_id,fps,option){

		// file要素にファイルパスをセットする
		var res = this.fileUploadK.setFilePaths(fue_id,fps,option);

		return res;

	}
	
	
	/**
	 * 画像をTR要素に表示する
	 * @param jQuery tr TR要素オブジェクト
	 * @param object ent データエンティティ
	 */
	setImageToTr(tr,ent){

		for(var i in this.fields){
			var field = this.fields[i];
			
			// TR要素からLabel要素を取得する。
			var lbl = tr.find("[for='" + field + "']");
			if(!lbl[0]) continue;
			var imgElm = lbl.find('img');
			if(imgElm[0]){
				
				var fp = ent[field]; // ファイル名
				
				// ファイル名が空である場合、空画像パスをセットする。
				if(fp == null || fp == ''){
					imgElm.attr('src',this.none_img_fp);
					var aElm = lbl.find('a');
					if(aElm[0]){
						aElm.attr('href',this.none_img_fp);
					}
					return;
				}
				
				var orig_fp = fp; // オリジナルファイルパス
				var thum_fp = fp.replace('/orig/', '/thum/'); // サムネイルファイルパス

				// IMG要素に画像を表示する。
				var imgObj = new Image();
				imgObj.src = thum_fp;
				imgObj.onload = () => {
					imgElm.attr('src',thum_fp);
				};

				// アンカー要素を取得し、オリジナルファイルパスをセットする。
				var aElm = lbl.find('a');
				if(aElm[0]){
					aElm.attr('href',orig_fp);
				}
				
			}
			
			
		}
			
	}
	
	
	/**
	 * FDにファイルオブジェクトをセットする
	 * @param FileData fd FD
	 * @parma string form_type フォーム種別 :new_inp,edit
	 * @return FileData FD
	 */
	setFilesToFd(fd,form_type){

		var box = this.fileUploadK.box;

		for(var fu_id in box){

			var fieldInfo = this._getFieldInfoFromFuKey(fu_id); // fu_keyからフィールドInfoを取得する
			if(fieldInfo.form_type != form_type) continue;

			var files = box[fu_id]['files']; // FDにセット予定のファイルオブジェクトを取得する
			if(files == null) continue;
			if(files[0] == null) continue;
			
			var fileData = box[fu_id]['fileData']; // エラーチェックのためにフィールドデータを取得 （フィールドデータにはFU要素やDnD由来のMIME,サイズ、ファイル名がセットされている。）
			if(fileData[0] == null) continue;
			var fEnt = fileData[0]; // フィールドエンティティを取得 (単一アップロードなので一行目のみ取得)
			if(fEnt.err_flg == false){ // エラーでない場合
				fd.append(fieldInfo.field, files[0]); // FDにファイルオブジェクトをセットする
			}

		}
		return fd;

	}
	
	/**
	 * fu_keyからフィールドInfoを取得する
	 * @param string fu_id
	 * @return フィールドInfo
	 */
	_getFieldInfoFromFuKey(fu_id){
		
		// フィールドInfoのデフォルト
		var fieldInfo = {
				'fu_id':fu_id,
				'field':fu_id,
				'form_type':'none',
		}
		
		if(fu_id == null || fu_id == '') return fieldInfo;
		if(fu_id.length < 3) return fieldInfo;
		
		var end_str = fu_id.slice(-2); // 末尾の2文字を取得
		if(end_str == '_n'){
			fieldInfo.form_type = 'new_inp';
			fieldInfo.field = fu_id.substr(0,fu_id.length-2); // 末尾の2文字を削る
		}else if(end_str == '_e'){
			fieldInfo.form_type = 'edit';
			fieldInfo.field = fu_id.substr(0,fu_id.length-2);
		}else{
			return fieldInfo;
		}
		
		return fieldInfo;
		
	}
	
	
	
}