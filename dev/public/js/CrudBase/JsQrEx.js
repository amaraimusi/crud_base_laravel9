
/*
* jsQR.jsのラッパークラス
* @note QRコードをシンプルに利用するためのクラス。jsQR.jsに依存。
* @auther amaraimusi
* @version 1.1.0
* @since 2022-1-15 | 2022-2-14
* 
*/
class JsQrEx{

	/*
	* コンストラクタ
	* @param string canvas_xid canvasタグ要素のid属性値
	* @param function readCallback QRコードの読込成功時に呼び出されるコールバック
	* @param string config_xid 設定区分要素のxid(省略可能）)
	* @param object param 下記のプロパティは省略可能
	* 	- cvs_width int キャンバスの横幅
	* 	- cvs_height int キャンバスの縦幅
	* 	- camera_width int カメラの解像度　横
	* 	- camera_height int カメラの解像度　縦
	* 	- intarval int setTimerの再帰呼出間隔
	* 	- errCallback function エラーコールバック←カメラ不許可時に呼び出される。
	*/
	constructor(canvas_xid, readCallback, config_xid, param){

		this.active = false;
		if(canvas_xid==null) new Error('Sytem error:canvas_xid is empty!');
		if(param==null) param = {};
		this.readCallback = readCallback;
		if(typeof readCallback != 'function') throw new Error('System err:readCallback is not function');
		this.config_xid = config_xid;
		
		param = this._setParam(param);
		
		this.param = param;

		let video=document.createElement('video');
		
		video.setAttribute("autoplay","");
		video.setAttribute("muted","");
		video.setAttribute("playsinline","");
		this.jq_cvs = jQuery('#' + canvas_xid);
		let cvs=document.getElementById(canvas_xid);
		let cvs_ctx=cvs.getContext("2d");
		let tmp = document.createElement('canvas');
		let tmp_ctx = tmp.getContext("2d");
		
		this.video = video;
		this.cvs = cvs;
		this.cvs_ctx = cvs_ctx;
		this.tmp = tmp;
		this.tmp_ctx = tmp_ctx;
		
		// canvas要素のサイズを0にする。隠し状態。
		cvs.style.width="0px";
		cvs.style.height="0px";
		cvs.setAttribute("width",0);
		cvs.setAttribute("height",0);
		
		this._initConfig(config_xid); // 設定区分の初期化と作成
		

		this.video = video;

	}
	
	
	/**
	 * デフォルトパラメータを取得する
	 */
	_getDefParam(){
		
		let defParam = {
			'cvs_width':640,
			'cvs_height':480,
			'camera_width':640,
			'camera_height':480,
			'intarval':50,// ms
			'read_size_rate':0.5,
		};
		return defParam;
	}
	
