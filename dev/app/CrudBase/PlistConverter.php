<?php
/**
 * plist変換クラス
 * 
 * @note
 * 多重構造のデータからplist用のデータに変換するクラス。
 * 
 * @version 1.3
 * @date 2016-11-22 | 2017-4-5
 * @author k-uehara
 *
 */
class PlistConverter{
	
	
	var $inds = array();// インデント情報
	
	/**
	 * データからplistの行リストに変換する
	 * 
	 * @note
	 * 型を明示的にする場合は、settype関数でデータの各要素に型をセットすること。
	 * 型はstring,integer,boolに対応。
	 * 
	 * @param array $data データ（多重構造化）
	 * @return array plistの行リスト
	 */
	public function convPlistLines($data){
		$lines = array(); // XMLの行リスト
		
		$this->inds = $this->createIndentMap(); // インデント情報
		
		
		// ヘッダー部分を組み立てる
		$lines[] = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
		$lines[] = "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">";
		$lines[] = "<plist version=\"1.0\">";


		// 構造変換を実行する(※高速化のため$linesに値がセットされる）
		$this->excuteConvert($data,null,$lines,0,0);


		
		// フッター部分を組み立てる
		$lines[] = "</plist>";

		return $lines;
		
	}
	
	

	
	/**
	 * 構造変換を実行する
	 *
	 * @note
	 * 再帰呼出しを行っている特殊関数である。
	 * 内部で当メソッドを再帰呼出ししている。
	 * $linesが出力であるが高速化のため、returnでなく参照引数としている。
	 *
	 * @param array $data
	 * @param string $key キー
	 * @param array $lines 行リスト（当関数の出力でもある）
	 * @param int $deep 深層値
	 * @param bool $ass_flg 連想配列フラグ  0:通常配列  , 1:連想配列
	 * @return  注意：returnすると低速化するため、returnをしてはならない!!
	 */
	private function excuteConvert(&$data,$key,&$lines,$deep,$ass_flg){
	
		$ind = $this->inds[$deep];
	
		// データは配列系（通常配列or連想配列）である場合
		if(is_array($data)){
	
			// データは連想配列である場合
			if (array_values($data) === $data) {
				$deep++;
				if($ass_flg){
					$lines[] = $ind.'<key>'.$key.'</key>';
				}
				$lines[] = $ind.'<array>';
				foreach($data as $key2 => $v){
					$this->excuteConvert($v,$key2,$lines,$deep,0);
				}
				$lines[] = $ind.'</array>';
			}
	
			// データは通常配列である場合
			else {
				$deep++;
				if($ass_flg){
					$lines[] = $ind.'<key>'.$key.'</key>';
				}
				$lines[] = $ind.'<dict>';
				foreach($data as $key2 => $v){
					$this->excuteConvert($v,$key2,$lines,$deep,1);
				}
				$lines[] = $ind.'</dict>';
			}
	
		}
	
		// データはプリミティブである場合（配列でない場合）
		else{
			if($ass_flg){
				$lines[] = $ind.'<key>'.$key.'</key>';
			}
			$t = gettype($data);
			if($t == 'boolean'){
				$lines[] = $ind.$this->mekeBoolStr($data);
			}else{
				$lines[] = $ind."<{$t}>{$data}</{$t}>";
			}
	
		}
	
	
		//return 低速化するのでreturn禁止
	
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	/**
	 * BOOL用の要素文字列を作成する
	 * @param bool $bool ブール値
	 * @return string BOOL要素文字列
	 */
	private function mekeBoolStr($bool){
		if(empty($bool)){
			return '<false/>';
		}else{
			return '<true/>';
		}
	}
	
	/**
	 * インデントのマッピングを生成する
	 * @return array インデントのマッピング
	 */
	private function createIndentMap(){
		$ind = array();
		$t = "";
		for($i=0;$i<16;$i++){
			$ind[] = $t;
			$t.="\t";
		}
		
		
		return $ind;
	}
}