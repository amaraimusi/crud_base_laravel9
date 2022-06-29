<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChangePw extends AppModel
{
	protected $table = 'users'; // 紐づけるテーブル名
	//protected $guarded = ['id']; // 予期せぬ代入をガード。 通常、主キーフィールドや、パスワードフィールドなどが指定される。
	
	// ホワイトリスト（DB保存時にこのホワイトリストでフィルタリングが施される）
	public $fillable = [
			// CBBXS-2009
			'id',
			'hosp_id',
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
			'created_at',
			'updated_at',

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
	
	
	// DBからユーザーエンティティを取得する
	public function getUserEntity($user_id){
		if(!is_numeric($user_id)) throw new Exception('ERR220223A');
		$sql = "SELECT id, password FROM  users WHERE id={$user_id}";
		$ent = $this->selectEntity2($sql);
		return $ent;
		
	}
	

	/**
	 * エンティティのDB保存
	 * @param [] $ent エンティティ
	 * @param [] DB保存パラメータ
	 *  - form_type フォーム種別  new_inp:新規入力 edit:編集 delete:削除
	 *  - ni_tr_place 新規入力追加場所フラグ 0:末尾(デフォルト） , 1:先頭
	 *  - tbl_name DBテーブル名
	 * @return [] エンティティ(insertされた場合、新idがセットされている）
	 */
	public function saveEntity(&$ent, $regParam=[]){
		return $this->cb->saveEntity($ent, $regParam);

	}
	
	
	/**
	 * SQLを実行してエンティティを取得する
	 * @param string $sql
	 * @return [] エンティティ
	 */
	public function selectEntity2($sql){
		$res = \DB::select($sql);
		
		$ent = [];
		if(!empty($res)){
			$ent = current($res);
			$ent = (array)$ent;
		}
		
		return $ent;
	}
	
}