	// 設定区分の初期化と作成
	_initConfig(config_xid){
		if(config_xid == null) return;
		let config_btn_xid = config_xid + '_config_btn';
		let config_con_xid = config_xid + '_content';
		let read_size_rate_xid = config_xid + '_size_rate_xid';
		let apply_btn_xid  = config_xid + '_apply_btn';
		let def_btn_xid  = config_xid + '_def_btn';
		
		this.jQConfig = jQuery('#' + config_xid);
		
		let html = `
			<button id="${config_btn_xid}" class="btn btn-outline-secondary btn-sm">設定</button>
			<div id="${config_con_xid}" style="display:none;border:solid 2px #4b8bf4;padding:20px;">
				<table>
					<tbody>
						<tr>
							<td style="padding:3px;">QRコードの読込領域の割合</td>
							<td style="padding:3px;"><input type="number" id="${read_size_rate_xid}" step="0.1" max="1.0" min="0.2"; value="" style="width:3.5em;" /></td>
							<td style="padding:3px;"><aside>0.2～1.0の範囲で指定</aside></td>
						</tr>
					</tbody>
				</table>
				<div>
					<button id="${apply_btn_xid}" class="btn btn-primary btn-sm">適用</button>
					<button id="${def_btn_xid}" class="btn btn-primary btn-sm">初期に戻す</button>
				</div>
			</div>
		`;
		
		this.jQConfig.html(html);
		
		this.jqConfigBtn = this.jQConfig.find('#' + config_btn_xid);		
		this.jqConfigCon = this.jQConfig.find('#' + config_con_xid);		
		this.jqReadSizeRate = this.jQConfig.find('#' + read_size_rate_xid);
		this.jqApplyBtn = this.jQConfig.find('#' + apply_btn_xid);
		this.jqDefBtn = this.jQConfig.find('#' + def_btn_xid);
		
		this.jqReadSizeRate.val(this.param.read_size_rate);
		
		this.jqConfigBtn.click((evt)=>{
			this.jqConfigCon.toggle(300);
		});
		
		this.jqApplyBtn.click((evt)=>{
			this._apply();
		});
		
		this.jqDefBtn.click((evt)=>{
			this._toDefault();
		});
		
	}
	
	
	/**
	 * カメラ起動
	 * @param function callback カメラ起動後に実行するコールバック
	 * @param function errCallback カメラ起動失敗コールバック
	 */
	start(callback, errCallback){
		if(this.active == true) return;
		
		if(this.jQConfig) this.jQConfig.hide(); // 設定を隠す
		
		this.jq_cvs.show();
		this.startCallback = callback;
		this.errCallback = errCallback;
		
		navigator.mediaDevices.getUserMedia({
			"audio":false,
			"video":{
				"facingMode":"environment",
				"width":{
					"ideal":this.param.camera_width
					},
				"height":{
					"ideal":this.param.camera_height
					}
				}
		  }).then((stream) =>{
			let video = this.video;
			let cvs = this.cvs;
			video.srcObject = stream;
			video.onloadedmetadata = (e)=> {
				video.play();

				// ビデオカメラ映像のサイズを取得する
				let w = video.videoWidth;
				let h = video.videoHeight;
				
				//内部サイズをセット
				cvs.setAttribute("width",w);
				cvs.setAttribute("height",h);
				
				//画面上の表示サイズ
				cvs.style.width = this.param.cvs_width + "px";
				cvs.style.height= this.param.cvs_height + "px";
		
				this.active = true;
				setTimeout(()=>{this._scan();},500);//0.5秒後にスキャン開始
				
				if(this.startCallback){
					this.startCallback(); // カメラ起動コールバックを実行
				}
				
		    };
		  }).catch((e) =>{
			if(this.errCallback){
				this.errCallback(e);
			}else{
				alert('カメラ起動に失敗しました。');
			}
		});

	}
	
	/**
	 * カメラ停止
	 */
	stop(){
		if(this.active == false) return;
		if(this.jQConfig) this.jQConfig.show(); // 設定を表示
		
		this.active = false;
		this.jq_cvs.hide();
		
		const tracks = this.video.srcObject.getTracks();
		tracks.forEach(track => {
			track.stop();
		});
		
	}


	// QRコードのスキャン
	_scan(){

		let video = this.video;
		let cvs = this.cvs;
		let cvs_ctx = this.cvs_ctx;
		let tmp = this.tmp;
		let tmp_ctx = this.tmp_ctx;
		
		let w = this.param.camera_width;
		let h = this.param.camera_height;
		let read_size_rate = this.param.read_size_rate;
		
		let m = 0; // QR読取り領域サイズ
		if(w>h){
			m = h * read_size_rate;
		}else{
			m = w * read_size_rate;
		}
		let x1=(w-m)/2;
		let y1=(h-m)/2;
		cvs_ctx.drawImage(video,0,0,w,h); // ビデオ映像をcanvas要素に映し出す
		cvs_ctx.beginPath(); // canvas要素へ読取り矩形の描画準備
		cvs_ctx.strokeStyle="rgb(255,0,0)"; // 読取り矩形の線色
		cvs_ctx.lineWidth=2; // 線の太さ
		cvs_ctx.rect(x1,y1,m,m); // 読取り矩形をセット
		cvs_ctx.stroke(); // 実際に描画する
		
		// QRコードの読込処理 → 一時canvasに映し出された映像写真を元にQRコード読込を行う。
		tmp.setAttribute("width",m);
		tmp.setAttribute("height",m);
		tmp_ctx.drawImage(cvs,x1,y1,m,m,0,0,m,m);
		let imageData = tmp_ctx.getImageData(0,0,m,m);
		let scanResult = jsQR(imageData.data,m,m);
		if(scanResult){
			
			// 読込後コールバック
			this.readCallback(scanResult.data);
		}
		if(this.active == true){
			setTimeout(()=>{this._scan();},this.param.intarval);
		}
	}
	
