<?php
error_reporting(E_ALL ^ E_NOTICE);//Noticeエラーを表示させない


// **** エンティティ情報の例 ****
// $ei['int_a'] = array('name'=>'int_a','type'=>'int','jname'=>'ID','size'=>null,'def'=>0,'primaryKey'=>true,'req'=>true,'ic'=>true,'maxvalue'=>10,'minvalue'=>0,'inptype'=>'null');
// $ei['string_a'] = array('name'=>'string_a','type'=>'string','jname'=>'文字列A','size'=>3,'def'=>'ネコ','primaryKey'=>null,'req'=>null,'ic'=>true,'maxvalue'=>null,'minvalue'=>null,'inptype'=>'text');
// $ei['double_a'] = array('name'=>'double_a','type'=>'double','jname'=>'ダブルA','size'=>null,'def'=>99,'primaryKey'=>false,'req'=>true,'ic'=>true,'maxvalue'=>1000,'minvalue'=>10,'inptype'=>null);
// $ei['date_a'] = array('name'=>'date_a','type'=>'date','jname'=>'日付A','size'=>null,'def'=>'false','primaryKey'=>false,'req'=>false,'ic'=>true,'maxvalue'=>null,'minvalue'=>null,'inptype'=>null);
// $ei['time_a'] = array('name'=>'time_a','type'=>'time','jname'=>'時間A','size'=>null,'def'=>null,'primaryKey'=>false,'req'=>false,'ic'=>true,'maxvalue'=>null,'minvalue'=>null,'inptype'=>null);
// $ei['datetime_a'] = array('name'=>'datetime_a','type'=>'datetime','jname'=>'時刻A','size'=>null,'def'=>null,'primaryKey'=>false,'req'=>false,'ic'=>true,'maxvalue'=>null,'minvalue'=>null,'inptype'=>null);

/**
 * 入力チェック　ver3.0
 * ★概要
 * フィールド情報を元に、データチェックを行うクラス。
 * ★履歴
 * 2014/4/21	新規作成。input_check_ex2.php,input_check_ex.php,input_check.php,i_input_chek.phpを統合する。
 *
 * @author k-uehara
 *
 */
class InputCheck{


	///チェック対象文字を修正したときの文字
	var $m_newVal;

	///エラーメッセージ
	var $errMsg;

	///エラーメッセージリスト
	var $m_errMsgList;

	///値を修正したエンティティ
	var $m_newEnt;

	///エラーフィールド名リスト
	var $m_errFieldList;

	public static function getInstance(){


		if(!$_REQUEST['InputCheck']){
			$obj=new InputCheck();
			$_REQUEST['InputCheck']=&$obj;
		}else{
			$obj=&$_REQUEST['InputCheck'];
		}

		return $obj;

	}



	/**
	 * エンティティをエンティティ情報を元に入力チェックする。
	 * @param array $ent　　入力対象エンティティ
	 * @param array $entityInfo	エンティティ情報
	 * @return 入力エラーがあった場合、エラーメッセージを返す。
	 */
	function checkEntity($ent,$entityInfo){


		if($this->checkEntity2($ent, $entityInfo)==false){

			$errMsg=join('<br>',$this->m_errMsgList);


			return $errMsg;


		}else{

			return null;
		}
	}



	/**
	 * データの入力チェックを行う。
	 * @param  array $data　入力チェック対象データ
	 * @param  array $entityInfo　エンティティ情報
	 * @param  $dataName　データの名称。エラーメッセージに利用。省略可
	 * @return エラーメッセージ（入力エラーがあった場合）
	 */
	public function checkData($data,$entityInfo,$dataName=null){




		//▼構成品エンティティリストの件数分、以下の処理を繰り返す。
		$i=1;
		foreach ((array)$data as $key => $ent){

			//▽エンティティの入力チェック。エラーメッセージリストを取得する。
			$errMsg=$this->checkEntity($ent,$entityInfo);

			//▽エラーメッセージリストがnullでなければ、以下の処理を行う。
			if(isSet($errMsg)==true){
				//◇エラーメッセージリストからエラーメッセージを作成。
				$errMsg=$dataName.$i.'行目：'.$errMsg;

				//◇エラーメッセージリスト２にエラーメッセージを追加。
				$errMsgList2[$key]=$errMsg;

			}

			$i++;

		}

		//▼エラーメッセージリスト2がnullである場合、trueを返す。
		if(isSet($errMsgList2)==null){
			return null;


			//▼エラーメッセージリスト2がnullでない場合、以下の処理を行う。
		}else{

			//▽エラーメッセージリストを<br />で連結する。（エラーメッセージ２の作成）
			$errMsg2=join('<br />',$errMsgList2);

			//▽エラーメッセージ２を返す。
			return $errMsg2;
		}



	}







