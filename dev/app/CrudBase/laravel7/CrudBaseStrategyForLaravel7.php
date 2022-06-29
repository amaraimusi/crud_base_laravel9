<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
require_once CRUD_BASE_PATH . 'PdoDao.php';
require_once CRUD_BASE_PATH . 'SaveData.php';

/**
 * Laravel7用ストラテジークラス
 * @version 1.1.3
 * @since 2020-6-10 | 2022-617
 * @license MIT
 */
class CrudBaseStrategyForLaravel7  implements ICrudBaseStrategy{
	
	private $ctrl; // クライアントコントローラ
	private $model; // クライアントモデル
	private $whiteList; // ホワイトリスト
	private $crudBaseData;
	private $dao; // IDaoインターフェースを実装したクラス。PdoDaoクラスなど。
	private $pdo; // PDOオブジェクト
	
	public function __construct(){
	    $this->pdo = \DB::connection()->getPdo();
	
	    $this->dao = new PdoDao(null, $this->pdo);
	   
	    $this->saveData = new SaveData($this->dao);
	    
	}
	
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
	
	
	/**
	 * ホワイトリストのセッター
	 * @param [] $whiteList ホワイトリスト
	 */
	public function setWhiteList(&$whiteList){
		$this->whiteList = $whiteList;
	}
	
	
	/**
	 * SQLを実行する
	 * @param string $sql SQL文
	 * @return mixed
	 */
	public function sqlExe($sql){
		$res = \DB::select($sql);
		return $res;
	}
	
	public function query($sql){
		return $this->sqlExe($sql);
	}
	
	public function begin(){
		\DB::beginTransaction();
	}
	
	public function rollback(){
		\DB::rollback();
	}
	
	public function commit(){
		\DB::commit();
	}
	
	
	/**
	 * セッションに書き込み
	 * @param string $key
	 * @param mixed $value 値
	 */
	public function sessionWrite($key, $value){
		Session::put($key, $value);
	} 
	
	
	/**
	 *  セッションから読み取り
	 * @param string $key キー
	 * @return mixed 
	 */
	public function sessionRead($key){
		return $value = session($key);
	}
	
	
	/**
	 * セッションから削除
	 * @param string $key キー
	 */
	public function sessionDelete($key){
	    Session::forget($key);
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
		
		$userInfo =[
				'update_user' => '',
				'user_name' => '',
				'user_id' => '',
				'user_email' => '',
				'ip_addr' => $_SERVER["REMOTE_ADDR"], // IPアドレス,
				'user_agent' => $_SERVER['HTTP_USER_AGENT'], // ユーザーエージェント,
				'role' => 'none',
		];
		
		if(\Auth::id()){// idは未ログインである場合、nullになる。
			$user_id = \Auth::id(); // ユーザーID（番号）
			$user_name = \Auth::user()->name; // ユーザー名
			$user_email = \Auth::user()->email; // メールアドレス
			$role = \Auth::user()->role; // 権限
			
			$userInfo['update_user'] = $user_name;
			$userInfo['user_name'] = $user_name;
			$userInfo['user_id'] = $user_id;
			$userInfo['user_email'] = $user_email;
			$userInfo['role'] = $role;
			
			// 権限が空であるならオペレータ扱いにする
			if(empty($userInfo['role'])){
				$userInfo['role'] = 'oparator';
			}
			
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
		$web_root = CRUD_BASE_URL_BASE;
		$home_r_path = $web_root;
		
		return [
				'home_r_path' => $home_r_path,
				'webroot' => $web_root,
		];
	}
	
	
	/**
	 * データをDB保存
	 * @param [] $data データ（エンティティの配列）
	 * @param [] $option ホワイトリスト
	 */
	public function saveAll(&$data, &$option=[]){
		
		foreach($data as &$ent){
			$this->saveEntity($ent, $option);
		}
		unset($ent);
		
	}
	
	
	/**
	 * エンティティをDB保存
	 * @param [] $ent エンティティ
	 * @param [] $option
	 */
	public function save(&$ent, &$option=[]){
		return $this->saveEntity($ent, $option);
	}
	
	
	/**
	 * エンティティのDB保存
	 * @param [] $ent エンティティ
	 * @param [] $whiteList ホワイトリスト
	 * @return [] エンティティ(insertされた場合、新idがセットされている）
	 */
	public function saveEntity(&$ent, &$option=[]){
		

		$ent = array_intersect_key($ent, array_flip($this->whiteList)); // ホワイトリストによるフィルタリング
		
		
		if(empty($ent['id'])){
			// ▽ idが空であればINSERTをする。
			$id = $this->model->insertGetId($ent); // INSERT
			$ent['id'] = $id;
		}else{

			// ▽ idが空でなければUPDATEする。
			$this->model->updateOrCreate(['id'=>$ent['id']], $ent); // UPDATE
		}
		
		return $ent;
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
	 * idに紐づくレコードをDB削除
	 * @param int $id
	 */
	public function delete($id){
		$rs=$this->model->destroy($id); // idに紐づくレコードをDB削除
		return $rs;
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
		return '';
	}
	
	/**
	 * CSRFトークンを取得する ※Ajaxのセキュリティ
	 * @return mixid CSRFトークン
	 */
	public function getCsrfToken(){
		return csrf_token(); // ← Laravelの関数
	}
	
	
	/**
	 * SQLを実行して単一の値を取得する
	 * @param string $sql
	 * @return mixed 単一の値
	 */
	public function selectValue($sql){
		$res = \DB::select($sql);
		
		$value = null;
		if(!empty($res)){
			$ent = current($res);
			$value = current($ent);
		}
		
		return $value;
	}
	
	
	/**
	 * SQLを実行してエンティティを取得する
	 * @param string $sql
	 * @return [] エンティティ
	 */
	public function selectEntity($sql){
		$res = \DB::select($sql);
		
		$ent = [];
		if(!empty($res)){
			$ent = current($res);
			$ent = (array)$ent;
		}
		
		return $ent;
	}
	
	
	/**
	 * SQLを実行してデータを取得する
	 * @param string $sql
	 * @return [] データ（エンティティの配列）
	 */
	public function selectData($sql){
		$data = \DB::select($sql);
		
		$data2 = [];
		if(!empty($data)){
			foreach($data as $ent){
				$data2[] = (array)$ent;
			}
		}
		
		return $data2;
	}
	
	public function setCrudBaseData(&$crudBaseData)
	{
		$this->crudBaseData = $crudBaseData;
	}
	
	public function passwordToHash($pw){
		throw new Error('passwordToHashメソッドは未実装です。');
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
	    if(!empty(\Auth::id())){
	        \Auth::logout();
	    }
	}
	
	/*
	 *  ログインチェック
	 *  @return true:ログイン状態, false:未ログイン
	 */
	public function loginCheck(){
	    if(empty(\Auth::id())){
	        return false;
	    }
	    return true;
	}
	
	public function getAuth()
	{
	    return $this->getUserInfo();
	}
	
}