	_setParam(pParam){
		
		// ローカルストレージキーの取得。
		this.ls_key = null;
		if(pParam){
			if(pParam.ls_key){
				this.ls_key = pParam.ls_key;
			}else{
				this._createLsKey();
			}
		}
		
		let lsParam = this._getLsParam(); // ローカルストレージ由来パラメータ
		let defParam = this._getDefParam(); // デフォルトパラメータ
		
		// クローンを作成してメンバにセット（パラメータの値がobject型である場合、参照にあるため干渉が起きてしまうのを避ける）
		this.lsParam = $.extend(true, {}, lsParam);
		this.pParam = $.extend(true, {}, pParam);
		this.defParam = $.extend(true, {}, defParam);
		
		let param = {};
		if(!this._empty(lsParam)){
			param = this._merge(param, lsParam);
		}

		if(!this._empty(pParam)){
			param = this._merge(param, pParam);
		}
		
		param = this._merge(param, defParam);
		this.param = param;
		
		return param;

	}
	
	// jQuery要素に入力された値をパラメータに適用する。
	_apply(){
		let read_size_rate = this.jqReadSizeRate.val();
		if(!this._isRange(read_size_rate, 0.2, 1.0, true)){
			alert('「QRコードの読込領域の割合」は0.2から1.0の範囲で入力してください。');
			return;
		}
		read_size_rate = read_size_rate * 1; // 暗黙的数値変換
		
		this.param.read_size_rate = read_size_rate;
		this._saveLs(); // ローカルストレージに保存
		
		this.jqConfigCon.hide(); // 設定コンテンツを閉じる
	}
	
	//数値範囲入力チェックのバリデーション
	_isRange(v,range1,range2,req){


		//必須入力チェック
		if(req==true){
			if(v == null || v === '' || v === false){
				return false;
			}
		}


		//数値チェックをする。
		if(isNaN(v)){
			return false;
		}

		//数値範囲チェックをする。
		if(range1 <= v && range2 >= v){
			return true;
		}else{
			return false;
		}


	}
	
	
	
	// 初期設定に戻す
	_toDefault(){
		
		let defParam = this._getDefParam();
		for(let key in defParam){
			this.param[key] = defParam[key];
		}
		
		this._refreshJQConfig(); // jQuery要素へパラメータをセットする。
		this.clearlocalStorage(); // ローカルストレージで保存しているパラメータをクリアする
		
	}
	
	// jQuery要素へパラメータをセットする。
	_refreshJQConfig(){
		this.jqReadSizeRate.val(this.param.read_size_rate);
	}
	
	
	
	/**
	 * 引数1のパラメータに引数2のパラメータをマージする。
	 * マージルール→未セット(undefined)ならセットする。
	 */
	_merge(param, param2){
		for(let key in param2){
			if(param[key] === undefined){
				param[key] = param2[key];
			}
		}
		return param;
	}
	

	
	/**
	 * ローカルストレージパラメータを取得する
	 */
	_getLsParam(){
		
		let ls_key = this._getLsKey(); // ローカルストレージキーを取得する
		let param_json = localStorage.getItem(ls_key);
		let lsParam = JSON.parse(param_json);
		if(lsParam == null) lsParam = {};
		return lsParam;
		
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
	_saveLs(){
		let ls_key = this._getLsKey(); // ローカルストレージキーを取得する
		let param_json = JSON.stringify(this.param);
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
	
	/*　パラメータをデフォルトに戻す。
	*/
	_resetParam(){
		
		for(let key in this.defParam){
			this.param[key] = this.defParam[key];
		}
		
		this._saveLs();
		
		return this.param;
	}
}