<?php

define("SDQ","%DXQ#");
define("SSQ","%SXQ#");

/**
 *
 * CSV読込書出クラス
 * 
 *
 * @version 3.0
 * 
 * @date 
 * 2011-9-26 新規作成。　出力機能は未実装<br>
 * 2012-1-12 readを改良。最初の一行をキーにする機能を追加
 * 2013-8-14 readを非推奨にし、loadを作成。saveメソッドを新規追加。
 * 2014-4-11 rakuten用に改造
 * 2014-5-22 cnvToAryForDqのnull判定にバグ。コンマが連続するCSVでエラーが発生した。
 * 2014-5-23 splitExで上記のバグを修正。さらに高速化。
 * 2015-4-16 ver2にバージョンアップ。
 * 2015-4-16 指定CSV判定メソッド追加
 * 2015-4-17 load3を追加。
 * 2016-1-28 loadEx2とload_firstを追加
 * 2016-2-25 列数が異なるレコードで起こるバグを修正
 * 2016-6-16 saveメソッドを一新。CsvIo2.phpからCsvIoにクラス名を戻す。
 * 2016-7-4 load関数を大幅修正
 *
 * @author k-uehara
 *
 */
class CsvIo{
	
	
	
	/**
	 * CSV読込
	 *
	 * @note
	 * 当サーバー上に配置してあるCSVファイルからデータを読み込む。
	 * ダブルクォートの括り内に存在する改行やコンマにも対応している。
	 *
	 * @version 4.1
	 * @date 2011-9-26 | 2017-7-4
	 *
	 * @param array $csv_fp CSVファイルパス
	 * @param array $delim 区分記号: 「,」や「\t」を指定する。デフォルトは「,」。
	 * @param array $sjis_flg Shift-JISフラグ: true（デフォルト）:Shift-JISからUTF8に変換
	 * 
	 * @return array CSVデータ配列
	 * @throw エラーメッセージ
	 */
	public function load($csv_fp,$delim=',',$sjis_flg=true){
		
		
		if(!file_exists($csv_fp) || !is_readable($csv_fp)){
			throw new Error('There is no csv file!');
		}
		
		
		$data = array();
		
		// Shift-JIS形式のCSVである場合
		if($sjis_flg){
			
			// CSVファイルをUTF8に書き換える
			$buffer = mb_convert_encoding(file_get_contents($csv_fp), "UTF-8", "SJIS");
			$csv_fp= tmpfile();
			fwrite($csv_fp, $buffer);
			rewind($csv_fp);
			
			$header = NULL;
			while (($row = fgetcsv($csv_fp, 0, $delim)) !== FALSE) {
				
				if(!$header){
					$header = $row;
				}else{
					$data[] = array_combine($header, $row);
				}
			}
			fclose($csv_fp);
		}

		// UTF8形式のCSVである場合
		else{
			
			$header = NULL;
			if (($handle = fopen($csv_fp, 'r')) !== FALSE)
			{
				while (($row = fgetcsv($handle, 1000, $delim)) !== FALSE)
				{
					if(!$header){
						$header = $row;
					}else{
						$data[] = array_combine($header, $row);
					}
				}
				fclose($handle);
			}
		}

		return $data;

	}
	

	
	
	


	


