<?php

require_once 'ThumbnailEx.php';

/**
 * ファイルアップロードクラス
 * 
 * @note
 * 「<input type = 'file'>」であるファイルアップロードのフォーム要素から送られてきたファイルデータを指定場所に保存する。
 * ファイルチェックや、画像形式ならサムネイル画像作成も行う。
 * 
 * @date 2018-6-30 | 2021-10-2
 * @version 1.1.6
 * @history
 * 2021-5-20 バグ修正
 * 2018-10-23 ver 1.1.2 セパレータから始まるディレクトリの時に起こるバグを修正
 * 2018-8-23 ver1.1 optionにfn(ファイル名)を指定できるようにした。
 * 2018-8-22 ver1.0 リリース
 * 2018-6-30 開発開始
 */
class FileUploadK{
	
	private $thumbnailEx;

	private $param;
	
	/**
	 * コンストラクタ
	 * @param array $param パラメータ
	 *  - def_dp デフォルト・ディレクトリパス
	 */
	public function __construct($param = array()){
		
		$this->thumbnailEx = new ThumbnailEx();
		
		if(empty($param['def_dp'])) $param['def_dp'] = 'upload_files';
		
		$this->param = $param;
		
	}
	
	
	/**
	 * ファイル配置　シンプル型
	 * @param array $FILES $_FILES
	 * @param string $filed フィールド
	 * @param string $fp ファイルパス
	 * @param [] $option
	 *  - thum_width int サムネイル画像の横幅
	 *  - thum_height  int サムネイル画像の縦幅
	 *  - md_width int 中間画像の横幅
	 *  - md_height  int 中間画像の縦幅
	 */
	public function putFile1(&$FILES, $filed, $fp, $option=[]){
		if(empty($FILES)) return;
		
		if(empty($fp)) return;
		
		$thum_width = $option['thum_width'] ?? 64;
		$thum_height = $option['thum_height'] ?? 64;
		$md_width = $option['md_width'] ?? 480;
		$md_height = $option['md_height'] ?? null;
		
		
		$fp = str_replace("\\", '/', $fp);
		$fp = str_replace("//", '/', $fp);

		// ファイルパスからファイル名とディレクトリパスを取得する
		$pathInfo = pathinfo($fp);
		$fn = $pathInfo['basename'];
		$dp = $pathInfo['dirname'];
		
		// ディレクトリパスからmidディレクトリパスとthumディレクトリパスを作成する。
		$ary=explode("/", $dp);
		end($ary); // 配列の内部ポインタを末尾に移動する
		$last_key = key($ary); // 末尾のキーを取得
		$ary[$last_key] = 'mid';
		$mid_dp = join("/", $ary); // midディレクトリパスを作成
		$ary[$last_key] = 'thum';
		$thum_dp = join("/", $ary); // thumディレクトリパスを作成

		// ファイル保管ディレクトリ情報にパラメータをセットする
		$dpDatas[$filed] = array(
				'fn' => $fn,
				'orig_dp' => $dp,
				'thums' => array(
					0 => array(
							'thum_dp' => $thum_dp,
					    'thum_width' => $thum_width,
					    'thum_height' => $md_height,
							),
					1 => array(
							'thum_dp' => $mid_dp,
					    'thum_width' => $md_width,
					    'thum_height' => $md_height,
							),
					)
		);
		
		// ファイルアップロードの一括作業
		$option['dpDatas'] = $dpDatas;
		$res = $this->workAllAtOnce($FILES,$option);
		
	}
	
	
	
	
	/**
	 * 一括作業
	 * @param array $files2 $_FILES
	 * @param array $option オプション
	 * 
	 * - dpDatas ファイル保管ディレクトリ情報
	 * - 	fue_id file要素id
	 * - 		fn ファイル名（省略時は$_FILES内のファイル名）
	 * - 			省略:$_FILES内のファイル名がセットされる。
	 * - 			ファイル名文字列：複数アップロードのときは、最初の1件に「ファイル名文字列」をセットする。
	 * - 			ファイル名配列：複数アップロードのとき、それぞれの配列要素をセットする。
	 * - 		orig_dp オリジナルパス（ファイル保管ディレクトリ）
	 * - 		thums[i] サムネイル情報（画像ファイルのみの設定）
	 * - 			thum_dp　サムネイル保管ディレクトリパス
	 * - 			thum_width サムネイル画像の横幅(省略可）
	 * - 			thum_height サムネイル画像の横幅(省略可）
	 *  			※ thum_widthとthum_heightのどちらか一方を省略すると片方の比率に幅を調整する。
	 *  
	 * - valids バリデーション情報
	 * - 	fue_id file要素id
	 * - 		permit_exts 許可拡張子（配列、連結文字）
	 * - 		permit_mimes 許可MIME(配列、連結文字)
	 * - 		mime_check_flg MIMEチェックフラグ　0:MIMEチェックせず(デフォルト) , 1:MIMEチェックを実施
	 * - 		empry_ext_flg 空拡張子チェックフラグ　0:空拡張子を正常とみなす , 1:空拡張子はエラーとみなす(デフォルト)
	 * - 		wamei file要素の和名
	 *
	 * @return $res
	 *  - fileData ファイルデータ
	 *  - errs エラーリスト
	 *
	 */
	public function workAllAtOnce(&$FILES, &$option = []){
		if(empty($FILES)) return;
		

		// ファイルデータを取得する
		$fileData = $this->getFileData($FILES,$option);
		
		// バリデーション情報を取得する
		$valids = $this->getValids($option);
		
		// バリデーション
		$this->validation($fileData,$valids);
		
		// エラーを一つのエラーメッセージ文字列にまとめる。
		$err_msg = $this->combineErrMsg($fileData);
		
		// ディレクトリパスデータを取得する
		$dpDatas = $this->getDirPathData($fileData, $option);
		
		// ファイルをディレクトリパスへコピーする。
		$fileData = $this->copyOrigFiles($fileData, $dpDatas);
		
		// サムネイル用のディレクトリを作成
		$this->makeThumsDp($dpDatas);
		
		// サムネイルを作成する。
		$fileData = $this->createThumFiles($fileData,$dpDatas);
		
		$res = array(
				'fileData' => $fileData,
				'err_msg' => $err_msg,
		);
		
		return $res;
	}
	
	

	
	
