<?php

namespace App\Http\Controllers;
use App\Http\Controllers\AppController;
use Illuminate\Http\Request;
use App\Models\WebApi;
use Illuminate¥Support¥Facades¥DB;

class WebApiController extends AppController
{
	
	// 当画面バージョン
	public $this_page_version = '1.0.0';
	
	protected $cb; // CrudBase制御クラス
	protected $md; // モデル
	
	
	
	/**
	 * CrudBase用の初期化処理
	 *
	 * @note
	 * フィールド関連の定義をする。
	 *
	 */
	private function init(){

		
		$crud_base_path = CRUD_BASE_PATH;
		require_once $crud_base_path . 'CrudBaseController.php';
		
		$model = new WebApi(); // モデルクラス
		
		$crudBaseData = [
			'fw_type' => 'laravel8',
			'model_name_c' => 'Api',
			'tbl_name' => 'nekos', // テーブル名をセット
			'crud_base_path' => $crud_base_path,
		];
		
		$crudBaseCon = new \CrudBaseController($this, $model, $crudBaseData);
		
		$model->init($crudBaseCon);
		
		$this->md = $model;
		$this->cb =$crudBaseCon;
		
		$crudBaseData = $crudBaseCon->getCrudBaseData();
		return $crudBaseData;
		
	}
	
	
	
	/**
	 * APIテスト
	 */
	public function cors_test(){

		$param_json = $_POST['key1'];
		$param = json_decode($param_json,true);//JSON文字を配列に戻す
		
		$param['success'] = 'success';
		
		$json = json_encode($param, JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS);
		return $json;
		
		
	}

	
	
	
}