	/**
	 * エンティティの入力チェックを行う。
	 * @param array $ent	エンティティ
	 * @param array $entInfo	エンティティ情報
	 * @return 入力エラーがない場合、TRUEを返す。
	 * ※結果はメンバにセットされる。
	 */
	private function checkEntity2($ent,$entInfo){

		$this->m_newEnt=$ent;

		//▼エンティディ詳細情報を取得する。

		$flgA=true;
		$em=null;



		//▼エンティティのすべてのフィールド分、入力チェックを行う。
		foreach ((array)$entInfo as $key => $rec){


			//▼入力チェック対象となっているデータのみ入力チェック。
			if($rec['ic']){
				if($this->check($ent[$key], $rec['size'], $rec['type'], $rec['jname'],$rec['req'], null,$rec['inptype'],$rec['def'],$rec['minvalue'],$rec['maxvalue'])==false){
					//入力チェックエラーがある場合。
					$em=$this->errMsg;		//エラーメッセージを取得する。

					//▼入力タイプがselect,radio,checkboxの場合、デフォルト値を修正後エンティティにセット
					$this->m_newEnt[$key]=$this->getSyusei($ent[$key],$rec['inptype'],$rec['def']);


					$flgA=null;//
				}else{
					//入力チェックでエラーがなかった場合
				}

			}
			if($em!=null){
				$errMsgs[$key]=$em;//エラーメッセージを追加します。入力エラーがないときはnullが張ります。
				$errFieldList[]=$key;//エラーフィールドリストをセット
			}
			$em=null;
		}
		$this->m_errMsgList=$errMsgs;
		$this->m_errFieldList=$errFieldList;

		return $flgA;
	}