	/**
	 * ファイルパスの「/orig/」から左部分パスを切り取る
	 * @param string $fp
	 * @return string 「/orig/」から左部分パスを切り取る
	 */
	public function cutLeftFromOrig($fp){
		$dp3 = '';
		$dp2 = $fp . '/';
		if(strpos($dp2, '/orig/') !== false){
			$dp3 = $this->stringLeftRev($dp2, '/orig/');
		}
		return $dp3;
	}
	
	/**
	 * 文字列を右側から印文字を検索し、左側の文字を切り出す。
	 * @param $s string 対象文字列
	 * @param $mark string 印文字
	 * @return string  印文字から左側の文字列
	 */
	private function stringLeftRev($s,$mark){
		
		if ($s==null || $s==""){
			return $s;
		}
		$a = strrpos($s,$mark);
		if($a==null && $a!==0){
			return "";
		}
		
		$s2=substr($s,0,$a);
		return $s2;
		
	}
	
	
	
	/**
	 * サムネイル用のディレクトリを作成
	 * @param [] $fileData
	 */
	private function makeThumsDp(&$fileData){
		
		foreach($fileData as &$box1){
			$thums = $box1['thums'];
			foreach($thums as $ent){
				$thum_dp = $ent['thum_dp'];
				$this->makeDirEx($thum_dp);
			}
		}
		
	}
	
	
	/**
	 * ファイルデータを取得する[
	 * @param array $FILES $_FILESのこと
	 * @param array $option workAllAtOnceメソッドと同じ$option
	 * @return array ファイルデータ
	 */
	private function getFileData(&$FILES,&$option){
		
		$fileData = array(); // ファイルデータ
		
		$imgMap = array('png','jpg','jpeg','gif'); // サムネイル対応している画像拡張子
		
		$fnData = $this->makeFnData($FILES,$option); // ファイル名データを作成
		
		// $_FILESからファイルデータを作成する。
		foreach($FILES as $fue_id => $files2){
			
			// 1件のファイルアップロードのみである場合、複数構造に変換する。
			if(is_string($files2['name'])){
				$files2 = $this->convFiles2mult($files2); // file2の複数構造変換
			}
			
			foreach($files2['name'] as $i => $fn){
				
				$fn = $fnData[$fue_id][$i];
				$ext = $this->stringRightRev($fn,'.'); // 拡張子
				$ext = mb_strtolower($ext); // 小文字化
				$mime = $files2['type'][$i]; // MIME
				$size = $files2['size'][$i]; // 容量サイズ
				$error = $files2['error'][$i];
				$tmp_name = $files2['tmp_name'][$i];
				
				$thum_flg = false; // サムネイルフラグ
				if(array_search($ext, $imgMap) !== false) $thum_flg = true;
				
				$fEnt = array(
						'fue_id' => $fue_id,
						'index' => $i,
						'fn' => $fn,
						'ext' => $ext,
						'mime' => $mime,
						'size' => $size,
						'thum_flg' => $thum_flg,
						'error' => $error,
						'tmp_name' => $tmp_name,
				);
				$fileData[] = $fEnt;
			}
		}
		
		return $fileData;
	}
	
	
	
