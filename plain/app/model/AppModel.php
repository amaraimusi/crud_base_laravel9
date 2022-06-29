<?php
/**
 * Application model for Cake.
 *
 * This file is application-wide model file. You can put all
 * application-wide model-related methods here.
 *
 * PHP 5
 *
 * CakePHP(tm) : Rapid Development Framework (http://cakephp.org)
 * Copyright 2005-2012, Cake Software Foundation, Inc. (http://cakefoundation.org)
 *
 * Licensed under The MIT License
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright 2005-2012, Cake Software Foundation, Inc. (http://cakefoundation.org)
 * @link          http://cakephp.org CakePHP(tm) Project
 * @package       app.Model
 * @since         CakePHP(tm) v 0.2.9
 * @license       MIT License (http://www.opensource.org/licenses/mit-license.php)
 */


/**
 * CakePHPが用意しているモデルの基本クラス
 * 
 * 特に処理はない。
 * 
 * Application model for Cake.
 *
 * Add your application-wide methods in the class below, your models
 * will inherit them.
 *
 * @package       app.Model
 */
class AppModel {

    protected $cb; // CrudBase制御クラス
    
    public function __construct() {
        
    }
	
	// 更新ユーザーなど共通フィールドをデータにセットする。
	protected function setCommonToData($data,$update_user){
	
	
		// ユーザーエージェント
		$user_agent = $_SERVER['HTTP_USER_AGENT'];
		$user_agent = mb_substr($user_agent,0,255);
	
		// IPアドレス
		$ip_addr = $_SERVER["REMOTE_ADDR"];
	
		// 本日
		$today = date('Y-m-d H:i:s');
	
		// データにセットする
		foreach($data as $i => $ent){
				
			$ent['update_user'] = $update_user;
			$ent['user_agent'] = $user_agent;
			$ent['ip_addr'] = $ip_addr;
				
			// idが空（新規入力）なら生成日をセットし、空でないなら除去
			if(empty($ent['id'])){
				$ent['created'] = $today;
			}else{
				unset($ent['created']);
			}
				
			$ent['modified'] = $today;
	
				
			$data[$i] = $ent;
		}
	
	
		return $data;
	
	}
	
	
	
	// 更新ユーザーなど共通フィールドをセットする。
	protected function setCommonToEntity($ent,$update_user){
	
		// 更新ユーザーの取得とセット
		//$update_user = $this->Auth->user('username');
		$ent['update_user'] = $update_user;
	
		// ユーザーエージェントの取得とセット
		$user_agent = $_SERVER['HTTP_USER_AGENT'];
		$user_agent = mb_substr($user_agent,0,255);
		$ent['user_agent'] = $user_agent;
	
		// IPアドレスの取得とセット
		$ip_addr = $_SERVER["REMOTE_ADDR"];
		$ent['ip_addr'] = $ip_addr;
	
		// idが空（新規入力）なら生成日をセットし、空でないなら除去
		if(empty($ent['id'])){
			$ent['created'] = date('Y-m-d H:i:s');
		}else{
			unset($ent['created']);
		}
	
		// 更新日時は除去（DB側にまかせる）
		if(isset($ent['modified'])){
			unset($ent['modified']);
		}
	
	
		return $ent;
	
	}
	
	
	/**
	 * 削除フラグを切り替える
	 * @param array $ids IDリスト
	 * @param int $delete_flg 削除フラグ   0:有効  , 1:削除
	 * @param string $update_user 更新ユーザー
	 */
	public function switchDeleteFlg($ids,$delete_flg,$update_user){
	
		// IDリストと削除フラグからデータを作成する
		$data = array();
		foreach($ids as $id){
			$ent = array(
					'id' => $id,
					'delete_flg' => $delete_flg,
			);
			$data[] = $ent;
				
		}
	
		// 更新ユーザーなど共通フィールドをデータにセットする。
		$data = $this->setCommonToData($data,$update_user);
	
		// データを更新する
		$rs=$this->saveAll($data, array('atomic' => false,'validate'=>false));
	
		return $rs;
	
	}
	
	/**
	 * SQLインジェクションサニタイズ
	 * @param mixed $data 文字列および配列に対応
	 * @return mixed サニタイズ後のデータ
	 */
	public function sqlSanitizeW(&$data){
		$this->sql_sanitize($data);
		return $data;
	}
	
	
	/**
	 * SQLインジェクションサニタイズ(配列用)
	 *
	 * @note
	 * SQLインジェクション対策のためデータをサニタイズする。
	 * 高速化のため、引数は参照（ポインタ）にしている。
	 *
	 * @param array サニタイズデコード対象のデータ
	 * @return void
	 */
	public function sql_sanitize(&$data){
		
		if(is_array($data)){
			foreach($data as &$val){
				$this->sql_sanitize($val);
			}
			unset($val);
		}elseif(gettype($data)=='string'){
			$data = addslashes($data);// SQLインジェクション のサニタイズ
		}else{
			// 何もしない
		}
	}
	
	/**
	 * エンティティをDB保存(シンプル版)
	 * @param [] $ent エンティティ
	 * @param string $tbl_name
	 */
	public function saveSimple(&$ent, $tbl_name){
	    return $this->cb->saveSimple($ent, $tbl_name);
	    
	}

}