	/**
	 * 入力チェックを行う。OKであればtrueを返し、エラーであればfalseを返す。
	 * エラーメッセージや修正値はメンバにセットされる。
	 * @param string $val　チェック対象文字列
	 * @param int $limitLen	制限文字数
	 * @param string $type	入力チェックの種類。現在はint,double,string,dateに対応。
	 * @param string $jname　項目の日本語名称
	 * @param boolean $req		必須入力フラグ。必須入力にする場合はtrue。省略可能。
	 * @param string $errMsg	任意のエラーメッセージにする。省略時には規定エラーメッセージを返す。
	 * @param string $inptype 入力ボックスタイプ。省略時はtextになる。text,radio,select,checkbox,hiddenのいずれかを指定。
	 * @param string $def 	初期値。select,radio,checkbox系の場合、エラーだった場合この値をセット
	 * @return string OKであればtrue,エラーであればfalse
	 */
	private function check($val ,$limitLen,$type,$jname,$req=false,$prm_errMsg=null,$inptype='text',$def=null,$minvalue=null,$maxvalue=null){


		$errMsg=null;
		$flg=true;
		switch($type){
			case 'int';
			//▼整数チェック
			if($this->isIntEx($val, $limitLen, $req)==false){
				if(!$prm_errMsg){
					$errMsg=sprintf("%sは%s文字以内の整数で入力してください。",$jname,$limitLen);
					$flg=false;
				}
			}else{
				//▼範囲値チェック
				if($this->is_range($val, $minvalue, $maxvalue)==false){
					$errMsg=sprintf("%sは%sから%sまでの範囲内で数値を入力してください。",$jname, $minvalue, $maxvalue);
					$flg=false;
				}

			}


			break;
			case 'string';
			//▼文字列チェック

			if($this->isTextEx1($val, $limitLen, $req)==false){

				if(!$prm_errMsg){
					if($req){
						$errMsg=sprintf("%sを%s文字以内で入力してください。【必須入力】",$jname,$limitLen);

					}else{
						$errMsg=sprintf("%sは%s文字以内で入力してください。",$jname,$limitLen);
					}
					$flg=false;
				}
			}
			break;
			case 'double';
			//▼数値チェック
			if($this->isNumEx($val, $limitLen, $req)==false){
				if(!$prm_errMsg){
					$errMsg=sprintf("%sは%s文字以内の数値で入力してください。",$jname,$limitLen);
					$flg=false;
				}
			}else{
				//▼範囲値チェック
				if($this->is_range($val, $minvalue, $maxvalue)==false){
					$errMsg=sprintf("%sは%sから%sまでの範囲内で数値を入力してください。",$jname, $minvalue, $maxvalue);
					$flg=false;
				}

			}
			break;
			case 'date';
			//▼日付チェック 。時刻までの表記はエラー
			if($this->isDateEx($val, $limitLen, $req)==false){
				if(!$prm_errMsg){
					$errMsg=sprintf("%sは「yyyy/mm/dd」形式の存在する日付を入力してください。【半角で入力】",$jname);
					$flg=false;
				}

			}
			break;
			case 'time';
			//▼時刻チェック 。
			if($this->isTimeEx($val, $limitLen, $req)==false){
				if(!$prm_errMsg){
					$errMsg=sprintf("%sは「h:i:s」形式の時刻を入力してください。【半角で入力】",$jname);
					$flg=false;
				}

			}
			break;
			case 'datetime';
			//▼日時チェック 。
			if($this->isDatetimeEx($val,$req)==false){
				if(!$prm_errMsg){
					$errMsg=sprintf("%sは「y/m/d h:i:s」形式の日時を入力してください。【半角で入力】",$jname);
					$flg=false;
				}

			}
			break;

			default;
			echo 'InputCheckExにて致命的エラー $type='.$type;
		}


		//▼入力エラーがあった場合の処理。
		if ($flg==false){
			if(!$prm_errMsg){
				//特定の入力タイプである場合、エラメッセージを変更します。
				$errMsg=$this->inputboxEachErrMsg($errMsg,$inptype,$jname);
			}else{
				//引数でエラーメッセージが指定されている場合は、これをエラーメッセージとします。
				$errMsg=$prm_errMsg;
			}


			//特定の入力タイプである場合、初期値をメンバの修正値にセットする。
			$this->setDefalut($inptype,$def);
		}
		//メンバへエラーメッセージをセット
		$this->errMsg=$errMsg;

		return $flg;

	}


	/**
	 * 入力タイプがselect,radio,checkboxの場合、それぞれ専用のエラーメッセージを作成する。
	 * @param string $inptype　入力タイプ
	 * @param string $jname	デフォルト文字
	 * @return string
	 */
	private function inputboxEachErrMsg($errMsg,$inptype,$jname){
		switch ($inptype){
			case 'select';
			$errMsg=sprintf("%sは想定外の値でしたのでデフォルトを選択しました。確認のためもう一度選択しなおしてください。",$jname);
			break;
			case 'checkbox';
			$errMsg=sprintf("%sのチェックボックスは想定外の値でしたのでデフォルトを設定しました。確認のためもう一度設定しなおしてください。",$jname);
			break;
			case 'radio';
			$errMsg=sprintf("%sのラジオボタンは未選択でしたのでデフォルトを選択しました。確認のためもう一度選択しなおしてください。",$jname);
			break;

		}
		return $errMsg;
	}


	/**
	 * 入力タイプがselect,radio,checkboxの場合、デフォルト値をメンバの修正値にセットする。
	 * @param string $inptype　入力タイプ
	 * @param string $def		デフォルト文字
	 */
	private function setDefalut($inptype,$def){
		if('select' == $inptype || 'checkbox' == $inptype || 'radio' == $inptype ){
			$this->m_newVal=$def;
		}
	}

	/**
	 * 入力タイプがselect,radio,checkboxの場合、デフォルト値をメンバの修正値にセットする。
	 * @param string $val　値
	 * @param string $inptype 入力タイプ
	 * @param string $def	デフォルト文字
	 * @return string 修正値
	 */
	private function getSyusei($val,$inptype,$def){
		if('select' == $inptype || 'checkbox' == $inptype || 'radio' == $inptype ){
			$rtn=$def;
		}else{
			$rtn=$val;
		}
		return $rtn;
	}






















