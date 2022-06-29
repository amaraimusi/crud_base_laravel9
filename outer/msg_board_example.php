<?php 

require_once '../plain/app/index.php';
?>

<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta name="google" content="notranslate" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>メッセージボードの見本 | ワクガンス</title>
	<link rel='shortcut icon' href='/home/images/favicon.ico' />
	
	<link href="/note_prg/css/bootstrap-4.3.1-dist/bootstrap.min.css" rel="stylesheet">
	<link href="/note_prg/css/bootstrap-4.3.1-dist/font/css/open-iconic.min.css" rel="stylesheet">
	<link href="/note_prg/css/common2.css" rel="stylesheet">
	<?php echo crudBaseCss('MsgBoard') ?>
	<script src="/note_prg/js/jquery3.js"></script>	<!-- jquery-3.3.1.min.js -->
	<script src="/note_prg/js/bootstrap-4.3.1-dist/bootstrap.bundle.min.js"></script>
	<script src="/note_prg/js/vue.min.js"></script>
	<script src="/note_prg/js/livipage.js"></script>
	<script src="/note_prg/js/ImgCompactK.js"></script>
	<?php echo crudBaseJs('MsgBoard') ?>
	

</head>
<body>
<div id="header" ><h1>メッセージボードの見本 | ワクガンス</h1></div>
<div class="container">


<h2>デモ</h2>
<?php echo cbShortcode('MsgBoard'); ?>

<div class="yohaku"></div>
<ol class="breadcrumb">
	<li><a href="/">ホーム/</a></li>
	<li><a href="/crud_base_laravel8/dev/public">ダッシュボード/</a></li>
	<li>メッセージボードの見本</li>
</ol>
</div><!-- content -->
<div id="footer">(C) kenji uehara 2021-12-1</div>
</body>
</html>