	/**
	 * ファイル名データを作成
	 * @param array $FILES $_FILESのこと
	 * @param array $option workAllAtOnceメソッドと同じ$option
	 * @return array ファイル名データ 
	 */
	private function makeFnData(&$FILES,&$option){
		
		
		$fnData = array(); // ファイル名データ
		
		// オプションに設定がなければ空フラグをセットする。
		$opt_empty_flg = false; // オプション空フラグ
		if(empty($option)) $opt_empty_flg = true;
		if(empty($option['dpDatas'])) $opt_empty_flg = true;
		
		// ファイル保管ディレクトリ情報を取得する
		$dpDatas = array(); // ファイル保管ディレクトリ情報
		if($opt_empty_flg == false) $dpDatas = $option['dpDatas'];
		
		// ファイル名データの作成
		foreach($FILES as $fue_id => $files2){
			
			// 1件のファイルアップロードのみである場合、複数構造に変換する。
			if(is_string($files2['name'])){
				$files2 = $this->convFiles2mult($files2); // file2の複数構造変換
			}
			
			// オプションに設定がなければ空フラグをセットする。その２
			if(empty($dpDatas[$fue_id])) $opt_empty_flg = true;
			if(empty($dpDatas[$fue_id]['fn'])) $opt_empty_flg = true;
			
			// オプションファイル名リストを取得
			$optFns = array(); // オプションファイル名リスト
			if($opt_empty_flg == false){
				$opt_fn = $dpDatas[$fue_id]['fn'];
				if(is_string($opt_fn)){
					$optFns = array($opt_fn);
				}else{
					$optFns = $opt_fn;
				}
			}
			
			foreach($files2['name'] as $i => $fn){

				// オプションにファイル名がセットされていないなら、$_FILES内のファイル名をセットする。
				if($opt_empty_flg){
					$fnData[$fue_id][$i] = $fn;
					continue;
				}
				
				// オプションのファイル名をファイル名データにセットする。
				if(empty($optFns[$i])){
					$fnData[$fue_id][$i] = $fn;
				}else{
					$fnData[$fue_id][$i] = $optFns[$i];
				}

			}
		}
		
		return $fnData;
	}

	
	/**
	 * file2の複数構造変換
	 * @param array $files2 単数ファイル構造
	 * @return array 複数構造化し$files2
	 */
	private function convFiles2mult($files2){
		$files2['name'] = array($files2['name']);
		$files2['type'] = array($files2['type']);
		$files2['size'] = array($files2['size']);
		$files2['error'] = array($files2['error']);
		$files2['tmp_name'] = array($files2['tmp_name']);
		return $files2;
	}
	
	
	/**
	 * バリデーション情報を取得する
	 * @param array $option オプション
	 *  - valids バリデーション情報
	 * @return array バリデーション情報
	 */
	private function getValids(&$option){
		
		$valids = array();
		if(!empty($option['valids'])) $valids = $option['valids'];
		
		// バリデーション情報の初期化
		foreach($valids as &$valid){

			$valid['permit_exts'] = $this->str2aryInAry($valid,'permit_exts');
			$valid['permit_mimes'] = $this->str2aryInAry($valid,'permit_mimes');
			if(empty($valid['mime_check_flg'])) $valid['mime_check_flg'] = 0;
			if(empty($valid['empry_ext_flg'])) $valid['empry_ext_flg'] = 1;
			if(empty($valid['wamei'])) $valid['wamei'] = '';

		}
		unset($valid);
		
		return $valids;
	}

	
	/**
	 * 配列中のキーに紐づく値が連結文字列なら配列に変換する。
	 * 
	 * @param $ary (string or array)
	 * @param キー
	 * @return array 配列
	 */
	private function str2aryInAry($ary,$key){
		
		// キーに紐づく値が空であるなら空配列を返す。
		if(empty($ary[$key])) return array();
		
		// コンマ連結文字列であるなら配列に変換。ついでに空白を除去。
		$res = $ary[$key];
		if(is_string($res)){
			$res = array_map('trim', explode(',', $res));
		}

		return $res;
	}
	
	
	
