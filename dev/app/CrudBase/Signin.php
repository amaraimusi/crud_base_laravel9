<?php
require_once 'ICrudBaseStrategy.php';

/**
 * サインイン
 * 
 * @note
 * メール
 * 
 * @since 2020-4-23
 * @license MIT
 * @version 1.0.0
 */
class Signin{

	var $strategy;
	
	/**
	 * コンストラクタ
	 * @param ICrudBaseStrategy.php $strategy フレームワークストラテジー
	 * @param string $update_user 更新ユーザー
	 */
	public function __construct($ctrl, $model){
		global $crudBaseConfig; // crud_base_config.phpで定義しているデータ
		$fw_type = $crudBaseConfig['fw_type'];
		
		if($fw_type == 'cake_php' || $fw_type == 'cakephp' ){
			require_once CRUD_BASE_PATH . 'cakephp/CrudBaseStrategyForCake.php';
			$this->strategy = new CrudBaseStrategyForCake();

		}
		
		else if($fw_type == 'laravel' || $fw_type == 'laravel7'){
			require_once CRUD_BASE_PATH . 'laravel7/CrudBaseStrategyForLaravel7.php';
			$this->strategy = new CrudBaseStrategyForLaravel7();
		}else{
			throw new Error('$fw_type is noting!');
		}
		
		$this->strategy->setCtrl($ctrl);
		$this->strategy->setModel($model);
		
	}
	
	
	
