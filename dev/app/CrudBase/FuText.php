<?php 
require_once 'UploadFileValidation.php';
require_once 'CsvIo.php';

/**
 * ファイルアップロードからテキストまたは配列データを取得する
 * 
 * @note
 * $_FILEからテキスト配列を取得する
 * 
 * @date 2017-6-26 | 2017-6-30
 * @version 1.0
 *
 */
class FuText{
	
	// アップロードファイルバリデーションクラス
	private $uploadFileValidation; 
	
	public function __construct(){
		$this->uploadFileValidation = new UploadFileValidation();
	}
	
	/**
	 * $_FILES内からテキスト配列を取得する
	 * 
	 * @note
	 * テキスト配列だけでなくテキスト文字列形式や、XMLをパースした形式で取得可能である。
	 * 
	 * @param array $files $_FILESを指定する
	 * @param array option オプション
	 * - file_key: $_FILESのキー: 省略時は$_FILESの先頭行を取得対象にする。
	 * 
	 * - output_type: 出力タイプ: 
	 *     - line:テキスト配列    text:テキスト文字列    xml:XMLをパースしたデータ   json:JSONパースしたデータ
	 *     - ※省略時は拡張子から適切な出力タイプを自動判別する。
	 *     
	 * - permitExts<array>: 許可拡張子のリスト: 
	 *     - 省略時はtxt,xml,json,csv,plistが許可拡張子となる。拡張子は小文字で記述すること。
	 * 
	 * @return 
	 * - err_msg<string> エラーメッセージ
	 * - texts<array> テキスト配列
	 * 
	 */
	public function getTextFromFiles($files,$option=array()){

		$res = array(
				'err_msg' => '',
				'data' => array()
			);
		
		if(empty($files)){
			$res['err_msg'] = 'アップロードされたファイルはありません';
			return $res;
		}
		
		
		// If Param property is empty, set a value.
		$option = $this->setOptionIfEmpty($option);
		
		
		// $_FILESからファイルオブジェクトを取得する。
		$file1 = null; // ファイルオブジェクト
		$file_key = $option['file_key']; // ファイルキー
		if(empty($file_key)){
			// ファイルキーが未指定なら先頭行をファイルオブジェクトとして取得する
			$file1 = current($files);
		}else{
			// $_FILESからファイルキーにひもづくファイルオブジェクトを取得する。
			$file1 = $files[$file_key];
		}
		
		// 出力タイプが空であるなら、ファイル名の拡張子から適切な出力タイプをセットする。
		if(empty($option['output_type'])){
			$option['output_type'] = $this->setOutputTypeByExtend($file1);
		}
		
		
		// アップロードファイルのバリデーション
		$permitExts = $option['permitExts']; // 許可拡張子リスト
		//$permitMimes = $option['permitMimes']; // 許可MIMEリスト
		$ufvOption = array('mime_check_flg' => 0); // MIMEのチェックは行わない
		$err_msg = $this->uploadFileValidation->checkFileData($file1,$permitExts,null,array('mime_check_flg'=>0));
		if(!empty($err_msg)){
			$res['err_msg'] = $err_msg;
			return $res;
		}
		
		
		$res = array('err_msg'=>'','data'=>array());
		switch($option['output_type']){
			case 'line';
			
				// ファイルアップロードからテキスト配列を取得する
				$res= $this->getLine($file1);
				break;
				
			case 'text';
			
				// ファイルアップロードからテキスト文字列を取得する
				$res= $this->getText($file1);
				break;
			
			case 'xml';
			
				// XML用のデータ取得
				$res= $this->getDataForXml($file1["tmp_name"]);
				break;
				
			case 'json';
			
				// JSON用のデータ取得
				$res= $this->getDataForJson($file1["tmp_name"]);
				break;
				
			case 'csv';
			
				// CSV用のデータ取得
				try {
					$res['data'] = $this->getDataForCsv($file1["tmp_name"]);
				} catch (Exception $e) {
					$res['err_msg'] = $e->getMessage();
				}
				
				break;
			
			default;
		}

		return $res;


	}
	
	
	