	/**
	 * バリデーションを行う
	 * @param array $fileData ファイルデータ
	 * @param array $valids バリデーション情報
	 * @return array エラー情報をセットしたファイルデータ
	 */
	private function validation(&$fileData,&$valids){
		
		foreach($fileData as &$fEnt){
			
			$fue_id = $fEnt['fue_id']; // file要素のid属性
			
			// バリデーション情報が空である場合、バリデーションを行わず、エラーなしの判定をセットする。
			if(empty($valids[$fue_id])){
				$fEnt['err_msg'] = '';
				$fEnt['err_flg'] = false;
				continue;
			}
			
			// ファイルエンティティとバリデーション情報を元にバリデーションを行う。
			$valid = $valids[$fue_id];
			$err_msg = $this->validForFileEntity($fEnt,$valid);
			
			// バリデーションの結果をファイルエンティティにセットする。
			$err_flg = false;
			if(!empty($err_msg)) $err_flg = true;
			$fEnt['err_msg'] = $err_msg;
			$fEnt['err_flg'] = $err_flg;
			
		}
		unset($fEnt);
		
		
	}
	
	
	/**
	 * ファイルエンティティとバリデーション情報を元にバリデーションを行う。
	 * @param array $fEnt ファイルエンティティ
	 * @param array $valid バリデーション情報
	 * @return string エラー文字列。 正常である場合は空文字。
	 */
	public function validForFileEntity(&$fEnt,&$valid){
		
		$wamei = $valid['wamei'];
		if(empty($wamei)) $wamei = $fEnt['fue_id'];
		
		
		
		// エラー情報が入っているか？
		if(!empty($fEnt['error'])){
			return $wamei . ':' . $fEnt['error'];
		}
		
		// ファイル名が空でないか？
		$fn = $fEnt['fn'];
		if(empty($fn)){
			return "{$wamei}:ファイル名が空です。";
		}
		
		// 一時ファイル名が空でないか？
		if(empty($fEnt['tmp_name'])){
			return "{$wamei}:ファイルが空です。";
		}
		
		// ファイルサイズが0であるかチェックする。
		if(empty($fEnt['size'])){
			return "{$wamei}::ファイルサイズが0です。ファイル名【{$fn}】";
		}
		
		// 空拡張子フラグがＯＮであれば拡張子の空チェックを行う。
		$ext = $fEnt['ext'];
		if($valid['empry_ext_flg']){
			if(empty($ext)){
				return "{$wamei}:ファイル名に拡張子がありません。ファイル名【{$fn}】";
			}
		}
		
		// 許可拡張子リストに存在する拡張子であるか？
		$permit_exts = $valid['permit_exts'];
		$ext = mb_strtolower($ext);
		if(!empty($ext)){
			if(in_array($ext,$permit_exts) == 0){
				return "{$wamei}:未許可の拡張子です。【{$fn}】";
			}
		}
		
		
		// MIMEチェックフラグがONであればチェックを行う。
		if(!empty($valid['mime_check_flg'])){
			
			// MIMEを取得する
			$mime_type = $fEnt['mime'];
			
			// MIMEが空でないか？
			if(empty($mime_type)){
				return "{$wamei}:MIMEタイプが空です。【{$fn}】";
			}
			
			// 許可拡張子リストに存在する拡張子であるか？
			$permit_mimes = $valid['permit_mimes'];
			if(in_array($mime_type,$permit_mimes)==0){
				return "{$wamei}:無効のMIMEタイプです。【{$fn}→{$mime_type}】";
			}
			
		}
		
		return '';

	}
	
	
	/**
	 * エラーを一つのエラーメッセージ文字列にまとめる。
	 * @param array $fileData ファイルデータ
	 * @return string エラーメッセージ（正常である場合は空文字）
	 */
	private function combineErrMsg(&$fileData){
		
		$one_err_msg = ''; // ひとつのエラーメッセージ文字列
		
		foreach($fileData as &$fEnt){
			if($fEnt['err_flg']){
				$one_err_msg .= $fEnt['err_msg'] . '<br>';
			}
		}
		unset($fEnt);
		
		return $one_err_msg;
	}
	
	
	
	
	/**
	 * ディレクトリパスデータを取得する
	 * @param array $fileData ファイルデータ
	 * @param array $option オプション
	 *  - dpDatas ファイル保管ディレクトリ情報
	 */
	private function getDirPathData(&$fileData,&$option){
		
		// file要素IDリストを取得する
		$fueIds = array();
		foreach($fileData as &$fEnt){
			$fueIds[] = $fEnt['fue_id'];
		}
		unset($fEnt);
		$fueIds = array_unique($fueIds);// 重複を除去
		
		// オプションからディレクトリ情報を取得する。
		$dpDatas = array();
		if(!empty($option['dpDatas'])) $dpDatas = $option['dpDatas'];
		
		$def_dp = $this->param['def_dp']; // デフォルト・ディレクトリパス
		
		foreach($fueIds as $fue_id){
			if(empty($dpDatas[$fue_id])){
				$dpDatas[$fue_id] = array('orig_dp' => $def_dp);
			}else{
				if(empty($dpDatas[$fue_id]['orig_dp'])){
					$dpDatas[$fue_id]['orig_dp'] = $def_dp;
				}
			}
		}
		
		return $dpDatas;
	}
	
	
	