	/**
	 * CSV読込
	 *
	 * @note
	 * 当サーバー上に配置してあるCSVファイルからデータを読み込む。
	 * 
	 * @version 3.0
	 * @date 2011-9-26 | 2017-6-19
	 * 
	 * @param array $csv_fp CSVファイルパス
	 * @param array $option オプション
	 * - d_quote_del: ダブルクォート除去フラグ: 
	 *   - true(デフォルト):	ダブルクォートの括りを除去。
	 *   - false: 			ダブルクォートの括りを除去しない。
	 * - sjis_flg: Shift-jisフラグ: 
	 *   - true(デフォルト):	Shift-jisとして扱う（Window系の環境）  
	 *   - false: 			Shift-jisとして扱わない。(utf8)
	 * - first_field_flg 先頭フィールドフラグ: 
	 *   - 0: 先頭行もデータとして扱い、フィールド（キー)は連番になる。 
	 *   - 1: (デフォルト):先頭行をフィールドとして扱う。    
	 *   - 2: 先頭行は無視、フィールドは連番になる。
	 * 
	 * @return array
	 * - res: 		結果   true:読み取り成功    false:読み取り失敗
	 * - err_msg: 	エラーメッセージ
	 * - data: 		CSVデータ
	 */
	public function load_old($csv_fp,$option=array()){
		
		//CSVファイルパスの空チェックおよびファイル存在チェックを行う。
		if(!$csv_fp){
			return array('res'=>false,'err_msg'=>'CSVファイルパスが空です。','data'=>array());
		}
		if ( !$this->is_file_ex($csv_fp)) {
			return array('res'=>false,'err_msg'=>"CSVファイルが存在しません。【{$csv_fp}】",'data'=>array());
		}
		
		// オプションの未設定値に初期値をセットする
		if(empty($option['d_quote_del'])){
			$option['d_quote_del'] = true;
		}
		if(empty($option['sjis_flg'])){
			$option['sjis_flg'] = true;
		}
		if(empty($option['first_field_flg'])){
			$option['first_field_flg'] = 1;
		}
		
		// オプションの値を変数にセット
		$d_quote_del = $option['d_quote_del'];
		$sjis_flg = $option['sjis_flg'];
		$first_field_flg = $option['first_field_flg'];
		
		
		// CSVファイルパスをShift-jisに変更
		if($sjis_flg){
			$csv_fp=mb_convert_encoding($csv_fp,'SJIS','UTF-8');
		}
		
		$first_flg = true; // 先頭フラグ
		$defEnt = array(); // デフォルトエンティティ
		
		//▼CSVファイルのデータを読み込みdataを作成
		if ( $fp = fopen ($csv_fp, "r")) {

			$data=array();
			while (false !== ($line = fgets($fp))){

				if($sjis_flg){
					$str=mb_convert_encoding($line, 'utf-8', 'utf-8,sjis,euc_jp,jis');
				}

				//▽コンマで区切った文字列を配列に変換。ダブルクォート区切りに対応している。
				$ent = $this->splitEx($str);

				// 先頭行もデータとして扱い、フィールド（キー)は連番になる。 
				if($first_field_flg==0){
					$data[] = $ent;
				}
				
				// 先頭行をフィールドとして扱う。    
				elseif($first_field_flg==1){
					if($first_flg==true){
						foreach($ent as $field){
							$defEnt[] = trim($field,'"');
						}
						
					}else{
						$ent2 = array();
						foreach($defEnt as $i => $field){
							if(isset($ent[$i])){
								$ent2[$field] = $ent[$i];
							}
						}
						$data[] = $ent2;
					}
				}
				
				// 先頭行は無視、フィールドは連番になる。
				elseif($first_field_flg==2){
					if($first_flg==true){
						
					}else{
						$data[] = $ent;
					}
				}
				
				$first_flg = false;
			}
		}
		fclose ($fp) ;
		
		
		//オプションで指定されているならデータ中からダブルクォートをすべて削除。
		if($d_quote_del){
			$this->deleteDoubleQuote($data);
		}
		

		return array('res'=>true,'err_msg'=>'','data'=>$data);
	}
	

