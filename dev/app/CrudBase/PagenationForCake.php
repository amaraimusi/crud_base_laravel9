<?php

/**
 * ページネーション制御クラス
 * 
 * ページネーションの目次や列名ソートに必要な情報を作成します。
 * 
 * Cake PHP用であるが、ネイティブのPHPにも使用可能です。
 *
 * ◇主な機能
 * - DB検索に必要なLIMIT,ORDER BYを生成する。
 * - ページネーション情報としてページ目次、ソート用リンク、データ件数等を出力する。
 * 
 * @author k-uehara
 * @version 1.5.7
 * @date 2010-4-1 | 2020-8-1
 *
 */
class PagenationForCake{

	/**
	 *
	 * ページネーション関連のデータを取得する
	 * 
	 * @param  array $pages		  ページネーション情報
	 * @param  int $all_data_cnt	データ件数（limitをかけていない、検索条件を含めたデータの件数）
	 * @param  string $path			基本的なURLを指定。例:「proj/list.php」。
	 * @param  array $params		ページ関連外のその他のパラメータをURLに付加する場合。例：「array('xxx'=>'1','flg',true)」
	 * @param  array $fields		HTMLテーブルのキーはDBフィールド、値はフィールド和名にする。例：「array('title'=>'タイトル')」
	 * @param  array $kjs		   検索条件情報
	 * @return array $data ページネーションデータ
	 * - $data['page_index_html'] ページ目次を生成するHTML
	 * - $data['page_prev_link'] 前へリンク
	 * - $data['page_next_link'] 戻りリンク
	 * - $data['page_top_link'] トップリンク
	 * - $data['page_last_link'] ラストリンク
	 * - $data['sorts'][フィールド名] HTMLテーブルをソートするリンク
	 * - $data['page_no'] 現在ページ番号
	 * - $data['all_data_cnt'] 検索データ件数
	 * - $data['all_page_cnt'] ページ数
	 */
	public function createPagenationData(&$pages,$all_data_cnt,$path,$params,$fields,$kjs){

		// 検索条件ＵＲＬクエリを生成する。
		$kjs_uq = $this->createKjsUrlQuery($kjs);
		
		//　ソートＵＲＬリンクHTMLのリストを生成する。
		$sorts=$this->_createSorts2($pages,$all_data_cnt,$path,$params,$fields,$kjs_uq);
		
		//　ページ目次用のHTMLコードを生成する。
		$res = $this->_createIndexHtml2($pages,$all_data_cnt,$path,$params,$kjs_uq);

		$pages['page_index_html'] = $res['mokuji'];
		$pages['def_url'] = $res['def_url'];
		$pages['page_prev_link'] = $res['page_prev_link'];
		$pages['page_next_link'] = $res['page_next_link'];
		$pages['page_top_link'] = $res['page_top_link'];
		$pages['page_last_link'] = $res['page_last_link'];
		$pages['query_str'] = $res['query_str'];
		
		$pages['sorts']=$sorts;
		$pages['all_data_cnt']=$all_data_cnt;//全データ数
		if(isset($pages['row_limit'])){
			$pages['all_page_cnt']=ceil($pages['all_data_cnt'] / $pages['row_limit']);//全ページ数
		}else{
			$pages['all_page_cnt']=1;
			$pages['row_limit'] = $pages['all_data_cnt'];
		}
		
		return $pages;
	}
	

	
	/**
	 * 検索条件ＵＲＬクエリを生成する。
	 * @param  array $kjs 検索条件情報
	 * @return string 検索条件ＵＲＬクエリ
	 */
	private function createKjsUrlQuery($kjs){
		
		$str = "";
		foreach($kjs as $field => $value){
			if(is_array($value)) continue;
			if($value !== "" && $value !==null){
				if($str != ""){
					$str .= '&';
				}
				$value = urlencode($value);// URLエンコード
				$str .= $field . "=" . $value;
			}
		}
		
		return $str;
	}
	
	//リクエストからデータを取得。サニタイズや空ならデフォルト値のセットも行う。
	private function _getDataFromRequest($req){
		App::uses('Sanitize', 'Utility');

		if(empty($req['page_no'])){
			$data['page_no']=0;
		}else{
			$data['page_no']=Sanitize::escape($req['page_no']);//SQLインジェクションのサニタイズ
		}

		if(empty($req['row_limit'])){
			$data['row_limit']=null;
		}else{
			$data['row_limit']=Sanitize::escape($req['row_limit']);//SQLインジェクションのサニタイズ
		}

		if(empty($req['sort_field'])){
			$data['sort_field']=null;
		}else{
			$data['sort_field']=Sanitize::escape($req['sort_field']);//SQLインジェクションのサニタイズ
		}

		if(empty($req['sort_desc'])){
			$data['sort_desc']=0;
		}else{
			$data['sort_desc']=Sanitize::escape($req['sort_desc']);//SQLインジェクションのサニタイズ
		}

		return $data;
	}



