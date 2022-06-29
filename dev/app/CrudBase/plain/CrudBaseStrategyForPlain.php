<?php

require_once CRUD_BASE_PATH . 'PdoDao.php';
require_once CRUD_BASE_PATH . 'SaveData.php';

/**
 * プレーン版ストラテジークラス
 * @version 1.0.2
 * @since 2021-12-9 | 2022-6-18
 * @license MIT
 */
class CrudBaseStrategyForPlain  implements ICrudBaseStrategy{
	
	private $ctrl; // クライアントコントローラ
	private $model; // クライアントモデル
	private $whiteList; // ホワイトリスト
	private $crudBaseData;
	private $dao; // PDO DAO
	private $users; // ユーザーエンティティ
	private $saveData; // データ保存クラス
	
	public function __construct(){
	    
	    // データベースアクセスオブジェクトであるPDOの生成とDB接続設定
	    global $crudBaseConfig;
	    $dbConfig = $crudBaseConfig['dbConfig'];
	    $this->dao = new PdoDao($dbConfig);
	    
	    $this->saveData = new SaveData();
	    


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
	    $res = $this->dao->query($sql);
		return $res;
	}
	
	public function query($sql){
		return $this->sqlExe($sql);
	}
	
	public function begin(){
		$res = $this->dao->query('BEGIN');
		return $res;
	}
	
	public function rollback(){
	    $res = $this->dao->query('ROLLBACK');
	    return $res;
	}
	
