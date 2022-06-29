<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Neko extends AppModel
{
	protected $table = 'nekos'; // 紐づけるテーブル名
	//protected $guarded = ['id']; // 予期せぬ代入をガード。 通常、主キーフィールドや、パスワードフィールドなどが指定される。
	
	// ホワイトリスト（DB保存時にこのホワイトリストでフィルタリングが施される）
	public $fillable = [
			// CBBXS-2009
			'id',
			'neko_val',
			'neko_name',
			'neko_date',
			'neko_group',
			'neko_dt',
			'neko_flg',
			'img_fn',
			'note',
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
	
	/**
	 * 検索条件とページ情報を元にDBからデータを取得する
	 * @param array $crudBaseData
	 * @return number[]|unknown[]
	 *  - array data データ
	 *  - int non_limit_count LIMIT制限なし・データ件数
	 */
	public function getData($crudBaseData){
		
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
				SELECT SQL_CALC_FOUND_ROWS Neko.* {$outer_selects_str}
				FROM {$main_tbl_name} AS Neko
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
			$cnds[]="CONCAT( IFNULL(Neko.neko_name, '') ,IFNULL(Neko.note, '')) LIKE '%{$kjs['kj_main']}%'";
		}
		
		// CBBXS-1003
		
		if(!empty($kjs['kj_id'])){
			$cnds[]="Neko.id = {$kjs['kj_id']}";
		}

		if(!empty($kjs['kj_neko_val1']) || $kjs['kj_neko_val1'] === '0' || $kjs['kj_neko_val1'] === 0){
			$cnds[]="Neko.neko_val >= {$kjs['kj_neko_val1']}";
		}
		
		if(!empty($kjs['kj_neko_val2']) || $kjs['kj_neko_val2'] === '0' || $kjs['kj_neko_val2'] === 0){
			$cnds[]="Neko.neko_val <= {$kjs['kj_neko_val2']}";
		}
		
		if(!empty($kjs['kj_neko_name'])){
			$cnds[]="Neko.neko_name LIKE '%{$kjs['kj_neko_name']}%'";
		}
		
		if(!empty($kjs['kj_neko_date1'])){
			$cnds[]="Neko.neko_date >= '{$kjs['kj_neko_date1']}'";
		}
		
		if(!empty($kjs['kj_neko_date2'])){
			$cnds[]="Neko.neko_date <= '{$kjs['kj_neko_date2']}'";
		}
		
		if(!empty($kjs['kj_neko_group'])){
			$cnds[]="Neko.neko_group = {$kjs['kj_neko_group']}";
		}
		
		if(!empty($kjs['kj_neko_dt'])){
			$kj_neko_dt = $kjs['kj_neko_dt'];
			$dtInfo = $this->cb->crudBaseModel->guessDatetimeInfo($kj_neko_dt);
			$cnds[]="DATE_FORMAT(Neko.neko_dt,'{$dtInfo['format_mysql_a']}') = DATE_FORMAT('{$dtInfo['datetime_b']}','{$dtInfo['format_mysql_a']}')";
		}
		
		$kj_neko_flg = $kjs['kj_neko_flg'];
		if(!empty($kjs['kj_neko_flg']) || $kjs['kj_neko_flg'] ==='0' || $kjs['kj_neko_flg'] ===0){
			if($kjs['kj_neko_flg'] != -1){
				$cnds[]="Neko.neko_flg = {$kjs['kj_neko_flg']}";
			}
		}
		
		if(!empty($kjs['kj_img_fn'])){
			$cnds[]="Neko.img_fn = '{$kjs['kj_img_fn']}'";
		}
		
		if(!empty($kjs['kj_note'])){
			$cnds[]="Neko.note LIKE '%{$kjs['kj_note']}%'";
		}
		
		if(!empty($kjs['kj_sort_no']) || $kjs['kj_sort_no'] ==='0' || $kjs['kj_sort_no'] ===0){
			$cnds[]="Neko.sort_no = {$kjs['kj_sort_no']}";
		}
		
		$kj_delete_flg = $kjs['kj_delete_flg'];
		if(!empty($kjs['kj_delete_flg']) || $kjs['kj_delete_flg'] ==='0' || $kjs['kj_delete_flg'] ===0){
			if($kjs['kj_delete_flg'] != -1){
				$cnds[]="Neko.delete_flg = {$kjs['kj_delete_flg']}";
			}
		}
		
		if(!empty($kjs['kj_update_user'])){
			$cnds[]="Neko.update_user = '{$kjs['kj_update_user']}'";
		}
		
		if(!empty($kjs['kj_ip_addr'])){
			$cnds[]="Neko.ip_addr = '{$kjs['kj_ip_addr']}'";
		}
		
		if(!empty($kjs['kj_user_agent'])){
			$cnds[]="Neko.user_agent LIKE '%{$kjs['kj_user_agent']}%'";
		}
		
		if(!empty($kjs['kj_created'])){
			$kj_created=$kjs['kj_created'].' 00:00:00';
			$cnds[]="Neko.created >= '{$kj_created}'";
		}
		
		if(!empty($kjs['kj_modified'])){
			$kj_modified=$kjs['kj_modified'].' 00:00:00';
			$cnds[]="Neko.modified >= '{$kj_modified}'";
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
	 * 猫種別リストをDBから取得する
	 */
	public function getNekoGroupList(){

		// DBからデータを取得
		$query = \DB::table('neko_groups')->
		whereRaw("delete_flg = 0")->
		orderBy('sort_no', 'ASC');
		$data = $query->get();

		// リスト変換
		$list = [];
		foreach($data as $ent){
			$ent = (array)$ent;
			$id = $ent['id'];
			$name = $ent['neko_group_name'];
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
	 *  - whiteList ホワイトリスト（省略可)
	 * @return [] エンティティ(insertされた場合、新idがセットされている）
	 */
	public function saveEntity(&$ent, $regParam=[]){
	    
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
	 * エンティティのDB保存
	 * @param [] $ent エンティティ
	 * @return [] エンティティ(insertされた場合、新idがセットされている）
	 */
	public function saveEntity2($ent){
	    
	    $ent = $this->setCommonToEntity($ent);
	    
	    $ent = array_intersect_key($ent, array_flip($this->fillable));
	    
	    // 患者テーブルへDB更新
	    if(empty($ent['id'])){
	        // ▽ idが空であればINSERTをする。
	        $id = $this->insertGetId($ent); // INSERT
	        $ent['id'] = $id;
	    }else{
	        
	        // ▽ idが空でなければUPDATEする。
	        $this->updateOrCreate(['id'=>$ent['id']], $ent); // UPDATE
	    }
	    
	    return $ent;
	    
	}
	
	
	/**
	 * データのDB保存
	 * @param [] $data データ←エンティティの配列
	 */
	public function saveData($data){
	    $data2 = [];
	    foreach($data as $ent){
	        $ent2 = $this->saveEntity($ent);
	        $data2[] = $ent2;
	    }
	    return $data2;
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
	
	// CBBXE
	
	
}

