<?php
/**
 * アップロードファイルバリデーションクラス
 * 
 * @note
 * @date 2016-12-20 | 2017-6-26
 * @version 1.1 option指定に対応
 *
 */
class UploadFileValidation{
	
	
	/**
	 * アップロードファイル群のバリデーション
	 * @param array $files ファイル群データ( $_FILES )
	 * @param array $permitExts 許可拡張子リスト
	 * @param array $permitMimes 許可MIMEリスト
	 * @param array $option 
	 * - wamei 和名: エラーメッセージに組み込む和名。配列型と文字列型の両方で指定可能。（省略可）
	 * - mime_check_flg: MIMEチェックフラグ: 0:MIMEチェックしない    1（デフォルト):MIMEチェックを行う
	 * @return エラー情報。 正常である場合はnullを返す
	 */
	public function checkFiles($files,$permitExts,$permitMimes,$option){

		// オプションのプロパティが未セットなら初期値をセットする
		$option = $this->setOptionIfEmpty($option);
		
		$wamei = $option['wamei'];
		
		$errs = array();
		foreach($files as $key => $fileData){
			
			// 和名を取得
			$wamei2 = $wamei;
			if(is_array($wamei)){
				if(!empty($wamei[$key])){
					$wamei2 = $wamei[$key];
				}else{
					$wamei2 = null;
				}
			}
			
			// アップロードファイルのバリデーション
			$err = $this->checkFileData($fileData,$permitExts,$permitMimes,$option);
			
			if(!empty($err)){
				$errs[] = $err;
			}
		}
		

		if(empty($errs)){
			return null;
		}else{
			return $errs;
		}
	}
	
	
	/**
	 * アップロードファイルのバリデーション
	 * @param array $fileData ファイルデータ
	 * @param array $permitExts 許可拡張子リスト
	 * @param array $permitMimes 許可MIMEリスト
	 * @param array $option 
	 * - wamei 和名: エラーメッセージに組み込む和名。配列型と文字列型の両方で指定可能。（省略可）
	 * - mime_check_flg: MIMEチェックフラグ: 0:MIMEチェックしない    1（デフォルト):MIMEチェックを行う
	 * @return エラー情報。 正常である場合はnullを返す
	 */
	public function checkFileData($fileData,$permitExts,$permitMimes,$option=array()){

		// オプションのプロパティが未セットなら初期値をセットする
		$option = $this->setOptionIfEmpty($option);

		$wamei = $option['wamei'];
		
		// エラー情報が入っているか？
		if(!empty($fileData['error'])){
			return $wamei.$fileData['error'];
		}
		
		// ファイル名を取得する
		$fn = $fileData['name'];
		
		// ファイル名が空でないか？
		if($fn == "" || $fn == null){
			return $wamei."ファイル名が空です。";
			
		}
		
		// 一時ファイル名が空でないか？
		if(empty($fileData['tmp_name'])){
			return $wamei."ファイルが空です。";
		}
		
		// ファイル名に不正文字が含まれていないかチェックする
		if(preg_match('/;|<|>|%|\$|\.\/|\\\\/', 'xxx.png')){
			return $wamei."ファイル名に不正記号が含まれています。";
		}
		
		// ファイル名から拡張子を取得する。
		$ext1 = $this->stringRightRev($fn,'.');
		
		// 拡張子が空でないか？
		if($ext1 == "" || $ext1 == null){
			return $wamei."ファイル名に拡張子がありません。ファイル名【" . $fn . "】";
		}
		
		// ファイルサイズが0であるかチェックする。
		if(empty($fileData['size'])){
			return $wamei."ファイルサイズが0です。ファイル名【" . $fn . "】";
		}
		
		$ext1 = mb_strtolower($ext1);
		
 		// 許可拡張子リストに存在する拡張子であるか？
		if(in_array($ext1,$permitExts)==0){
			return $wamei."無効の拡張子です。【" . $fn . "】";
		}
		
		
		// MIMEチェックフラグがONであればチェックを行う。
		if(!empty($option['mime_check_flg'])){
			
			// MIMEを取得する
			$mime_type = $fileData['type'];
			
			// MIMEが空でないか？
			if($mime_type == "" || $mime_type == null){
				return $wamei."MIMEタイプが空です。";
			}
			
			// 許可拡張子リストに存在する拡張子であるか？
			if(in_array($mime_type,$permitMimes)==0){
				return $wamei."無効のMIMEタイプです。【" . $mime_type . "】";
			}
			
		}

		return null;
		
		
	}
	
	
	/**
	 * オプションのプロパティが未セットなら初期値をセットする
	 * @param array $option オプション
	 * @return array オプション
	 */
	private function setOptionIfEmpty($option){
		if(empty($option)){
			$option = array();
		}else if(!is_array($option)){
			$wamei = $option;
			$option = array('wamei'=>$wamei);
		}
		
		if(empty($option['wamei'])){
			$option['wamei'] = ' : ';
		}
		
		if(!isset($option['mime_check_flg'])){
			$option['mime_check_flg'] = 1;
		}
		
		return $option;

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
	
	
	
	
	
	
	
	
	
	
	
	
	
	
}