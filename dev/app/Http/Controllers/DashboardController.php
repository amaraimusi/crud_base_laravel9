<?php

namespace App\Http\Controllers;
use App\Http\Controllers\AppController;
use Illuminate\Http\Request;
use App\Models\Dashboard;
use Illuminate¥Support¥Facades¥DB;

class DashboardController extends AppController
{
	
	// 当画面バージョン
	public $this_page_version = '1.0.0';
	
	protected $cb; // CrudBase制御クラス
	protected $md; // モデル
	
	/**
	 * ネコCRUDページ
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
		return view('dashboard.index', compact('crudBaseData', 'crud_base_json'));
		
		
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
		
		$model = new Dashboard(); // モデルクラス
		
		$crudBaseData = [
			'fw_type' => 'laravel7',
			'model_name_c' => 'Dashboard',
			'tbl_name' => 'nekos', // テーブル名をセット
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
	
	
	
}


