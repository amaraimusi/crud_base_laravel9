<?php
class ImgFileUpload extends FileUploadBase{


	/**
	 * 一括作業
	 * {@inheritDoc}
	 * @see FileUploadBase::workAllAtOnce()
	 */
	public function workAllAtOnce($files = null,$param = null){
		
		// ファイルチェック
		$errs = $this->checkFile();
		
		$res = array('errs'=>$errs);
		return $res;
	}
	
	/**
	 * ファイルチェック
	 */
	public function checkFile(){
		// アップロードファイルのバリデーションを行い、エラーがあればエラーリストに追加する。
		$upFileValid = new UploadFileValidation();
		$suppData = $this->param['suppData']; // 補足データ
		$errs = $upFileValid->checkFiles($this->files,array('png','jpg','jpeg'),array('image/png','image/jpeg'),$suppData);

		return $errs;
		
		
	}
	
	/**
	 * ファイル情報を取得
	 */
	public function getFileInfo(){
		
	}
	
	/**
	 *  ファイル配置
	 */
	public function putFile(){
		
	}
}