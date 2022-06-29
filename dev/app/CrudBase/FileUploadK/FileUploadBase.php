<?php

/**
 * ファイルアップロードクラスのインターフェース
 * @date 2018-6-30
 *
 */
abstract class FileUploadBase
{
	public $files; // $_FILES
	
	public $param; // パラメータ
	

	abstract public function workAllAtOnce($files = null,$param = null); // 一括作業
	abstract public function checkFile(); // ファイルチェック
	abstract public function getFileInfo(); // ファイル情報を取得
	abstract public function putFile(); // ファイル配置
	
	/**
	 * コンストラクタ
	 * @param array $files $_FILES
	 * @param array $param パラメータ
	 */
	public function __construct($files = array(),$param = array()){
		$this->files = $files;
		$this->param = $param;
	}
	
	/**
	 * ファイルデータのセッター
	 * @param array $files $_FILES
	 */
	public function setFiles($files){
		$this->files = $files;
	}
	
	/**
	 * パラメータのセッター
	 * @param array $param
	 */
	public function setParam($param){
		$this->param = $param;
	}
}