	/**
	 * 汎用テキストチェック。
	 * 文字数チェックを行う。
	 * 必須入力チェックを行う。
	 * @param string $str 対象文字列
	 * @param int $len　制限文字数
	 * @param boolean $reqFlg 必須入力のチェックも行う場合はtrueとする。
	 * @return boolean
	 */
	function isTextEx1($str,$len,$reqFlg){

		//文字数チェック
		$ln=mb_strlen($str,'utf8');

		if($ln>$len){
			return false;
		}

		//必須入力チェック
		if($reqFlg){
			if($str===null || $str===''){

				return false;
			}
		}

		return true;

	}


	/**
	 * 数値チェック。
	 *
	 * 数値チェックを行う。（小数点、負もＯＫ）
	 * 文字数チェックを行う。
	 * 必須入力チェックを行う。
	 * @param string $str 対象文字列
	 * @param int $len　制限文字数
	 * @param $reqFlg 必須入力のチェックも行う場合はtrueとする。
	 * @return boolean
	 */
	function isNumEx($str,$len,$reqFlg){



		//必須入力チェック
		if($reqFlg){
			if(isSet($str)==false || $str==''){
				return false;
			}

			//数値チェック
			if(is_numeric($str)==false){
				return false;
			}else{
				return true;
			}


		}else{
			if(isSet($str)==false || $str==''){
				return true;
			}
			//数値チェック
			if(is_numeric($str)==false){
				return false;
			}else{
				return true;
			}

		}

	}

	/**
	 * 正数チェック。
	 *
	 * 数値チェックを行う。（小数点、負は不可）
	 * 文字数チェックを行う。
	 * 必須入力チェックを行う。
	 * @param string $str 対象文字列
	 * @param int $len　制限文字数
	 * @param $reqFlg 必須入力のチェックも行う場合はtrueとする。
	 * @return boolean
	 */
	function isPNumEx($str,$len,$reqFlg){

		//数値チェック
		if($this->isPNum($str)==false){
			return false;
		}


		//必須入力チェック
		if($reqFlg){
			if(isSet($str)==false || $str==''){
				return false;
			}
		}

		return true;
	}


	/**
	 * 整数チェック。
	 *
	 * 数値チェックを行う。（小数点不可、負はＯＫ）
	 * 文字数チェックを行う。
	 * 必須入力チェックを行う。
	 * @param string $str 対象文字列
	 * @param int $len　制限文字数
	 * @param boolean $reqFlg 必須入力のチェックも行う場合はtrueとする。
	 * @return boolean
	 */
	function isIntEx($str,$len,$reqFlg){

		//▼必須入力チェック。
		if($str==null ||  $str==''){
			if($reqFlg==true){
				return false;
			}else{
				return true;
			}
		}

		//▼整数チェック
		if($this->isInt($str)==false){
			return false;
		}

		return true;
	}



	/**
	 * 日付チェック。閏年対応にも対応。（Y/M/DかY-M-D)
	 * 文字数チェックを行う。
	 * 必須入力チェックを行う。
	 * @param string $str 対象文字列
	 * @param int $len　制限文字数 使いません。
	 * @param boolean $reqFlg 必須入力のチェックも行う場合はtrueとする。
	 * @return boolean
	 */
	function isDateEx($str,$len=null,$reqFlg){


		$str=trim($str);

		//空値且つ、必須入力がnullであれば、TRUEを返す。
		if(!$str && !$reqFlg){
			return true;
		}

		//日付チェック
		if($this->isDate($str)==false){
			return false;
		}



		return true;
	}

	/**
	 * 時刻チェック。  h-i-s,h:i:s,hhiiss型に対応
	 * @param string $str 対象文字列
	 * @param int $len　制限文字数 使いません。
	 * @param boolean $reqFlg 必須入力のチェックも行う場合はtrueとする。
	 * @return boolean
	 */
	function isTimeEx($str,$len=null,$reqFlg){


		$str=trim($str);

		//空値且つ、必須入力がnullであれば、TRUEを返す。
		if(!$str && !$reqFlg){
			return true;
		}

		//時刻チェック
		if($this->isTime_his($str)==false){
			return false;
		}

		return true;
	}

	/**
	 * 日時チェック。 yyyymmddhhiidd,y/m/d h:i:s,y-m-d h:i:s型に対応
	 * @param string  $str 対象文字列
	 * @param boolean $reqFlg 必須入力のチェックも行う場合はtrueとする。
	 * @return boolean
	 */
	function isDatetimeEx($str,$reqFlg){

		//トリミングをする。
		$str=trim($str);

		//空値且つ、必須入力がnullであれば、TRUEを返す。
		if(!$str && !$reqFlg){
			return true;
		}

		//日時入力チェック
		$ret=$this->isDate($str);

		return $ret;
	}