	/**
	 * Ajax 仮登録アクション（パスワード再発行もかねる）
	 * @param [] $param
	 *  - step2_url string 本登録URL（クエリ部分なし）
	 * @return string
	 */
	public function tempRegAction($param = []){
		
		global $crudBaseConfig; // crud_base_config.phpで定義しているデータ

		if(empty($_SESSION)) session_start();
		
		// CSRFトークンによるセキュリティチェック
		if(CrudBaseU::checkCsrfToken('signin_x') == false){
			return '不正なアクションを検出しました。';
		}
		
		// 本登録URLの組み立て、または取得
		$step2_url = ''; // 本登録URL
		if(empty($param['step2_url'])){
			
			// 本登録URLの組み立て 例→https://amaraimusi.sakura.ne.jp/cake_demo/signin_x/step2
			$project_path = $crudBaseConfig['crud_base_project_path'];
			$step2_url=(empty($_SERVER["HTTPS"]) ? "http://" : "https://") . $_SERVER["HTTP_HOST"];
			$step2_url .= $project_path . '/signin_x/step2';
		}else{
			$step2_url = $param['step2_url'];
		}

		$email = $param['email'] ?? null;
		if($email == null) throw new Error('システムエラー04234');

		$repw_flg = $param['repw_flg'] ?? 0; // パスワード再発行フラグ
		$exit_rec_flg = 0; // 既存レコード有フラグ
		$pw_flg = 0; // パスワード有フラグ
		$send_mail_flg = 0; // メール送信フラグ
		$dev_flg = 0; // 開発環境フラグ 0:本番, 1:開発環境
		
		if($_SERVER['SERVER_NAME'] == 'localhost') $dev_flg = 1;
		

		// メールアドレスを指定してDBからユーザーエンティティを取得する
		$ent = $this->getUserEntityByEmail($email);
		
		if(!empty($ent)){
			$exit_rec_flg = 1; // ユーザーエンティティが空でなければ既存レコード有フラグ ON
			if(!empty($ent['password'])) $pw_flg = 1; // パスワードが存在するならパスワード有フラグをONにする。
		}

		// 既存レコード有フラグがON且つ、パスワード有フラグをON、パスワード再設定フラグOFFである場合、「パスワード再発行対象」
		if($exit_rec_flg == 1 && $pw_flg == 1 && $repw_flg == 0){
			$res = ['is_repw'=>1];
			return $res;
		}
		
		// 既存レコード有フラグがOFFなら、デフォルトのユーザーエンティティを作成
		if($exit_rec_flg == 0){
			$ent = [
				'username' => $email, // ユーザー名にはメールアドレスをセット
				'email' => $email,
				'role' => 'oparator', // 最低権限をセット
			];
		}
		
		// ランダム且つ、一意のハッシュコードを生成する。
		$ent['temp_hash'] = $this->createHash();
		
		// SigninXの設定データをDBから取得する。
		$configs = $this->getConfigsForSigninX();
		
		// 仮登録制限時刻を取得
		$limit_time = trim($configs['limit_time']);
		$temp_datetime = $this->getTempDatetime($limit_time);
		$ent['temp_datetime'] = $temp_datetime;
		
		$this->save($ent);
		
		// 本登録URLに仮登録ハッシュコードをクエリとして付け足す。
		$step2_url .= '?th=' . $ent['temp_hash'];
		
		// パスワード再発行ならさらにクエリを付け足し
		if(!empty($repw_flg)){
			$step2_url .= '&repw=1';
		}
		
		
		// ▼ メール送信処理
		
		$mail_title = ''; // メール件名
		$mail_text = ''; // メール本文
		
		// パスワード再発行フラグによるメールメッセージの分岐
		if(empty($repw_flg)){
			$mail_title = $configs['mail_title1'];
			$mail_text = $configs['mail_text1'];
		}else{
			$mail_title = $configs['mail_title1_repw'];
			$mail_text = $configs['mail_text1_repw'];
		}
		
		$date = new DateTime($temp_datetime);
		$limit_time_str =  $date->format("Y年m月d日 H時i分");
		
		$mail_text = str_replace('%url', $step2_url, $mail_text);
		$mail_text = str_replace('%datetime', $limit_time_str, $mail_text);
		
		// 日本語文字化け対策
		mb_language("Japanese");
		mb_internal_encoding("UTF-8");
		
		$to = $email; // 宛先メールアドレス
		$subject = $mail_title;
		$message = $mail_text;
		$headers = "";
		
		$dev_mailtext = "";// 開発用メールテキスト
		
		// メール送信
		if($dev_flg == 0){
			mb_send_mail($to, $subject, $message, $headers);
		}else{
			$dev_mailtext = '※ローカル開発環境ではメール送信しないので、メール内容を以下に表示する。↓↓↓' . "\n\n" . $subject . "\n" . $message;
		}
		
		$send_mail_flg = 1; // メール送信フラグをONにする。
		
		// フロントエンドへのレスポンスデータ
		$res = [
			'repw_flg' => $repw_flg,
			'send_mail_flg' => $send_mail_flg,
			'dev_flg' => $dev_flg,
			'dev_mailtext' => $dev_mailtext,
		];
		
		return $res;
		
		
	}
	
	
	/**
	 * SigninXの設定データをDBから取得する。
	 * @return [] 設定データ
	 */
	private function getConfigsForSigninX(){
		
		// 設定テーブルから仮登録メール用の「件名」、「メール文」、「有効時間」等を取得する
		$sql = "SELECT config_key, config_value FROM config_xs WHERE group_key = 'signin_x'";
		$resData = $this->sqlExe($sql);

		if(empty($resData)) throw new Error('システムエラー04233:SigninX:not data');

		$configs = [];
		foreach($resData as $confEnt){
			$config_key = $confEnt['configs']['config_key'];
			$config_value = $confEnt['configs']['config_value'];
			$configs[$config_key] = $config_value;
		}
		
		return $configs;

	}
	
	
	
