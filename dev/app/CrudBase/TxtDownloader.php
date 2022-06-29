<?php


/**
 * テキストファイルのダウンロード
 * 
 * Shift-JIS形式とUTF-8形式のファイルに対応している。
 * 
 * @date 2016-10-20	新規作成
 * @version 1.0
 * @author k-uehara
 *
 */
class TxtDownloader{

	/**
	 * 行リストをテキストファイルに書き出し、ダウンロードする
	 * 
	 * @param string  $txt_file	テキストファイル名
	 * @param array $lineList	行リスト
	 * @param boolean $utf8_flg UTF-8フラグ
	 */
	function download($txt_file,$lineList,$utf8_flg=false){
		
		$buf="";// バッファ
		
		// Shift-jisでダウンロードする
		if(empty($utf8_flg)){

			foreach($lineList as $line){
				$buf .= mb_convert_encoding($line."\r\n", "SJIS-win", "UTF-8");
			}

		}
		else{
			$buf = "\xEF\xBB\xBF"; // utf-8形式のファイルにするため、BOMをセットする。

			foreach($lineList as $line){
				$buf .= $line."\r\n";
			}
		}

		header ("Content-disposition: attachment; filename=" . $txt_file);
		header ("Content-type: application/octet-stream; name={$txt_file}; charset=utf-8");
		print($buf);

	}

}


?>