	public function commit(){
	    $res = $this->dao->query('COMMIT');
	    return $res;
	}
	
	
	/**
	 * セッションに書き込み
	 * @param string $key
	 * @param mixed $value 値
	 */
	public function sessionWrite($key, $value){
	    $_SESSION[$key] = $value;
	} 
	
	
	/**
	 *  セッションから読み取り
	 * @param string $key キー
	 * @return mixed 
	 */
	public function sessionRead($key){
	    if(empty($_SESSION[$key])) return null;
	    return $_SESSION[$key];
	}
	
	
	/**
	 * セッションから削除
	 * @param string $key キー
	 */
	public function sessionDelete($key){
	    unset($_SESSION[$key]);
	} 
	
	
	/**
	 * ユーザー情報を取得する
	 * @param [] $param
	 *  - review_mode レビューモード true:レビューモードON
	 *
	 * @return
	 *  - update_user 更新ユーザー
	 *  - ip_addr IPアドレス
	 *  - user_agent ユーザーエージェント
	 *  - role 権限
	 *  - authority 権限データ
	 */
	public function getUserInfo($param=[]){
	    
	    // ユーザー情報の構造
	    $userInfo = [
	        'id'=> 0,
	        'user_id'=> 0,
	        'update_user' => '',
	        'username' => '',
	        'user_name' => '',
	        'nickname' => '',
	        'ip_addr' => '',
	        'user_agent' => '',
	        'email'=>'',
	        'role' => 'oparator',
	        'delete_flg' => 0,
	        'authority' => [
	            'name' => '',
	            'wamei' => '',
	            'level' => 0,
	        ],
	    ];
	    
	    if(!empty($param['review_mode'])){
	        return $this->getUserInfoForReviewMode($userInfo); // レビューモード用ユーザー情報を取得
	    }
	    
	    // ユーザーエンティティを取得
	    $users = $this->getUsers();
	    
	    if($this->loginCheck()){// idは未ログインである場合、nullになる。
	        
	        $user_id = 0;
	        $user_name = '';
	        $nickname = '';
	        if(!empty($users['id'])) $user_id = $users['id'];
	        
	        if(!empty($users['name'])) $user_name = $users['name'];
	        if(!empty($users['user_name'])) $user_name = $users['user_name'];
	        if(!empty($users['nickname'])) $nickname = $users['nickname'];
	        if(empty($nickname))  $nickname = $user_name;
	        
	        $role = 'oparator';
	        if(!empty($users['role'])) $role = $users['role'];
	        
	        $userInfo['id'] = $user_id;
	        $userInfo['user_id'] = $user_id;
	        $userInfo['username'] = $user_name;
	        $userInfo['user_name'] = $user_name;
	        $userInfo['update_user'] = $user_name;
	        $userInfo['nickname'] = $nickname;
	        $userInfo['email'] = $users['email']; // メールアドレス
	        $userInfo['role'] = $role; // 権限
	        $userInfo['delete_flg'] = $users['delete_flg']; // 権限
	        $userInfo['user_agent'] = $_SERVER['HTTP_USER_AGENT']; // ユーザーエージェント
	        $userInfo['authority'] = $this->getAuthority($role);
	    }
	    
	    $userInfo['ip_addr'] = $_SERVER["REMOTE_ADDR"];// IPアドレス

	    
	    return $userInfo;
	}
	
	
	/**
	 * 権限に紐づく権限エンティティを取得する
	 * @param string $role 権限
	 * @return array 権限エンティティ
	 */
	private function getAuthority($role){
	    
	    // 権限データを取得する
	    global $crudBaseAuthorityData; // 権限データ
	    
	    // 権限データを取得する
	    $authorityData = $crudBaseAuthorityData;
	    
	    $authority = [];
	    if(!empty($authorityData[$role])){
	        $authority = $authorityData[$role];
	    }
	    
	    return $authority;
	}
	
	
	/**
	 * ユーザーエンティティを取得
	 * @return [] ユーザーエンティティ
	 */
	private function getUsers(){
	    if(!empty($this->users)) return $this->users;
	    
	    if(empty($_SESSION['uid'])) return [];
	    
	    $user_id = $_SESSION['uid'];
        $sql = "SELECT * FROM users WHERE id='{$user_id}'";
        $users = $this->selectEntity($sql);
	    $this->users = $users;
	    return $users;
	}
	
	
	/**
	 *  レビューモード用ユーザー情報を取得
	 * @param [] $userInfo
	 * @return [] $userInfo
	 */
	private function getUserInfoForReviewMode(&$userInfo){
	    
	    $userInfo['id'] = -1;
	    $userInfo['user_id'] = $userInfo['id'];
	    $userInfo['update_user'] = 'dummy';
	    $userInfo['username'] = $userInfo['update_user'];
	    $userInfo['update_user'] = $userInfo['update_user'];
	    $userInfo['ip_addr'] = 'dummy_ip';
	    $userInfo['user_agent'] = 'dummy_user_agent';
	    $userInfo['email'] = 'dummy@example.com';
	    $userInfo['role'] = 'admin';
	    $userInfo['delete_flg'] = 0;
	    $userInfo['nickname'] = '見本ユーザー';
	    $userInfo['authority']['name'] = 'admin';
	    $userInfo['authority']['wamei'] = '見本';
	    $userInfo['authority']['level'] = 30;
	    $userInfo['review_mode'] = 1; // 見本モードON;
	    
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
		
	    $tbl_name = $this->crudBaseData['tbl_name'];

		$ent = array_intersect_key($ent, array_flip($this->whiteList)); // ホワイトリストによるフィルタリング
		
		$res = $this->saveData->save($tbl_name, $ent); // DB保存
		$ent = $res['ent'];
		
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
	    
	    $tbl_name = $this->crudBaseData['tbl_name'];
	    $sql = "DELETE FROM {$tbl_name} WHERE id='{$id}';";
	    $res = $this->sqlExe($sql);
	    
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
		//throw new Exception("'validForKj'は未実装です。");
		return '';
	}
	
