<?php

/**
 * データ保存クラス
 * @version 2.0.2
 * @author kenji uehara
 * @since 2019-11-6 | 2022-1-9
 * @license MIT
 *
 */
class SaveData{
	
	
	private $dao;
	
	private $fieldTypeHm; // フィールド型ハッシュマップ
	
	
	/**
	 * コンストラクタ
	 * @param IDao $dao
	 */
	public function __construct(IDao $dao = null){
		if($dao == null){
			require_once 'PdoDao.php';
			$dao = new PdoDao();
		}
		$this->dao = $dao;
	}

	
	/**
	 * DAOを取得する
	 * @return IDao $dao
	 */
	public function getDao(){
		return $this->dao;
	}
	
	
	/**
	 * データ保存する
	 * 
	 * @note
	 * idフィールドが主キー、オートインクリメントであるテーブルが対象。
	 * 1行でもDB登録に失敗すると一旦すべてロールバックする。
	 * トランザクション制御が内部でなされている。idをレスポンスとして取得する仕様上、この制御ははずせず。
	 * 
	 * @param string $tbl_name テーブル名
	 * @param array $data データ（エンティティ配列型）
	 * @return array
	 *   - rData 処理結果データ
	 *   - err_msg エラーメッセージ
	 */
	public function saveAll($tbl_name, &$data){
		if(empty($data)) return 1;
		
		$sqls = $this->createInsertAndUpdate2($tbl_name, $data);

		$rData = []; // 処理結果データ
		
		$this->begin();
		foreach($sqls as $i => $sql){
			$err_msg = $this->dao->query($sql);
			if(!empty($err_msg)) break;
			
			
			$rEnt = [];
			if($id == 0){
				$rEnt['id'] = $data[$i]['id'];
				$rEnt['exe_type'] = 'update';
			}else{
			    $id = $this->getValue('SELECT LAST_INSERT_ID()');
				$rEnt['id'] = $id;
				$rEnt['exe_type'] = 'insert';
			}
			$rData[] = $rEnt;
		}
		
		if(empty($err_msg)){
			$this->commit();
		}else{
			$this->rollback();
		}
		
		$res = ['rData'=>$rData, 'err_msg'=>$err_msg];
		return $res;
		
	}
	
	
	/**
	 * データ保存する
	 * 
	 * @note
	 * idフィールドが主キー、オートインクリメントであるテーブルが対象。
	 * トランザクション制御が内部でなされている。idをレスポンスとして取得する仕様上、この制御ははずせず。
	 * 
	 * @param string $tbl_name テーブル名
	 * @param array $ent エンティティ
	 * @return array
	 *   - rEnt 処理結果エンティティ
	 *   - err_msg エラーメッセージ
	 * 
	 */
	public function save($tbl_name, &$ent){
		if(empty($ent)) return 1;
		
		$sql = $this->makeInsertSqlDupFromEnt($tbl_name, $ent);
		
		$this->begin();
		$err_msg = $this->dao->query($sql);
		
		$rEnt = [];
		if(empty($err_msg)){
			$id = $this->getValue('SELECT LAST_INSERT_ID()');
			$this->commit();
			if($id == 0){
				$rEnt['id'] = $ent['id'];
				$rEnt['exe_type'] = 'update';
			}else{
				$rEnt['id'] = $id;
				$rEnt['exe_type'] = 'insert';
				$ent['id'] = $id;
			}
		}else{
			$this->rollback();
		}
		
		$res = ['ent'=>$ent, 'rEnt'=>$rEnt, 'err_msg'=>$err_msg];
		return $res;
	}
	
	
	
	
	/**
	 * テーブルに存在しないフィールドを除去するフィルター
	 * @param string $tbl_name テーブル名
	 * @param array $data 
	 * @return array フィルター後のデータ
	 */
	public function filterData($tbl_name, &$data){
		
		// 列情報を取得する
		$fields = $this->getFields($tbl_name);
		
		$data2 = [];
		foreach($data as $ent){
			$ent2 = [];
			foreach($ent as $field=>$value){
				if(in_array($field, $fields)){
					$ent2[$field] = $value;
				}
			}
			$data2[] = $ent2;
		}
		return $data2;
	}
	
	
	
	
	