	/**
	 * ファイルをディレクトリパスへコピーする
	 * @param array $fileData ファイルデータ
	 * @param array $dpDatas ディレクトリ情報
	 * @reutrn array ファイルパスをセットしたファイルデータ
	 */
	private function copyOrigFiles(&$fileData,&$dpDatas){

		$fps = array(); // ファイルパスリスト
		
		foreach($fileData as $i => &$fEnt){
			
			$fue_id = $fEnt['fue_id'];
			$dpData = $dpDatas[$fue_id];
			$dp = $dpData['orig_dp']; // ディレクトリパス
			$dp = $this->separateAlign($dp,null,0,1); // パスやURLのセパレータをそろえる
			$fn = $fEnt['fn']; // ファイル名
			$fp = $this->connectPath($dp,$fn); // ディレクトリパスとファイル名を連結する。
			$this->makeDirEx($dp); // ディレクトリパスが存在しないなら作成する
			
			$tmp_name = $fEnt['tmp_name']; // 一時ファイル名
			$fp = $this->plusHomePath($fp); // ファイルパスの先頭がセパレータであるならホームルートパスを付加する。
			move_uploaded_file($tmp_name, $fp); // ファイルコピー
			
			$fEnt['orig_fp'] = $fp;
			
		}
		unset($fEnt);
		
		return $fileData;
		
	}
	
	
	/**
	 * サムネイルを作成する。
	 * @param array $fileData ファイルデータ
	 * @param array $dpDatas ディレクトリ情報
	 * @reutrn array サムネイルファイルパスをセットしたファイルデータ
	 */
	private function createThumFiles(&$fileData,&$dpDatas){
		
		foreach($fileData as $i => &$fEnt){
			$fue_id = $fEnt['fue_id']; // file要素のID属性
			
			if($fEnt['thum_flg'] == false) continue;
			if(empty($dpDatas[$fue_id])) continue;
			if(empty($dpDatas[$fue_id]['thums'])) continue;
			
			$orig_fp = $fEnt['orig_fp'];
			$thums = $dpDatas[$fue_id]['thums'];
			foreach($thums as $thEnt){

				$thum_dp = $thEnt['thum_dp'];
				$this->makeDirEx($thum_dp); // ディレクトリパスが存在しないなら作成する（ホームルートを付加するとバグになるので注意）
				$thum_dp = $this->plusHomePath($thum_dp); // ファイルパスの先頭がセパレータであるならホームルートパスを付加する。

				$thum_fp = $this->connectPath($thum_dp,$fEnt['fn']); // ディレクトリパスとファイル名を連結する。

				$thum_width = null;
				if(!empty($thEnt['thum_width'])) $thum_width = $thEnt['thum_width'];
				$thum_height = null;
				if(!empty($thEnt['thum_height'])) $thum_height = $thEnt['thum_height'];

				$this->thumbnailEx->createThumbnail($orig_fp,$thum_fp,$thum_width,$thum_height);
				
			}
			
		}
		unset($fEnt);

		return $fileData;
	}
	
	
	/**
	 * ファイルパスの先頭がセパレータであるならホームルートパスを付加する。
	 * @param string $fp ファイルパス
	 * @return string ホームルートパスを付加したファイルパス
	 */
	private function plusHomePath($fp){
		
		$s1 = mb_substr($fp,0,1); // 先頭の一文字を取得する。
		
		// ファイルパスの先頭がセパレータであるならホームルートパスを付加する。
		if($s1 == '/' || $s1 == DIRECTORY_SEPARATOR){
			$fp = $_SERVER['DOCUMENT_ROOT'] . $fp;
			$fp = str_replace($s1.$s1, $s1, $fp); // 2重セパレータを置換する
		}

		return $fp;
	}
	
	
	/**
	 * ディレクトリパスとファイル名を連結する。
	 * @param string $dp ディレクトリパス
	 * @param string $fn ファイル名
	 * @return string ファイルパス
	 */
	private function connectPath($dp,$fn){
		

		if(empty($dp)) return $fn;
		
		$es1 = mb_substr($dp,-1); // ディレクトリパスから末尾の一文字を取得
		$fp = ''; // ファイルパス

		if($es1 == '/' || $es1 == '\\'){
			$fp = $dp . $fn;
		}else{
			$sep = $this->getPathSeparator($dp); // ディレクトリパスからパスセパレータを取得する
			$fp = $dp . $sep . $fn;
		}

		// 2重セパレータを置換する
		if(strpos($fp, '//') !== false){
			$fp = str_replace($es1.$es1, $es1, $fp); 
		}
		if(strpos($fp, '\\\\') !== false){
			$fp = str_replace($es1.$es1, $es1, $fp);
		}
		
		return $fp;
		
	}
	
