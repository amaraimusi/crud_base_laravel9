
/**
 * 時間差ポップアップ
 * @note 
 *     ポップアップの追加とポップアップの表示をタイミングをずらして実行できる。
 *     主な使い方→ ポップアップを追加してブラウザリロードした後、ポップアップを表示。
 *     PopupCat.jsに依存している。
 * @since 2022-2-17 | 2022-2-19
 * @version 1.1.0
 * @auther amaraimusi
 * @license MIT
 */
class PopupLion{
	
	/**
	* コンストラクタ
	* @param param　現バージョンでは未使用
	* @param popupCatParam　PopupCatのparam
	* 
	*/
	constructor(param, popupCatParam){
		if(param==null) param = {};
		this.param = param;
		this.boxs = this._getBoxsFromLs();
		this.popupCatList = {}; // PopupCatオブジェクトのリスト。キーはxid。
		this.release_index = 0;
		
		if(popupCatParam==null) popupCatParam= {};
		popupCatParam['popupClickCallback'] = ()=>{ // ポップアップをクリックしたときのイベント
			// ポップアップをクリックしたらクリアする。
			this._endAllPopup();
		}	
		this.popupCatParam = popupCatParam;
	}
	
	
	/**
	* ポップアップ情報を追加
	* @param xid　ポップアップ化する要素のid属性値
	* @param data　ポップアップ要素内に属する要素とその要素にセットする値のデータ
	*     [{'jq_slt':'#cat_name','value':'hogehoge'}]
	*/
	addPopup(xid, data){
		if(xid == null) throw new Exceptin('PopupLion.js error. xid is empty');
		if(data == null) data = [];
		let box = {
			'xid':xid,
			'data':data,
			'show_done_flg':0, // 表示済みフラグ
		}
		this.boxs.push(box);
		
		
		this._saveLs(this.boxs); // ローカルストレージに保存
	}
	
	/**
	* ポップアップをリリースする(ポップアップの表示）
	*/
	releasePopup(){

		// 全てのポップアップの終了チェック
		if(this.boxs.length == this.release_index){
			this._endAllPopup(); // 全てのポップアップ表示完了
			return;
		}
		
		// ポップアップ表示中にページ遷移が行われた場合の対策
		let box = null;
		for(let i = this.release_index; i <  this.boxs.length; i++){
			if(this.boxs[i].show_done_flg == 0){
				box = this.boxs[i];
				this.release_index = i;
				break;
			}
		}
		
		if(box == null){
			this._endAllPopup();
			return;
		}
		
		box.show_done_flg = 1; // 表示済みにする
		let xid = box.xid;
		let popupCat = this._getPopupCat(xid);
		let popElm = popupCat.getPopupElm();
		let data = box.data;
		for(let i in box.data){
			let ent = box.data[i];
			let jqElm = popElm.find(ent.jq_slt);
			if(jqElm[0]){
				jqElm.html(ent.value);
			}
		}
		
		this.release_index++;
		
		this._saveLs(this.boxs);

		popupCat.pop(()=>{
			this.releasePopup();
		});
	}
	
	// 全てのポップアップ表示完了
	_endAllPopup(){
		if(this._empty(this.boxs)) return;
		this.boxs = []; // 空にする
		this.release_index = 0;
		this.clearlocalStorage(); // ローカルストレージをクリア
	}
	
	
	/**
	* PopupCatオブジェクトを生成して取得する。
	* @param xid ポップアップ要素のid属性
	* @return object PopupCatオブジェクト
	*/
	_getPopupCat(xid){
		if(this.popupCatList[xid] == null){
			let popupCat = new PopupCat();
			popupCat.popupize(xid, this.popupCatParam); // 指定要素をポップアップ化する
			this.popupCatList[xid] = popupCat;
		}
		return this.popupCatList[xid];
		
	}

	/**
	 * ローカルストレージからboxsを取得する
	 */
	_getBoxsFromLs(){
		
		let ls_key = this._getLsKey(); // ローカルストレージキーを取得する
		let param_json = localStorage.getItem(ls_key);
		let lsBoxs = JSON.parse(param_json);
		if(lsBoxs == null) lsBoxs = [];
		return lsBoxs;
		
	}
	
	/**
	 * ローカルストレージで保存しているパラメータをクリアする
	 */
	clearlocalStorage(){
		let ls_key = this._getLsKey(); // ローカルストレージキーを取得する
		localStorage.removeItem(ls_key);
	}
	
	
	/**
	 * ローカルストレージにパラメータを保存
	 */
	_saveLs(param){
		let ls_key = this._getLsKey(); // ローカルストレージキーを取得する
		let param_json = JSON.stringify(param);
		localStorage.setItem(ls_key, param_json);
	}
	
	
	/**
	 * ローカルストレージキーを取得する
	 */
	_getLsKey(){
		if(this.ls_key == null){
			this.ls_key = this._createLsKey();
		}
		
		return this.ls_key;
		
	}
	
	/**
	 * ローカルストレージキーを自動生成する。
	 */
	_createLsKey(){
		// ローカルストレージキーを取得する
		let ls_key = location.href; // 現在ページのURLを取得
		ls_key = ls_key.split(/[?#]/)[0]; // クエリ部分を除去
		ls_key += this.constructor.name; // 自分自身のクラス名を付け足す
		return ls_key;
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
	
}
