<?php

require_once('InputCheckValid.php');
require_once('IDao.php');
require_once('CsvExin.php');
require_once('LogEx.php');


/**
 * 大型CSVインポート | CSV分割読込
 * 
 * @note
 * 数十MBクラスのCSVファイルを分割して読み込む。
 * CSVファイルのzipにのみ対応。（生のCSVファイルには未対応）
 * CsvImportBig.jsと連動。
 * 日本語ファイル名に対応。
 * 
 * @component
 * CsvExin.php
 * 
 * @date 2019-5-20 | 2020-11-4
 * @version 1.1.6
 * @license MIT
 *
 */
class CsvImportBig{
	
    var $icv; // 入力チェックバリデーション | InputCheckValid
    var $csvExin; // CsvExin.php 専属CSV読込 csv_exin
    var $log; // LogEx.php
    
    /**
     * コンストラクタ
     * @param IDao $dao データベースアクセスオブジェクト
     * @param array $param
     * - string $log_fp ログファイルパス
     * - string $update_user 更新ユーザー
     */
    public function __construct(IDao &$dao, $param){
        $log_fp = $param['log_fp'];
        $this->icv = new InputCheckValid(['log_flg'=>1, 'log_fp'=>$log_fp]);
        $this->csvExin = new CsvExin($this->icv, $dao, $param['update_user']);
        
        $this->log = new LogEx();
    }
    
    
	/**
	 * ZIPの解凍
	 * @param array $files $_FILES
	 * @param array $param
	 * @return $param
	 * 
	 */
	public function unzip($files, $param){
		
		if(empty($files)){
			return $this->err($param, "アップロードZIPファイルは空です。");
		}
		
		$zip_dp = $param['zip_dp']; // ZIPディレクトリパス
		mkdir($zip_dp); // ZIPディレクトリを作成。 ZIPの配置と展開先
		
		// ZIPフィル名を取得、半角英数字でなければ日時からのファイル名を代わりにセットする。
		$zip_fn = $_FILES[0]['name']; // ZIPファイル名
		if (!preg_match("/^[a-zA-Z0-9-_.]+$/", $zip_fn)) {
			$zip_fn = date('Ymdhis') . '.zip';
		}
		
		// zipファイルをサーバーの作業ディレクトリパスの場所へ配置
		$tmp_name = $_FILES[0]['tmp_name'];
		move_uploaded_file($tmp_name, $zip_dp . $zip_fn);

		// ▼ ZIPを解凍する
		$zip_fp = $zip_dp . $zip_fn; // ZIPファイルパス
		$zip = new ZipArchive();
		$res = $zip->open($zip_fp); // zipファイルを指定
		if($res === true){
			$zip->extractTo($zip_dp);// 出力先パスを指定
			$zip->close();
		} else {
			return $this->err($param, "ZIPの解凍に失敗しました。");
		}
		
		// 日本語ファイル名を半悪英数字に変更
		$this->jpFnRename($zip_dp);
		
		$csv_fp = $this->getCsvFilePath($zip_dp); // ZIPディレクトリ内からCSVファイルパスを取得する。
		if(empty($csv_fp)) return $this->err($param, "ZIP解凍先にCSVファイルが存在しません。");
		$pi = pathinfo($csv_fp);
		$csv_fn = $pi['basename'];
		
		// CSVファイル名が半角英数字（一部記号）でなければエラー。
		if (!preg_match("/^[a-zA-Z0-9-_.]+$/", $csv_fn)) {
			return $this->err($param, "CSVファイル名は半角英数字にしてください。（日本語ファイル名は不可です。）");
		}
		
		
		$head_str = $this->getHeadsFromTextfile($csv_fp); // テキストファイルの先頭行文字列を取得する
		$heads = $this->makeHeads($head_str);// 列名配列を取得する
		$csvFieldData = $param['csvFieldData']; // CSVフィールドデータ
		
		// 列名のクリーニング。「:」など、特定文字から右側の文字を切り捨てる。
		$heads = $this->cleaningHeads($heads);
	
		// インデックスハッシュマップを作成 | キーはフィールド、値はインデックス（0からの列順）
		$idxHm = $this->makeIdxHm($heads, $csvFieldData);
		
		// 重複列名チェック
		$err_msg = $this->checkDuplicateClmName($heads); 
		if(!empty($err_msg)) return $this->err($param, $err_msg);
		
		// 必須列チェック
		$err_msg = $this->checkRequiredClm($idxHm, $csvFieldData);
		if(!empty($err_msg)) return $this->err($param, $err_msg);

		$fsize = filesize ($csv_fp); // ファイル容量を取得する
		
		// CSVフィールドからバリデーションデータを作成する
		$validData = $this->icv->makeValidDataFromCsvFieldData($csvFieldData);

		$param['idxHm'] = $idxHm;
		$param['zip_fn'] = $zip_fn;
		$param['zip_fp'] = $zip_fp;
		$param['csv_fn'] = $csv_fn;
		$param['csv_fp'] = $csv_fp;
		$param['fsize'] = $fsize;
		$param['validData'] = $validData;
		

		return $param;
	}
	
	
	/**
	 * 日本語ファイル名を半悪英数字に変更
	 *
	 * @note
	 * 指定ディレクトリ内の日本語ファイル名を日時から生成したファイル名に一括変更する。
	 *
	 * @param string $dp ディレクトリパス
	 * @param string $sep セパレータ（省略可）
	 * @return array ファイル名変更情報
	 */
	private function jpFnRename($dp, $sep='/'){
		
		$resData = []; // レスポンスデータ
		
		// ディレクトリパスの末尾にセパレータがなければ付け足す。
		$one = mb_substr($dp, -1);
		if($one != $sep) $dp .= $sep;
		
		$fns = scandir($dp);
		foreach($fns as $i => $fn){
			if($fn == '.' || $fn == '..') continue;
			if (!preg_match("/^[a-zA-Z0-9-_.]+$/", $fn)) {
				
				$old_fp = $dp . $fn; // 旧ファイルパス
				
				// 拡張子を取得
				$pi = pathinfo($fn);
				$ext = $pi['extension'];
				
				// 新ファイルパス
				$date_str = date('Ymd_his');
				$new_fp = "{$dp}{$date_str}_{$i}.{$ext}";
				
				rename ($old_fp, $new_fp); // ファイル名変更
				
				$ent = ['old_fp'=>$old_fp, 'new_fp'=>$new_fp,];
				$resData[] = $ent;
				
			}else{
				$old_fp = $dp . $fn;
				$ent = ['old_fp'=>$old_fp, 'new_fp'=>$old_fp,];
				$resData[] = $ent;
			}
		}
		
		return $resData;
	}
	
	
	/**
	 * 列名のクリーニング
	 * 
	 * @note
	 * 「:」など特定文字から右側は切り捨てる。
	 * 
	 * @param array $heads 列配列
	 * @return array クリーニング後の列配列
	 */
	private function cleaningHeads($heads){
		$removeMarks = [':', '：', '※', '(', '（', '【'];
		foreach($heads as $i => $clm_name){
			foreach($removeMarks as $remove_mark){
				$clm_name = $this->removeRight($clm_name, $remove_mark);
			}
			$heads[$i] = $clm_name;
 		}
 		return $heads;
	}
	