	/**
	 * CSVファイルから先頭行のみ読み込む
	 *
	 * 最低限のバリデーション機能を備えている。
	 *
	 * @param array $files ファイルアップロード情報 $_FILES["upload_file"]
	 * 
	 * @return array
	 * - res 結果   true:読み取り成功    false:読み取り失敗
	 * - err_msg エラーメッセージ
	 * - row CSVの先頭行
	 */
	public function load_first($files){

		$rets['res']=true;
		$rets['err_msg']=null;
		$rets['row']=array();
		
		//事前バリデーションにてエラーがある場合は、エラーメッセージをセットし、処理を抜ける。
		$err_msg=$this->validation_before($files);
		if(!empty($err_msg)){
			$rets['res']=false;
			$rets['err_msg']=$err_msg;
			return $rets;
		}
		

		//▼CSVファイルのデータを読み込みdataを作成
		$csvFn=$files["tmp_name"];
		$row = array();
		try {
			$csvFn=mb_convert_encoding($csvFn,'SJIS','UTF-8');
			if ( $fp = fopen ($csvFn, "r")) {

				$line = fgets($fp);//1行目を取得
				$line=mb_convert_encoding($line, 'utf-8', 'utf-8,sjis,euc_jp,jis');//UTF8エンコード
				$row=$this->splitEx($line);//▽コンマで区切った文字列を配列に変換。ダブルクォート区切りに対応している。
				
			}
			@fclose ($fp) ;
		
		} catch (Exception $e) {
		
			@fclose ($fp) ;
			$rets['res']=false;
			$rets['err_msg']="CSVファイルからデータを読み取れませんでした。";
			return $rets;
		}
		
		$rets['row']=$row;

		return $rets;
		
	}

// 	/**
// 	 * CSV読込その２ ※非推奨 loadメソッドを使ってください。
// 	 * 
// 	 * readメソッドのエイリアスです。
// 	 * 
// 	 * @param string $csvFn CSVファイル名
// 	 * @return array 2次元データ
// 	 */
// 	public function load2($csvFn){
// 		$data=$this->read($csvFn,$fieldFlg=false);
// 		return $data;
// 	}

	
	/**
	 * CSV読込その２（拡張版） ※非推奨 loadメソッドを使ってください。
	 * 
	 * 最低限のバリデーション機能を備えている。
	 * 
	 * @param array $files ファイルアップロード情報 $_FILES["upload_file"]
	 * @param array $option
	 * - d_quote_del=>true データからダブルクォートを除去。省略時は除去しない。
	 * @return array 
	 * - res 結果   true:読み取り成功    false:読み取り失敗
	 * - err_msg エラーメッセージ
	 * - data CSVデータ
	 */
	public function loadEx2($files,$option=array()){
	

	
		$rets['res']=true;
		$rets['err_msg']=null;
		$rets['data']=array();
	
		//事前バリデーションにてエラーがある場合は、エラーメッセージをセットし、処理を抜ける。
		$err_msg=$this->validation_before($files);
		if(!empty($err_msg)){
			$rets['res']=false;
			$rets['err_msg']=$err_msg;
			return $rets;
		}
		
		
		

		//▼CSVファイルのデータを読み込みdataを作成
		$csvFn=$files["tmp_name"];
		try {
			$csvFn=mb_convert_encoding($csvFn,'SJIS','UTF-8');
			if ( $fp = fopen ($csvFn, "r")) {

				$data=array();
				while (false !== ($line = fgets($fp))){

					$str=mb_convert_encoding($line, 'utf-8', 'utf-8,sjis,euc_jp,jis');

					//▽コンマで区切った文字列を配列に変換。ダブルクォート区切りに対応している。
					$ent=$this->splitEx($str);
	
					array_push($data,$ent);

				}
			}
			@fclose ($fp) ;
	
		} catch (Exception $e) {
	
			@fclose ($fp) ;
			$rets['res']=false;
			$rets['err_msg']="CSVファイルからデータを読み取れませんでした。";
			return $rets;
		}

		
		
		
		//オプションで指定されているならデータ中からダブルクォートをすべて削除。
		if(!empty($option['d_quote_del'])){
			$this->deleteDoubleQuote($data);
		}

 		$rets['data']=$data;

		return $rets;
	
	}



// 	/**
// 	 * ※非推奨 loadメソッドを使ってください。
// 	 * CSV読込・先頭行をキーとして
// 	 * 
// 	 * 先頭行をキーとしているCSVファイルを読み込み,2次元データを取得します。
// 	 * CSVファイルの１行目は配列のキーになります。
// 	 * 
// 	 * @param string $csvFn CSVファイル名
// 	 * @return array 2次元データ
// 	 */
// 	function read($csvFn,$fieldFlg=false){

// 		$data=$this->load($csvFn);

// 		//▼フィールドフラグがTrueの場合、最初の一行をキーにする。
// 		if($fieldFlg==true){

// 			foreach ($data as $i => $ent){
// 				if(empty($flg)){
// 					$flg=1;

// 					$keys=$data[0];//キーリストを取得

// 				}else{
// 					foreach ($keys as $j=>$key){
// 						$ent2[$key]=$ent[$j];
// 					}
// 					$data2[]=$ent2;
// 				}
// 			}



// 		}else{
// 			$data2=&$data;
// 		}

// 		return $data2;
// 	}


