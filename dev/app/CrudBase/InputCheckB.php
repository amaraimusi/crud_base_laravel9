<?php

/**
 * 入力チェックB | バリデーション
 * 
 * @version 1.1
 * 
 * @date 2016-1-28 isDatetimeの引数・必須許可フラグを省略可能にする。
 * @date 2015-10-5	新規作成
 * 
 * @author k-uehara
 *
 */
class InputCheckB{
	
	
	/**
	 * 日時入力チェックのバリデーション
	 * 
	 * 日付のみあるいは時刻は異常と見なします。
	 * 
	 * @param string $strDateTime	日時文字列
	 * @param bool $reqFlg	必須許可フラグ
	 * @return bool	true:正常　　　false:異常
	 */
	function isDatetime($strDateTime,$reqFlg=false){
	
		//空値且つ、必須入力がnullであれば、trueを返す。
		if(empty($strDateTime) && empty($reqFlg)){
			return true;
		}
	
		//空値且つ、必須入力がtrueであれば、falseを返す。
		if(empty($strDateTime) && !empty($reqFlg)){
			return false;
		}
	
	
		//日時を　年月日時分秒に分解する。
		$aryA =preg_split( '|[ /:_-]|', $strDateTime );
		if(count($aryA)!=6){
			return false;
		}
	
		foreach ($aryA as $key => $val){
	
			//▼正数以外が混じっているば、即座にfalseを返して処理終了
			if (!preg_match("/^[0-9]+$/", $val)) {
				return false;
			}
				
		}
	
		//▼グレゴリオ暦と整合正が取れてるかチェック。（閏年などはエラー） ※さくらサーバーではemptyでチェックするとバグになるので注意。×→if(empty(checkdate(12,11,2012))){・・・}
		if(checkdate($aryA[1],$aryA[2],$aryA[0])==false){
			return false;
		}
	
		//▼時刻の整合性をチェック
		if($aryA[3] < 0 || $aryA[3] > 23){
			return false;
		}
		if($aryA[4] < 0 ||  $aryA[4] > 59){
			return false;
		}
		if($aryA[5] < 0 || $aryA[5] > 59){
			return false;
		}
	
		return true;
	}
}