/**
 * CrudBase用リアクティブ機能（未完成）
 * 
 * @note
 * 行/エンティティ単位で要素をバインドすることができる。
 * 
 * @date 2018-12-6
 * @version 0.1.0
 * 
 */
class CrudBaseReact{
	
	
	/**
	 * コンストラクタ
	 * 
	 * @param param
	 * - flg
	 */
	constructor(param){
		

	}
	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};

		
		return param;
	}
	
	/**
	 * 初期化
	 * @param array fields フィールド配列
	 * @param string hyo_elm_id 表要素ID   複数の表IDを指定するときはコンマで連結する
	 */
	init(fields, hyo_elm_id){
		
		this.fields = fields;
		
		// 表IDリストの取得とトリミング
		var hyoIds = hyo_elm_id.split(',');
		for(var i in hyoIds){
			var hyo_id = hyoIds[i];
			hyoIds[i] = hyo_id.trim();
		}
		this.hyoIds = hyoIds;
		
	}
	
	/**
	 * 行のリアクティビング
	 * @note
	 * 各表の行/エンティティを同期する
	 */
	reactivatingOfRow(){
	}

}