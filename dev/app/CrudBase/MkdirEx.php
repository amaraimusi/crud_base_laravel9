<?php


/**
 * ディレクトリ作成拡張
 * 
 * @note
 * フォルダ（ディレクトリ）作成機能を拡張したクラス
 * 
 * @author k-uehara
 * @date 2017-2-21
 * @version 1.0
 */
class MkdirEx{
	/**
	 * パス指定によるディレクトリ作成（パーミッションをすべて許可）
	 *
	 * @note
	 * ディレクトリが既に存在しているならディレクトリを作成しない。
	 * パスに新しく作成せねばならないディレクトリ情報が複数含まれている場合でも、順次ディレクトリを作成する。
	 *
	 * @param string $path ディレクトリのパス
	 *
	 */
	public function mkdir777($path,$sjisFlg=false){
	
		if($sjisFlg==true){
			$path=mb_convert_encoding($path,'SJIS','UTF-8');
		}
	
		if (is_dir($path)){
			return;
		}
	
	
		// パスを各ディレクトリに分解する。
		$ary=explode('/', $path);
	
		// パス内のディレクトリを1件ずつ存在チェックしながら、ディレクトリを作成する。
		$iniFlg=true;
		foreach ($ary as $key => $val){
	
			if ($iniFlg==true){
				$iniFlg=false;
				$dd=$val;
			}else{
				$dd.='/'.$val;
			}
	
			if (!(is_dir($dd))){
				mkdir($dd,0777);//ディレクトリを作成
				chmod($dd,0777);// パーミッションをすべて許可
			}
		}
			
	
	}
}