	/**
	 * CSV保存
	 * 
	 * @note
	 * CSVをサーバー上にテキストファイルに書き出す
	 *
	 * @version 3.0
	 * @date 2017-6-17
	 *
	 * @param string $fp 出力ファイルパス
	 * @param array $data CSVデータ
	 */
	public function save($fp,$data){
		
		if(empty($data)){return;}
		
		// 出力ファイルパスからディレクトリパスを切り出す。
		$path_param = pathinfo($fp);
		$dp = $path_param['dirname'];
		
		// フォルダを作成
		$this->makeDirEx($dp);
		
		//データの先頭行に列名を追加。列名はキー。
		$clms=array_keys($data[0]);
		array_unshift($data,$clms);
		
		// CSV用データに変換
		$this->convToCsvData($data);
		
		
		
		// ファイルを追記モードで開く
		$fp_h = fopen ( $fp, 'ab' );
		
		// ファイルを排他ロックする
		flock ( $fp_h, LOCK_EX );
		
		// ファイルの中身を空にする
		ftruncate ( $fp_h, 0 );
		
		// データのバッファ
		$buf = "";
		if(!empty($data)){
			$i=0;
			foreach($data as $ent){
				foreach($ent as $v){
					$cell[$i][] = $v;
				}
				$buf .= mb_convert_encoding(implode(",",$cell[$i])."\r\n", "SJIS-win", "UTF-8");
				
				//$buf .= implode(",",$cell[$i]) . "\r\n";
				$i++;
			}
			
		}
		
		// データをファイルに書き込む
		fwrite ( $fp_h, $buf);
		
		// ファイルを閉じる
		fclose ( $fp_h );
		
		
		// 旧コード
		// 			// CSVファイル名の設定
		// 			$csv_file = $csvFn;
		
		// 			// CSVデータの初期化
		// 			$csv_data = "";
		
		
		
		// 			// CSVデータの作成
		// 			foreach((array)$data as $key => $value ){
		
		// 				$csv_data.=join($value,',');
		
		
		// 				if(count($data) !== intval($key)+1){
		
		// 					$csv_data .= "\n";
		
		// 				}
		// 			}
		
		// 			// ファイルを追記モードで開く
		// 			$fp = fopen($csv_file, 'ab');
		
		// 			// ファイルを排他ロックする
		// 			flock($fp, LOCK_EX);
		
		// 			// ファイルの中身を空にする
		// 			ftruncate($fp, 0);
		
		// 			// データをファイルに書き込む
		// 			fwrite($fp, $csv_data);
		
		// 			// ファイルを閉じる
		// 			fclose($fp);
		
	}
	
	
	
	/**
	 * CSV用データに変換
	 *
	 * @note
	 * 文字列型ならダブルクォートで括る
	 * 多次元配列に対応
	 * 高速化のため、引数は参照（ポインタ）であり返値もかねている。
	 *
	 * @param array $data データ
	 * @return array CSV用のデータ
	 */
	private function convToCsvData(&$data){
		if(is_array($data)){
			foreach($data as &$val){
				$this->convToCsvData($val);
			}
			unset($val);
		}elseif(gettype($data)=='string'){
			$data = str_replace('"','""',$data);
			$data = '"' . $data .'"';
		}else{
			// 何もしない
		}
	}
	
	
	
