<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

/**
 * ダッシュボードのモデルクラス
 * @since 2021-7-26
 * @license MIT
 * @author kenji uehara
 *
 */
class Dashboard extends Model{

	
	
    protected $cb; // CrudBase制御クラス
	
	
	public function __construct(){
		
	}
	
	
	/**
	 * 初期化
	 * @param CrudBaseController $cb
	 */
	public function init($cb){
		$this->cb = $cb;
		
		// ホワイトリストをセット
		$cbParam = $this->cb->getCrudBaseData();

	}

	
}
