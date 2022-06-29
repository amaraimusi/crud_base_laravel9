<?php
require_once('IDao.php');

/**
 * CsvExportBig | 大型CSVダウンロード
 * 
 * @version 1.0.1 DB関連は未実装
 * @date 2019-6-26 | 2019-8-15
 * @author kenji uehara
 * @license MIT
 *
 */
class CsvExportBig{
	
	var $dao;
	
	/**
	 * コンストラクタ
	 * @param IDao $dao データベースアクセスオブジェクト
	 */
	public function __construct(IDao &$dao){
		$this->dao = $dao;
	}
	
	
	/**
	 * 初期処理
	 * @param array $param
	 * @return array $param
	 */
	public function initAction($param){
		$csvFieldData = $param['csvFieldData']; // CSVフィールドデータ
		
		// 作業日時を取得
		$work_dt = date('Y-m-d h:i:s');
		
		$work_dp = $param['work_dp']; // 作業ディレクトリパス
		$csv_fn = $param['def_csv_fn']; // CSVファイル名
		
		// パスの末尾にスラッシュがなければ追加
		$work_dp = $this->addSlashToPathEnd($work_dp);
		
		// 2つか前より古い更新日のファイルをすべて削除する
		$this->removeFileByOldDay($work_dp,2);
		
		// CSVファイル名に日時を付け足す
		$csv_fn = $this->prosCsvFn($csv_fn, $work_dt);
		
		$csv_fp = $work_dp . $csv_fn; // CSVファイルパス
		
		// CSVフィールドデータから列名リストを抽出および、列名リストから列名行を作成。
		$clmNames = $this->extraClmNamesFromCfd($csvFieldData);
		$clm_name_line = '"' . implode('","', $clmNames) . '"'; // 列名行
		
		// ファイルを追記モードで開く（テキストファイルを作成）
		$h = fopen ( $csv_fp, 'ab' );
		flock ( $h, LOCK_EX );// ファイルを排他ロックする
		ftruncate ( $h, 0 );// ファイルの中身を空にする
		
		// 列名行をファイルに書き込む
		fwrite ( $h, $clm_name_line . "\n");
		
		fclose ( $h );// ファイルを閉じる

		// データ数が未設定ならデータ数を取得する。
		$data_count = 0; // データ数
		if(empty($param['data_count'])){
			$data_count = $this->getDataCount($param); // データ数をDBから取得する
		}else{
			$data_count = $param['data_count'];
		}
		
		// パラメータにセットする
		$param['data_count'] = $data_count;
		$param['work_dp'] = $work_dp;
		$param['work_dt'] = $work_dt;
		$param['csv_fn'] = $csv_fn;
		$param['csv_fp'] = $csv_fp;
		
		
		return $param;
	}
	
	
	/**
	 * パスの末尾にスラッシュがなければ追加。
	 *
	 * @param string $path パス
	 * @param string $sep セパレータ: デフォルトは「/」である。「¥」を指定することも可能。
	 * @return string 末尾にスラッシュを付加したパス
	 *
	 */
	private function addSlashToPathEnd($path,$sep='/'){
		if(empty($path)){
			return $path;
		}
		
		$end_str = mb_substr($path,-1);
		if($end_str== $sep){
			return $path;
		}
		
		$path .= $sep;
		
		return $path;
		
	}
	
	
	/**
	 * CSVファイル名に日時を付け足す
	 * @param string $csv_fn CSVファイル名
	 * @param datetime $work_dt 作業日時
	 * @return string CSVファイル名
	 */
	private function prosCsvFn($csv_fn, $work_dt){
		$dt_str = date('Ymdhis', strtotime($work_dt));

		$pInfo = pathinfo($csv_fn);
		$csv_fn = $pInfo['filename'] . $dt_str . '.' .  $pInfo['extension'];
		return $csv_fn;
	}
	
	
	/**
	 * 危険処理
	 * 指定日数より古い更新日のファイルをすべて削除する
	 *
	 * @note
	 *指定日数に2を指定した場合、二日以上前のファイルをすべて削除。
	 *0を指定すると、すべてのファイルを削除
	 *
	 * @param string $dp ディレクトリパス
	 * @param number $day_num 指定日数
	 */
	private function removeFileByOldDay($dp, $day_num = 1){
		
		$fps = $this->scandir3($dp); // ディレクトリ内にあるすべてのファイルのファイルパスを取得する
		$today = date("Y-m-d");
		
		foreach($fps as $fp){
			$dt = date("Y-m-d", filemtime($fp));
			$diff_day = $this->diffDay($today, $dt); // 2つの日付の日数差を算出する
			
			// 日付差が指定日数以上なら、ファイル削除を行う
			if($day_num <= $diff_day){
				//unlink($fp);
				$this->removeDirectory($fp);
			}
		}
	}
	
	
	/**
	 * ディレクトリごとファイルを削除する。（階層化のファイルまで削除可能）
	 * @param string $dir 削除対象ディレクトリ
	 */
	private function removeDirectory($dir) {
		
		// ディレクトリでないなら即削除
		if (!is_dir($dir)) {
			unlink($dir);
			return;
		}
		
		if ($handle = opendir($dir)) {
			while (false !== ($item = readdir($handle))) {
				if ($item != "." && $item != "..") {
					$dp = $dir . '/' . $item;
					if (is_dir($dp)) {
						$this->removeDirectory($dp);
					} else {
						unlink($dp);
					}
				}
			}
			closedir($handle);
			rmdir($dir);
		}
	}
	
	
	