	/**
	 * ディレクトリを作成する
	 *
	 * @note
	 * ディレクトリが既に存在しているならディレクトリを作成しない。
	 * パスに新しく作成せねばならないディレクトリ情報が複数含まれている場合でも、順次ディレクトリを作成する。
	 * 日本語ディレクトリ名にも対応。
	 * パスセパレータは「/」と「¥」に対応。
	 * ディレクトリのパーミッションの変更をを行う。(既にディレクトリが存在する場合も）
	 *
	 * @version 1.2
	 * @date 2014-4-13
	 *
	 * @param string $dir_path ディレクトリパス
	 */
	private function makeDirEx($dir_path,$permission = 0705){
		
		if(empty($dir_path)){return;}
		
		// 日本語名を含むパスに対応する
		$dir_path=mb_convert_encoding($dir_path,'SJIS','UTF-8');
		
		// ディレクトリが既に存在する場合、書込み可能にする。
		if (is_dir($dir_path)){
			chmod($dir_path,$permission);// 書込み可能なディレクトリとする
			
			return;
		}
		
		// パスセパレータを取得する
		$sep = DIRECTORY_SEPARATOR;
		if(strpos($dir_path,"/")!==false){
			$sep = "/";
			
		}
		
		//パスを各ディレクトリに分解し、ディレクトリ配列をして取得する。
		$ary=explode($sep, $dir_path);
		
		//ディレクトリ配列の件数分以下の処理を繰り返す。
		$dd = '';
		foreach ($ary as $i => $val){
			
			if($i==0){
				$dd=$val;
			}else{
				$dd.=$sep.$val;
			}
			
			//作成したディレクトリが存在しない場合、ディレクトリを作成
			if (!is_dir($dd)){
				mkdir($dd,$permission);//ディレクトリを作成
				@chmod($dd,$permission);// 書込み可能なディレクトリとする
			}
		}
		
	}
	










	/**
	 * 日本語ファイルも扱えるis_file
	 * 
	 * ファイルが存在するか判定します。
	 * 
	 * @param string $fn ファイル名
	 * @return boolean
	 */
	public function is_file_ex($fn){
		$fn=mb_convert_encoding($fn,'SJIS','UTF-8');
		if (is_file($fn)){
			return true;
		}else{
			return false;
		}
	}




	/**
	 * 識別列名リストから指定CSVであるか判定する
	 * 
	 * CSVデータの列名が識別列名リストと一致するなら、指定CSVと判定します。
	 * 
	 * @param array $data CSVデータ
	 * @param array $idents 識別列名リスト
	 * @return bool true:指定CSVである    false:指定CSVでない
	 */
	public function checkIdent($data,$idents){

		$rets['res']=true;
		$rets['err_msg']=null;

		// 識別列名リストが空である場合、判定処理はせず、OKとみなす。
		if(empty($idents)){
			return $rets;
		}



		// CSVデータが空である場合、エラー
		if(empty($data)){
			$rets['res']=false;
			$rets['err_msg']="CSVデータが空です。";
			return $rets;
		}

		// CSVデータから列配列を取得
		$heads=$data[0];

		// 識別別名リストの件数が、列配列を超える場合、エラー。
		$idents_cnt=count($idents);
		if($idents_cnt > count($heads)){
			$rets['res']=false;
			$rets['err_msg']="指定外のCSVファイルです。指定CSVは列が{$idents_cnt}件以上です。";
			return $rets;
		}

		// 識別列名リストでCSVデータの列を判定する。
		$res=true;
		$err_msg=null;
		foreach($idents as $i=>$ident){

			$clm=trim($heads[$i]);


			if(is_array($ident)){
				// 値が配列である場合、列名が別名リストに存在するかチェックする。
				$res=$this->checkIdentAlias($clm,$ident);

			}else{

				// 列名と識別列名が一致しないならフラグ＝false
				if($clm != $ident){
					$res=false;
				}

			}

			if($res==false){

				//識別列名を取得
				$ident_clm=$this->getIdentClm($ident);

				$clm_no=$i+1;//列番号

				//エラーメッセージを組み立て
				$err_msg="指定外のCSVファイルです。{$clm_no}列目の列名が「{$ident_clm}」でありません。";
				break;
			}


		}

		$rets['res']=$res;
		$rets['err_msg']=$err_msg;

		return $rets;

	}




