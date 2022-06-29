<?php


/**
 * CSVダウンロード
 * 
 * @version 2.0 Excel2019,2016で文字化けするようになった。対応策をコメントに記載。
 * @date 2014-5-12 | 2019-4-11新規作成
 * @author k-uehara
 *
 */
class CsvDownloader{

	
	/**
	 * データをCSVファイルとしてダウンロードする。(UTF-8）
	 *
	 * @param string $csv_file CSVファイル名
	 * @param array  $data データ		エンティティ配列型
	 * @param bool $bom_flg BOMフラグ  0:BOMなし（デフォ）,  1:BOM有
	 */
	public function output($csv_file, $data, $bom_flg=0){
		
		$buf = "";
		
		// BOM付きutf-8のファイルである場合
		if(!empty($bom_flg)){
			$buf = "¥xEF¥xBB¥xBF";
		}
		
		// CSVデータの作成
		if(!empty($data)){
			$i=0;
			foreach($data as $ent){
				foreach($ent as $v){
					$cell[$i][] = $v;
				}
				$buf .= implode(",",$cell[$i])."\n";
				$i++;
			}
		}
		
		// CSVファイルのヘッダーを書き出す
		header ("Content-disposition: attachment; filename=" . $csv_file);
		header ("Content-type: application/octet-stream; name=" . $csv_file);
		
		print($buf); // CSVデータの書き出し
		
	}

	
	/**
	 * データをCSVファイルとしてダウンロードする。(Shift-jis版）　※非推奨メソッド
	 * 
	 * @note
	 * 旧Excelに対応。Excel2019,2016では文字化けする。
	 * 
	 * ▼Excel2019,2016でCSVを開く場合
	 * メモ帳でCSVを開く　→　「名前を付けて保存」　→　保存したCSVをExcelで開くと文字化けが治っている。
	 * ただutf-8のCSVでも同様なことができるので、わざわざ当メソッドを使うまでもない。なので当メソッドは非推奨とする。
	 *
	 * @param string $csv_file CSVファイル名
	 * @param array  $data データ		エンティティ配列型
	 */
	public function outputForExcel($csv_file, $data){

		$buf = "";

		// CSVデータの作成
		if(!empty($data)){
			$i=0;
			foreach($data as $ent){
				foreach($ent as $v){
					$cell[$i][] = $v;
				}
				$buf .= implode(",",$cell[$i]) . "\r\n";
				$i++;
			}

		}

		// CSVファイルのヘッダーを書き出す
 		header("Content-Type: application/octet-stream");
 		header("Content-Disposition: attachment; filename={$csv_file}");

 		print(mb_convert_encoding($buf,"SJIS", "UTF-8")); // Shift-JISに変換してからCSVデータの書き出し

	}

}


?>