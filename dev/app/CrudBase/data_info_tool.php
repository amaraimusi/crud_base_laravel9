<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta name="google" content="notranslate" />
   	<meta http-equiv="X-UA-Compatible" content="IE=edge">
   	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>DBテーブル情報閲覧ツール | ワクガンス</title>
	<link rel='shortcut icon' href='/home/images/favicon.ico' />
	
	<link href="/note_prg/css/bootstrap.min.css" rel="stylesheet">
	<link href="/note_prg/css/common2.css" rel="stylesheet">

	<script src="/note_prg/js/jquery3.js"></script>	<!-- jquery-3.3.1.min.js -->
	<script src="/note_prg/js/bootstrap.min.js"></script>
	<script src="/note_prg/js/livipage.js"></script>
	<script src="/note_prg/js/ImgCompactK.js"></script>

</head>
<body>
<div id="header" ><h1>DBテーブル情報閲覧ツール | ワクガンス</h1></div>



<?php 
require_once 'CrudBase/PdoDao.php';
$pdoDao = new PdoDao();
$dao = $pdoDao->getDao();

$param = $_GET;
if(empty($param['tbl_name'])) $param['tbl_name'] = 'wp_posts';
if(empty($param['limit'])) $param['limit'] = 4;
if(empty($param['where'])) $param['where'] = null;

?>



<div style="float:left;width:20%;overflow:scroll">
<?php 
$tbls = getTbls($dao, $param);
foreach ($tbls as $tbl_name){
	echo "<a href='?tbl_name={$tbl_name}'>{$tbl_name}</a><br>";
}
?>
</div>
<div style="float:left;width:80%;">

<?php

try {
	

	$data = getData($dao, $param);
	
	$data = filterData($data);
	
	createTable($data);
	

	
} catch (PDOException $e) {
	exit('データベース接続失敗。'.$e->getMessage());
}
?>




<?php 


function filterData($data){
	$data2 = [];
	foreach($data as $ent){
		unset($ent[0]);
		unset($ent[1]);
		unset($ent[2]);
		unset($ent[3]);
		unset($ent[4]);
		unset($ent[5]);
		unset($ent[6]);
		unset($ent[7]);
		unset($ent[8]);
		unset($ent['Collation']);
		unset($ent['Default']);
		unset($ent['Extra']);
		unset($ent['Privileges']);

		$data2[] = $ent;
	}
	return $data2;
}


function createTable($data){

	$keys = array_keys($data[0]);
	$head_html = "<th>" . implode("</th><th>",$keys) . "</th>";
	
	$body_html = '';
	foreach($data as $ent){
		$body_html .= "<tr><td>" . implode('</td><td>',$ent) . "</td></tr>'";
	}
	
	$html = "
		<table border='1'>
			<thead><tr>{$head_html}</tr></thead>
			<tbody>{$body_html}</tbody>
		</table>
	";
	
	echo $html;
}



function getData(&$dao, $param){
	$tbl_name = $param['tbl_name'];
	$limit = $param['limit'];
	
	// フィールドデータを取得する
	$data = getFieldInfoData($dao, $param);
	
	// データを取得する
	$data2 = getData2($dao, $param);
	
	// マージ
	$data = mergeData($data, $data2);

	return $data;
}

// マージ
function mergeData($data, $data2){
	
	if(empty($data2)) return $data;
	
	$row_count = count($data2);
	
	// 	データをループ（エンティティ）
	foreach($data as &$ent){
		// 	エンティティからフィールドを取得する
		$field = $ent['Field'];
		
		// 	行数ループ
		for($row_no=0; $row_no<$row_count; $row_no++){
 			// 	行とフィールドを指定してデータ2から値2を取得する
 			$value2 = $data2[$row_no][$field];
 			$row_field = 'row' . $row_no;
 			$ent[$row_field] = $value2;// 	エンティティに行キーを指定して値2を取得する
		}

	}
	unset($ent);
	
	return $data;
}



function getData2($dao, $param){
	
	$tbl_name = $param['tbl_name'];
	$limit = $param['limit'];
	$id_field = $param['limit'];
	$where = $param['where'];
	
	
	$sql="SELECT * FROM {$tbl_name} LIMIT {$limit}";
	if(!empty($where)){
		$sql = "
		SELECT * FROM {$tbl_name}
			WHERE {$where} 
			LIMIT {$limit}
		";
	}
	
	$stmt = $dao->query($sql);
	$data = [];
	foreach ($stmt as $row) {
		$data[] = $row;
	}
	return $data;
}


function getFieldInfoData(&$dao, $param){
	
	$tbl_name = $param['tbl_name'];
	$limit = $param['limit'];
	
	$sql="SHOW FULL COLUMNS FROM {$tbl_name}";
	$stmt = $dao->query($sql);
	$data = [];
	foreach ($stmt as $row) {
		$data[] = $row;
	}
	return $data;
}

function debug($val){
	echo '<pre>';
	var_dump($val);
	echo '</pre>';
}


function getTbls($dao, $param){
	$sql="SHOW TABLES";
	$stmt = $dao->query($sql);
	$tbls = [];
	foreach ($stmt as $row) {
		$tbls[] = $row[0];
	}
	return $tbls;
}
?>
<div class="yohaku"></div>
<ol class="breadcrumb">
	<li><a href="index.html">開発ツールホーム</a></li>
	<li>DBテーブル情報閲覧ツール</li>
</ol>

<div id="footer">(C) kenji uehara 2019-10-26</div>
</body>
</html>