	//find用のlimitとorderを作成する。
	private function _createFindLimit($page_no,$row_limit){

		if(!isset($row_limit)){
			return null;
		}

		$lm1=$page_no * $row_limit;
		$findLimit=$lm1.','.$row_limit;
		return $findLimit;
	}

	
	
	
	/**
	 * ページ目次用のHTMLコードを生成する。
	 * 
	 * @param  array $pages		 ページネーション情報
	 * @param  int $all_data_cnt	データ件数（limitをかけていない、検索条件を含めたデータの件数）
	 * @param  string $path			基本的なURLを指定。例:「proj/list.php」。
	 * @param  array $params		ページ関連外のその他のパラメータをURLに付加する場合。例：「array('xxx'=>'1','flg',true)」
	 * @param  string $kjs_uq	   検索条件ＵＲＬクエリ文字列
	 * @param  array ページ目次用のHTMLコードデータ
	 * 
	 */
	private function _createIndexHtml2(&$pages,$all_data_cnt,$path,$params,$kjs_uq){

		$page_no=$pages['page_no'];
		$row_limit_cnt=$pages['row_limit'];
		
		$midasi_cnt=30;
		$params['row_limit']=$row_limit_cnt;
		$params['sort_field']=$pages['sort_field'];
		$params['sort_desc']=$pages['sort_desc'];
		
		//ページ目次用のHTMLコードを生成する。
		$res=$this->_createIndexHtml($page_no,$params,$all_data_cnt,$row_limit_cnt,$midasi_cnt,$path,$kjs_uq);

		return $res;
	}

	/**
	 * ページ目次用のHTMLコードを生成する。
	 * @param int $page_no	現在のページ番号（０から開始）
	 * @param array $params リンクのURLに付加するパラメータ（キー、値）
	 * @param int $data_cnt データ数
	 * @param int $row_limit_cnt 限界表示行数（最大表示行数）
	 * @param int $midasi_cnt 表示する見出し数
	 * @param string $kjs_uq 検索条件ＵＲＬクエリ文字列
	 * @return array ページ目次用のHTMLコードデータ
	 */
	private function _createIndexHtml($page_no,$params,$data_cnt,$row_limit_cnt,$midasi_cnt=8,$pageName="list.php",$kjs_uq){

		$res=[
				'mokuji'=>'',
				'def_url'=>'',
				'page_prev_link'=>'',
				'page_next_link'=>'',
				'page_top_link'=>'',
				'page_last_link'=>'',
				'query_str'=>'',
		];
		
		if($data_cnt==0) return $res;
		if(!isset($row_limit_cnt)) return $res;
		if(empty($pageName)) $pageName="list.php";
		
		//▼ページネーションを構成する総リンク数をカウントする。
		$allMdCnt=ceil($data_cnt/$row_limit_cnt);
		$md2=$allMdCnt;
		if($md2>$midasi_cnt){
			$md2=$midasi_cnt;
		}
		$linkCnt=4+$md2;

		//▼最終ページ番号を取得
		if($md2>0){
			$lastPageNo=$allMdCnt-1;
		}

		$strParams='';
		if(!empty($params)){
			//▼その他パラメータコードを作成する。
			foreach($params as $key=>$val){
				if($val!==null && $val!=='')
					$strParams=$strParams.'&'.$key.'='.$val;
			}
		}
		
		// デフォルトURLを作成
		$def_url = "{$pageName}?page_no=1{$strParams}&act_flg=2&{$kjs_uq}";

		//▼最戻リンクを作成
		$page_top_link = '';
		$rtnMax='&lt&lt';
		if($page_no>0){
			$url = "{$pageName}?page_no=0{$strParams}&act_flg=2&{$kjs_uq}";
			$page_top_link = $url;
			$rtnMax="<a href='{$url}'>{$rtnMax}</a>";
		}

		//▼単戻リンクを作成
		$rtn1='&lt';
		$page_prev_link = '';
		if($page_no>0){
			$p=$page_no-1;
			$url = "{$pageName}?page_no={$p}{$strParams}&act_flg=2&{$kjs_uq}";
			$page_prev_link = $url;
			$rtn1 = "<a href='{$url}'>{$rtn1}</a>";
		}

		//▼単進リンクを作成
		$page_next_link = '';
		$next1='&gt';
		if($page_no<$lastPageNo){
			$p=$page_no+1;
			$url = "{$pageName}?page_no={$p}{$strParams}&act_flg=2&{$kjs_uq}";
			$page_next_link = $url;
			$next1 = "<a href='{$url}'>{$next1}</a>";
		}

		//▼最進リンクを作成
		$page_last_link = '';
		$nextMax='&gt&gt';
		if($page_no<$lastPageNo){
			$p=$lastPageNo;
			$url = "{$pageName}?page_no={$p}{$strParams}&act_flg=2&{$kjs_uq}";
			$page_last_link = $url;
			$nextMax="<a href='$url'>{$nextMax}</a>";
		}

		//▼見出し配列を作成
		$fno=$lastPageNo-$md2+1;
		if($page_no<$fno){
			$fno=$page_no;
		}
		$lno=$fno+$md2-1;

		for($i=$fno;$i<=$lno;$i++){
			$pn=$i+1;
			if($i!=$page_no){
				$url = "{$pageName}?page_no={$i}{$strParams}&act_flg=2&{$kjs_uq}";
				$midasiList[]="<a href='$url'>{$pn}</a>";
			}else{
				$midasiList[]=$pn;
			}
		}

		//▼HTML組み立て

		$html="<div id='page_index'>";
		$html.="{$rtnMax}&nbsp;\n";
		$html.="{$rtn1}&nbsp;\n";
		foreach($midasiList as $key=>$val){
			$html.="{$val}&nbsp;\n";
		}
		$html.="{$next1}&nbsp;\n";
		$html.="{$nextMax}&nbsp;\n";
		$html.="</div>\n";
		
		// クエリ文字列
		$query_str = "page_no=0{$strParams}&{$kjs_uq}";
		
		$res['mokuji'] = $html;
		$res['def_url'] = $def_url;
		$res['page_prev_link'] = $page_prev_link;
		$res['page_next_link'] = $page_next_link;
		$res['page_top_link'] = $page_top_link;
		$res['page_last_link'] = $page_last_link;
		$res['query_str'] = $query_str;

		return $res;
	}