	/**
	 * CSV読込その３
	 * 
	 * 入力チェック機能を組み込んでいます。
	 * 識別列名リストでCSVデータの列名が一致するか調べ、指定CSVファイルか判定します。
	 * 対象列リストで指定の列だけデータを取得できます。
	 *
	 * @param $files ←$_FILES["upload_file"]を指定する。
	 * @param array $idents 識別列名リスト
	 * @param $targets 対象列リスト(取得対象の列）
	 * @param $option 'd_quote_del'=true //データからダブルクォーテーションを削除
	 * @return res:成功可否（boolean)    err_msg:エラーメッセージ（文字列）   data:CSVデータ（2次元配列）
	 */
	public function load3($files,$idents,$targets,$option=array()){

		$csvFn=$files["tmp_name"];


		$rets['res']=true;
		$rets['err_msg']=null;
		$rets['data']=array();



		//事前バリデーションにてエラーがある場合は、エラーメッセージをセットし、処理を抜ける。
		$err_msg=$this->validation_before($files);
		if(!empty($err_msg)){
			$rets['res']=false;
			$rets['err_msg']=$err_msg;
			return $rets;
		}




		//▼CSVファイルのデータを読み込みdataを作成
		try {
			$csvFn=mb_convert_encoding($csvFn,'SJIS','UTF-8');
			if ( $fp = fopen ($csvFn, "r")) {



				$data=array();
				while (false !== ($line = fgets($fp))){


					$str=mb_convert_encoding($line, 'utf-8', 'utf-8,sjis,euc_jp,jis');



					//▽コンマで区切った文字列を配列に変換。ダブルクォート区切りに対応している。
					$ent=$this->splitEx($str);

					array_push($data,$ent);


				}
			}
			@fclose ($fp) ;

		} catch (Exception $e) {

			@fclose ($fp) ;
			$rets['res']=false;
			$rets['err_msg']="CSVファイルからデータを読み取れませんでした。";
			return $rets;
		}

		//オプションで指定されているならデータ中からダブルクォートをすべて削除。
		if(!empty($option['d_quote_del'])){
			$this->deleteDoubleQuote($data);
		}



		// 識別列名リストから指定CSVであるか判定する。
		$chks=$this->checkIdent($data,$idents);
		if ($chks['res']==false){
			$rets['res']=false;
			$rets['err_msg']=$chks['err_msg'];
			return $rets;
		}


		//列配列から対象列リストに紐づく列番号を取得する。
		$data=$this->exitractByTargetClms($data,$targets);

		$rets['data']=$data;


		return $rets;

	}



	/**
	 * CSV読込その３マルチ
	 * 
	 * load3の機能に加えて、複数種のCSVファイルに対応しています。
	 * CSVの種類を自動的に見分けて、データを取得します。
	 *
	 * @param $files ←$_FILES["upload_file"]を指定する。
	 * @param $ident_data 識別列名情報（識別列名情報の配列）
	 * @param $target_data 対象列情報（対象列リストの配列）
	 * @param $option
	 * 			'd_quote_del'=true //データからダブルクォーテーションを削除
	 * @return res:成功可否（boolean)    err_msg:エラーメッセージ（文字列）   data:CSVデータ（2次元配列）    csv_index:CSV種類インデックス
	 */
	public function load3_multi($files,$ident_data,$target_data,$option=array()){

		$csvFn=$files["tmp_name"];


		$rets['res']=true;
		$rets['err_msg']=null;
		$rets['data']=array();
		$rets['csv_index']= -1;



		//事前バリデーションにてエラーがある場合は、エラーメッセージをセットし、処理を抜ける。
		$err_msg=$this->validation_before($files);
		if(!empty($err_msg)){
			$rets['res']=false;
			$rets['err_msg']=$err_msg;
			return $rets;
		}




		//▼CSVファイルのデータを読み込みdataを作成
		try {
			$csvFn=mb_convert_encoding($csvFn,'SJIS','UTF-8');
			if ( $fp = fopen ($csvFn, "r")) {



				$data=array();
				while (false !== ($line = fgets($fp))){


					$str=mb_convert_encoding($line, 'utf-8', 'utf-8,sjis,euc_jp,jis');



					//▽コンマで区切った文字列を配列に変換。ダブルクォート区切りに対応している。
					$ent=$this->splitEx($str);

					array_push($data,$ent);


				}
			}
			@fclose ($fp) ;

		} catch (Exception $e) {

			@fclose ($fp) ;
			$rets['res']=false;
			$rets['err_msg']="CSVファイルからデータを読み取れませんでした。";
			return $rets;
		}

		//オプションで指定されているならデータ中からダブルクォートをすべて削除。
		if(!empty($option['d_quote_del'])){
			$this->deleteDoubleQuote($data);
		}



		// ▽識別列名情報から指定CSV判定、およびCSV種類インデックスを取得
		$csv_index=-1;//CSV種類インデックスの初期化
		$ident_err_msg='';//識別判定用エラーメッセージの初期化
		foreach($ident_data as $i=>$idents){

			$chks=$this->checkIdent($data,$idents);// 識別列名リストから指定CSVであるか判定する。

			if ($chks['res']==true){
				$csv_index=$i;
				break;
			}else{
				$ident_err_msg.=$chks['err_msg'].'<br>';
			}

		}

		//指定CSVが存在しなかった場合、エラーメッセージを返して処理抜け。
		if($csv_index==-1){
			$rets['res']=false;
			$rets['err_msg']=$ident_err_msg;
			return $rets;
		}

		//対象列情報からCSV種類インデックスに紐づく、対象列名リストを取得
		$targets=$target_data[$csv_index];


		//列配列から対象列リストに紐づく列番号を取得する。
		$data=$this->exitractByTargetClms($data,$targets);

		$rets['data']=$data;
		$rets['csv_index']=$csv_index;


		return $rets;

	}





