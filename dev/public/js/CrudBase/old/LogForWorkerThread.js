/**
 * ワーカースレッド用ログクラス
 * 
 * @note
 * 最初の数十件のログと最後の数十件のログを蓄積しておき、必要な時にまとめて出力するクラス。
 * 最初と最後の数十件のみ保存するので、メモリの節約になる。
 * 最初のログ件数は前ログ件数、最後のログ件数は後ログ件数と、当クラス内では呼称している。
 * 
 * 
 * @date 2015-10-23	新規作成
 * @date 2015-12-2	クラス名変更 LogForWorker→LogForWorkerThread
 * 
 */

var LogForWorkerThread =function(){

	this.first_count=10;//前ログ件数
	this.last_count=10;//後ログ件数
	
	this.f_logs=[this.first_count];
	this.l_logs=[this.last_count];
	this.index=0;
	this.last_index=-1;
	this.last_round_flg=false;//後ログ一巡フラグ   false:一巡してない   true:一巡した
	
	
	/**
	 * プロパティのセッター
	 * @param first_count 前ログ件数
	 * @param last_count 後ログ件数
	 */
	this.setProperty=function(first_count,last_count){
		this.first_count=first_count;
		this.last_count=last_count;
		
	};
	
	/**
	 * ログを蓄積する。
	 * @param v ログにする値
	 * 
	 */
	this.log=function(v){
		
		if(this.index < this.first_count){
			this.f_logs[this.index]=v;
		}else{
			if(this.last_index == -1){
				this.last_index = 0;
			}
			
			this.l_logs[this.last_index]=v;
			
			this.last_index++;
			
			if(this.last_index >= this.last_count){
				this.last_index=0;
				this.last_round_flg=true;//一巡
			}
		}
		
		
		
		this.index++;
	};
	
	/**
	 * 前ログリストを取得する
	 */
	this.getFirstLogs=function(){
		
		var res=[];
		
		if(this.index < this.first_count){
			for (var i=0;i<this.index;i++){
				res.push(this.f_logs[i]);
			}
		}else{
			for (var i=0;i<this.first_count;i++){
				res.push(this.f_logs[i]);
			}
		}
		
		return res;
		
	};
	
	/**
	 * 後ログリストを取得する。
	 */
	this.getLastLogs=function(){
		var res=[];
		
		if(this.last_index == -1){
			return res;
		}
		
		
		if(this.last_round_flg==false){
			for (var i=0;i<this.last_index;i++){
				res.push(this.l_logs[i]);
			}
		}else{
			for (var i=0;i<this.last_count;i++){
				var k = i + this.last_index;
				if(k >= this.last_count){
					k=k-this.last_count;
				}
				res.push(this.l_logs[k]);
			}
		}
		
		return res;
	}
	

};
	