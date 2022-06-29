<?php


/**
 * 汎用的なStaticメソッドを提供するクラス
 * @author kenji uehara
 * @license MIT
 * @since 2021-4-19 | 2021-4-28
 *
 */
class CrudBaseU{
	
	
	/**
	 * CSSファイルリストを取得する
	 * @return array CSSファイルリスト
	 */
	public static function getCssList(){
		
		
		return [
			'bootstrap.min',
			'font/css/open-iconic.min', // アイコン
			'jquery-ui.min',
			'Layouts/default',
			'CrudBase/dist/CrudBase.min.css?ver=3.0.6',
		];
	}
	
	/**
	 * JSファイルのインクルード
	 */
	public static function getJsList(){
		return [
			'jquery.min',
			'bootstrap.min',
			'jquery-ui.min',
			'vue.min',
			'Layouts/default',
			'CrudBase/dist/CrudBase.min.js?ver=3.0.6',
		];
	}

	
	/**
	 * CSRFトークンによるセキュリティチェック
	 * @return boolean true:無問題 , false:不正アクションを確認！
	 */
	public static function checkCsrfToken($page_code){
		
		// Ajaxによって送信されてきたCSRFトークンを取得。なければfalseを返す。
		$csrf_token = null;
		if(!empty($_POST['_token'])) $csrf_token = $_POST['_token'];
		
		if($csrf_token == null){
			if(!empty($_POST['csrf_token'])) $csrf_token = $_POST['csrf_token'];
		}
		
		if($csrf_token == null){
			if(!empty($_GET['_token'])) $csrf_token = $_GET['_token'];
		}
		
		if($csrf_token == null){
			if(!empty($_GET['csrf_token'])) $csrf_token = $_GET['csrf_token'];
		}

		if($csrf_token == null) return false;
		
		// セッションキーを組み立て
		$ses_key = $page_code . '_csrf_token';
		$ses_csrf_token = $_SESSION[$ses_key];

		if($csrf_token == $ses_csrf_token){
			return true;
		}
		
		return false;
	}
	
	
	/**
	 * CSRFトークンを取得
	 * セッションまわりの処理も行う。
	 * @return string CSRFトークン
	 */
	public static function getCsrfToken($page_code)
	{
		
		$ses_key = $page_code . '_csrf_token'; // セッションキーを組み立て
		$csrf_token = self::random();
		$_SESSION[$ses_key]  = $csrf_token;
		
		return $csrf_token;
	}
	
	
	/**
	 * ランダム文字列を作成
	 * @param number $length
	 * @return string
	 */
	public static function random($length = 8)
	{
		return base_convert(mt_rand(pow(36, $length - 1), pow(36, $length) - 1), 10, 36);
	}
	
	/**
	 * ランダムハッシュコードを作成
	 * @param number $length
	 * @return string ハッシュコード
	 */
	public function randomHash($length = 8)
	{
		$random =  substr(str_shuffle('1234567890abcdefghijklmnopqrstuvwxyz'), 0, $length);
		$hash = hash('sha256', MD5($random)); // ハッシュを作成
		$hash = mb_substr($hash,0,$length);
		
		return $hash;
	}
	
	/**
	 * CrudBase設定データをhidden化して埋め込み
	 */
	public static function hiddenOfCrudBaseConfigJson(){
		global $crudBaseConfig;
		$json_str = json_encode($crudBaseConfig,JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS);
		
		echo "<input type='hidden' id='crudBaseConfig' value='{$json_str}' >";
		
	}
	
	
	
	
	
}