	/**
	 * ソートＵＲＬリンクHTMLのリストを生成する。
	 *
	 * @param  int $all_data_cnt	データ件数（limitをかけていない、検索条件を含めたデータの件数）
	 * @param  string $path			基本的なURLを指定。例:「proj/list.php」。
	 * @param  array $params		ページ関連外のその他のパラメータをURLに付加する場合。例：「array('xxx'=>'1','flg',true)」
	 * @param  array $fields		HTMLテーブルのキーはDBフィールド、値はフィールド和名にする。例：「array('title'=>'タイトル')」
	 * @param  string $kjs_uq	   検索条件ＵＲＬクエリ文字列
	 * @param  array ソートＵＲＬリンクHTMLのリスト
	 */
	private function _createSorts2(&$pages,$all_data_cnt,$path,$params,$fields,$kjs_uq){

		$sort_field=$pages['sort_field'];
		$sort_desc=$pages['sort_desc'];
		$page_no=$pages['page_no'];
		$row_limit=$pages['row_limit'];

		$sorts=$this->_createSorts($sort_field, $sort_desc, $fields, $page_no, $row_limit, $path, $params,$kjs_uq);

		return $sorts;
	}


	//ソートリンクリストを作成
	private function _createSorts($sort_field,$sort_desc,$fields,$page_no,$row_limit,$path,$params,$kjs_uq){


		//その他パラメータコードを作成する。
		$strParams='';
		if(!empty($params)){

			foreach($params as $key=>$val){
				if($val!==null && $val!=='')
					$strParams=$strParams.'&'.$key.'='.$val;
			}
		}

		//フィールドリストの件数分、以下の処理を繰り返す。
		$data=null;
		foreach($fields as $f=>$fName){
			//リンクを組み立てる。
			$url = "{$path}?page_no={$page_no}&sort_field={$f}&sort_desc=0{$strParams}&act_flg=3&{$kjs_uq}";
			$link = "<a href='$url'>{$fName}</a>";

			//リンクをフィールド名をキーにしてソートリンクリストにセット
			$data[$f]=$link;
		}

		//現在ソートフィールドがnullでない場合、以下の処理を行う。
		if(!empty($sort_field)){
			
			$fName = '順番';
			if(!empty($fields[$sort_field])) $fName= $fields[$sort_field];//フィールド和名
			 

			//現在ソート方法と逆順を取得。フィールド和名に並び順を示すアイコン文字を入れる。
			$revSortType=1;
			if($sort_desc==1){
				$revSortType=0;
				$fName='▼'.$fName;
			}else{
				$fName='▲'.$fName;
			}

			//リンクを組み立てる。
			$url = "{$path}?page_no={$page_no}&limit={$row_limit}&sort_field={$sort_field}&sort_desc={$revSortType}{$strParams}&act_flg=3&{$kjs_uq}";
			$link = "<a href='$url'>{$fName}</a>";

			//ソートリンクリストに現在ソートフィールドをキーにしてリンクをセットする。
			$data[$sort_field]=$link;
		}

		return $data;
	}

}
?>