	/**
	 * CSRFトークンを取得する ※Ajaxのセキュリティ
	 * @return mixed CSRFトークン
	 */
	public function getCsrfToken(){
        // 非推奨
        return null;
		
	}
	
	
	/**
	 * SQLを実行して単一の値を取得する
	 * @param string $sql
	 * @return mixed 単一の値
	 */
	public function selectValue($sql){
	    $res = $this->selectEntity($sql);
	    
	    if(empty($res)) return null;
	    
	    $value = current($res);
	    return $value;

	}
	
	
	/**
	 * SQLを実行してエンティティを取得する
	 * @param string $sql
	 * @return [] エンティティ
	 */
	public function selectEntity($sql){
	    $res = $this->sqlExe($sql);
		
	    if(empty($res)) return [];

	    $ent = [];
	    foreach($res[0] as $key => $value){
	        if(!is_numeric($key)){
	            $ent[$key] = $value;
	        }
	    }

		return $ent;

	}
	
	
	/**
	 * SQLを実行してデータを取得する
	 * @param string $sql
	 * @return [] データ（エンティティの配列）
	 */
	public function selectData($sql){
	    $res = $this->sqlExe($sql);
	    return $res;

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
	 * $option []
	 *  - submit_key Submitボタンのキー（POSTのname属性）
	 *  - email_key Eメール要素のキー（POSTのname属性）
	 *  - pw_key パスワード要素のキー（POSTのname属性）
	 *  - referer ログイン後の移動先URL
	 * @return 0:ログイン失敗, 1:既にログイン済み, -1:Submitボタンが押されていない
	 */
	public function login($option=[]){
	    
	    $submit_key = $option['submit_key'] ?? 'login_submit';
	    $email_key = $option['email_key'] ?? 'email';
	    $pw_key = $option['pw_key'] ?? 'password';
	    
	    $referer = $option['referer'] ?? '';
	    if(empty($referer)){
	        $referer = $_SESSION['referer'] ?? '/';
	    }
	    
	    // Submitボタンが押されたときに、ログインの認証処理を行う。
	    if(!empty($_POST[$submit_key])){
	        
	        // 既にログイン済みであるか判定、未ログインである場合のみログイン認証を開始する。
	        if(empty($_SESSION['uid'])){
	            $email = $_POST[$email_key];
	            $users = $this->getUsersByEmail($email_key, $email); // usersテーブルからEメールに紐づくユーザーエンティティを取得する
	            $user_id = $users['id'];
	            $pw_hash = $users['password'];
	            
	            // パスワードの一致判定
	            if(password_verify($_POST[$pw_key], $pw_hash)){
	                session_regenerate_id(true); // セッションの更新
	                $_SESSION['uid'] =$user_id; // ログイン状態にする。
	                header('Location: ' . $referer);// 遷移元のページにリダイレクトする。
	                exit();
	            }else{
	                logB("ログイン失敗:{$email}  {$_POST[$pw_key]}");
	                return 0;
	            }
	        }
	        return 1;
	    }
	    
	    return -1;
	}
	
	/**
	 * usersテーブルからEメールに紐づくユーザーエンティティを取得する
	 * @param string $email_key usersテーブルにおける、Eメールのフィールド名
	 * @param string $email Eメールアドレス
	 * @return [] ユーザーエンティティ
	 */
	private function getUsersByEmail( $email_key, $email){
	    
	    // 本来は、DBからユーザーEメールにひもづくパスワードハッシュを取得処理である。
	    $ent = $this->selectEntity("SELECT * FROM users WHERE {$email_key} = '{$email}'");

	    return $ent;

	}
	
	
	/**
	 * ログアウトする
	 * {@inheritDoc}
	 * @see ICrudBaseStrategy::logout()
	 * $option []
	 *  - referer ログイン後の移動先URL
	 */
	public function logout($option = []){

	    $_SESSION['uid'] = null; // ログアウト状態にする
	    
	    $referer = $option['referer'] ?? '';
	    if(empty($referer)){
	        $referer = $_SESSION['referer'] ?? '/';
	    }

	    header('Location: ' . $referer);// 遷移元のページにリダイレクトする。
	}
	
	/*
	 *  ログインチェック
	 *  @return true:ログイン状態, false:未ログイン
	 */
	public function loginCheck(){
	    if(empty($_SESSION['uid'])){
	        return false;
	    }
	    return true;
	}
	
    public function getAuth()
    {
        return $this->getUserInfo();
    }

	
	
	
}