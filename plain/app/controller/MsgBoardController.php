<?php
require_once 'AppController.php';
require_once CRUD_BASE_PATH . 'CrudBaseController.php';
require_once CRUD_BASE_ROOT . 'model/MsgBoard.php';

/**
 * メッセージボード画面
 * 
 * @since 2021-6-11
 *
 */
class MsgBoardController extends AppController {

    protected $cb; // CrudBase制御クラス
	private $md;
	private $paramSets;
	
	// 当画面バージョン (バージョンを変更すると画面に新バージョン通知とクリアボタンが表示されます。）
	public $this_page_version = '1.0.0';

	/**
	 * コンストラクタ
	 * @param [] $param
	 */
	public function __construct(&$param = []){

	    $this->md = new MsgBoard();
	}


	/**
	 * indexページのアクション
	 *
	 * indexページではメッセージボード一覧を検索閲覧できます。
	 * 一覧のidから詳細画面に遷移できます。
	 * ページネーション、列名ソート、列表示切替、CSVダウンロード機能を備えます。
	 */
	public function index() {

		$this->init();
		
		// CrudBase共通処理（前）
		$crudBaseData = $this->cb->indexBefore();//indexアクションの共通先処理(CrudBaseController)
		$crudBaseData['pages']['sort_desc'] = 1;

		// Ajaxセキュリティ:CSRFトークンの取得
		$crudBaseData['csrf_token'] = CrudBaseU::getCsrfToken('msg_board');

		$res = $this->md->getData($crudBaseData);
		$data = $res['data'];
		$non_limit_count = $res['non_limit_count']; // LIMIT制限なし・データ件数
		
		// CrudBase共通処理（後）
		$crudBaseData = $this->cb->indexAfter($crudBaseData, ['non_limit_count'=>$non_limit_count]);

		//■■■□□□■■■□□□仮ログイン
		if(empty($_SESSION['uid'])){
		    $_SESSION['uid'] = 1;
		}
		
		
		
		$crudBaseData['userInfo'] = $this->cb->getUserInfo();
		
		$userInfo = $crudBaseData['userInfo'];
		
		if(empty($userInfo['id'])){
			$userInfo['id'] = -1;
		}
		
		// 当画面のユーザータイプを取得 master:マスター型, login_user:一般ログインユーザー, guest:未ログインユーザー
		$user_type = $this->getThisUserType($userInfo);
		$crudBaseData['user_type'] = $user_type;
		
		// 当画面のユーザータイプによる変更ボタン、削除ボタンの表示、非表示情報をセットする
		$data = $this->md->setBtnDisplayByThisUserType($user_type, $data, $userInfo);
		
		// データに評価関連データをセットする
		$evals = $this->md->getEvals($data, $userInfo);
		$crudBaseData['evals'] = $evals;
		
		// 評価種別ハッシュマップをDBから取得する。
		$evalTypeHm = $this->md->getEvalTypeHm();
		$crudBaseData['evalTypeHm'] = $evalTypeHm;
		
		// メール通知機能の初期化
		$otherUserIds = $this->md->getOtherUserIds();// その他関係者ユーザーID配列をセミナー受講者テーブルから取得する	
		$sendMailInfo = $this->md->initSendMailInfo($this, $data, $user_type, $userInfo, $otherUserIds);
		$crudBaseData['sendMailInfo'] = $sendMailInfo;
		
		$crud_base_json = json_encode($crudBaseData,JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS);

		$this->set([
			'title_for_layout'=>'メッセージボード',
		    'data'=> $data,
		    'evals'=> $evals,
			'crudBaseData'=> $crudBaseData,
			'crud_base_json'=> $crud_base_json,
		]);
		
		return $this->render();


	}
	
	public function set($param){
	    $this->paramSets = $param;
	}
	