	/**
	 * 左から印文字を探し、見つかった場所から左側の文字列を返す。（印文字は含めず）
	 * 検索文字列が存在しない場合は、対象文字列をそのまま返す。
	 * 検索文字列が先頭にあった場合も、対象文字列をそのまま返す。
	 * @param string  $str　対象文字列
	 * @param string  $mark　印文字列
	 * @return string
	 */
	function stringLeft($str,$mark){
		$a=mb_strpos($str,$mark,0,'utf8');
		if(!$a){return $str;}
		$len=mb_strlen($str,'utf8');
		$rtn=mb_substr($str,0,$a,'utf8');

		return $rtn;
	}


	/**
	 * メールアドレスチェック。
	 * 文字数チェックを行う。
	 * 必須入力チェックを行う。
	 * @param string $str 対象文字列
	 * @param int $len　制限文字数
	 * @param boolean $reqFlg 必須入力のチェックも行う場合はtrueとする。
	 * @return boolean
	 */
	function isMailEx($str,$len,$reqFlg){

		//日付チェック
		if($this->isMail($str)==false){
			return false;
		}

		//文字の長さチェック
		$ln=mb_strlen($str);
		if($ln>$len){
			return false;
		}

		//必須入力チェック
		if($reqFlg){
			if(isSet($str)==false || $str==''){
				return true;
			}
		}

		return true;
	}


	/**
	 * メールアドレスチェック
	 * @param string $str　メールアドレス文字列
	 * @return boolean
	 */
	function isMail($str){

		$ary=split("@",$str);
		if(sizeof($ary)!=2){

			return false;
		}else{
			if (mb_strlen($ary[0],'utf8')<1 || mb_strlen($ary[1],'utf8')<4){
				return false;
			}
		}

		return true;

	}



	/**
	 * 日時チェック 閏年対応
	 * @param string $strDate　日付文字列
	 * @return boolean　可否
	 */
	function isDatetime($strDateTime){


		//トリミング
		$strDateTime=trim($strDateTime);

		//空であればエラー
		if (!$strDateTime){return false;}


		$aryA=array();
		//yyyymmdd型の場合
		if(is_numeric($strDateTime)){

			if(strlen($strDateTime)==8 ){
				$ary_b=str_split($strDateTime,2);

				$aryA[0]=$ary_b[0].$ary_b[1];
				$aryA[1]=$ary_b[2];
				$aryA[2]=$ary_b[3];
				$aryA[3]=0;
				$aryA[4]=0;
				$aryA[5]=0;
			}elseif(strlen($strDateTime)==14 ){

				$aryA[0]=$ary_b[0].$ary_b[1];
				$aryA[1]=$ary_b[2];
				$aryA[2]=$ary_b[3];
				$aryA[3]=$ary_b[4];
				$aryA[4]=$ary_b[5];
				$aryA[5]=$ary_b[6];
			}else{
				return false;
			}

		}

		//y-m-d h:i:sやy/m/dなど
		else{
			//日時を　年月日時分秒に分解する。
			$aryA =preg_split( '|[ /:_-]|', $strDateTime );
			foreach ($aryA as $key => $val){

				//▼正数以外が混じっているば、即座にfalseを返して処理終了
				if ($this->isPNum($val)==false){
					return false;
				}
				$aryA[$key]=trim($val);
			}
		}

		//▼グレゴリオ暦と整合正が取れてるかチェック。（閏年などはエラー）
		if(!checkdate($aryA[1],$aryA[2],$aryA[0])){
			return false;
		}


		//▼時刻の整合性をチェック
		if ($this->checkTime($aryA[3], $aryA[4], $aryA[5])==false){
			return false;
		}

		return true;


	}

	/**
	 * hhiiss型の時刻チェック
	 * @param string $v	時刻文字列
	 * @return true:false
	 */
	function isTime_hhiiss($v){

		//文字数が6でなければfalseを返す。
		if(mb_strlen($v)!=6){
			return false;
		}

		//文字が数値でなければ、falseを返す。
		if($this->isInt($v)==false){
			return false;
		}

		//2文字ずつ分割し、時分秒を取得。
		$ary = str_split($v,2);

		//時刻の整合性をチェックする。
		$ret =$this->checkTime($ary[0],$ary[1],$ary[2]);

		return $ret;
	}

