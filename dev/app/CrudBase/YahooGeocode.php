<?php 
/**
 * Yahoo ジオコーダー便利クラス
 * 
 * @note 
 * Yahooジオコーダーを使いやすしたクラス。
 * 
 * @author kenji uehara
 * @license MIT
 * @date 2019-8-4
 *
 */
class YahooGeocode{
	
	/**
	 * 住所から緯度経度を取得する
	 * @param string $address 住所
	 * @param string $api_key APIキー
	 * @return array 緯度,経度
	 */
	public function getLatLngFromAddress($address, $api_key){
		
		$base_url = "https://map.yahooapis.jp/geocode/V1/geoCoder?output=xml&appid={$api_key}";
		$param = '&query=' . $address;
		
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_URL, $base_url. $param);
		curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'GET');
		curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
		$xml_str = curl_exec($curl);
		
		$geoData =$this->xml2arr($xml_str);
		
		$find_flg = false; // true:緯度経度が見つかる, false:緯度経度が見つからない
		$lat = 0; // 緯度
		$lng = 0; // 経度
		if(!empty($geoData['Feature'])){
			if(!empty($geoData['Feature']['Geometry'])){
				if(!empty($geoData['Feature']['Geometry']['Coordinates'])){
					$find_flg = true;
					$coordinates = $geoData['Feature']['Geometry']['Coordinates'];
					$ary=explode(",", $coordinates);
					$lat = trim($ary[1]);
					$lng = trim($ary[0]);
				}
			}
		}
		
		$res = ['lat'=>$lat, 'lng'=>$lng];
		return $res;
		
	}
	
	
	/**
	 * XMLテキストからデータ配列に変換する
	 *
	 * @note
	 * 多層構造であるとき、階層化の配列が0件でであるなら0件配列でなく空文字がセットされる。
	 * JSONとは完全な互換性はないので注意すること。
	 *
	 * @param string $xml_text XMLテキスト
	 * @return データ配列
	 */
	private function xml2arr($xml_text){
		// XML解析
		$data= new SimpleXMLElement($xml_text,
			LIBXML_COMPACT | LIBXML_NOERROR,
			false);
		
		// SimpleXMLElementオブジェクト型から配列データに変換する
		$this->obj2arr($data);
		
		return $data;
	}
	
	
	/**
	 * SimpleXMLElementのレスポンスのオブジェクトをデータ配列に変換する。
	 *
	 * @note
	 * 階層化の配列が0件である場合、0件配列でなく、空文字がセットされる。
	 * 高速化のため引数を参照型しており、レスポンスも兼ねている。
	 *
	 * @param array $data SimpleXMLElementオブジェクト → 配列データ
	 */
	private function obj2arr(&$data){
		
		if(is_array($data)){
			foreach($data as $i => &$chiled){
				$this->obj2arr($chiled);
			}
			unset($chiled);
		}elseif(is_object($data)){
			$count = $data->count();
			if(empty($count)){
				$data = '';
			}else{
				$data = get_object_vars($data);
				foreach($data as $i => &$chiled){
					$this->obj2arr($chiled);
				}
				unset($chiled);
			}
		}
	}
	
	
}