	/**
	 * 印文字から右側を切り捨てる
	 * @param string $s 対象文字列
	 * @param string $mark 印文字
	 * @return string 切り捨て後の文字列
	 */
	private function removeRight($s,$mark){
		
		if ($s==null || $s==""){
			return $s;
		}
		$a=strpos($s,$mark);
		if($a==null && $a!==0){
			return $s;
		}
		$s2=substr($s,0,$a);
		return $s2;
	}
	
	
	/**
	 * ZIPディレクトリ内からCSVのファイルパスを取得する。
	 * @param string $zip_dp ZIPディレクトリパス
	 * @return string CSVファイルパス
	 */
	private function getCsvFilePath($zip_dp){
		$fps = $this->getFilepathInDeepDir($zip_dp);// ディレクトリ階層化の全ファイル名を取得する
		foreach($fps as $fp){
			$path_param = pathinfo($fp);
			$ext = '';
			if(!empty($path_param['extension'])) $ext = $path_param['extension'];
			$ext = mb_strtolower($ext); // 小文字化
			if($ext == 'csv'){
				return $fp;
			}
		}
		return null;
		
	}
	
	/**
	 * ディレクトリ内の全階層を深く探り、ファイルパスリストを取得する
	 * @param string $dp ディレクトリパス
	 * @param [] $list ファイル名リスト（内部処理用なのでセット不要)
	 * @return [] ファイルパスリスト
	 */
	private function getFilepathInDeepDir($dp, $list=[] ) {
		if(empty($dp)) return [];
		
		// ディレクトリパスの末尾が「/」または「\」なら取り除く
		$end_one = mb_substr($dp, -1);
		if($end_one == '/' || $end_one == '\\') {
			$dp = mb_substr($dp, 0, mb_strlen($dp)-1);// 末尾の一文字を削る
		}
		
		if ($handle = opendir("{$dp}")) {
			while (false !== ($item = readdir($handle))) {
				if ($item != "." && $item != "..") {
					if (is_dir("{$dp}/{$item}")) {
						$list = $this->getFilepathInDeepDir("{$dp}/{$item}", $list);
					} else {
						$list[] = "{$dp}/{$item}";
					}
				}
			}
			closedir($handle);
			
		}
		return $list;
	}
	
	
	/**
	 * scandir関数の拡張関数。
	 *
	 * @note
	 * 「.」「..」となっているファイル名は除外する。
	 * 日本語ファイル名に対応するためUTF-8に変換している。
	 * そのため、当関数で取得したファイル名でWindows上のファイルを扱う場合、Shift-JISに戻す必要がある。
	 * WindowsのファイルはShift-JISで扱わねばならないためである。
	 *
	 * @param string $dir_name ディレクトリ名
	 * @return array ファイル名の配列
	 */
	private function scandir2($dir_name){
		$files = scandir($dir_name);
		
		// 「.」,「..」名のファイルを除去、および日本語ファイルに対応。
		$files2 = array();
		foreach($files as $file){
			if($file=='.' || $file=='..'){
				continue;
			}
			$file = mb_convert_encoding($file, 'UTF-8', 'SJIS');
			$files2[] = $file;
		}
		
		
		return $files2;
	}
	
	
	/**
	 * テキストファイルの先頭行文字列を取得する
	 * @param string $fn テキストファイルパス
	 * @return string 先頭行文字列
	 */
	private function getHeadsFromTextfile($fn){

		$head_str = '';
		if ($fp = fopen ( $fn, "r" )) {
			$head_str = fgets ($fp);
		}
		fclose ( $fp );
		
		$head_str = $this->deleteBom($head_str); // UTF8ファイルのテキストに付いているBOMを除去する

		return $head_str;
	}
	
	
	/**
	 * UTF8ファイルのテキストに付いているBOMを除去する
	 * @param string $str UTF8ファイルから取得したテキストの文字列
	 * @return string BOMを除去した文字列
	 */
	private function deleteBom($str){
		if (($str == NULL) || (mb_strlen($str) == 0)) {
			return $str;
		}
		if (ord($str{0}) == 0xef && ord($str{1}) == 0xbb && ord($str{2}) == 0xbf) {
			$str = substr($str, 3);
		}
		return $str;
	}
	
	
	/**
	 * 列名配列を取得する
	 * @param string $head_str 先頭文字列
	 * @return array 列名配列
	 */
	private function makeHeads($head_str){
		$heads = explode(",", $head_str); // 列名配列
		
		// 空白のトリミング
		foreach($heads as $i => $clm_name){
			$clm_name = str_replace('"', '', $clm_name);
			$heads[$i] = trim($clm_name);
		}
		
		return $heads;
	}
	
	
	/**
	 * エラー処理
	 * 
	 * @note
	 * 作業ディレクトリ内のファイル、ディレクトリ類をすべて除去する
	 * @param string $err_msg
	 */
	private function err($param, $err_msg){
		$param['err_msg'] = $err_msg;
		
		//$this->removeDirectory($param['zip_dp']); // 作業ファイルをクリアする
// 		$work_dp = $param['work_dp']; // 作業ディレクトリパス
// 		$this->dirClearEx($work_dp); // ディレクトリ内のファイルをまとめて削除する。
		return $param;
		
	}
	
	
	/**
	 * ※危険な処理：作業フォルダパスを間違えると必要なファイルが削除されてしまう。
	 * ディレクトリ内のファイルとフォルダをまとめて削除する。
	 * @param  string $dir_name ファイル削除対象のディレクト名
	 */
	private function dirClearEx($dir_name, $zip_clear_flg=false){
		if($zip_clear_flg==false) return;
		
		$dir_name = $this->dpEndSp($dir_name); // 末尾のセパレータを除去
		
		//フォルダ内のファイルを列挙
		$files = scandir($dir_name);
		$files = array_filter($files, function ($file) {
			return !in_array($file, array('.', '..'));
		});
			
			foreach($files as $fn){
				$ffn=$dir_name.'/'.$fn;
				try {
					//unlink($ffn);//削除
					$this->removeDirectory($ffn);
				} catch (Exception $e) {
					throw e;
				}
			}
			
			return true;
	}
	
	
	/**
	 * ディレクトリパスの末尾のセパレータを除去、もしくは追加
	 * @param string $dp ディレクトリパス
	 * @param boolean $end_sep_flg false:セパレータ除去(def), true:セパレータ追加
	 * @param string $sep セパレータ
	 * @return string ディレクトリパス
	 */
	private function dpEndSp($dp, $end_sep_flg=false, $sep ='/'){
	    
	    if(empty($dp)) return '';
	    
	    $e_s = mb_substr($dp, -1);
	    if($e_s==$sep && $end_sep_flg==false ){
	        $dp = mb_substr($dp, 0, mb_strlen($dp)-1);
	    }elseif($e_s!=$sep && $end_sep_flg==true ){
	        $dp .= $sep;
	    }
	    
	    return $dp;
	}
	
	
	/**
	 * ディレクトリごとファイルを削除する。（階層化のファイルまで削除可能）
	 * @param string $dir 削除対象ディレクトリ
	 */
	private function removeDirectory($dir) {
		if(empty($dir)) return;
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
	 * インデックスハッシュマップを作成 | キーはフィールド、値はインデックス（0からの列順）
	 * @param array $heads 列名配列
	 * @param array $csvFieldData CSVフィールドデータ
	 */
	private function makeIdxHm($heads, $csvFieldData){

		$idxHm = []; // インデックスハッシュマップ
		
		foreach($heads as $index => $clm_name1){
			foreach($csvFieldData as &$cfEnt){
				$field = $cfEnt['field'];
				if($clm_name1 == $cfEnt['clm_name']){
					$idxHm[$field] = $index;
					break;
				}else{
					
					// 列名は別名と一致するかチェック
					if($this->matchAlias($cfEnt, $clm_name1)){
						$idxHm[$field] = $index;
						break;
					}
				}
			}
			unset($cfEnt);
		}
		
		return $idxHm;
	}
	
	
	/**
	 * 列名は別名と一致するかチェック
	 * @param array $cfEnt CSVフィールドデータのエンティティ
	 * @param string $clm_name 一致比較元の列名
	 * @return false:不一致, true:一致
	 */
	private function matchAlias(&$cfEnt, $clm_name){
		
		$aliases = $cfEnt['clm_alias_names']; // 別名リスト
		foreach($aliases as $alias){
			if(empty($alias)) continue;
			if($clm_name == $alias){
				return true;
			}
		}
		return false;
	}
	
	
	/**
	 * 重複列名チェック
	 * @param array $heads 列名配列
	 * @return string エラーメッセージ
	 */
	private function checkDuplicateClmName($heads){

		// ▼重複エラーチェック
		foreach($heads as $clm_name1){
			$cnt = 0;
			foreach($heads as $clm_name2){
				if($clm_name1 == $clm_name2){
					$cnt++;
				}
			}
			if($cnt >= 2){
				$err_msg = "列名「{$clm_name1}」は2つ以上存在します。同じ列名を避けてください。";
				return $err_msg;
			}
		}
		
		return null;
	}
	
	
	/**
	 * 必須列チェック
	 * @param array $idxHm 先頭文字列（列名文字列）
	 * @param array $csvFieldData CSVフィールドデータ
	 * @return string エラーメッセージ
	 */
	private function checkRequiredClm($idxHm, $csvFieldData){
		$err_msg = null;
		$errClmNames = []; // エラー列名リスト

		// ▼必須列チェック
		foreach($csvFieldData as $cfEnt){
			
			$field = $cfEnt['field'];
			
			// 必須列である場合
			if(!empty($cfEnt['req_clm'])){
				// インデックスマップに存在しない、つまり列が存在しないならエラー列名リストに追加する。
				if(!isset($idxHm[$field])){
					$errClmNames[] = $cfEnt['clm_name'];
				}
			}
		}
		
		// エラーメッセージの組み立て
		if(count($errClmNames) >= 1){
			$err_clm_names_str = join( ', ', $errClmNames );
			$err_msg = "次の列は必須です。→{$err_clm_names_str}";
		}
		
		return $err_msg;
	}
	
	
	/**
	 * データ登録
	 * @param array $data データ
	 * @param array $param 
	 * @param string $main_tbl_name メインテーブル
	 */
	public function reg($data, $param, $main_tbl_name){
	    
	    // DB保存
	    $csvExinData = [
	        'data'=>$data,
	        'csvFieldData'=>$param['csvFieldData'],
	        'csvParam'=>['main_table_name'=>$main_tbl_name],
	    ];
	    
	    $this->csvExin->reg($csvExinData);
	}
	
	
	/**
	 * CSV読込
	 * @param array $param パラメータ
	 * @param function $cbAfterValid バリデーション前のデータ加工コールバック
	 * @return array レスポンス
	 *  - data CSVデータ
	 *  - param パラメータ
	 */
	public function csvRead($param, $cbAfterValid = null){
	    
		$data = []; // CSVデータ
		$dataA = []; // CSV配列データ
		$batch_data_num = $param['batch_data_num']; // 一括データ処理数
		$csv_fp = $param['csv_fp']; // CSVファイルパス
		$offset = $param['offset']; // 途中読込用のオフセット
		$stack_mem_size = $param['stack_mem_size']; // 累積サイズ
		$idxHm = $param['idxHm']; // インデックスハッシュマップ
		$csvFieldData = $param['csvFieldData']; // CSVフィールドデータ
		$req_batch_count = $param['req_batch_count']; // リクエストバッチ回数
		$csv_row_no = $param['csv_row_no']; // CSV行番
		$csv_row_no2 = $csv_row_no;
		$end_flg = false; // 終了フラグ
		$data_size = 0; // データ容量サイズ
		
		$path_param = pathinfo($csv_fp);
		$csv_fn = $path_param['basename']; // CSVファイル名
		
		// CSVからデータを取得
		$csvTexts = []; // CSVテキストリスト
		$csvRowNos = []; // CSV行番リスト
		$break_row_str = ''; // 中断行文字列
		if ($fp = fopen ( $csv_fp, "r" )) {
			fseek($fp, $offset); // 途中から読み込む
			for($i=0;$i<$batch_data_num;$i++){
				
				$line = fgets ($fp);
				$csv_row_no++;
				if($line == false){
					if($i == 0) $end_flg = true; 
					break; // ファイル内テキストが末尾に達したら処理抜け
				}
				
				// 改行対策。中断行文字列がCSV改行の途中である場合、改行をすべて回収するまでもう少し行取得を行う。
				$break_row_str = $line;
				if($this->idDuringLineFeed($break_row_str)){
					while(true){
						$line = fgets ($fp);
						$csv_row_no++;
						
						if($line == false) break; // ファイルが末尾に達しているなら処理抜け

						// 中断行文字列に追加行を付け足して、再度、改行途中チェックを行う。
						$break_row_str .= $line;
						if($this->idDuringLineFeed($break_row_str) == false){ // 改行途中でなければ処理抜け
							break;
						}
					}
				}
				
				$csvTexts[] = $break_row_str;
				
				// CSV行番をセット
				$csvRowNos[] = $csv_row_no2 + 1; // テキストエディタは行番号1から始まるので1を加算
				$csv_row_no2 = $csv_row_no;
				
				
			}

			$offset = ftell($fp); // 途中を取得
		}
		fclose ( $fp );
		
		// 終了フラグがONであるなら処理抜け
		if($end_flg == true){
		     // ディレクトリ内のファイルをまとめて削除する。
		    if(!empty($param['zip_clear_flg'])){
		        $this->removeDirectory($param['zip_dp']);
		    }
		    $param['end_flg'] = $end_flg;
		    return ['param'=>$param, 'dataA'=>[], 'data'=>[]];
		}
		
		$csvTexts[0] = $this->deleteBom($csvTexts[0]); // UTF8ファイルのテキストに付いているBOMを除去する
		
		foreach($csvTexts as $i => $csv_text){
			$entX = $this->csvTextToData($csv_text); // CSVテキストを2次元配列に変換する
			if(empty($entX)) continue;
			$dataA[] = $entX[0];
		}

		// 累積サイズに加算
		$stack_mem_size += strlen($csv_text); 
		
		// 配列データを加工して登録用データを作成する
		$data = $this->prosData($dataA, $idxHm, $req_batch_count, $csvRowNos, $csv_fn);
		
		// バリデーション前にデータ加工コールバックを実行する
		if($cbAfterValid != null){
			$data = call_user_func( $cbAfterValid, $data );
		}
		
		// バリデーション
		$validData = $param['validData'];
		$err_count = $param['err_count'];
		foreach($data as &$ent){
			$csv_err_msg = $this->icv->validEnt($ent, $validData, $ent['csv_row_no']);
			$ent['csv_err_msg'] = $csv_err_msg;
			if(!empty($csv_err_msg)) $err_count++;
		}
		unset($ent);
		
		$param['csv_row_no'] = $csv_row_no;
		$param['end_flg'] = $end_flg;
		$param['offset'] = $offset;
		$param['stack_mem_size'] = $stack_mem_size;
		$param['err_count'] = $err_count;
		$res = ['param'=>$param, 'dataA'=>$dataA, 'data'=>$data];

		return $res;
	}
	
	
	/**
	 * CSVの行が改行中であるか判定する
	 * @param string $csv_line CSVの行
	 * @return true:改行中の行である
	 */
	private function idDuringLineFeed($csv_line){
		if(empty($csv_line)) return false;
		
		$csv_line = trim($csv_line);
		$ary = preg_split("//u", $csv_line, -1, PREG_SPLIT_NO_EMPTY);

		$state = 0; // 0:初期状態, 1:通常状態, 2:ダブルクォート監視状態, 3:ダブルクォート内状態
		$dq_flg = 0; // 連続ダブルクォートフラグ   ダブルクォート内状態においてダブルクォートが連続するときONになる。
		$len = count($ary); // 文字数を取得する
		
		foreach($ary as $i => $one){
			// 文字が「,」である場合、
			if($one == ','){
				// 	初期状態
				switch ($state){
					case 0: // 初期状態
						$state = 1; // 通常状態にする
						break;
					case 1: // 通常状態
						$state = 2; // ダブルクォート監視状態にする。
						break;
					case 2: // ダブルクォート監視状態
						break;
					case 3: // ダブルクォート内状態
						break;
				}
			}
			
			// 文字が半角スペースである場合
			elseif($one == ' '){
				
				switch ($state){
					case 0: // 初期状態
						$state = 1; // 通常状態にする
						break;
					case 1: // 通常状態
						break;
					case 2: // ダブルクォート監視状態
						break;
					case 3: // ダブルクォート内状態
						break;
				}
				
			}
			
			// 文字が「"」である場合
			elseif($one == '"'){
				switch ($state){
					case 0: // 初期状態
						$state = 3; // ダブルクォート内状態
						break;
					case 1: // 通常状態
						break;
					case 2: // ダブルクォート監視状態
						$state = 3; // ダブルクォート内状態
						break;
					case 3: // ダブルクォート内状態
						
						if($dq_flg == 1){
							$dq_flg = 0; // 連続ダブルクォート状態を解除
							break;
						}
						// 次の文字はない
						if($i == $len-1){
							$state = 1; // 通常状態にする
							break;
						}
						
						// 次の文字はダブルクォートか？
						$next = $ary[$i + 1];
						if($next == '"'){
							$dq_flg = 1; // 連続ダブルクォート状態にする
							break;
						}
						
						// 次以降に最初に現れる文字は「,」か？（スペースは飛ばす）
						for($i2=$i+1; $i2<$len; $i2++){
							$nnext = $ary[$i2];
							if($nnext == ','){
								$state = 1; // 通常状態にする
								break;
							}elseif($nnext == ' '){
								continue;
							}else{
								break;
							}
						}
						break;
				}
			}
			
			// その他の文字である場合
			else{
				switch ($state){
					case 0: // 初期状態
						$state = 1; // 通常状態にする
						break;
					case 1: // 通常状態
						break;
					case 2: // ダブルクォート監視状態
						$state = 1; // 通常状態にする
						break;
					case 3: // ダブルクォート内状態
						break;
				}
			}
			
			$prev_state = $state;
		} // ループ終わり
		
		$flg = false;
		
		// ダブルクォート状態のまま担っている場合、「改行中」という判断を下す。
		if($state == 3){
			$flg = true;
		}
		
		return $flg;
	}
	
	
	/**
	 * CSVテキストを2次元配列に変換する
	 * @note
	 * ExcelのCSVに対応
	 * ダブルクォート内の改行に対応
	 * 「""」エスケープに対応
	 *
	 * @param string $csv_text CSVテキスト
	 * @returns array 2次元配列
	 */
	private function csvTextToData($csv_text){
		
		if($csv_text=='' || $csv_text==null) return null;
		
		$csv_line = trim($csv_text); // スペースだけでなく末尾の改行を除く
		$ary = preg_split("//u", $csv_text, -1, PREG_SPLIT_NO_EMPTY);

		// CSVテキストの末尾が改行でないければ改行を付け足す。
		$csv_text_len = count($ary);
		$last = $ary[$csv_text_len - 1];
		if(preg_match("/\r|\n/", $last)){
			$ary[] = "\n";
		}
		
		$data = [];
		$len = count($ary);
		$enclose = 0; // ダブルクォート囲み状態フラグ  0:囲まれていない , 1:囲まれている
		$cell = '';
		$row = [];
		
		for($i=0; $i<$len; $i++){
			
			$one = $ary[$i];
			
			// ダブルクォートで囲まれていない
			if($enclose == 0){
				if($one == '"'){
					$enclose = 1; // 囲み状態にする
				}
				else if($one == ','){
					$row[] = $cell;
					$cell = '';
				}
				else if(preg_match("/\r|\n/", $one)){
					$row[] = $cell;
					$data[] = $row;
					$cell = '';
					$row = [];
					
					// 次も改行文字ならインデックスを飛ばす
					if($i < $len - 1){
						$ns = $ary[$i+1];
						if(preg_match("/\r|\n/", $ns)){
							$i++;
						}
					}
				}else{
					$cell .= $one;
				}
			}
			
			// ダブルクォートで囲まれている
			else{
				if($one == '"'){
					if($i < $len - 1){
						$s2 = $one . $ary[$i + 1]; // 2文字分を取得
						// 2文字が「""」であるなら、一つの「"」とみなす。
						if($s2 == '""'){
							$cell .= '"';
							$i++;
						}else{
							$enclose = 0; // 囲み状態を解除する
						}
					}
					
				}
				else{
					$cell .= $one;
				}
			}
			
		}
		return $data;
	}
	
	
	/**
	 * 配列データを加工して登録用データを作成する
	 * @param array $dataA CSV配列データ
	 * @param array $idxHm インデックスハッシュマップ
	 * @param int $req_batch_count リクエストバッチ回数
	 * @param array $csvRowNos CSV行番
	 * @param string $csv_fn CSVファイル名
	 * @return array 登録用データ
	 */
	private function prosData($dataA, $idxHm, $req_batch_count, $csvRowNos, $csv_fn){
		$data = [];
		if(empty($dataA)) return [];
		
		foreach($dataA as $d_i => $entA){
			
			if(count($entA) == 0) continue;

			// 列名行は除外する
			if($req_batch_count == 0 && $d_i == 0) continue;
			
			$ent = [];
			foreach($idxHm as $field => $c_i){
				if(isset($entA[$c_i])){
					$ent[$field] = $entA[$c_i];
				}
			}
			
			$ent['csv_fn'] = $csv_fn; // CSVファイル名をセット
			$ent['csv_row_no'] = $csvRowNos[$d_i]; // CSV行番をセット
			
			$data[] = $ent;
		}
		
		return $data;
	}
	
	
	/**
	 * ログテキストを取得
	 * @return string ログテキスト
	 */
	public function getLogText(){
	    return $this->icv->getErrLogText(100000);
	}
	

	

}