	/**
	 * 対象列リストから指定列のデータだけ抽出
	 * @param array $data	CSVデータ
	 * @param array $targets	対象列リスト
	 * @return array 抽出後のCSVデータ
	 */
	public function exitractByTargetClms($data,$targets){

		// 対象列リストが空なら抽出処理は行わない。
		if(empty($targets)){

			return $data;
		}

		if(empty($data)){
			return $data;
		}

		// CSVデータから列配列を取得
		$heads=$data[0];


		// 列配列から対象列リストに紐づく列番号リストを取得する。
		$tarClmNos=$this->getTargetClmNos($heads,$targets);

		if(empty($tarClmNos)){
			return $data;
		}



		//CSVデータから列番号リストに該当する列のみ抽出。
		$data2=array();
		foreach($data as $ent){
			$ent2=array();
			foreach($tarClmNos as $key=>$clmNo){
				if(isset($ent[$clmNo])){
					$ent2[$key]=$ent[$clmNo];
				}else{
					$ent2[$key]=null;
				}
				
			}
			$data2[]=$ent2;
		}




		return $data2;

	}

	
	private function splitEx($str){
	
	
	
		//「\"」を待避する。
		$s=$str;
		$n=mb_strpos($s,'\"',0);//「\"」を検索
	
		//「"」が存在しないなら通常の分割。
		if(empty($n) && $n!==0){
			$ary=explode(",", $str);
	
			//最後の行から改行を削除
			$l_i=count($ary)-1;
			$ary[$l_i] = str_replace("\r\n", '', $ary[$l_i]);
			$ary[$l_i] = str_replace("\r", '', $ary[$l_i]);
			$ary[$l_i] = str_replace("\n", '', $ary[$l_i]);
	
			return $ary;
		}
	
		$sdqFlg=false;
		if(!empty($n) || $n===0){
			$sdqFlg=true;
			$s = str_replace('\"', SDQ, $s);//「\"」を待避させる。
	
		}
	
		//「"」でくくられた「,」を待避する。
		$dqFlg=false;
		$n=mb_strpos($s,'"',0);//「"」を検索
		if(!empty($n) || $n===0){
			$dqFlg=true;
	
			$ary=explode ( '"' , $s );
			for($i=1;$i<count($ary);$i=$i+2){
				//echo $i."-";
				$ary[$i]=str_replace(',', SSQ, $ary[$i]);//「,」待避させる
			}
			$s=join("",$ary);
	
		}
	
		//待避文字から「"」に戻す。
		if($sdqFlg==true){
			$s = str_replace(SDQ, '"', $s);
		}
	
		$ary=explode ( ',' , $s );//分解
	
		//待避文字から「,」に戻す。
		if($dqFlg==true){
			foreach($ary as $i=>$v){
				$ary[$i]=str_replace(SSQ,',', $v);
			}
		}
	
	
		return $ary;
	}
	
	/**
	 * ファイル名の拡張子がCSVであるか調べる。
	 * @param string $fn	ファイル名
	 * @return boolean true:CSVである	false:CSVでない
	 */
	private function is_exten_csv($fn){
		$res=false;
		$extension = pathinfo( basename($fn), PATHINFO_EXTENSION );
	
		if ( strcasecmp( $extension, "csv" ) == 0 ) {
	
			$res=true;
		}
		return $res;
	}
	
