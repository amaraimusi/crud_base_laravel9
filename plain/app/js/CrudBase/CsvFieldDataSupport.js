/**
 * CSVフィールドデータ補助クラス
 * 
 * @version 0.9.1
 * @date 2019-6-28 | 2019-8-13
 * @auther kenji uehara
 * @license MIT
 */
class CsvFieldDataSupport{
	
	
	/**
	 * CSVフィールデータの正規化
	 * 
	 * @note
	 * CSVフィールドエンティティ表
	 * - field	フィールド名
	 * - clm_name	列名
	 * - wamei	和名	列名のエイリアス
	 * - clm_alias_names	別名リスト
	 * - req_flg	必須フラグ	CSVインポート時に必須の列。falseなら無くても良い列を表す。
	 * - type	型	
	 * - join_type	JOINタイプ	null:主テーブルに属する, left:LEFT JOIN, const:定数ハッシュマップ
	 * - tbl_name	テーブル名
	 * - model_name	モデル名
	 * - master	マスター名	モデル名のエイリアス
	 * - id_field	関連IDフィールド
	 * - dMap	IDマップ	定数ハッシュマップ
	 * - import_flg	インポートフラグ	true:CSVインポート有効（デフォ）
	 * - export_flg	エクスポートフラグ	true:CSVエクスポート有効（デフォ）
	 * 
	 * 
	 * @param array csvFieldData CSVフィールドデータ
	 * @param string main_tbl_name 主テーブル名
	 * @return array 正規化後のCSVフィールドデータ
	 */
	normalizeCsvFieldData(csvFieldData, main_tbl_name){
		
		for(let i in csvFieldData){
			let ent = csvFieldData[i];
			
			// フィールドチェック
			if(ent.field == null) throw new Error("CsvFieldData: 'field' is empty!");
			
			// 列名と和名の両方が空ならエラー
			if(ent.clm_name == null && ent.wamei == null) throw  Error("CsvFieldData: clm_name and wamei is empty!");
		
			// 列名だけが空なら、列名に和名をセットする
			if(ent.clm_name == null && ent.wamei != null){
				ent['clm_name'] = ent.wamei;
			}
			
			// 和名だけが空なら、和名に列名をセットする
			if(ent.clm_name != null && ent.wamei == null){
				ent['wamei'] = ent.clm_name;
			}
			
			// 別名リストが空ならnullをセット
			if(ent.clm_alias_names == null) ent['clm_alias_names'] = null;
			
			// 必須フラグが未セットならfalseをセット
			if(ent.req_flg == null) ent['req_flg'] = false;
			
			// 列必須が未セットなら必須フラグをセット
			if(ent.req_clm == null) ent['req_clm'] = ent['req_flg'];
			
			// JOINタイプが未セットならnullをセット
			if(ent.join_type == null) ent['join_type'] = null;
			
			// 関連IDフィールドが空且つ、JOINタイプがnull以外なら、フィールド名の「_name」を「_id」に置換してセット
			if(ent.id_field == null){
				if(ent.join_type != null){
					ent['id_field'] = ent.field.replace('_name', '_id');
				}else{
					ent['id_field'] = null;
				}
			}
		
			// モデル名、マスター、テーブル名の3フィールドがすべて空ならメインテーブル名またはメインモデル名をセットする。
			if(ent.model_name == null && ent.master == null && ent.tbl_name == null){
				let main_model_name = this._tblNameToModelName(main_tbl_name); //  メインテーブル名からメインモデル名を取得する
				ent['model_name'] = main_model_name;
				ent['master'] = main_model_name;
				ent['tbl_name'] = main_tbl_name;
			}else{
				
				// テーブル名とモデル名を取得する
				let res = this._getTblNames(ent);
				let model_name = res.model_name;
				let tbl_name = res.tbl_name;
				
				if(ent.model_name == null) ent['model_name'] = model_name;
				if(ent.master == null) ent['master'] = model_name;
				if(ent.tbl_name == null) ent['tbl_name'] = tbl_name;
			}
			
			// IDハッシュマップ... JOINタイプが定数である場合、IDハッシュマップが未セットならエラーを投げる。
			if(ent.join_type == 'const'){
				if(ent.idMap == null) throw new Error(`CsvFieldData: ${ent.field}: ipMap is empty!`);
			}else{
				ent['idMap'] = null;
			}
			
			// インポートフラグが未セットならtrueをセット
			if(ent.import_flg == null) ent['import_flg'] = true;
			
			// エクスポートフラグが未セットならtrueをセット
			if(ent.export_flg == null) ent['export_flg'] = true;
			
			// 入力タイプ
			if(ent.inp_type == null){
				if(ent['id_field'] == null){
					ent['inp_type'] = 'text';
				}else{
					ent['inp_type'] = 'select';
				}
			}
			
		}
		
		return csvFieldData;
	}
	
	
	/**
	 * テーブル名からモデル名に変換する
	 * (例) big_cat_tests → BigCatTest
	 */
	_tblNameToModelName(str){
		if(str=='' || str==null) return '';
		
		//_+小文字を大文字にする(例:_a を A)
		str = str.replace(/_./g,
			function(s) {
				return s.charAt(1).toUpperCase();
			}
		);

		// 先頭を大文字化する
		str = str.charAt(0).toUpperCase() + str.slice(1);
		
		// 末尾が「s」なら削る
		var e1 = str.slice(-1);
		if(e1 == 's'){
			str =str.substr(0,str.length-1);
		}
		
		return str;
	}
	
	
	/**
	 * モデル名からテーブル名を作成する
	 (例) BigCatTest → big_cat_tests
	 */
	_modelNameToTblName(str){
		if(str=='' || str==null) return '';
		// 先頭を小文字かする
		str = str.charAt(0).toLowerCase() + str.slice(1);
		
		//大文字を_+小文字にする(例:A を _a)
		str = str.replace(/([A-Z])/g,
			function(s) {
				return '_' + s.charAt(0).toLowerCase();
			}
		);
		
		str += 's';

		return str;
	}
	
	
	/**
	 * テーブル名とモデル名を取得する
	 * @param object ent CSVフィールドエンティティ
	 * @return object テーブル名とモデル名
	 */
	_getTblNames(ent){
		
		// テーブル名を取得
		let tbl_name = ent.tbl_name;
		
		// モデル名を取得
		let model_name = ent.model_name;
		if(model_name == null) model_name = ent.master;
		
		// テーブル名が空ならモデル名から作成
		if(tbl_name == null){
			tbl_name = this._modelNameToTblName(model_name);
		}
		
		// モデル名が空ならテーブル名から作成
		if(model_name == null){
			model_name = this._tblNameToModelName(tbl_name);
		}
		
		return {
			tbl_name:tbl_name,
			model_name:model_name,
		};
		
	}
	
}