<?php

namespace App\Http\Controllers;
use App\Http\Controllers\AppController;
use Illuminate\Http\Request;
use App\Models\ChangePw;
use Illuminate¥Support¥Facades¥DB;
use Illuminate\Support\Facades\Session;

class ChangePwController extends AppController
{
	
	// 当画面バージョン (バージョンを変更すると画面に新バージョン通知とクリアボタンが表示されます。）
	public $this_page_version = '1.0.0';
	
	private $cb; // CrudBase制御クラス
	private $md; // モデル
	
	/**
	 * パスワード変更CRUDページ
	 */
	public function index(){
	    
	    // ログアウトになっていたらログイン画面にリダイレクト
        if(\Auth::id() == null){
            return redirect('login');
        }
    
 		$this->init();

  		// CrudBase共通処理（前）
  		$crudBaseData = $this->cb->indexBefore();//indexアクションの共通先処理(CrudBaseController)
 		
 		$userInfo = $this->getUserInfo();
		$crudBaseData['userInfo'] = $userInfo;

		$crud_base_json = json_encode($crudBaseData,JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS);
		return view('change_pw.index', compact('crudBaseData', 'crud_base_json'));
		
		
	}
	
	
	/**
	 * DB登録
	 *
	 * @note
	 * Ajaxによる登録。
	 * 編集登録と新規入力登録の両方に対応している。
	 */
	public function ajax_reg(){
		
		$this->init();

		// すでにログアウトになったらlogoutであることをフロントエンド側に知らせる。
		if(\Auth::id() == null) return json_encode(['err_msg'=>'logout']);

		// JSON文字列をパースしてエンティティを取得する
		$json=$_POST['key1'];
		$formData = json_decode($json, true);
		
		$old_pw = $formData['old_pw'];
		$new_pw1 = $formData['new_pw1'];
		
		$user_id = \Auth::id();
		$userEnt = $this->md->getUserEntity($user_id); // DBからユーザーエンティティを取得する
		

		$hash = $userEnt['password'];
		if (!\Hash::check($old_pw, $hash)) {
		    $res = ['err_msg'=>'現在のパスワードが正しくありません。'];
		    return json_encode($res, JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS); // JSONに変換
		}
		
		// 新パスワードをハッシュ化してセットする
		$hash2 = \Hash::make($new_pw1); // パスワードをハッシュ化する。
		$userEnt['password'] = $hash2;

		$ent2  = $this->md->saveEntity($userEnt); // DB保存
		
        $res = ['success'=>1];
		
        $json_str = json_encode($res, JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS); // JSONに変換
		
		return $json_str;
		
	}
	
	
	/**
	 * CrudBase用の初期化処理
	 *
	 * @note
	 * フィールド関連の定義をする。
	 *
	 */
	private function init(){
		
		
		
		
		$crud_base_path = CRUD_BASE_PATH;
		$crud_base_js = CRUD_BASE_JS;
		$crud_base_css = CRUD_BASE_CSS;
		require_once $crud_base_path . 'CrudBaseController.php';
		
		$model = new ChangePw(); // モデルクラス
		
		$crudBaseData = [
				'fw_type' => 'laravel8',
				'model_name_c' => 'ChangePw',
				'tbl_name' => 'users', // テーブル名をセット
				'crud_base_path' => $crud_base_path,
				'crud_base_js' => $crud_base_js,
				'crud_base_css' => $crud_base_css,
		];
		
		$crudBaseCon = new \CrudBaseController($this, $model, $crudBaseData);
		
		$model->init($crudBaseCon);
		
		$this->md = $model;
		$this->cb =$crudBaseCon;
		
		$crudBaseData = $crudBaseCon->getCrudBaseData();
		return $crudBaseData;
		
	}

	
	public function getCb(){
	    return $this->cb;
	}
	
	public function getMd(){
	    return $this->md;
	}
	
	
}


