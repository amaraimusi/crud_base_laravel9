<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

/**
 * CakePHPによるAjax認証
 * @date 2016-9-12 | 2020-8-4
 */
class AjaxLoginWithCakeController{

	/**
	 * 認証状態を取得して返す。
	 * Ajaxで呼び出される。
	 */
	public function login_check() {

// 		// 遷移元をセッションにセットする。
// 		$referer=$_SERVER["HTTP_REFERER"] ?? '';
// 		Session::put('ajax_login_with_cake_ses_key', $referer);
		
		// 「戻り」用のURLをセットする。
		$url = $_SERVER["REQUEST_URI"];
		Session::put('ajax_login_with_cake_ses_key', $url);
		
		// 認証状態を取得する
		$auth_flg = 0;
		if(!empty(\Auth::id())){
			$auth_flg = 1;//認証中
		}
		
		// レスポンス用JSONを作成
		$data=['auth_flg'=>$auth_flg];
		$json_data=json_encode($data);//JSONに変換

		return $json_data;
	
	}
	
	
	/**
	 * ログイン画面を経由してリファラへリダイレクトで戻る
	 * 
	 * @note
	 * 未認証時にアクセスするとログイン画面へ遷移する。
	 * ログインすると当メソッドを実行し、リファラへリダイレクトで戻る。
	 */
	public function login_rap(){

		// セッションから取り出したリファラへリダイレクトする。
		$referer = session('ajax_login_with_cake_ses_key');
		return redirect($referer);

	}
	
	
	/**
	 * ログアウト
	 */
	public function logout(){
		
		if(!empty(\Auth::id())){
			\Auth::logout();
		}
		
		return redirect('/');
	}
	
	
	
	
	
}
