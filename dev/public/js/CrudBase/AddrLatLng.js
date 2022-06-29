/**
 * 住所緯度経度・編集機能
 * 
 * @note
 * GoogleジオコードAPIを使用
 * 
 * @date 2019-4-11 | 2019-8-4
 * @version 1.1.0
 */
class AddrLatLng{

	/**
	 * コンストラクタ
	 * 
	 * @param object param
	 * - div_xid 当機能埋込先区分のid属性
	 * - wrap_slt ラッパー要素のセレクタ
	 * - map_slt 地図要素のセレクタ
	 * - address_tb_slt 住所テキストボックスのセレクタ
	 * - lat_tb_slt 緯度テキストボックスのセレクタ
	 * - lng_tb_slt 経度的巣tボックスのセレクタ
	 * - err_slt エラー要素のセレクタ
	 * - zoom Mapsの初期ズーム
	 */
	constructor(param){
		param = this._setParamIfEmpty(param);
		this.tDiv = jQuery('#' + param.div_xid); //  This division
		
		this.param = param;
		this.map; // Mapsオブジェクト
		this.infoWindow1; // 吹き出しウィンドウ
		this.marker; // マーカーオブジェクト
		this.geocoder; // ジオコーディングオブジェクト | google.maps.Geocoder(); | 住所から緯度経度取得に利用
		this.init_flg = false; // 初期化済みフラグ
		
		this.wrapDiv = this.tDiv.find(param.wrap_slt); // ラッパー要素
		this.addrElm = this.tDiv.find(param.address_tb_slt); // 住所テキストボックス
		this.latElm = this.tDiv.find(param.lat_tb_slt); // 緯度テキストボックス
		this.lngElm = this.tDiv.find(param.lng_tb_slt); // 経度テキストボックス
		this.errElm = this.tDiv.find(param.err_slt); // エラー要素
		
		
	}
	
	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};
		if(param['div_xid'] == null) param['div_xid'] = 'addr_lat_lng';
		if(param['wrap_slt'] == null) param['wrap_slt'] = '.allex_map_w';
		if(param['map_slt'] == null) param['map_slt'] = '.allex_map';
		if(param['address_tb_slt'] == null) param['address_tb_slt'] = '.allex_address';
		if(param['lat_tb_slt'] == null) param['lat_tb_slt'] = '.allex_lat';
		if(param['lng_tb_slt'] == null) param['lng_tb_slt'] = '.allex_lng';
		if(param['err_slt'] == null) param['err_slt'] = '.allex_err';
		
		if(param['def_lat'] == null) param['def_lat'] = 35.670528; // 東京都２丁目１３?１０ ユニマットアネックスビル7F
		if(param['def_lng'] == null) param['def_lng'] = 139.72014;
		
		if(param['lat'] == null) param['lat'] = param.def_lat;
		if(param['lng'] == null) param['lng'] = param.def_lng;
		if(param['zoom'] == null) param['zoom'] = 15;
	
		return param;
	}
	
	
	/**
	 * 初期化
	 */
	init(){

		let param = this.param;
		
		let mapElm = this.tDiv.find(param.map_slt);
		
		// 地図を作成
		let map = new google.maps.Map( mapElm[0], {
			center: new google.maps.LatLng(param.lat, param.lng ),
			zoom: param.zoom ,
		});
		this.map = map;
		
		// マーカーの作成
		let marker = new google.maps.Marker( {
			map: map ,
			position: new google.maps.LatLng( param.lat, param.lng ) ,
		}) ;
		this.marker = marker;
		
		// 地図のクリックイベント
		map.addListener( "click", ( argument ) => {
			this._clickOnMap(argument);
		}) ;
		
		
		this.init_flg = true; // 初期化済みにする
		
	}
	
	/**
	 * 地図のクリックイベント
	 * @param argument レスポンス
	 */
	_clickOnMap(argument){
		let latLng = argument.latLng;
		let lat = latLng.lat();
		let lng = latLng.lng();
		let place_id = argument.placeId;

		// テキストボックスに緯度経度をセットする
		this.latElm.val(lat);
		this.lngElm.val(lng);

		this.param.lat = lat;
		this.param.lng = lng;

	}
	
	
	/**
	 * 住所緯度経度・編集機能 :地図表示アクション
	 * @param jQuery btnElm ボタン要素
	 */
	addrLatLngShowMap(btnElm){
		this.wrapDiv.show();
		this._errShow(''); // エラーメッセージをクリア
		
		if(this.init_flg == false){
			this.init();
		}
		

		let param = this.param;
		
		// 緯度経度を取得する
		let lat = this.latElm.val();
		let lng = this.lngElm.val();
		if(this._empty(lat)) lat = param.def_lat;
		if(this._empty(lng)) lng = param.def_lng;
		
		// 地図の中心位置を移動
		let latLng = new google.maps.LatLng( lat, lng );
		this.map.setCenter(latLng);
		
		// マーカーの位置移動
		this.marker.setPosition(latLng);
		
		this.param.lat = lat;
		this.param.lng = lng;
		
		
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


	/**
	 * 住所緯度経度・編集機能 :住所から自動設定
	 * @param jQuery btnElm ボタン要素
	 */
	addrLatLngAutoSet(btnElm){

		this._errShow(''); // エラーメッセージをクリア

		// 住所、地名、ランドマークなどを入力
		let address_text = this.addrElm.val();
		
		if(this._empty(address_text)){
			this._errShow('住所を入力してください');
			return;
		}
		
		//ジオコーディングの取得、またはインスタンス生成
		if(this.geocoder == null){
			this.geocoder = new google.maps.Geocoder(); 
		}
		let geocoder = this.geocoder;
	
		// 住所、地名、ランドマークなどから正規住所、プレースID、緯度経度を取得する
		geocoder.geocode({address: address_text}, (results, status) => {
			if (status === 'OK' && results[0]){
				let result = results[0];

				// 住所の緯度経度を取得
				let lat = result.geometry.location.lat();
				let lng = result.geometry.location.lng();
				
				// 緯度経度テキストボックスへセット
				this.latElm.val(lat);
				this.lngElm.val(lng);
				
				// 地図が初期化済みならMapsにも位置をセットする
				if(this.init_flg){
					
					// 地図を住所の位置へ移動させる
					this.map.setCenter(result.geometry.location);
					
					// マーカーを住所の位置へ移動させる
					this.marker.setPosition(result.geometry.location);
				}

			}else{
				this._errShow('住所の場所は見つかりませんでした。'); // エラーメッセージをクリア
			}
		}); 
		
	}
	
	
	/**
	 * エラー表示
	 * @param string エラーメッセージ
	 */
	_errShow(err_msg){
		this.errElm.html(err_msg);
	}
	
	
	/**
	 * 編集フォーム表示時に呼び出される
	 */
	addrLatLngEditShow(){
		if(this.init_flg==false) return;
		
		let param = this.param;
		this._errShow(''); // エラーメッセージをクリア
		
		// 緯度経度を取得する
		let lat = this.latElm.val();
		let lng = this.lngElm.val();
		if(this._empty(lat)) lat = param.def_lat;
		if(this._empty(lng)) lng = param.def_lng;
		
		// 地図の中心位置を移動
		let latLng = new google.maps.LatLng( lat, lng );
		this.map.setCenter(latLng);
		
		// マーカーの位置移動
		this.marker.setPosition(latLng);
		
		this.param.lat = lat;
		this.param.lng = lng;
		
	}
	
	
}