	/**
	 * 2つの日付の日数差を算出する
	 *
	 * diff = d2 - d1
	 *
	 * @param date or string $d2
	 * @param date or string $d1
	 * @return int 日数差
	 */
	private function diffDay($d2,$d1){
		
		$u1=strtotime($d1);
		$u2=strtotime($d2);
		
		//日数を算出
		$diff=$u2-$u1;
		$d_cnt=$diff/86400;
		
		return $d_cnt;
	}
	
	
	/**
	 * scandir関数の拡張関数。
	 *
	 * @note
	 * 「.」「..」となっているファイル名は除外する。
	 *
	 * @param  string $dp ディレクトリ名
	 * @param string $sep セパレータ（省略可）
	 * @return array ファイルパスリスト
	 */
	private function scandir3($dp, $sep = '/'){
		$files = scandir($dp);
		
		// ディレクトリパスの末尾にセパレータを付け足す
		$dp2 = $dp;
		if(mb_substr($dp2, -1) != $sep){
			$dp2 .= $sep;
		}
		
		// 「.」,「..」名のファイルを除去、および日本語ファイルに対応。
		$fps = [];
		foreach($files as $file){
			if($file=='.' || $file=='..'){
				continue;
			}
			$fps[] = $dp2 . $file;
		}
		
		return $fps;
	}
	
	
	/**
	 * CSVフィールドデータから列名リストを抽出する
	 * @param array $csvFieldData CSVフィールドデータ
	 * @return array 列名リスト
	 */
	private function extraClmNamesFromCfd($csvFieldData){
		$clmNames = []; // 列名リスト
		foreach($csvFieldData as $ent){
			$clmNames[] = $ent['clm_name'];
		}
		return $clmNames;
	}
	
	
	/**
	 * データ数をDBから取得する
	 * @param array $param 
	 * @return int データ数
	 */
	private function getDataCount($param){
		
		$tbl_name = $param['tbl_name'];
		
		$where = $this->makeWhere($param, $tbl_name); // WHERE条件を作成する
		
		$sql = "SELECT COUNT(id) AS data_count FROM {$tbl_name} {$where}";
		
		$res = $this->dao->sqlExe($sql);
		$data_count = 0;
		if(!empty($res)){
			$data_count = $res[0][0]['data_count'];
		}

		return $data_count;

	}
	
	
	/**
	 * WHERE条件を作成する
	 * @param array $param
	 * @return string WHERE条件文
	 */
	private function makeWhere($param, $tbl_name){
		
		$csvFieldData = $param['csvFieldData']; // CSVフィールドデータ
		
		$where = ''; // WHERE条件文
		if(empty($param['kjs'])) return $where;
		
		if(!empty($param['kjs'])){
			$kjs = $param['kjs'];
			
			$first_flg = true;
			foreach($kjs as $field=>$kj_value){
				if(empty($kj_value)) continue;
				
				// 初回ループである場合はANDを付けない
				$and_str = 'AND';
				if($first_flg == true){
					$and_str ='';
					$first_flg = false;
				}
				
				// フィールド名からCSVフィールドエンティティを取得する
				$cfEnt = $this->getCsvFieldEntity($csvFieldData, $field);
				
				// テーブル名を取得
				$tbl_name2 = '';
				if(!empty($cfEnt)){
					$tbl_name2 = $cfEnt['tbl_name'];
				}else{
					$tbl_name2 = $tbl_name;
				}
				
				// SQLを組み立て
				$where .= " {$and_str} {$tbl_name2}.{$field}='{$kj_value}' ";
			}
		}
		
		if(!empty($where)){
			$where = ' WHERE' . $where;
		}
		
		return $where;
	}
	
	
	/**
	 * フィールド名からCSVフィールドエンティティを取得する
	 * @param array $csvFieldData CSVフィールドデータ
	 * @param string $field フィールド名
	 * @return array CSVフィールドエンティティ
	 */
	private function getCsvFieldEntity(&$csvFieldData, $field){
		foreach($csvFieldData as $ent){
			if($ent['field'] == $field){
				return $ent;
			}
		}
		return null;
	}
	
	
	/**
	 * 継続処理
	 * @param array $param
	 * @return array $param
	 */
	public function continuAction($param){
		
		$tbl_name = $param['tbl_name'];
		
		$select_str = $this->makeSelect($param, $tbl_name); // SELECT部分を作成する
		
		$where = $this->makeWhere($param, $tbl_name); // WHERE条件を作成する
		
		$join_str = $this->makeJoinStr($param, $tbl_name); // JOIN部分を作成する
		
		$limit = "LIMIT {$param['offset']}, {$param['batch_data_num']}";
		
		$sql = "SELECT {$select_str}  FROM {$tbl_name} {$join_str} {$where} {$limit}";
		
		// DBからデータを取得する
 		$res = $this->dao->sqlExe($sql);
 		
 		// データ構造を変換（2次元配列化）
 		$data = $this->convStructForDbData($res);

		// 定数型フィールドの値を取得する
 		$data = $this->getValueForConstType($data, $param);
 		
 		$csvFieldData = $param['csvFieldData']; // CSVフィールドデータ
 		
 		// ▼CSVへ書き出す
 		// ファイルを追記モードで開く（テキストファイルを作成）
 		$csv_fp = $param['csv_fp']; // CSVファイルパス
 		$h = fopen ( $csv_fp, 'a' );
 		flock ( $h, LOCK_EX );// ファイルを排他ロックする
 		foreach($data as $ent){
 			
 			$line = $this->entityToLine($ent, $csvFieldData); // エンティティから行文字列を作成する。
 			fwrite ( $h,  $line . "\n"); // 行をファイルに追記する。
 		}
 		fclose ($h);// ファイルを閉じる
 		
 		
 		// オフセットを進める
 		$data_count = count($data); // データ数を取得する
 		$offset = $param['offset'];
 		$offset += $data_count;

 		$param['offset'] = $offset;

		return $param;
	}
	
	
	/**
	 * DBデータ用構造変換
	 * @param array $res DB取得のレス
	 * @return array エンティティ配列型のデータ
	 */
	private function convStructForDbData(&$res){
		$data = [];
		if(!empty($res)){
			foreach($res as $i=>$tbl){
				foreach($tbl as $ent){
					foreach($ent as $key => $v){
						$data[$i][$key]=$v;
					}
				}
			}
		}
		return $data;
	}
	
	
	/**
	 * SELECT条件を作成する
	 * @param array $param
	 * @param string $tbl_name メインテーブル名
	 * @return string SELECT部分文字列
	 */
	private function makeSelect(&$param, $tbl_name){
		
		$csvFieldData = $param['csvFieldData']; // CSVフィールドデータ
		
		$ary = [];
		foreach($csvFieldData as $cfEnt){
			
			$field = $cfEnt['field'];
			if($cfEnt['join_type'] == 'const'){
				$field = $cfEnt['id_field'];
			}

			// テーブル名を取得
			$tbl_name2 = '';
			if(!empty($cfEnt)){
				$tbl_name2 = $cfEnt['tbl_name'];
			}else{
				$tbl_name2 = $tbl_name;
			}
			
			$ary[] = " {$tbl_name2}.{$field}";
		}
		
		$select_str = implode(",", $ary); // SELECT部分文字列
		
		return $select_str;
	}
	
	
	/**
	 * JOIN部分を作成する
	 * @param array $param
	 * @param string $main_tbl_name メインテーブル名
	 * @return string JOIN部分文字列
	 */
	private function makeJoinStr(&$param, $mani_tbl_name){
		
		$csvFieldData = $param['csvFieldData']; // CSVフィールドデータ
		
		// 同じテーブルをJOINしないように重複をフィルタリングする。
		$cfData2 = [];
		foreach($csvFieldData as $cfEnt){
			if($cfEnt['join_type'] == 'left'){
				$tbl_name = $cfEnt['tbl_name'];
				if(empty($cfData2[$tbl_name])){
					$cfData2[$tbl_name] = $cfEnt;
				}
			}
		}
		
		// JOIN部分文字列を組み立て
		$join_str = ""; // JOIN部分文字列 
		foreach($cfData2 as $tbl_name => $cfEnt){
			$join_str .= " LEFT JOIN {$cfEnt['tbl_name']} ON {$mani_tbl_name}.{$cfEnt['id_field']} = {$cfEnt['tbl_name']}.id";
		}

		return $join_str;
		
	}
	
	
	/**
	 * 定数型フィールドの値を取得する
	 * @param array $data
	 * @param array $param
	 * @return array $data 定数型フィールドの値をセット後
	 */
	private function getValueForConstType(&$data, &$param){
		$csvFieldData = $param['csvFieldData']; // CSVフィールドデータ
		
		// JOINタイプが定数型のエンティティだけにフィルタリングする。
		$cfData2 = [];
		foreach($csvFieldData as $cfEnt){
			if($cfEnt['join_type'] == 'const'){
				$cfData2[] = $cfEnt;
			}
		}
		
		// 定数型フィールドの値を取得する
		foreach($data as &$ent){
			foreach($cfData2 as &$cfEnt){
				$field = $cfEnt['field'];
				$id_field = $cfEnt['id_field'];
				$idMap = $cfEnt['idMap']; // IDマップ	/ 定数ハッシュマップ
				
				$name = '';
				$x_id = $ent[$id_field]; // 定数ID
				if(!empty($x_id)){
					if(!empty($idMap[$x_id])){
						$name = $idMap[$x_id];
					}
				}
				$ent[$field] = $name;
			}
		}
		unset($cfEnt);
		unset($ent);
		
		return $data;
		
	}
	
	
	/**
	 * エンティティから行文字列を作成する。
	 * @param array $ent エンティティ
	 * @param array $csvFieldData CSVフィールドデータ
	 * @return string 行文字列
	 */
	private function entityToLine($ent, $csvFieldData){
		$line = "";
		$list = []; // リスト
		foreach($csvFieldData as $cfEnt){
			$field = $cfEnt['field'];
			$value = $ent[$field];
			
			// 値をダブルクォートで囲みリストに追加する
			if(mb_strpos($value, '"')!==false){
				$value = str_replace('"', '""', $value);
			}
			$value = '"' . $value . '"';
			$list[] = $value;
			
		}
		
		// リストをカンマでjoinする。
		$line = implode(',', $list);
		
		return $line;
	}
	
	
	/**
	 * ZIP化する
	 * @param array $param
	 * @return array $param
	 */
	public function zipConversion($param){
		
		$zip = new ZipArchive();
		
		// ZIPファイルパスを作成する
		$csv_fp = $param['csv_fp'];
		$paths = pathinfo($csv_fp);
		$zip_fp = $paths['dirname'] . '/' . $paths['filename'] . '.zip';
		
 		// ZIPファイルをオープン
		$res = $zip->open($zip_fp, ZipArchive::CREATE);
		
		// zipファイルのオープンに成功した場合
		if ($res === true) {
			
			// 圧縮するファイルを指定する
			$zip->addFile($csv_fp);
			
			// 閉じる
			$zip->close();
		}
		
		$param['zip_fp'] = $zip_fp;
		
		return $param;
	}
	
	
}