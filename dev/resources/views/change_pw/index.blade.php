<?php 
extract($crudBaseData, EXTR_REFS);

$ver_str = '?v=1.0.0' . $version; // キャッシュ回避のためのバージョン文字列

// ユーザー/ログイン/ログアウト関連
$auth_level = 0; // 権限レベル
$authority_wamei = ''; // 権限名
$user_name = '';
$userInfo = $crudBaseData['userInfo'];
$user_name = $userInfo['user_name'];
$nickname = $userInfo['nickname'];
if(empty($nickname)) $nickname = $user_name;
$auth_level = $userInfo['authority']['level'];
$authority_wamei = $userInfo['authority']['wamei'];
$role = $userInfo['role'];
?>
<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex, nofollow">
	<title>呼出メッセージ管理画面</title>
	
	<script src="{{ asset('/js/app.js') }}" defer></script>
	<script src="{{ $crud_base_js . $ver_str }}" defer></script>
	<script src="{{ asset('/js/ChangePw/ChangePw.js')  . $ver_str }}" defer></script>
	<script src="{{ asset('/js/ChangePw/index.js')  . $ver_str }}" defer></script>
	<link href="{{ asset('/css/app.css') }}" rel="stylesheet">
	<link href="{{ asset('/js/font/css/open-iconic.min.css') }}" rel="stylesheet">
	<link href="{{ $crud_base_css . $ver_str }}" rel="stylesheet">
	<link href="{{ asset('/css/common.css')  . $ver_str}}" rel="stylesheet">
	<link href="{{ asset('/css/ChangePw/index.css')  . $ver_str}}" rel="stylesheet">
	
</head>
<body>

<div class="container-fluid">


<div id="app"></div><!-- vue.js -->
<input id="crud_base_json" type="hidden" value='<?php echo $crud_base_json?>' />
<input type="hidden" id="csrf_token" value="{{ csrf_token() }}" >
<div id="err" class="text-danger"></div>

	

<div id="vue_app">
	<div class="block_main">
	
		<div class="row">
			<div class="col-5">現在のパスワード</div>
			<div class="col-7">
				<input type="password" id="old_pw" v-model="formData.old_pw"  class="valid form-control" value="" pattern="^[0-9A-Za-z]{8,24}" required  maxlength="24"   style="width:100%" title="8～24文字の半角英数字で入力してください。" />
			</div>
		</div>
		<div class="row">
			<div class="col-5">新しいパスワード</div>
			<div class="col-7">
				<input type="password" id="new_pw1" v-model="formData.new_pw1"  class="valid form-control" value="" pattern="^[0-9A-Za-z]{8,24}" required maxlength="24"  style="width:100%" title="8～24文字の半角英数字で入力してください。" />
			</div>
		</div>
		<div class="row" style="margin-top:2px;">
			<div class="col-5">再入力</div>
			<div class="col-7">
				<input type="password" id="new_pw2" v-model="formData.new_pw2"  class="valid form-control" value="" pattern="^[0-9A-Za-z]{8,24}" required maxlength="24"  style="width:100%" title="8～24文字の半角英数字で入力してください。" />
			</div>
		</div>
		

		<div class="row"  style="margin-top:50px;">
			<div class="col-12" style="text-align:center;">
				<span class="text-danger" v-text="err_msg"></span>
			</div>
		</div>
	
		<div class="row" style="margin-top:50px;">
			<div class="col-6" style="text-align:center">
				<a href="{{url('/')}}" class="btn btn-secondary btn-lg"style="width:8em">キャンセル</a>
			</div>
			<div class="col-6" style="text-align:center;">
				<button type="button"  onclick="reg();" class="btn btn-primary btn-lg" style="width:8em">更新</button>
			</div>
		</div>
		
	</div>
</div><!-- vue.js -->




<!-- 完了ポップアップ -->
<div id="change_pw_popup" style="display:none">
	<h4>パスワード変更完了</h4>
	<div class="row" style="margin-top:1.2em;">
		<div class="col-12">パスワードを変更しました。</div>
	</div>

</div>
	







@include('layouts.common_footer')


</div></body>
</html>