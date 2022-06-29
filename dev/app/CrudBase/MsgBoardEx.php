<?php

/**
 * メッセージボード・拡張サポートクラス(CakePHP2に対応）
 * @since 2021-5-14
 * @license MIT
 * @author kenji uehara
 *
 */
class MsgBoardEx{
	
	private $strategy; // ストラテジー
	private $cb; // CrudBaseControllerクラス
	
	/**
	 * コンストラクタ
	 * @param ICrudBaseStrategy.php $strategy フレームワークストラテジー
	 * @param string $update_user 更新ユーザー
	 */
	public function __construct($ctrl, $model){
		global $crudBaseConfig; // crud_base_config.phpで定義しているデータ
		
		$this->cb = $ctrl->getCb();
		$this->strategy = $this->cb->getStrategy();
		
		$this->strategy->setCtrl($ctrl);
		$this->strategy->setModel($model);
		
	}
	
	/**
	 * 初期化
	 * @param [] $sendMailInfo 送信メール情報
	 * @param [] $data メッセージボードデータ
	 * @param string $this_user_type 当画面でのユーザータイプ master:当セミナーの主催者, login_user:その他のログインユーザー
	 * @param [] $userInfo 自分のユーザー情報
	 * @param [] $otherUserIds その他関係者ユーザーID配列(メッセージボードに書き込んでいる人以外のユーザーIDの配列）
	 * @return [] 送信メール情報
	 */
	public function init(&$sendMailInfo, &$data, $this_user_type, &$userInfo, $otherUserIds=[]){
		
		$config_group_key = $sendMailInfo['config_group_key'];
		$this->Configs = $this->getConfigs($config_group_key);
		
		$permission_master = $this->Configs['permission_master']; // マスター許可フラグ
		$permission_login_user = $this->Configs['permission_login_user']; // ログインユーザー許可フラグ
		$send_mail_limit = $this->Configs['send_mail_limit']; // メール送信制限
		
		if(empty($userInfo['id'])) throw new Error('システムエラー: 210516A login is needed.');
		$my_user_id = $userInfo['id']; // 自分自身のユーザーID
		$permission_flg = 0; // メール送信許可フラグ
		
		$partyUserIds = $this->getPartyUserIds($data, $otherUserIds, $my_user_id); // 関係者ユーザーID配列を取得（メール送信先のユーザーIDの配列）
		$party_user_count = count($partyUserIds); // 関係者ユーザー人数
		$err_msg = '';
		
		
		$flg1 = 0;
		// マスター且つ、permission_master ON
		if($this_user_type == 'master' && $permission_master == 1 ){
			$flg1 = 1;
		}
		else if($this_user_type == 'login_user' && $permission_login_user == 1){
			$flg1 = 1;
		}
		
		if($flg1 == 1){
			// 関係者ユーザー人数がメール送信制限以下であれば、メール送信許可フラグをONにする。
			if($send_mail_limit >= $party_user_count){
				$permission_flg = 1;
			}
			
			// メール送信制限を超えている場合
			else{
				$permission_flg = 0;
				$err_msg = "メール送信先のユーザー数がメール送信制限を超えているためメール通知はできません。 送信先人数:{$party_user_count} / 送信制限:{$send_mail_limit}件";
			}
		}

		//ディスプレイ情報のセット
		$disp_mail_check = '';
		if($permission_flg == 0){
			$disp_mail_check = 'display:none;';
		}
		
		$info_url = (empty($_SERVER['HTTPS']) ? 'http://' : 'https://').$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
		

		$sendMailInfo['permission_master'] = $permission_master;
		$sendMailInfo['permission_login_user'] = $permission_login_user;
		$sendMailInfo['send_mail_limit'] = $send_mail_limit;
		$sendMailInfo['my_user_id'] = $my_user_id;
		$sendMailInfo['permission_flg'] = $permission_flg;
		$sendMailInfo['partyUserIds'] = $partyUserIds;
		$sendMailInfo['party_user_count'] = $party_user_count;
		$sendMailInfo['err_msg'] = $err_msg;
		$sendMailInfo['disp_mail_check'] = $disp_mail_check;
		$sendMailInfo['this_user_type'] = $this_user_type;
		$sendMailInfo['info_url'] = $info_url;

		return $sendMailInfo;
	}
	
	
	/**
	 * 関係者ユーザーIDリストを取得する（メール送信先のユーザーIDの配列）
	 * @param [] $data メッセージボードデータ
	 * @param [] $otherUserIds その他関係者ユーザーID配列
	 * @param int $my_user_id 自分のユーザーID
	 * @return [] 関係者ユーザーIDリスト
	 */
	private function getPartyUserIds($data, $otherUserIds, $my_user_id){
		// メッセージボードデータからuser_idの配列であるpartyUserIdsを取得する
	    $userIds = HashCustom::extract($data, '{n}.user_id');
		
		// partyUserIdsにその他関係者ユーザーID配列をマージする。
		$userIds = array_merge($userIds, $otherUserIds);
		
		$userIds[] = $my_user_id; // 自分自身にもメール通知するので、自分のユーザーIDを追加する。
		
		$userIds = array_unique($userIds);
		
		return $userIds;
	}
	
	
	