	/**
	 * ファイルアップロード情報からテキスト配列を取得する
	 * 
	 * @param array $file1 ファイル情報
	 * @return string[]|array[]
	 */
	private function getLine($file1){
		// 一時ファイルからテキストを取得してテキスト配列にセットする。
		$texts = array(); // テキスト配列
		$tmp_name=$file1["tmp_name"];
		try {
			$tmp_name = mb_convert_encoding($tmp_name,'SJIS','UTF-8');
			if ( $fp = fopen ($tmp_name, "r")) {


				while (false !== ($line = fgets($fp))){

					$texts[] = mb_convert_encoding($line, 'utf-8', 'utf-8,sjis,euc_jp,jis');

				}
			}
			@fclose ($fp) ;

		} catch (Exception $e) {
			@fclose ($fp) ;
			return array(
					'err_msg' => 'テキストの読込に失敗しました。',
					'data' => array()
			);

		}
		
		return array(
				'err_msg' => '',
				'data' => $texts
		);
		
	}
	
	
	
	
	/**
	 * ファイルアップロード情報からテキスト文字列を取得する
	 * 
	 * @param array $file1 ファイル情報
	 * @return string テキスト文字列
	 */
	private function getText($file1){
		
		$tmp_name=$file1["tmp_name"];
		$text = file_get_contents($tmp_name);
		
		// BOMを除去する
		$text = $this->deleteBom($text);
		
		// UTF8に変換する
		$text = mb_convert_encoding($text, 'utf-8', 'utf-8,sjis,euc_jp,jis');

		return array(
				'err_msg'=>'',
				'data'=>$text
		);
		
	}
	
	
	
	/**
	 * XML用のデータ取得
	 * 
	 * @param string $xmlFp XMLファイルパス
	 * @return array 配列データ
	 */
	private function getDataForXml($xmlFp){
		

		$res = array(
				'err_msg' => '',
				'data' => array()
				);
		
		// ファイルからXMLテキストを読み込む
		$text = file_get_contents($xmlFp);
		
		
		
		// BOMを除去する
		$text = $this->deleteBom($text);
		
		// UTF8に変換する
		$text = mb_convert_encoding($text, 'utf-8', 'utf-8,sjis,euc_jp,jis');
		
		// XMLテキストからデータ配列に変換する
		$data = $this->xml2arr($text);
		
		
		// 質問データと選択肢データの構造変換
		if(empty($data['qstData'])){
			$data['qstData'] = array();
		}else{
			$data['qstData'] = $data['qstData']['qstData'];
			foreach($data['qstData'] as &$qstEnt){
				if(empty($qstEnt['choiceData'])){
					$qstEnt['choiceData'] = array();
				}else{
					$qstEnt['choiceData'] = $qstEnt['choiceData']['choiceData'];
				}
			}
			unset($qstEnt);
		}
		

		if(!empty($data)){
			$res['data'] = $data;
		}else{
			$res['res_msg'] = 'XMLデータの読込に失敗、もしくはXMLが空です。';
		}
		
		return $res;

	}
	
	/**
	 * XMLテキストからデータ配列に変換する
	 * 
	 * @note
	 * 多層構造であるとき、階層化の配列が0件でであるなら0件配列でなく空文字がセットされる。
	 * JSONとは完全な互換性はないので注意すること。
	 * 
	 * @param string $xml_text XMLテキスト
	 * @return array データ配列
	 */
	public function xml2arr($xml_text){
		// XML解析
		$data= new SimpleXMLElement($xml_text,
				LIBXML_COMPACT | LIBXML_NOERROR,
				false);
		
		// SimpleXMLElementオブジェクト型から配列データに変換する
		$this->obj2arr($data);
		
		return $data;
	}
	