	public function render(){
	    
	    extract($this->paramSets);
	    ob_start();
	    
	    include CRUD_BASE_ROOT . "view/MsgBoard/index.php";
	    $html = ob_get_contents();
	    ob_end_clean();
	    
	    return $html;
	}
	

	
	/**
	 * Ajax 新規DB登録
	 *
	 */
	public function ajax_new_reg(){
	    
	    $this->init();

		// CSRFトークンによるセキュリティチェック
		if(CrudBaseU::checkCsrfToken('msg_board') == false){
			return '不正なアクションを検出しました。';
		}
		
		$userInfo = $this->cb->getUserInfo();
		
		
		// JSON文字列をパースしてエンティティを取得する
		$json=$_POST['key1'];
		$ent = json_decode($json, true);
		
		// 登録パラメータ
		$reg_param_json = $_POST['reg_param_json'];
		$regParam = json_decode($reg_param_json,true);
		if(empty($regParam['ni_tr_place'])) $regParam['ni_tr_place'] = 0; // 

		$ent = $this->setCommonToEntity($ent);
		
		// CBBXE
		$ent = $this->md->saveEntity($ent, $regParam);
		
		// ファイルアップロードとファイル名のDB保存
		if(!empty($_FILES)){
			$ent['attach_fn'] = $this->cb->makeFilePath($_FILES, "/crud_base_laravel8/dev/public/storage/msg_board/y%Y/{$ent['id']}/%unique/orig/%fn", $ent, 'attach_fn');
			$fileUploadK = $this->factoryFileUploadK();
			$fileUploadK->putFile1($_FILES, 'attach_fn', $ent['attach_fn']);
			$this->md->saveEntity($ent, $regParam);
		}

		// メール送信
		$send_mail_info_json = $_POST['send_mail_info_json'];
		$sendMailInfo = json_decode($send_mail_info_json, true);
		$sendMailInfo = $this->md->sendMail($this, $ent, $sendMailInfo, $userInfo);
		
		$res = ['ent'=>$ent, 'sendMailInfo'=>$sendMailInfo];
		$json_str = json_encode($res, JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS); // JSONに変換
		
		return $json_str;
		
	}
	
	
	/**
	 * Ajax 編集DB登録
	 *
	 */
	public function ajax_edit_reg(){
		
	    $this->init();
		
		// CSRFトークンによるセキュリティチェック
		if(CrudBaseU::checkCsrfToken('msg_board') == false){
			return '不正なアクションを検出しました。';
		}
		
			
		$userInfo = $this->cb->getUserInfo();
		if(empty($userInfo['id'])) throw new Exception('システムエラー 210512A');
		
		
		// JSON文字列をパースしてエンティティを取得する
		$json=$_POST['key1'];
		$ent = json_decode($json, true);
		
		if($userInfo['id'] != $ent['user_id']) throw new Exception('システムエラー 210512B');
		
		// 登録パラメータ
		$reg_param_json = $_POST['reg_param_json'];
		$regParam = json_decode($reg_param_json,true);

		$ent = $this->setCommonToEntity($ent);

		unset($ent['attach_fn']);
		if(empty($ent['id'])) throw new Exception('システムエラー 210512C');
		
		// CBBXE
		$ent = $this->md->saveEntity($ent, $regParam);
		
		$json_str = json_encode($ent, JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS); // JSONに変換
		
		return $json_str;
		
	}

	
	/**
	 * 削除登録
	 *
	 * @note
	 * Ajaxによる削除登録。
	 * 削除更新でだけでなく有効化に対応している。
	 * また、DBから実際に削除する抹消にも対応している。
	 */
	public function ajax_delete(){

	    $this->init();
	    
		// CSRFトークンによるセキュリティチェック
		if(CrudBaseU::checkCsrfToken('msg_board') == false){
			return '不正なアクションなアクションです。 210510B';
		}
		
		$userInfo = $this->cb->getUserInfo();
		if(empty($userInfo['id'])){
			return '不正なアクションなアクションです。 210510C';
		}
		
		$config = 
			[
				'org_del_flg'=>'1', // マスター権限者は一般ログインユーザーのメッセージを削除できるか 0:削除不可, 1:削除フラグON, 2:抹消する
				'my_del_flg'=>'1', // 一般ログインユーザーは自分のメッセージを削除できるか。 0:削除不可, 1:削除フラグON, 2:抹消する
			];
			
		$org_del_flg = $config['org_del_flg'];
		$my_del_flg = $config['my_del_flg'];
		
		$user_id = $userInfo['id'];

		// 当画面のユーザータイプを取得 master:マスター型, login_user:一般ログインユーザー, guest:未ログインユーザー
		$user_type = $this->getThisUserType($userInfo); 
		
		// JSON文字列をパースしてエンティティを取得する
		$json=$_POST['key1'];
		$param = json_decode($json, true);
		$id = $param['id']; // メッセージボードID
		
		// 削除対象のメッセージボードエンティティを取得する
		$sql = "SELECT * FROM msg_boards WHERE id={$id}";
		$ent = $this->cb->selectEntity($sql);

		if(empty($ent)) return '不正なアクション 210511A';

		$my_msg_flg = 0; // 自分のメッセージであるか？ 0:違う, 1:自分のメッセージである。
		if($ent['user_id'] == $user_id){
			$my_msg_flg = 1;
		}
		
		if($user_type == 'master'){
			// 自分のメッセージである場合
			if($my_msg_flg == 1){
				$this->deleteActionToDb($my_del_flg, $ent, $userInfo);
			}
			
			// 自分のメッセージではない場合
			else{
				$this->deleteActionToDb($org_del_flg, $ent, $userInfo);
			}
		}else if($user_type == 'login_user'){
			if($my_msg_flg == 1){
				$this->deleteActionToDb($my_del_flg, $ent, $userInfo);
			}
			
			// 自分のメッセージではない場合は何もしない
			else{
				
			}
		}else{
			return 'システムエラー 210511B';
		}
		
		$res = ['success'=>1];
		
		$json_str =json_encode($res);//JSONに変換
		
		return $json_str;

	}
	
	
	/**
	 * 
	 * 当画面のユーザータイプを取得
	 * @param [] $userInfo
	 * @return string 当画面のユーザータイプ master:マスター型, login_user:一般ログインユーザー, guest:未ログインユーザー
	 */
	private function getThisUserType($userInfo = []){
		
		if(empty($userInfo)){
			$userInfo = $this->getUserInfo();
		}
		
		if(empty($userInfo['id'])) return 'guest';
		
		$user_type = 'login_user'; // 当画面のユーザータイプ 
		
		if($userInfo['authority']['level'] >= 30){
			$user_type = 'master';
		}
		
		return $user_type;
	}
	
	
	