	/**
	 * フィールドリストを取得する
	 * @param string $tbl_name テーブル名
	 * @return array フィールドリスト
	 */
	public function getFields($tbl_name){
		$columns = $this->getColumns($tbl_name);
		$fields = [];
		foreach($columns as $clmEnt){
			$fields[] = $clmEnt['Field'];
		}
		return $fields;
	}
	
	
	/**
	 * 列情報を取得する
	 * @param string $tbl_name テーブル名
	 * @return array $columns 列情報
	 */
	public function getColumns($tbl_name){
		$columns = $this->dao->getData("SHOW FULL COLUMNS FROM {$tbl_name}");
		return $columns;
	}
	
	
	/**
	 * エンティティからDUPLICATE型のINSERT文を作成する(重複は更新）
	 * 
	 * @note
	 * テーブルに存在しないフィールドは無視する。
	 * 
	 * @param string $tbl_name テーブル名
	 * @param array $ent エンティティ
	 * @return array INSERT SQLリスト
	 *
	 */
	public function makeInsertSqlDupFromEnt($tbl_name, $ent){
		if(empty($ent)) return [];
		
		// フィールド型ハッシュマップを取得する
		$fieldTypeHm = $this->getFieldTypeHashmap($tbl_name);
		
		$fields_str = '';
		$i_vals_str = '';
		$u_vals_str = '';
		foreach($ent as $field => $value){
			if(empty($fieldTypeHm[$field])) continue;
			if($field == 'id' && empty($value)) continue;
			
			$fields_str .= $field . ',';
			$type = $fieldTypeHm[$field];
			
			// 日付系に空をセットする場合はNULLをセット
			if(empty($value) && ($type == 'date' || $type == 'datetime')){
				$i_vals_str .= "NULL,";
				$u_vals_str .=  "{$field}=NULL,";
			}else{
				$i_vals_str .= "'{$value}',";
				$u_vals_str .=  "{$field}='{$value}',";
			}
		}
		
		// 末尾の一文字であるコンマを削る
		$i_vals_str = mb_substr($i_vals_str,0,mb_strlen($i_vals_str)-1);
		$u_vals_str = mb_substr($u_vals_str,0,mb_strlen($u_vals_str)-1);
		$fields_str = mb_substr($fields_str,0,mb_strlen($fields_str)-1);
		
		$sql = "
		 	INSERT INTO {$tbl_name} ({$fields_str})
	 		VALUES ({$i_vals_str})
	 		ON DUPLICATE KEY UPDATE {$u_vals_str}
		";
		
		return $sql;
		
	}
	
	
	/**
	 * フィールド型ハッシュマップを取得する
	 * @param string $tbl_name
	 * @return array フィールド型ハッシュマップ
	 */
	private function getFieldTypeHashmap($tbl_name){
		
		if($this->fieldTypeHm) return $this->fieldTypeHm;
		
		$columns = $this->getColumns($tbl_name); // 列情報を取得する
		$fieldTypeHm = [];
		
		foreach($columns as $clmEnt){
			$field = $clmEnt['Field'];
			$type = $clmEnt['Type'];
			$fieldTypeHm[$field] = $type;
		}
		$this->fieldTypeHm = $fieldTypeHm;
		
		return $fieldTypeHm;
	}
	
	
	
	/**
	 * データからDUPLICATE型のINSERT文を作成する
	 * @param string $tbl_name テーブル名
	 * @param array $data エンティティ配列型のデータ
	 * @return array INSERT SQLリスト
	 *
	 */
	public function makeInsertSqlDup($tbl_name, &$data){
		if(empty($data)) return [];
		
		$sqls = [];
		foreach($data as $ent){
			$sqls[] = $this->makeInsertSqlDupFromEnt($tbl_name, $ent);
		}
		return $sqls;
		
		return $sqls;
		
		
	}
	
	/**
	 * データからINSERTとUPDATEのSQL文を生成する
	 * @param string $tbl_name テーブル名
	 * @param array $data エンティティ配列型のデータ
	 * @param string $id_filed IDフィールド（主キーフィールド）
	 * @return array|string[][]
	 */
	public function createInsertAndUpdate($tbl_name, $data, $id_filed='id'){
		if(empty($data)) return [];
		
		
		$inserts = []; // INSERT SQLリスト
		$updates = []; // UPDATE SQLリスト
		foreach($data as &$ent){
			
			
			// IDが空ならINSERT文を組み立て
			if(empty($ent[$id_filed])){
				$inserts[] = $this->makeInsertSql($tbl_name, $ent); // INSERT文を作成する
			}
			
			// IDが存在すればUPDATE文を組み立て
			else{
				$updates[] = $this->makeUpdateSql($tbl_name, $ent); // UPDATE文を作成する
			}
		}
		unset($ent);
		
		$res = [
			'inserts' => $inserts,
			'updates' => $updates,
		];
		return $res;
	}
	