	/**
	 * 仮登録制限時刻を取得およびセット
	 * @return string 仮登録制限時刻
	 */
	private function getTempDatetime($limit_time){
		$date = new DateTime();
		$date->modify("+{$limit_time} hour");
		$temp_datetime =  $date->format("Y-m-d H:i:s");
		return $temp_datetime;
		
	}
	
	
	// メールアドレスを指定してDBからユーザーエンティティを取得する
	private function getUserEntityByEmail($email){
		// SQLインジェクションサニタイズ
		$email = $this->sqlSanitizeW($email);
		$sql = "SELECT * FROM users WHERE email='{$email}'";
		
		$ent = [];
		$resData = $this->sqlExe($sql);
		if(!empty($resData)){
			$ent = $resData[0]['users'];
		}
		return $ent;
	}
	
	
	/**
	 * SQLインジェクションサニタイズ
	 * @param mixed $data 文字列および配列に対応
	 * @return mixed サニタイズ後のデータ
	 */
	private function sqlSanitizeW(&$data){
		$this->sql_sanitize($data);
		return $data;
	}
	
	
	/**
	 * ランダム且つ、一意のハッシュコードを生成する。
	 * @return string ハッシュコード
	 */
	private function createHash(){
		$hash = '';
		$flg = 1;
		while ($flg){
			$hash = CrudBaseU::randomHash(20);
			$sql = "SELECT id FROM users WHERE temp_hash='{$hash}'";
			$res = $this->sqlExe($sql);
			if(empty($res)){
				$flg = 0;
			}
		}
		return $hash;
		
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
	private function sql_sanitize(&$data){
		
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
	 * SQLを実行
	 * @param string $sql
	 */
	private function sqlExe(&$sql){
		return $this->strategy->sqlExe($sql);
	}
	
	
	/**
	 * エンティティをDB保存
	 * @param [] エンティティ
	 */
	private function save(&$ent){
		return $this->strategy->save($ent);
	}
	
	
	/**
	 * 本登録アクション
	 */
	public function step2(){
		
		if(empty($_GET['th'])){
			echo 'Invalid access! ERROR16231';
			die();
		}
		
		// パスワード再発行フラグを取得する
		$repw_flg = 0;
		if(!empty($_GET['repw'])){
			$repw_flg = 1;
		}
		
		$res = [
			'limit_over_flg' => 0,
			'csrf_token'=>'',
		];
		
		$temp_hash = $_GET['th'];
		
		// 仮登録ハッシュコードを指定してユーザーエンティティを取得する
		$ent = $this->getUserEntityByTempHash($temp_hash);
		
		// CSRFトークンを取得
		if(empty($_SESSION)) session_start();
		$csrf_token = CrudBaseU::getCsrfToken('signin_x_pw_reg');
		
		// 制限時間オーバーチェック
		$limit_over_flg = 0; // 制限時刻オーバーフラグ 0:OK, 1:時間オーバー
		$temp_datetime = $ent['temp_datetime']; // 仮登録制限時刻
		$temp_dt_u = strtotime($temp_datetime); // 文字列日付からのUNIXタイムスタンプ
		$now_u = time(); // 現在時刻のユニックスタイムスタンプ
		if($now_u > $temp_dt_u){
			$limit_over_flg = 1;
		}

		// ユーザーエンティティからパスワード、仮登録ハッシュコード、仮登録制限時間を除外し、jsonに変換
		unset($ent['password']);
		unset($ent['temp_hash']);
		unset($ent['temp_datetime']);
		$user_json = json_encode($ent, JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS);

		return [
			'limit_over_flg'=>$limit_over_flg,
			'csrf_token'=>$csrf_token,
			'user_json'=>$user_json,
			'repw_flg'=>$repw_flg,
			
		];
		
	}
	
	
	/**
	 * 仮登録ハッシュコードを指定してユーザーエンティティを取得する
	 * @param string $temp_hash 仮登録ハッシュコード
	 * @return [] ユーザーエンティティ
	 */
	public function getUserEntityByTempHash($temp_hash){
		
		// ユーザーテーブルからユーザーエンティティを取得する
		$sql = "SELECT * FROM users WHERE temp_hash='{$temp_hash}'";
		$resData = $this->sqlExe($sql);

		// ユーザーテーブルからデータを取得できなかった場合、不正アクセスと見なす。
		if(empty($resData)){
			echo 'Invalid access! ERROR16232';
			die();
		}

		$ent = $resData[0]['users']; // ユーザーエンティティ
		
		return $ent;
	}
	
	
	
	
	
	
	/**
	 * Ajax 本登録アクション
	 * @param [] $param
	 *  - step2_url string 本登録URL（クエリ部分なし）
	 * @return string
	 */
	public function pwReg($param = []){
		
		
		if(empty($_SESSION)) session_start();
		
		// CSRFトークンによるセキュリティチェック
		if(CrudBaseU::checkCsrfToken('signin_x_pw_reg') == false){
			return '不正なアクションを検出しました。';
		}
		
		$ent_p = $param['ent']; // 送信されてきたユーザーエンティティ
		$repw_flg = $param['repw_flg'];

		$dev_flg = 0; // 開発環境フラグ 0:本番, 1:開発環境
		if($_SERVER['SERVER_NAME'] == 'localhost') $dev_flg = 1;
		
		$user_id = $ent_p['id'];

		// ユーザーIDを指定してDBからユーザーエンティティを取得する
		$ent = $this->getUserEntityById($user_id);
		
		// 送信されてきたユーザーエンティティをマージする。
		foreach($ent_p as $field => $value){
			$ent[$field] = $value;
		}

		// パスワードのハッシュ化
		$ent['password'] = $this->passwordToHash($ent['password']);
		
		// 仮登録ハッシュコードと仮登録制限時刻を除去する。
		$ent['temp_hash'] = null;
		$ent['temp_datetime'] = null;
		
		$ent = $this->save($ent); // DB保存
		$ent = $ent['SigninX'];
		
		// SigninXの設定データをDBから取得する。
		$configs = $this->getConfigsForSigninX();

		// ▼ メール送信
		
		$mail_title = ''; // メール件名
		$mail_text = ''; // メール本文
		
		if(empty($repw_flg)){
			$mail_title = $configs['mail_title2'];
			$mail_text = $configs['mail_text2'];
		}else{
			$mail_title = $configs['mail_title2_repw'];
			$mail_text = $configs['mail_text2_repw'];
		}
		
		$nickname = $ent['nickname'];
		$mail_text = str_replace('%name', $nickname, $mail_text);
		$email = $ent['email'];
		
		// 日本語文字化け対策
		mb_language("Japanese");
		mb_internal_encoding("UTF-8");
		
		$to = $email; // 宛先メールアドレス
		$subject = $mail_title;
		$message = $mail_text;
		$headers = "";
		
		$dev_mailtext = "";// 開発用メールテキスト
		
		// メール送信
		if($dev_flg == 0){
			mb_send_mail($to, $subject, $message, $headers);
		}else{
			$dev_mailtext = '※ローカル開発環境ではメール送信しないので、メール内容を以下に表示する。↓↓↓' . "\n\n" . $subject . "\n" . $message;
		}
		
		// フロントエンドへのレスポンスデータ
		$res = [
			'user' => $ent,
			'success' => 1,// 成功フラグ
			'dev_flg' => $dev_flg,
			'dev_mailtext' => $dev_mailtext,
		];
		
		return $res;

	}
	
	
	// ユーザーIDを指定してDBからユーザーエンティティを取得する
	private function getUserEntityById($user_id){
		
		$sql = "SELECT * FROM users WHERE id='{$user_id}'";
		
		$ent = [];
		$resData = $this->sqlExe($sql);
		if(!empty($resData)){
			$ent = $resData[0]['users'];
		}
		return $ent;
	}
	
	/**
	 * パスワードをハッシュ化する。
	 * @param string $pw パスワード
	 * @return string ハッシュ化したパスワード
	 */
	public function passwordToHash($pw){
		return $this->strategy->passwordToHash($pw);
	}
	
	
	
	
	
	
	
}