	/**
	 * DBへの削除処理
	 * @param int $del_flg 削除方法フラグ 0:削除しない, 1:削除フラグをON, 2:抹消（DELETE）
	 * @param [] $ent メッセージボードエンティティ
	 * @param [] $userInfo ユーザー情報
	 */	
	private function deleteActionToDb($my_del_flg, &$ent, &$userInfo){
		
		if($my_del_flg == 0) return;
		
		// 削除フラグON
		elseif($my_del_flg == 1){
			$ent['update_user'] = $userInfo['update_user'];
			$ent['ip_addr'] = $userInfo['ip_addr'];
			$ent['delete_flg'] = 1;
			$this->md->save($ent, ['validate'=>false]);
			
		}
		
		// 抹消
		elseif($my_del_flg == 2){
			$this->md->delete($ent['id']);
		}
		
		else{
			throw new Exception('システムエラー 210511C');
		}
	}
	
	
	/**
	 * ファイルアップロードクラスのファクトリーメソッド
	 * @return \App\Http\Controllers\FileUploadK
	 */
	private function factoryFileUploadK(){
		$crud_base_path = CRUD_BASE_PATH;
		require_once $crud_base_path . 'FileUploadK/FileUploadK.php';
		$fileUploadK = new \FileUploadK();
		return $fileUploadK;
	}
	
	
	/**
	 * CrudBase用の初期化処理
	 *
	 * @note
	 * フィールド関連の定義をする。
	 *
	 */
	private function init(){

		/// 検索条件情報の定義
		$kensakuJoken=[
			
			['name'=>'kj_main', 'def'=>null],
			// CBBXS-2000
				['name'=>'kj_id', 'def'=>null],
				['name'=>'kj_other_id', 'def'=>null],
				['name'=>'kj_user_id', 'def'=>null],
				['name'=>'kj_user_type', 'def'=>null],
				['name'=>'kj_message', 'def'=>null],
				['name'=>'kj_attach_fn', 'def'=>null],
				['name'=>'kj_sort_no', 'def'=>null],
				['name'=>'kj_delete_flg', 'def'=>0],
				['name'=>'kj_update_user', 'def'=>null],
				['name'=>'kj_ip_addr', 'def'=>null],
				['name'=>'kj_created', 'def'=>null],
				['name'=>'kj_modified', 'def'=>null],

			// CBBXE
			
			['name'=>'row_limit', 'def'=>50],
			
		];
		
		
		///フィールドデータ
		$fieldData = ['def'=>[
			
			// CBBXS-2002
			'id'=>[
					'name'=>'ID',//HTMLテーブルの列名
					'row_order'=>'MsgBoard.id',//SQLでの並び替えコード
					'clm_show'=>1,//デフォルト列表示 0:非表示 1:表示
			],
			'other_id'=>[
					'name'=>'外部ID',
					'row_order'=>'MsgBoard.other_id',
					'clm_show'=>1,
			],
			'user_id'=>[
					'name'=>'ユーザーID',
					'row_order'=>'MsgBoard.user_id',
					'clm_show'=>1,
			],
			'user_type'=>[
				'name'=>'ユーザータイプ',
				'row_order'=>'MsgBoard.user_type',
				'clm_show'=>1,
			],
			'message'=>[
					'name'=>'メッセージ',
					'row_order'=>'MsgBoard.message',
					'clm_show'=>1,
			],
			'attach_fn'=>[
					'name'=>'添付ファイル',
					'row_order'=>'MsgBoard.attach_fn',
					'clm_show'=>1,
			],
			'sort_no'=>[
					'name'=>'順番',
					'row_order'=>'MsgBoard.sort_no',
					'clm_show'=>0,
			],
			'delete_flg'=>[
					'name'=>'無効フラグ',
					'row_order'=>'MsgBoard.delete_flg',
					'clm_show'=>0,
			],
			'update_user'=>[
					'name'=>'更新者',
					'row_order'=>'MsgBoard.update_user',
					'clm_show'=>0,
			],
			'ip_addr'=>[
					'name'=>'IPアドレス',
					'row_order'=>'MsgBoard.ip_addr',
					'clm_show'=>0,
			],
			'created'=>[
					'name'=>'生成日時',
					'row_order'=>'MsgBoard.created',
					'clm_show'=>0,
			],
			'modified'=>[
					'name'=>'更新日',
					'row_order'=>'MsgBoard.modified',
					'clm_show'=>0,
			],

			// CBBXE
		]];
		
		// 列並び順をセットする
		$clm_sort_no = 0;
		foreach ($fieldData['def'] as &$fEnt){
			$fEnt['clm_sort_no'] = $clm_sort_no;
			$clm_sort_no ++;
		}
		unset($fEnt);
		
		require_once CRUD_BASE_PATH . 'CrudBaseController.php';

		$model = $this->md; // モデルクラス
		
		$crudBaseData = [
			'fw_type' => 'cake',
			'model_name_c' => 'MsgBoard',
			'tbl_name' => 'msg_boards', // テーブル名をセット
			'kensakuJoken' => $kensakuJoken, //検索条件情報
			'fieldData' => $fieldData, //フィールドデータ
		];

		$crudBaseCon = new CrudBaseController($this, $model, $crudBaseData);
		$model->init($crudBaseCon);
		
		$this->md = $model;
		$this->cb = $crudBaseCon;

		$crudBaseData = $crudBaseCon->getCrudBaseData();

		return $crudBaseData;
		
	}
	
	public function getCb(){
	    return $this->cb;
	}
	
	public function getMd(){
	    return $this->md;
	}
	
	
	/**
	 * 評価アクション
	 *
	 */
	public function evaluate(){
	    
	    $this->init();
	    
	    // CSRFトークンによるセキュリティチェック
	    if(CrudBaseU::checkCsrfToken('msg_board') == false){
	        return '不正なアクションを検出しました。';
	    }
	    
	    $userInfo = $this->cb->getUserInfo();
	    if(empty($userInfo['id'])) throw new Exception('システムエラー 220616A');
	    
	    // JSON文字列をパースしてエンティティを取得する
	    $json=$_POST['key1'];
	    $param = json_decode($json, true);
	    
	    $res = $this->md->evaluate($param, $userInfo); // 評価アクション
	    
	    $json_str = json_encode($res, JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS); // JSONに変換
	    
	    return $json_str;
	    
	}


}