	/**
	 * データからINSERTとUPDATEのSQL文を生成する
	 * @param string $tbl_name テーブル名
	 * @param array $data エンティティ配列型のデータ
	 * @param string $id_filed IDフィールド（主キーフィールド）
	 * @return array|string[] SQLリスト
	 */
	public function createInsertAndUpdate2($tbl_name, $data, $id_filed='id'){
	    if(empty($data)) return [];

	    $sqls = []; // SQLリスト
	    foreach($data as &$ent){
	        
	        
	        // IDが空ならINSERT文を組み立て
	        if(empty($ent[$id_filed])){
	            $sqls[] = $this->makeInsertSql($tbl_name, $ent); // INSERT文を作成する
	        }
	        
	        // IDが存在すればUPDATE文を組み立て
	        else{
	            $sqls[] = $this->makeUpdateSql($tbl_name, $ent); // UPDATE文を作成する
	        }
	    }
	    unset($ent);

	    return $sqls;
	}
	
	
	/**
	 * INSERT文を作成する
	 * @param string $tbl_name テーブル名
	 * @param array $ent 登録データのエンティティ
	 * @return string INSERT文
	 */
	public function makeInsertSql($tbl_name, &$ent){
		
		$clms_str = '';
		$vals_str = '';
		foreach($ent as $field => $value){
			$clms_str .= $field . ',';
			
			if(empty($value) && $value !==0 && $value !=='0') $value = '';
			$vals_str .= "'{$value}',";
		}
		
		// 末尾の一文字であるコンマを削る
		$clms_str = mb_substr($clms_str,0,mb_strlen($clms_str)-1);
		$vals_str = mb_substr($vals_str,0,mb_strlen($vals_str)-1);
		
		$insert_sql = "INSERT INTO {$tbl_name} ({$clms_str}) VALUES ({$vals_str});";
		return $insert_sql;
	}
	
	
	/**
	 * UPDATE文を作成する(非推奨）
	 * @param string $tbl_name テーブル名
	 * @param array $ent 登録データのエンティティ
	 * @param string $id_filed IDフィールド（主キーフィールド）
	 * @return string UPDATE文
	 */
	public function makeUpdateSql($tbl_name, &$ent, $id_filed='id'){
		if(empty($ent[$id_filed])) throw new Exception("makeUpdateSql: {$id_filed}が空です。");
		
		$vals_str = '';
		foreach($ent as $field => $value){
			if($value === null) continue;
			$vals_str .= "{$field}='{$value}',";
		}
		
		$vals_str = mb_substr($vals_str,0,mb_strlen($vals_str)-1);// 末尾の一文字であるコンマを削る
		
		$update_sql = "UPDATE {$tbl_name} SET {$vals_str} WHERE {$id_filed}={$ent['id']}";
		
		return $update_sql;
	}
	
	
	/**
	 * SQLによるエンティティ配列型のデータ取得
	 * @param string $sql
	 */
	public function getData($sql){
		return $this->dao->getData($sql);
	}
	
	
	
	/**
	 * SQLによるエンティティ配列型のデータ取得（エイリアス）
	 * @param string $sql
	 */
	public function getDataBySql($sql){
		return $this->getData($sql);
	}
	
	
	/**
	 * SQLによるエンティティ取得
	 * @param string $sql
	 */
	public function getEnt($sql){
		$data = $this->dao->getData($sql);
		if(empty($data)) return [];
		return $data[0];
		
	}

	
	/**
	 * SQLによるエンティティ取得（エイリアス）
	 * @param string $sql
	 */
	public function getEntBySql($sql){
		return $this->getEnt($sql);
	}
	
	
	/**
	 * 一つの値を取得する
	 * @param string $sql
	 * @return NULL|mixed
	 */
	public function getValue($sql){
		$ent = $this->getEnt($sql);
		if(empty($ent)) return null;
		$value = current($ent);;
		return $value;
	}

	
	/**
	 * エンティティをDBにINSERT
	 * @param string $tbl_name テーブル名
	 * @param array $ent エンティティ
	 * @return string $err_msg;
	 */
	public function insertEntity($tbl_name, $ent){
		
		$sql = $this->makeInsertSql($tbl_name, $ent);
		return $this->dao->query($sql);
	}
	
	/**
	 * オートインクリメントのリセット
	 * @param string $tbl_name テーブル名
	 * @param number $reset_value リセット値
	 * @return string $err_msg;
	 */
	public function resetAutoIncrement($tbl_name, $reset_value=1){

		$sql = "ALTER TABLE {$tbl_name} auto_increment = {$reset_value};";
		return  $this->dao->query($sql);
		
	}
	
	
	/**
	 * 削除
	 * @param string $tbl_name テーブル名
	 * @param int $id
	 * @return string $err_msg;
	 */
	public function delete($tbl_name, $id){
		$sql = "DELETE FROM {$tbl_name} WHERE id={$id}";
		return $this->dao->query($sql);
	}
	
	
	/**
	 * SQLを実行
	 * @param string $sql
	 * @return string $err_msg;
	 */
	public function query($sql){
		
		return $this->dao->query($sql);

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
	public function sql_sanitize(&$data){
		
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
	
	
	
	public function begin(){
		$this->dao->begin();
	}
	
	public function rollback(){
		$this->dao->rollback();
	}
	
	public function commit(){
		$this->dao->commit();
	}
	
	
}