	/**
	 * SimpleXMLElementのレスポンスのオブジェクトをデータ配列に変換する。
	 * 
	 * @note
	 * 階層化の配列が0件である場合、0件配列でなく、空文字がセットされる。
	 * 高速化のため引数を参照型しており、レスポンスも兼ねている。
	 * 
	 * @param array $data SimpleXMLElementオブジェクト → 配列データ
	 */
	private function obj2arr(&$data){

		if(is_array($data)){
			foreach($data as $i => &$chiled){
				$this->obj2arr($chiled);
			}
			unset($chiled);
		}elseif(is_object($data)){
			$count = $data->count();
			if(empty($count)){
				$data = '';
			}else{
				$data = get_object_vars($data);
				foreach($data as $i => &$chiled){
					$this->obj2arr($chiled);
				}
				unset($chiled);
			}
		}
		
	}
	
	
	
	
	/**
	 * JSON用のデータ取得
	 * @param string $fp ファイルパス
	 * @return array 配列データ
	 */
	private function getDataForJson($fp){
		
		$res = array(
				'err_msg' => '',
				'data' => array()
		);
		
		$json_str = file_get_contents($fp);

		// BOMを除去する
		$json_str = $this->deleteBom($json_str);
		
		// JSONデコード
		$data=json_decode($json_str,true);
		if($data===null){
			$res['err_msg'] = "JSONの展開に失敗しました。  " . json_last_error_msg() . ' ' . $json_str;
		}
		
		// レスポンスへデータをセット
		$res['data'] = $data;
		
		return $res;
		
	}
	
	
	/**
	 * CSV用のデータ取得
	 * @param string $fp ファイルパス
	 * @return array 配列データ
	 */
	private function getDataForCsv($fp){
		
		// CSV読込
 		$csvio = new CsvIo();
 		$data= $csvio->load($fp);

 		return $data;
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
	 * SQLサニタイズデコード
	 *
	 * @note
	 * SQLインジェクションでサニタイズしたデータを元に戻す。
	 * 高速化のため、引数は参照（ポインタ）にしている。
	 *
	 * @param any サニタイズデコード対象のデータ | 値および配列を指定
	 * @return void
	 */
	protected function sql_sanitize_decode(&$data){
		
		if(is_array($data)){
			foreach($data as &$val){
				$this->sql_sanitize_decode($val);
			}
			unset($val);
		}elseif(gettype($data)=='string'){
			$data = stripslashes($data);
		}else{
			// 何もしない
		}
	}
	
	
	
	
	
	
	// If Param property is empty, set a value.
	private function setOptionIfEmpty($option){
		
		if(empty($option['file_key'])){
			$option['file_key'] = null;
		}
		
		if(empty($option['output_type'])){
			$option['output_type'] = null;
			
			
		}
		
		if(empty($option['permitExts'])){
			$option['permitExts'] = array('txt','xml','json','csv','plist');;
		}
		
		if(empty($option['mime_check_flg'])){
			$option['mime_check_flg'] = 0;
		}
		
		
// 		if(empty($option['permitMimes'])){
// 			$option['permitMimes'] = array('text/plain','text/html','json','text/xml','application/json');
// 			if(!empty($option['mime_check_flg'])){
// 				$option['permitMimes'][] = 'application/octet-stream'; // すべてのファイルを表すMIME
// 			}
// 		}
		
		
		
		return $option;
	}
	
	
	
	/**
	 * ファイル名の拡張子から適切な出力タイプを取得する
	 * @param array $file1 ファイル情報
	 * 
	 */
	private function setOutputTypeByExtend($file1){

		// ファイル情報のファイル名から拡張子を取得する
		$fn = $file1['name'];
		$ext = pathinfo($fn, PATHINFO_EXTENSION);
		$ext = strtolower($ext); // 小文字か
		
		$output_type = 'text';
		switch($ext){
			case 'txt':
				$output_type = 'text';
				break;
			case 'xml':
				$output_type = 'xml';
				break;
			case 'csv':
				$output_type = 'csv';
				break;
			case 'json':
				$output_type = 'json';
				break;
			default:
				break;
		}
		
		
		return $output_type;
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
}
?>