<?php
/**
 * サムネイル作成の拡張クラス
 * 
 * @note
 * 画像ファイルからサムネイル画像を作成する。
 * 
 * png,jpeg,gifに対応している。
 * MIMEタイプではなく、拡張子からファイルを分類している。(MIMEタイプではバグが発生する）
 * 
 * @date 2016-11-1 | 2018-8-21 $thum_height=nullの時のバグを修正
 * @version 1.3.1
 * @author k-uehara
 *
 */
class ThumbnailEx{
	
	
	/**
	 * 画像ファイルからサムネイル画像を作成する
	 * 
	 * @note
	 * サムネイルの縦幅を省略すると、横幅の比率に合わせて幅を調整する。
	 * サムネイルの横幅についても同様である。
	 * 
	 * @param string $orig_fp オリジナル画像のファイルパス
	 * @param string $thum_fp サムネイル画像のファイルパス
	 * @param int $thum_width サムネイル画像の横幅(省略可）
	 * @param int $thum_height サムネイル画像の縦幅(省略可）
	 * @throw $thum_widthと$thum_heightが両方とも空だと例外を投げる。
	 */
	public function createThumbnail($orig_fp,$thum_fp,$thum_width=null,$thum_height=null){

		$orig_fp=mb_convert_encoding($orig_fp,'SJIS','UTF-8');
		
		// オリジナル画像が存在なら処理抜け
		if(!is_file($orig_fp)){
			return;
		}
		
		// 拡張子を取得する
		$info = pathinfo($orig_fp);
		$ext = $info["extension"];
		$ext = mb_strtolower($ext);

		// オリジナル画像の幅を取得する
		list($orig_width, $orig_height) = getimagesize($orig_fp);
		
		if($thum_width==null && $thum_height==null){
			throw new Exception('$thum_widthと$thum_heightのいずれかに値をセットしてください。');
		}
		
		if($thum_width==null){
			$thum_width = $orig_width * ( $thum_height / $orig_height);
		}
		
		if($thum_height==null){
			$thum_height = $orig_height * ( $thum_width / $orig_width);
		}
		
		
		// オリジナル画像のresourceオブジェクトを取得
		$origImg=null;
		if($ext == 'png'){
			$origImg = imagecreatefrompng($orig_fp);
		}elseif($ext == 'gif'){
			$origImg = imagecreatefromgif($orig_fp);
		}elseif($ext == 'jpg'){
			$origImg = imagecreatefromjpeg($orig_fp);
		}elseif($ext == 'jpeg'){
			$origImg = imagecreatefromjpeg($orig_fp);
		}else{
			throw new Exception("拡張子「{$ext}」は被対応です。");
		}
		
		// サムネイル画像のresourceオブジェクトを取得
		$thumImg = imagecreatetruecolor($thum_width, $thum_height);
		
		//ブレンドモードを無効にする
		imagealphablending($thumImg, false);
		
		//完全なアルファチャネル情報を保存するフラグをonにする
		imagesavealpha($thumImg, true);
		
		// サムネイル画像を作成
		imagecopyresized($thumImg, $origImg, 0, 0, 0, 0,
				$thum_width, $thum_height,
				$orig_width, $orig_height);
	
	
		// サムネイル画像を出力
		if($ext == 'png'){
			imagepng($thumImg,$thum_fp);
		}elseif($ext == 'gif'){
			imagegif($thumImg,$thum_fp);
		}else{
			imagejpeg($thumImg,$thum_fp);
		}
	
		// resourceオブジェクトを破棄する
		imagedestroy($origImg);
		imagedestroy($thumImg);
		

	}
	
	/**
	 * ディレクトリを作成する
	 * 
	 * @note
	 * ディレクトリが既に存在しているならディレクトリを作成しない。
	 * パスに新しく作成せねばならないディレクトリ情報が複数含まれている場合でも、順次ディレクトリを作成する。
	 * 日本語ディレクトリ名にも対応。
	 * パスセパレータは「/」と「\」に対応。
	 * ディレクトリのパーミッションの変更をを行う。(既にディレクトリが存在する場合も）
	 * 
	 * @version 1.2
	 * @date 2016-8-24 | 2014-4-13
	 * 
	 * @param string $dir_path ディレクトリパス
	 */
	public function makeDirEx($dir_path,$permission = 0705){

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
				chmod($dd,$permission);// 書込み可能なディレクトリとする
			}
		}
	}
	
	
	
	/**
	 * 日本語ディレクトリの存在チェック
	 * @param string $dn	ディレクトリ名
	 * @return boolean	true:存在	false:未存在
	 */
	public function is_dir_ex($dn){
		$dn=mb_convert_encoding($dn,'SJIS','UTF-8');
		if (is_dir($dn)){
			return true;
		}else{
			return false;
		}
	}
	
	/**
	 * ファイルパスやディレクトリパスからパスセパレータを取得する
	 * @param string $path パス（ファイルパス、またはディレクトリパス）
	 * @return パスセパレータ。   「/」か「\」
	 */
	public function getPathSeparator($path){
		if(empty($path)){
			return DIRECTORY_SEPARATOR;
		}
		if(strpos($path,"/")!==false){
			return "/";
		}
		if(strpos($path,"\\")!==false){
			return "\\";
		}
		return DIRECTORY_SEPARATOR;
		
	}
	
	
	
	
	
	
	
	
	
}