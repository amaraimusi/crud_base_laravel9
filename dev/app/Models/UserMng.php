<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserMng extends AppModel
{
	protected $table = 'users'; // 紐づけるテーブル名
	//protected $guarded = ['id']; // 予期せぬ代入をガード。 通常、主キーフィールドや、パスワードフィールドなどが指定される。
	
	// ホワイトリスト（DB保存時にこのホワイトリストでフィルタリングが施される）
	public $fillable = [
			// CBBXS-2009
			'id',
			'name',
			'email',
			'email_verified_at',
			'nickname',
			'password',
			'remember_token',
			'role',
			'temp_hash',
			'temp_datetime',
			'sort_no',
			'delete_flg',
			'update_user',
			'ip_addr',
			'created',
			'modified',

			// CBBXE
	];
	
	// CBBXS-2012
	const CREATED_AT = 'created';
	const UPDATED_AT = 'modified';

	// CBBXE
	
	//public $timestamps = false; // タイムスタンプ。 trueならcreated_atフィールド、updated_atフィールドに適用される。（それ以外のフィールドを設定で指定可）
	
	
	protected $cb; // CrudBase制御クラス
	
	
	public function __construct(){
	    parent::__construct();
	}
	
	
	/**
	 * 初期化
	 * @param CrudBaseController $cb
	 */
	public function init($cb){
		$this->cb = $cb;
		
		// ホワイトリストをセット
		$cbParam = $this->cb->getCrudBaseData();
		$fields = $cbParam['fields'];
		$this->fillable = $fields;
		
		parent::init($cb);
		$this->setTableName($this->table); // 親クラスにテーブル名をセット
	}
	
	/**
	 * 検索条件とページ情報を元にDBからデータを取得する
	 * @param [] $crudBaseData
	 * @return 
	 *  - [] data データ
	 *  - int non_limit_count LIMIT制限なし・データ件数
	 */
	public function getData(&$crudBaseData){

		$fields = $crudBaseData['fields']; // フィールド
		
		$kjs = $crudBaseData['kjs'];//検索条件情報
		$pages = $crudBaseData['pages'];//ページネーション情報
		
		// ▽ SQLインジェクション対策
		$kjs = $this->sqlSanitizeW($kjs);
		$pages = $this->sqlSanitizeW($pages);
		
		$page_no = $pages['page_no']; // ページ番号
		$row_limit = $pages['row_limit']; // 表示件数
		$sort_field = $pages['sort_field']; // ソートフィールド
		$sort_desc = $pages['sort_desc']; // ソートタイプ 0:昇順 , 1:降順
		$offset = $page_no * $row_limit;
		
		// 外部SELECT文字列を作成する。
		$outer_selects_str = $this->makeOuterSelectStr($crudBaseData);
		
		// 外部結合文字列を作成する。
		$outer_join_str = $this->makeOuterJoinStr($crudBaseData);
		
		//条件を作成
		$conditions=$this->createKjConditions($kjs);
		if(empty($conditions)) $conditions = '1=1'; // 検索条件なしの対策
		
		$sort_type = '';
		if(!empty($sort_desc)) $sort_type = 'DESC';
		$main_tbl_name = $this->table;
		
		$sql =
			"
				SELECT SQL_CALC_FOUND_ROWS UserMng.* {$outer_selects_str}
				FROM {$main_tbl_name} AS UserMng
				{$outer_join_str}
				WHERE {$conditions}
				ORDER BY {$sort_field} {$sort_type}
				LIMIT {$offset}, {$row_limit}
			";

		$data = $this->cb->selectData($sql);
		
		// LIMIT制限なし・データ件数
		$non_limit_count = 0;
		if(!empty($data)){
			$non_limit_count = $this->cb->selectValue('SELECT FOUND_ROWS()');
		}

		return ['data' => $data, 'non_limit_count' => $non_limit_count];
		
	}
	
	
	/**
	 * 検索条件情報からWHERE情報を作成。
	 * @param array $kjs	検索条件情報
	 * @return string WHERE情報
	 */
	private function createKjConditions($kjs){

		$cnds=null;
		
		$kjs = $this->cb->xssSanitizeW($kjs); // SQLサニタイズ
		
		if(!empty($kjs['kj_main'])){
			$cnds[]="
				CONCAT(
					IFNULL(UserMng.id, '') ,
					IFNULL(UserMng.name, '') ,
					IFNULL(UserMng.nickname, '') ,
					IFNULL(UserMng.email, '')
				) LIKE '%{$kjs['kj_main']}%'";
		}
		
		// CBBXS-1003
		if(!empty($kjs['kj_id']) || $kjs['kj_id'] ==='0' || $kjs['kj_id'] ===0){
			$cnds[]="UserMng.id = {$kjs['kj_id']}";
		}
		if(!empty($kjs['kj_name'])){
			$cnds[]="UserMng.name LIKE '%{$kjs['kj_name']}%'";
		}
		if(!empty($kjs['kj_email'])){
			$cnds[]="UserMng.email LIKE '%{$kjs['kj_email']}%'";
		}
		if(!empty($kjs['kj_email_verified_at'])){
			$cnds[]="UserMng.email_verified_at = {$kjs['kj_email_verified_at']}";
		}
		if(!empty($kjs['kj_nickname'])){
			$cnds[]="UserMng.nickname LIKE '%{$kjs['kj_nickname']}%'";
		}
		if(!empty($kjs['kj_password'])){
			$cnds[]="UserMng.password LIKE '%{$kjs['kj_password']}%'";
		}
		if(!empty($kjs['kj_remember_token'])){
			$cnds[]="UserMng.remember_token LIKE '%{$kjs['kj_remember_token']}%'";
		}
		if(!empty($kjs['kj_role']) || $kjs['kj_role'] ==='0' || $kjs['kj_role'] ===0){
			$cnds[]="UserMng.role = '{$kjs['kj_role']}'";
		}
		if(!empty($kjs['permRoles'])){
			$perm_roles_c = "'" . implode("','", $kjs['permRoles']) . "'";
			$cnds[]="UserMng.role IN({$perm_roles_c})";
		}else{
			$cnds[]="UserMng.role ='empty'";
		}
		if(!empty($kjs['kj_temp_hash'])){
			$cnds[]="UserMng.temp_hash LIKE '%{$kjs['kj_temp_hash']}%'";
		}
		if(!empty($kjs['kj_temp_datetime'])){
			$kj_temp_datetime = $kjs['kj_temp_datetime'];
			$dtInfo = $this->CrudBase->guessDatetimeInfo($kj_temp_datetime);
			$cnds[]="DATE_FORMAT(UserMng.temp_datetime,'{$dtInfo['format_mysql_a']}') = DATE_FORMAT('{$dtInfo['datetime_b']}','{$dtInfo['format_mysql_a']}')";
		}
		if(!empty($kjs['kj_sort_no']) || $kjs['kj_sort_no'] ==='0' || $kjs['kj_sort_no'] ===0){
			$cnds[]="UserMng.sort_no = {$kjs['kj_sort_no']}";
		}
		$kj_delete_flg = $kjs['kj_delete_flg'];
		if(!empty($kjs['kj_delete_flg']) || $kjs['kj_delete_flg'] ==='0' || $kjs['kj_delete_flg'] ===0){
			if($kjs['kj_delete_flg'] != -1){
			   $cnds[]="UserMng.delete_flg = {$kjs['kj_delete_flg']}";
			}
		}
		if(!empty($kjs['kj_update_user'])){
			$cnds[]="UserMng.update_user LIKE '%{$kjs['kj_update_user']}%'";
		}
		if(!empty($kjs['kj_ip_addr'])){
			$cnds[]="UserMng.ip_addr LIKE '%{$kjs['kj_ip_addr']}%'";
		}
		if(!empty($kjs['kj_created'])){
			$kj_created=$kjs['kj_created'].' 00:00:00';
			$cnds[]="UserMng.created >= '{$kj_created}'";
		}
		if(!empty($kjs['kj_modified'])){
			$kj_modified=$kjs['kj_modified'].' 00:00:00';
			$cnds[]="UserMng.modified >= '{$kj_modified}'";
		}

		// CBBXE
		
		$cnd=null;
		if(!empty($cnds)){
			$cnd=implode(' AND ',$cnds);
		}
		
		return $cnd;
		
	}
	
	
	/**
	 * トランザクション・スタート
	 */
	public function begin(){
		$this->cb->begin();
	}
	
	/**
	 * トランザクション・ロールバック
	 */
	public function rollback(){
		$this->cb->rollback();
	}
	
	/**
	 * トランザクション・コミット
	 */
	public function commit(){
		$this->cb->commit();
	}
	
	
	// CBBXS-2021
	/**
	 * 権限リストをDBから取得する
	 */
	public function getRoleList(){

		// DBからデータを取得
		$query = \DB::table('roles')->
		whereRaw("delete_flg = 0")->
		orderBy('sort_no', 'ASC');
		$data = $query->get();

		// リスト変換
		$list = [];
		foreach($data as $ent){
			$ent = (array)$ent;
			$id = $ent['id'];
			$name = $ent['role_name'];
			$list[$id] = $name;
		}

		return $list;
		
	}

	// CBBXE
	
	
	
	/**
	 * エンティティのDB保存
	 * @param [] $ent エンティティ
	 * @param [] DB保存パラメータ
	 *  - form_type フォーム種別  new_inp:新規入力 edit:編集 delete:削除
	 *  - ni_tr_place 新規入力追加場所フラグ 0:末尾(デフォルト） , 1:先頭
	 *  - tbl_name DBテーブル名
	 * @return [] エンティティ(insertされた場合、新idがセットされている）
	 */
	public function saveEntity(&$ent, &$regParam){
		
		
		return $this->cb->saveEntity($ent, $regParam);
		

	}
	
	
	
	/**
	 * データのDB保存
	 * @param [] $data データ（エンティティの配列）
	 * @return [] データ(insertされた場合、新idがセットされている）
	 */
	public function saveAll(&$data){
		return $this->cb->saveAll($data);
	}
	
	
	/**
	 * 複数レコードのINSERT
	 * @param [] $data データ（エンティティの配列）
	 */
	public function insertAll($data){
		
		if(empty($data)) return;
		
		foreach($data as &$ent){
			$ent = array_intersect_key($ent, array_flip($this->fillable));
			unset($ent['id']);
		}
		unset($ent);

		$this->insert($data);
		
		
	}
	
	// CBBXS-2022
	/**
	 * メールの重複チェック
	 * @param string $email メールアドレス
	 * @return bool true:無問題, false:重複あり
	 */
	public function checkEMailDuplication($email){
	    
	    $email = $this->sqlSanitizeW($email);
	    $sql = "SELECT id,email FROM users WHERE email='{$email}';";
	    
	    $res = $this->cb->selectValue($sql);
  
	    if(!empty($res)) return false;
	    return true;
	    
	}
	// CBBXE
	
	/**
	 * ユーザー名の重複チェック
	 * @param string $name ユーザー名
	 * @return bool true:無問題, false:重複あり
	 */
	public function  checkNameDuplication($name){
	    $name = $this->sqlSanitizeW($name);
	    $sql = "SELECT id,email FROM users WHERE name='{$name}';";
	    
	    $res = $this->cb->selectValue($sql);
	    
	    if(!empty($res)) return false;
	    return true;
	    
	}
	
	
}
