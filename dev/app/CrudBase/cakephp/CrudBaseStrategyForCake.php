<?php
App::uses('AppController', 'Controller');


/**
 * Cake2.x用ストラテジークラス
 * @version 1.0.7
 * @since 2020-6-10 | 2021-12-5
 * @license MIT
 */
class CrudBaseStrategyForCake extends AppController implements ICrudBaseStrategy{
	
	private $ctrl; // クライアントコントローラ
	private $model; // クライアントモデル
	private $whiteList; // ホワイトリスト
	private $crudBaseData;
	private $csrf_token;
	
	/**
	 * クライアントコントローラのセッター
	 * @param mixed $ctrl クライアントコントローラ
	 */
	public function setCtrl($ctrl){
		$this->ctrl = $ctrl;
	}
	
	
	/**
	 * クライアントモデルのセッター
	 * @param mixed $model クライアントモデル
	 */
	public function setModel($model){
		$this->model = $model;
	}
	
	public function sqlExe($sql){
		return $this->model->query($sql);
	}
	
	public function query($sql){
		return $this->sqlExe($sql);
	}
	
	public function begin(){
		return $this->sqlExe('BEGIN');
	}
	
	public function rollback(){
		return $this->sqlExe('ROLLBACK');
	}
	
	public function commit(){
		return $this->sqlExe('COMMIT');
	}
	
	
	/**
	 * セッションに書き込み
	 * @param string $key
	 * @param mixed $value 値
	 */
	public function sessionWrite($key, $value){
		$this->ctrl->Session->write($key, $value);
	} 
	
	
	/**
	 *  セッションから読み取り
	 * @param string $key キー
	 * @return mixed 
	 */
	public function sessionRead($key){
		return $this->ctrl->Session->read($key);
	}
	
	
	/**
	 * セッションから削除
	 * @param string $key キー
	 */
	public function sessionDelete($key){
		$this->ctrl->Session->delete($key);
	} 
	
	
	/**
	 * ユーザー情報を取得する
	 * 
	 * @return
	 *  - update_user 更新ユーザー
	 *  - ip_addr IPアドレス
	 *  - user_agent ユーザーエージェント
	 *  - role 権限
	 *  - authority 権限データ
	 */
	public function getUserInfo(){
		$userInfo = $this->ctrl->Auth->user();
		$update_user = '';
		$userInfo['update_user'] = $update_user;// 更新ユーザー
		$userInfo['ip_addr'] = $_SERVER["REMOTE_ADDR"];// IPアドレス
		$userInfo['user_agent'] = $_SERVER['HTTP_USER_AGENT']; // ユーザーエージェント

		// 権限が空であるならオペレータ扱いにする
		if(empty($userInfo['role'])){
			$userInfo['role'] = 'oparator';
		}
		
		$userInfo['nickname'] = '';
		if(!empty($userInfo['id'])){
			$user2 = $this->sqlExe("SELECT nickname FROM users WHERE id={$userInfo['id']}");
			
			$userInfo['nickname'] = $user2[0]['users']['nickname'];
		}

		return $userInfo;
	}
	
	
	/**
	 * パス情報を取得する
	 * @return []
	 *  - home_r_path string ホーム相対パス
	 *  - webroot string  ホーム相対パスのエイリアス(別名)
	 */
	public function getPath(){
		$webroot = $this->ctrl->webroot;
		$home_r_path = $webroot;
		
		return [
			'home_r_path' => $home_r_path,
			'webroot' => $webroot,
		];
	}
	
	
	/**
	 * データをDB保存
	 * @param [] $data データ（エンティティの配列）
	 * @param [] $option
	 */
	public function saveAll(&$data, &$option = []){
		
		if(!isset($option['atomic'])) $option['atomic'] = false;
		if(!isset($option['validate'])) $option['validate'] = false;
		$rs=$this->model->saveAll($data, $option);
		return $rs;
	}
	
	
	/**
	 * エンティティをDB保存
	 * @param [] $ent エンティティ
	 * @param [] $option
	 */
	public function save(&$ent, &$option = []){
		if(!isset($option['atomic'])) $option['atomic'] = false;
		if(!isset($option['validate'])) $option['validate'] = false;
		$rs=$this->model->save($ent, $option);
		return $rs;
	}
	
	
	/**
	 * エンティティをDB保存(シンプル版)
	 * ※SQLインジェクションのサニタイズは当メソッドで行っていないためよく注意すること。
	 * @param [] $ent エンティティ
	 * @param string $tbl_name
	 */
	public function saveSimple(&$ent, $tbl_name){
	    $res = $this->saveData->save($tbl_name, $ent); // DB保存

	    return $res;
	}
	