	/**
	 * hhii型の時刻チェック（時分のみ）
	 * @param string $v	時刻文字列
	 * @return true:false
	 */
	function isTime_hhii($v){

		//文字数が6でなければfalseを返す。
		if(mb_strlen($v)!=4){
			return false;
		}

		//文字が数値でなければ、falseを返す。
		if($this->isInt($v)==false){
			return false;
		}

		//2文字ずつ分割し、時分を取得。
		$ary = str_split($v,2);

		//時刻の整合性をチェックする。
		$ret =$this->checkTime($ary[0],$ary[1],0);

		return $ret;
	}

	/**
	 * h:i:s,h-i-s,hhiiss型の時刻チェック
	 * @param string $v	時刻文字列
	 * @return true:false
	 */
	function isTime_his($v){
		//区切りが「：」である場合。
		if(strstr($v,':')){
			$dimi=':';
		}

		//区切りが「-」である場合。
		elseif(strstr($v,'-')){
			$dimi='-';

		}

		//区切りがない場合。
		else{
			$ret=$this->isTime_hhiiss($v);
		}

		//区切り文字がnullでない場合、以下の処理を行う。
		if($dimi!=null){
			$ary=explode($dimi,$v);

			//時刻の整合性をチェックする。
			$ret =$this->checkTime($ary[0],$ary[1],$ary[2]);

		}

		return $ret;
	}

	/**
	 * 時刻の整合性をチェック
	 * @param int $hou　時
	 * @param int $min　分
	 * @param int $sec　秒
	 * @return boolean　可否
	 */
	function checkTime($hou,$min,$sec){


		if($hou < 0 || $hou > 23){

			return false;
		}
		if($min < 0 || $min > 59){

			return false;
		}
		if($sec < 0 || $sec > 59){

			return false;
		}

		return true;
	}



	/**
	 * 正数チェック
	 * @param string  $str　正数文字列
	 * @return boolean
	 */
	function isPNum($str){
		if (preg_match("/^[0-9]+$/", $str)) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * 整数チェック
	 * @param string  $str　整数文字列
	 * @return boolean
	 */
	function isInt($str){
		if (preg_match("/^-?[0-9]+$/", $str)) {
			return true;
		} else {
			return false;
		}
	}


	/**
	 * 値が範囲値ないであるかチェックする。
	 * valが文字列である場合、falseを返す。
	 * valが数値且つ、最小値と最大値のいずれかがnullの場合はtrueを返す。
	 * @param int 対象値 $val
	 * @param int 最小値 $minvalue
	 * @param int 最大値 $maxvalue
	 */
	function is_range($val,$minvalue,$maxvalue,$req=false){

		//▼必須入力チェック。
		if($val==null ||  $val==''){
			if($reqFlg==true){
				return false;
			}else{
				return true;
			}
		}

		if (!is_numeric($val)){

			return false;
		}
		if($minvalue ===null || $maxvalue ===null){

			return true;
		}
		if($val<$minvalue || $val > $maxvalue){


			return false;
		}

		return true;
	}


	/**
	 * 半角英数字ファイル名許可記号チェック
	 * @param  $str
	 * @return boolean
	 */
	function is_hankakuAlfFileSign(&$str){
		if($str==null){return true;}
		if(preg_match("/^[a-zA-Z0-9$ % ' - _ @ ! ` ( ) ~.]+$/", $str)){
			return true;
		} else {
			return false;
		}

	}

	/**
	 * 半角英数字チェック
	 * @param string $str
	 * @return boolean
	 */
	function is_hankakuAlf(&$str){
		if($str==null){return true;}
		if(preg_match("/^[a-zA-Z0-9]+$/", $str)){
			return true;
		} else {
			return false;
		}

	}
	/**
	 * 半角英数字「_-」チェック
	 * @param string $str
	 * @return boolean
	 */
	function is_hankakuAlfPlus(&$str){
		if($str==null){return true;}
		if(preg_match("/^[a-zA-Z0-9._-]+$/", $str)){
			return true;
		} else {
			return false;
		}

	}






}

?>