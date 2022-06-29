/**
 * 複数画像をプリロード
 * @note すべての画像を読み込んだらコールバックを実行（読込エラーであってもコールバックは実行）
 * @since 2022-1-10
 * @version 1.0.0
 * @auther amaraimusi
 * 
 */
class ImgsPreload{
	
	
	/**
	 * 複数画像をプリロード
	 * @param {key} imgFns 画像ファイル名リスト（画像ファイルパスリスト）
	 * @param function callback(画像オブジェクトリスト) すべての画像がプリロードされたら呼び出されるコールバック関数（省略可）
	 * @param function progressCallback({}) 進捗コールバック関数（省略可）
	 * @return {} imgObjList
	 */
	preload(p_imgFns, afterCallback, progressCallback){
		
		if (this._empty(p_imgFns)) return {};
		
		let imgFns;
		if(Array.isArray(p_imgFns)){
			imgFns = {};
			for(let i in p_imgFns){
				imgFns[String(i)] = p_imgFns[i];
			}
		}else{
			let type_name = typeof p_imgFns;
			if(type_name == 'object'){
				imgFns = p_imgFns;
			}else{
				throw Error('システムエラー 20220111A');
			}
		}
		
		this.counter = 0;
		this.data_cnt = Object.keys(imgFns).length;
		this.afterPreloadCallback = afterCallback;
		this.progressCallback = progressCallback;
		
		this.imgObjList = {};
		for(let key in imgFns){
			let img_url = imgFns[key];
			let imgObj = new Image();
			
			imgObj.onload = ()=>{
				this.counter ++;
				if(this.data_cnt == this.counter){
					if(this.afterPreloadCallback != null){
						this.afterPreloadCallback(this.imgObjList);
					}
				}
				
				// 進捗コールバックの実行
				if(this.progressCallback != null){
					this.progressCallback({counter:this.counter, data_cnt:this.data_cnt});
				}
			}
			imgObj.onerror = ()=>{
				console.log('画像の読込に失敗');
				this.counter ++;

				if(this.data_cnt == this.counter){
					if(this.afterPreloadCallback != null){
						this.afterPreloadCallback(this.imgObjList);
					}
				}
				
				// 進捗コールバックの実行
				if(this.progressCallback != null){
					this.progressCallback({counter:this.counter, data_cnt:this.data_cnt});
				}
				
			}
			
			imgObj.src = img_url;
			this.imgObjList[key] = imgObj;
			
		}
	
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