	/**
	 * 検索条件のバリデーション
	 *
	 * 引数のデータを、バリデーション情報を元にエラーチェックを行います。
	 * その際、エラーがあれば、エラーメッセージを作成して返します。
	 *
	 * @param array $data バリデーション対象データ
	 * @param array $validate バリデーション情報
	 * @return string 正常な場合、nullを返す。異常値がある場合、エラーメッセージを返す。
	 */
	public function validForKj($data,$validate){
		$errMsg=null;
		//▽バリデーション（入力チェック）を行い、正常であれば、改めて検索条件情報を取得。
		$this->model->validate=$validate;
		
		$this->model->set($data);
		if (!$this->model->validates($data)){
			
			////入力値に異常がある場合。（エラーメッセージの出力仕組みはcake phpの仕様に従う）
			$errors=$this->model->validationErrors;//入力チェックエラー情報を取得
			if(!empty($errors)){
				
				foreach ($errors  as  $err){
					
					foreach($err as $val){
						
						$errMsg.= $val.' ： ';
						
					}
				}
				
			}
			
		}
		
		return $errMsg;
	}
	
	public function selectData($sql)
	{
		throw new Error('まだ実装されてません。：selectData');
	}
	
	public function selectValue($sql)
	{
		
		$res = $this->sqlExe($sql);
		$value = null;
		if(!empty($res)){
			$ent = current($res);
			$ary = current($ent);
			$value = current($ary);
		}
		return $value;
	}
	
	public function getCsrfToken()
	{
		
// 		$page_code = $this->crudBaseData['main_model_name_s'];
// 		$ses_key = $page_code . '_csrf_token'; // セッションキーを組み立て

// 		$this->csrf_token = $this->random();
// 		$this->ctrl->Session->write($ses_key, $this->csrf_token);//セッションへの書き込み
		
// 		return $this->csrf_token;
		
		return null;
	}
	
	private function random($length = 8)
	{
		return base_convert(mt_rand(pow(36, $length - 1), pow(36, $length) - 1), 10, 36);
	}
	
	public function delete($id)
	{
		throw new Error('まだ実装されてません。delete');
	}
	
	public function selectEntity($sql)
	{
		throw new Error('まだ実装されてません。selectEntity');
	}
	
	public function setWhiteList(&$whiteList)
	{
		$this->whiteList = $whiteList;
	}
	
	public function setCrudBaseData(&$crudBaseData)
	{
		$this->crudBaseData = $crudBaseData;
	}
	
	public function passwordToHash($pw){
		App::uses('AuthComponent', 'Controller/Component');
		$pw_hash = AuthComponent::password($pw);
		return $pw_hash;
	}
	
	/**
	 * ログインする
	 * {@inheritDoc}
	 * @see ICrudBaseStrategy::login()
	 */
	public function login($option=[]){
	    throw new Exception('loginメソッドは未実装です。');
	}
	
	/**
	 * ログアウトする
	 * {@inheritDoc}
	 * @see ICrudBaseStrategy::logout()
	 */
	public function logout($option = []){
	    $this->redirect($this->ctrl->Auth->logout());
	}
	
	/*
	 *  ログインチェック
	 *  @return true:ログイン状態, false:未ログイン
	 */
	public function loginCheck(){
	    if(empty($this->ctrl->Auth->user())){
	        return false;
	    }
	    return true;
	}
	
	public function getAuth()
	{
	    return $this->getUserInfo();
	}
	
}