	/**
	 * ファイルパスやディレクトリパスからパスセパレータを取得する
	 * @param string $path パス（ファイルパス、またはディレクトリパス）
	 * @return パスセパレータ。   「/」か「\」
	 */
	private function getPathSeparator($path){
		if(empty($path)){
			return DIRECTORY_SEPARATOR;
		}
		if(strpos($path,"/")!==false){
			return "/";
		}
		if(strpos($path,'\\')!==false){
			return '\\';
		}
		return DIRECTORY_SEPARATOR;
		
	}
	
	
	/**
	 * 文字列を右側から印文字を検索し、右側の文字を切り出す。
	 * @param string $s 対象文字列
	 * @param string $mark 印文字
	 * @return string 印文字から右側の文字列
	 */
	private function stringRightRev($s,$mark){
		if ($s==null || $s==""){
			return $s;
		}
		
		$a = strrpos($s,$mark);
		if($a==null && $a!==0){
			return "";
		}
		$s2=substr($s,$a + strlen($mark),strlen($s));
		
		return $s2;
	}
	
	
	/**
	 * パスやURLのセパレータをそろえる
	 * @param string $path パス文字列    パスやURLなどの文字列
	 * @param string $separator セパレータ文字     未設定である場合は、自動
	 * @param int $head_sep 先頭セパレータフラグ    0(デフォ):そのまま , -1:先頭セパレータを除去 , 1:先頭セパレータを付加
	 * @param int $end_sep 末尾セパレータフラグ    0(デフォ):そのまま , -1:末尾セパレータを除去 , 1:末尾セパレータを付加
	 * @return string セパレータをそろえた文字列
	 */
	private function separateAlign($path,$separator=null,$head_sep=0,$end_sep=0){
		
		if(empty($path)) return $path;
		
		// セパレータが未設定である場合、パス文字列から自動判定する。
		if(empty($separator)){
			$a = strpos($path,'/');
			$b = strpos($path,"\\");
			if($a !==false && $b === false){
				$separator = '/';
			}elseif($a === false && $b !== false){
				$separator = "\\";
			}elseif($a === false &&  $a === false){
				$separator = DIRECTORY_SEPARATOR;
			}else{
				if($a < $b){
					$separator = '/';
				}else{
					$separator = "\\";
				}
			}
		}
		
		// セパレータをそろえる
		if($separator == '/'){
			$path = str_replace("\\", $separator, $path);
		}else{
			$path = str_replace('/', $separator, $path);
		}
		
		// 先頭セパレータフラグが1である場合、パス文字列の先頭にセパレータがなければ付加する
		if($head_sep == 1){
			$head_str = substr($path,0,1);// 先頭の一文字を取得
			if($head_str != $separator){
				$path = $separator . $path;
			}
		}
		
		// 先頭セパレータフラグが-1である場合、パス文字列の先頭にセパレータであれば除去する
		if($head_sep == -1){
			$head_str = substr($path,0,1);// 先頭の一文字を取得
			if($head_str == $separator){
				$path = substr($path,1); // 先頭の一文字を削る
			}
		}
		
		// 末尾セパレータフラグが1である場合、パス文字列の末尾にセパレータがなければ付加する
		if($end_sep == 1){
			$end_str = substr($path,-1); // 末尾の一文字を取得
			if($end_str != $separator){
				$path = $path . $separator;
			}
		}
		
		// 末尾セパレータフラグが-1である場合、パス文字列の末尾にセパレータであれば除去する
		if($end_sep == -1){
			$end_str = substr($path,-1); // 末尾の一文字を取得
			if($end_str == $separator){
				$path = substr($path,0,strlen($path) - 1);// 末尾の一文字を削る
			}
		}
		
		return $path;
		
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
	 * セパレータから始まるディレクトリはホームルートパスからの始まりとみなす。
	 *
	 * @version 1.3
	 * @date 2014-4-13 | 2018-8-18
	 *
	 * @param string $dir_path ディレクトリパス
	 */
	private function makeDirEx($dir_path,$permission = 0705){

 		if(empty($dir_path)){return;}

 		$home_flg = false; // ホームディレクトリパス  1:ホーム(htdocsより以降）からのパス
 		$s1 = mb_substr($dir_path,0,1);
 		if($s1 == '/' || $s1 == DIRECTORY_SEPARATOR){
 			$home_flg = 1;
 		}
		
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
				if($home_flg == 1){
					$dd = $_SERVER['DOCUMENT_ROOT'] . $sep . $dd;
				}
			}else{
				$dd .= $sep.$val;
			}
			
			//作成したディレクトリが存在しない場合、ディレクトリを作成
			if (!is_dir($dd)){
				mkdir($dd,$permission);//ディレクトリを作成
				chmod($dd,$permission);// 書込み可能なディレクトリとする
			}
		}
	}
	
	/**
	 * ディレクトリごとファイルを削除する。（階層化のファイルまで削除可能）
	 * @param string $dir 削除対象ディレクトリ(絶対パスで指定する。セパレータはスラッシュ、バックスラッシュが混在しても良い）
	 */
	public function removeDirectory($dir) {
		// ディレクトリでないなら即削除
 		if (!is_dir($dir)) {
			@unlink($dir);
			return;
		}
		if ($handle = opendir($dir)) {
			while (false !== ($item = readdir($handle))) {
				if ($item != "." && $item != "..") {
					$dp = $dir . '/' . $item;
					if (is_dir($dp)) {
						$this->removeDirectory($dp);
					} else {
						@unlink($dp);
					}
				}
			}
			closedir($handle);
			rmdir($dir);
		}
	}
	
}