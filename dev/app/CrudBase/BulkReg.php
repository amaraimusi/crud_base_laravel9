<?php
require_once('ICrudBaseStrategy.php');
/**
 * 一括登録
 * 
 * @note
 * 一括追加, 一括編集, 一括複製
 * 
 * @date 2019-1-9 | 2020-8-25
 * @version 2.0.0
 */
class BulkReg{

	var $strategy;
	var $update_user;
	
	/**
	 * コンストラクタ
	 * @param ICrudBaseStrategy.php $strategy フレームワークストラテジー
	 * @param string $update_user 更新ユーザー
	 */
	public function __construct(ICrudBaseStrategy &$strategy, $update_user = 'none'){
		$this->strategy = $strategy;
		$this->update_user = $update_user;
	}
	
	/**
	 * 登録
	 * @param string $tbl_name テーブル名
	 * @param array $param
	 * @return array レスポンス
	 */
	public function reg($tbl_name, $param){
		
		$action_code = $param['action_code'];
		$res = null;
		switch($action_code){
			
			// 順番取得アクション
			case 'cbba_get_sort_no':
				$res = $this->getSortNo($tbl_name, $param);
				break;
				
			// 一括追加登録アクション
			case 'cbba_add_reg':
				$res = $this->addReg($tbl_name, $param);
				break;
		}
		
		return $res;
		
	}
	
	/**
	 * 一括追加登録
	 * @param string $tbl_name テーブル名
	 * @param array $param
	 * @return array レスポンス
	 */
	private function addReg($tbl_name, &$param){
		
		$data = $param['data'];
		
		// 共通データをセットする
		$data = $this->setCommonField($data);
		
		// SQLインジェクション・サニタイズ（参照引数に対してサニタイズ）
		$this->sql_sanitize($data);
		
		// データからSQLリストを作成する。
		$sqls = $this->createInsertSqls($tbl_name, $data);
		
		$newIds = array(); // 新IDリスト
		
		$row_index = 1;
		$err_msg = '';
		
		// SQLを実行する
		$this->strategy->begin();
		try {
			foreach($sqls as $sql){
				$r = $this->strategy->sqlExe($sql);
				// INSERT直後の新idを取得し、新IDリストに詰める。
				$newIdRes = $this->strategy->selectValue("SELECT LAST_INSERT_ID()");
				$new_id = $this->getValueFromAryDepth($newIdRes);
				$newIds[] = $new_id;
				
				$row_index++;

			}
			
		} catch (Exception $e) {
			$this->strategy->rollback();
			$err_msg = "データの{$row_index}行目に異常があります。確認してください。";
		} 
		$this->strategy->commit();
		
		return array(
				'newIds'=> $newIds,
				'err_msg' => $err_msg
			);
	}
	
	/**
	 * SQLインジェクションサニタイズ
	 *
	 * @note
	 * SQLインジェクション対策のためデータをサニタイズする。
	 * 高速化のため、引数は参照（ポインタ）にしている。
	 *
	 * @param any サニタイズデコード対象のデータ | 値および配列を指定
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
	 * データからINSERT SQLリストを作成する。
	 * @param array $data
	 * @param string $tbl_name テーブル名
	 * @return array SQLリスト
	 */
	private function createInsertSqls($tbl_name, &$data){
		
		if(empty($data)) return array();
		
		// 列名群文字列を組み立て
		$ent0 = current($data);
		$keys = array_keys($ent0);
		$clms_str = implode(',', $keys); // 列名群文字列

		$sqls = array(); // SQLリスト
		foreach($data as &$ent){
			// 値群文字列
			$vals_str = "'".implode("','",$ent)."'";
			
			// INSERT文を組み立て
			$sqls[] = "INSERT INTO {$tbl_name} ({$clms_str}) VALUES ({$vals_str});";
		}
		unset($ent);
		
		return $sqls;
	}
	
	/**
	 * 共通データをセットする
	 * @param array $data
	 * @return array 共通データをセット後のデータ
	 */
	private function setCommonField(&$data){
		
		$today = date('Y-m-d H:i:s');
		
		foreach($data as &$ent){
			
			// 無効フラグ
			if(empty($ent['delete_flg'])) $ent['delete_flg'] = 0;
			
			// 更新ユーザー
			if(empty($ent['update_user'])) $ent['update_user'] = $this->update_user;
			
			// IPアドレス
			if(empty($ent['ip_addr'])) $ent['ip_addr'] = $_SERVER["REMOTE_ADDR"];
			
			// 生成日時
			if(empty($ent['created'])) $ent['created'] = $today;
			
		}
		unset($ent);
		
		return $data;
	}
	
	
	
	/**
	 * 順番を取得する
	 * @param string $tbl_name テーブル名
	 * @param array $param
	 * @return array 次順番
	 */
	private function getSortNo($tbl_name, $param){
		$add_position = $param['add_position']; // 追加位置 0:先頭追加, 1:末尾追加
		
		$lns = 'MIN';
		if($add_position == 1) $lns = 'MAX';
		
		$sql = "
			SELECT {$lns}(sort_no) AS next_sort_no
			FROM {$tbl_name};
		";
		
		$res = $this->strategy->selectValue($sql);
		
		$next_sort_no = 0; // 次順番
		if(!empty($res)) {
			// 配列の深みにある値を取得する(先頭行のみ）
			$next_sort_no = $this->getValueFromAryDepth($res);
			if($add_position == 1){
				$next_sort_no++;
			}else{
				$next_sort_no--;
			}
		}
		
		$res = ['next_sort_no'=>$next_sort_no];

		return $res;
	}
	
	/**
	 * 配列の深みにある値を取得する(先頭行のみ）
	 * @param array $ary 対象配列
	 * @
	 */
	private function getValueFromAryDepth(&$ary){
		if(is_array($ary)){
			$first = current($ary);
			return $this->getValueFromAryDepth($first);
		}else{
			return $ary;
		}
	}
	
	
	
}