	/**
	 * メール送信
	 * @param [] $ent メッセージボードエンティティ
	 * @param [] $sendMailInfo 送信メール情報
	 * @param [] $userInfo ユーザー情報
	 * @return [] $sendMailInfo 送信メール情報
	 */
	public function sendMail(&$ent, &$sendMailInfo, &$userInfo){
		
		if($sendMailInfo['send_mail_check'] == 0){
			$sendMailInfo['mail_send_cont'] = 0; // メール送信件数
			$sendMailInfo['debug_mail_text'] = ''; // デバッグ・メールテキスト
			return $sendMailInfo;
		}
		
		
		$partyUserIds = $sendMailInfo['partyUserIds']; // 関係者ユーザーID配列　（送信先ユーザーID配列）
		
		// 関係者ユーザーデータをDBのユーザーテーブルから取得する
		$partyUsers = $this->getPartyUsersFromDb($partyUserIds);
		
		// DBから設定データを取得
		$config_group_key = $sendMailInfo['config_group_key'];
		$configs = $this->getConfigs($config_group_key);
		
		// 設定データから件名テンプレートとメール本文テンプレートを取得する。
		$mail_title_tmpl = $configs['mail_title'];
		$mail_text_tmpl = $configs['mail_text'];
		
		// メッセージを取得
		$message = $ent['message'];
		if(empty($message)){
			if(empty($ent['attach_fn'])) throw new Error('システムエラー 210515D');
			$pi = pathinfo($ent['attach_fn']);
			$fn = $pi['basename'];
			$message = 'ファイル添付:' . $fn;
		}else{
			$message = h($message); // XSSサニタイズ
		}
		
		$debug_mail_text = ''; // デバッグメールテキスト
		
		// 日本語文字化け対策
		mb_language("Japanese");
		mb_internal_encoding("UTF-8");
		
		$nickname = $userInfo['nickname']; // 自分の名前
		$nickname = h($nickname);
		if(empty($nickname)) $nickname = $userInfo['username'];
		
		$dev_flg = 0;
		if($_SERVER['SERVER_NAME'] == 'localhost') $dev_flg = 1;
		
		$mail_send_cont = 0; // メール送信件数
		
		foreach($partyUsers as $i => $uEnt){
			
			// 宛名
			$to_nickname = $uEnt['nickname'];
			if(empty($to_nickname)) $nickname = $uEnt['username'];
			$to_nickname = h($to_nickname);
			
			// 件名を作成
			$mail_title = str_replace('%to_nickname', $to_nickname, $mail_title_tmpl);
			
			
			// メール本文を作成
			$mail_text = str_replace('%to_nickname', $to_nickname, $mail_text_tmpl);
			$mail_text = str_replace('%nickname', $nickname, $mail_text);
			$mail_text = str_replace('%message', $message, $mail_text);
			$url = $sendMailInfo['info_url'];
			$mail_text = str_replace('%url', $url, $mail_text);
			
			
			$email = $uEnt['email'];
			if(empty($email)) continue;
			
			$to = $email; // 宛先メールアドレス
			$subject = $mail_title;
			$mail_message = $mail_text;
			$headers = "";
			
			if($dev_flg == 0){
				mb_send_mail($to, $subject, $mail_message, $headers);
			}else{
				$debug_mail_text .= "----------" . $i . "\n送信先メールアドレス：" . $email . "\n件名：" . $subject . "\n\n" . $mail_message;
			}
			
			$mail_send_cont ++;

		}
		
		$sendMailInfo['mail_send_cont'] = $mail_send_cont;
		$sendMailInfo['debug_mail_text'] = $debug_mail_text;
		return $sendMailInfo;
		

	}
	
	
	/**
	 * 関係者ユーザーデータをDBのユーザーテーブルから取得する
	 * @param [] $partyUserIds 関係者ユーザーID配列
	 * @return [] 関係者ユーザーデータ
	 */
	private function getPartyUsersFromDb(&$partyUserIds){
		if(empty($partyUserIds)) throw new Exception('システムエラー 210515C');
		
		$ids_str = "'" . implode("','", $partyUserIds)."'";
		$sql = 
			"
				SELECT
					id,
					username,
					email,
					nickname
				FROM users
				WHERE
					id IN ($ids_str) AND
					delete_flg = 0
			";
		
		$data = $this->query($sql);
		if(empty($data)) throw new Exception('210515D');
		
		$partyUsers = [];
		foreach($data as $ent){
			$partyUsers[] = $ent['users'];
		}

		return $partyUsers;
		
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
	 * SQLを実行(エイリアス）
	 * @param string $sql
	 */
	private function query(&$sql){
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
	 * SigninXの設定データをDBから取得する。
	 * @return [] 設定データ
	 */
	private function getConfigs($group_key){
		
		// 設定テーブルから仮登録メール用の「件名」、「メール文」、「有効時間」等を取得する
		$sql = "SELECT config_key, config_value FROM config_xs WHERE group_key = '{$group_key}'";
		
		$resData = $this->sqlExe($sql);
		if(empty($resData)) throw new Error('システムエラー 210515A');
		
		$configs = [];
		foreach($resData as $confEnt){
			$config_key = $confEnt['config_key'];
			$config_value = $confEnt['config_value'];
			$configs[$config_key] = $config_value;
		}
		
		if(!isset($configs['permission_master'])) throw new Error('システムエラー 210515B1');
		if(!isset($configs['permission_login_user'])) throw new Error('システムエラー 210515B2');
		if(!isset($configs['send_mail_limit'])) throw new Error('システムエラー 210515B3');
		if(!isset($configs['mail_title'])) throw new Error('システムエラー 210515B4');
		if(!isset($configs['mail_text'])) throw new Error('システムエラー 210515B5');
		
		return $configs;
		
	}
	
	
	/**
	 * XSSサニタイズ
	 *
	 * @note
	 * XSSサニタイズ
	 * 記号「<>」を「&lt;&gt;」にエスケープする。
	 *
	 * @param mixed $data 対象データ | 値および配列を指定
	 * @return void
	 */
	public function xssSanitizeW(&$data){
		$this->xss_sanitize($data);
		return $data;
	}
	
	/**
	 * XSSエスケープ（XSSサニタイズ）
	 *
	 * @note
	 * XSSサニタイズ
	 * 記号「<>」を「&lt;&gt;」にエスケープする。
	 * 高速化のため、引数は参照（ポインタ）にしており、返値もかねている。
	 *
	 * @param mixed $data 対象データ | 値および配列を指定
	 * @return void
	 */
	private function xss_sanitize(&$data){
		
		if(is_array($data)){
			foreach($data as &$val){
				$this->xss_sanitize($val);
			}
			unset($val);
		}elseif(gettype($data)=='string'){
			$data = str_replace(array('<','>'),array('&lt;','&gt;'),$data);
		}else{
			// 何もしない
		}
	}
	
	
	
	
}