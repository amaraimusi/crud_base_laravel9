
<?php 
	$auth_level = 0; // 権限レベル
	$authority_wamei = ''; // 権限名
	$user_name = '';
	if(!empty($crudBaseData['userInfo']['authority'])){
		$userInfo = $crudBaseData['userInfo'];
		$user_name = $userInfo['user_name'];
		$nickname = $userInfo['nickname'];
		if(empty($nickname)) $nickname = $user_name;
		$auth_level = $userInfo['authority']['level'];
		$authority_wamei = $userInfo['authority']['wamei'];
	}
?>


<nav class="navbar navbar-expand-lg navbar-light bg-success">
	<a class="navbar-brand text-light" href="<?php echo CRUD_BASE_PROJECT_PATH;?>">CrudBase</a>

	<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
	<span class="navbar-toggler-icon"></span>
	</button>

	<div class="collapse navbar-collapse" id="navbarSupportedContent">
		<ul class="navbar-nav mr-auto">


		@auth
			@if ($auth_level >= 30)
				<li>
					<a class="nav-link text-light" href="neko">見本管理画面</a>
				</li>
			@endif
		@endguest
	
		</ul>
		
		<ul class="navbar-nav">
			<li class="nav-item dropdown">
				@auth
					<a class="nav-link dropdown-toggle text-light" href="#" id="username_navbarDropdownMenuLink" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						{{$nickname}}
					</a>
					<div class="dropdown-menu dropdown-menu-right" aria-labelledby="username_navbarDropdownMenuLink">
						<span class="dropdown-item">{{$authority_wamei}}</span>
						<span class="dropdown-item">{{$user_name}}</span>
						<a class=" btn btn-info btn-sm dropdown-item" href="<?php echo CRUD_BASE_PROJECT_PATH;?>/ajax_login_with_cake/logout" >ログアウト</a>
					</div>
				@else
					<a href="{{ route('login') }}" class="nav-link text-light">ログイン</a>
				@endguest
			</li>
		</ul>
		
	</div>
</nav>
<div style="height:4px"></div>

	