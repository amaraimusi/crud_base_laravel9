<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MsgBoardUserEval extends AppModel
{
	protected $table = 'msg_board_user_evals'; // 紐づけるテーブル名
	//protected $guarded = ['id']; // 予期せぬ代入をガード。 通常、主キーフィールドや、パスワードフィールドなどが指定される。
	
	// ホワイトリスト（DB保存時にこのホワイトリストでフィルタリングが施される）
	public $fillable = [
			// CBBXS-2009
			'id',
			'msg_board_id',
			'user_id',
			'eval_type_id',
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
				SELECT SQL_CALC_FOUND_ROWS MsgBoardUserEval.* {$outer_selects_str}
				FROM {$main_tbl_name} AS MsgBoardUserEval
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
			$cnds[]="CONCAT( IFNULL(MsgBoardUserEval.msg_board_user_eval_name, '') ,IFNULL(MsgBoardUserEval.note, '')) LIKE '%{$kjs['kj_main']}%'";
		}
		
		// CBBXS-1003
		if(!empty($kjs['kj_id']) || $kjs['kj_id'] ==='0' || $kjs['kj_id'] ===0){
			$cnds[]="MsgBoardUserEval.id = {$kjs['kj_id']}";
		}
		if(!empty($kjs['kj_msg_board_id']) || $kjs['kj_msg_board_id'] ==='0' || $kjs['kj_msg_board_id'] ===0){
			$cnds[]="MsgBoardUserEval.msg_board_id = {$kjs['kj_msg_board_id']}";
		}
		if(!empty($kjs['kj_user_id']) || $kjs['kj_user_id'] ==='0' || $kjs['kj_user_id'] ===0){
			$cnds[]="MsgBoardUserEval.user_id = {$kjs['kj_user_id']}";
		}
		if(!empty($kjs['kj_eval_type_id']) || $kjs['kj_eval_type_id'] ==='0' || $kjs['kj_eval_type_id'] ===0){
			$cnds[]="MsgBoardUserEval.eval_type_id = {$kjs['kj_eval_type_id']}";
		}
		if(!empty($kjs['kj_sort_no']) || $kjs['kj_sort_no'] ==='0' || $kjs['kj_sort_no'] ===0){
			$cnds[]="MsgBoardUserEval.sort_no = {$kjs['kj_sort_no']}";
		}
		$kj_delete_flg = $kjs['kj_delete_flg'];
		if(!empty($kjs['kj_delete_flg']) || $kjs['kj_delete_flg'] ==='0' || $kjs['kj_delete_flg'] ===0){
			if($kjs['kj_delete_flg'] != -1){
			   $cnds[]="MsgBoardUserEval.delete_flg = {$kjs['kj_delete_flg']}";
			}
		}
		if(!empty($kjs['kj_update_user'])){
			$cnds[]="MsgBoardUserEval.update_user LIKE '%{$kjs['kj_update_user']}%'";
		}
		if(!empty($kjs['kj_ip_addr'])){
			$cnds[]="MsgBoardUserEval.ip_addr LIKE '%{$kjs['kj_ip_addr']}%'";
		}
		if(!empty($kjs['kj_created'])){
			$kj_created=$kjs['kj_created'].' 00:00:00';
			$cnds[]="MsgBoardUserEval.created >= '{$kj_created}'";
		}
		if(!empty($kjs['kj_modified'])){
			$kj_modified=$kjs['kj_modified'].' 00:00:00';
			$cnds[]="MsgBoardUserEval.modified >= '{$kj_modified}'";
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
	 * 評価種別IDリストをDBから取得する
	 */
	public function getEvalTypeIdList(){

		// DBからデータを取得
		$query = \DB::table('eval_types')->
		whereRaw("delete_flg = 0")->
		orderBy('sort_no', 'ASC');
		$data = $query->get();

		// リスト変換
		$list = [];
		foreach($data as $ent){
			$ent = (array)$ent;
			$id = $ent['id'];
			$name = $ent['eval_type_name'];
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