	//識別列名を取得
	private function getIdentClm($ident){
		$ident_clm=null;
		if(is_array($ident)){
			if(!empty($ident)){
				$ident_clm=$ident[0];
			}
	
		}else{
			$ident_clm=$ident;
		}
		return $ident_clm;
	}
	
	
	
	
	/**
	 * 値が配列である場合、列名が別名リストに存在するかチェックする。
	 * @param string $clm   列名
	 * @param array $alias 別名リスト
	 */
	private function checkIdentAlias($clm,$alias){
	
		$res=false;
	
		if(empty($alias)){
			$res=true;
			return $res;
		}
	
		//別名リストに1件でも列名に一致するデータがあればtrueを返す。
		foreach($alias as $a_clm){
			if(empty($a_clm)){
				continue;
			}
	
			if($clm==$a_clm){
				$res=true;
				break;
			}
		}
	
		return $res;
	}

	/**
	 *  列配列から対象列リストに紐づく列番号を取得する。
	 * @param array $heads	列配列
	 * @param array $targets	対象列リスト
	 */
	private function getTargetClmNos($heads,$targets){

		$tarClmNos=array();//列番号リスト

		//対象列リストの件数分、以下の処理を繰り返す。
		foreach($targets as $key => $target){

			//対象列が別名配列である場合、別名配列数分、一致する列名を探す。
			if(is_array($target)){
				foreach($target as $alias){

					$clmNo=array_search($alias,$heads);//一致する列名を探す。

					//一致する列名が見つかった場合、列番号リストに見つかった列番号をセット
					if($clmNo!==false){
						$tarClmNos[$key]=$clmNo;
						break;
					}
				}
			}

			//対象列が文字列である場合,その文字列に一致する列名を探す。
			else{
				$clmNo=array_search($target,$heads);//一致する列名を探す。

				//一致する列名が見つかった場合、列番号リストに見つかった列番号をセット
				if($clmNo!==false){
					$tarClmNos[$key]=$clmNo;
				}
			}

		}




		return $tarClmNos;


	}

	
	
	/**
	 * データ中からダブルクォートをすべて削除。
	 * 
	 * @param array $data CSVデータ (※返り値を兼ねた参照指定型）
	 * @return void
	 */
	private function deleteDoubleQuote(&$data){
		
		foreach($data as &$ent){
			foreach($ent as &$v){
				if(strpos($v,'"')!==false){
					$v = trim($v,'"');
				}
			}
			
		}
		unset($v);
		unset($ent);
	}
	
	

	
	
	/**
	 * 
	 * 事前バリデーション
	 *
	 * 本格的にCSVデータを読み込む前に行うバリデーション
	 * 
	 * @param array $files ファイルアップロード情報 $_FILES["upload_file"]
	 * @return string $err_msg; エラーなしの場合、nullを返す。
	 * 
	 */
	private function validation_before($files){

		$err_msg=null;
		
		if(empty($files["tmp_name"])){
			$err_msg="CSVファイル名が指定されていません";
			return $err_msg;
		}
		
		//csvファイルが存在しない場合、エラーを返して終了。
		if ( !$this->is_file_ex($files["tmp_name"])) {
			$err_msg="CSVファイルが取り込めません。サーバーに制限されている可能性があります。";
			return $err_msg;
		}
		
		//拡張子チェック
		if($this->is_exten_csv($files["name"])==false){
			$err_msg="CSVファイルの拡張子が「.csv」でありません。";
			return $err_msg;
		}
		
		return $err_msg;
		
	}
	
	
	/**
	 * UTF8ファイルのテキストに付いているBOMを除去する
	 * @param string $str UTF8ファイルから取得したテキストの文字列
	 * @return string BOMを除去した文字列
	 */
	function deleteBom($str){
		if (($str == NULL) || (mb_strlen($str) == 0)) {
			return $str;
		}
		if (ord($str{0}) == 0xef && ord($str{1}) == 0xbb && ord($str{2}) == 0xbf) {
			$str = substr($str, 3);
		}
		return $str;
	}
	
	
	
	
	
	
	
	


}
?>