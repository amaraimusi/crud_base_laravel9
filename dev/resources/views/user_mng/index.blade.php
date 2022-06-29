<?php 


extract($crudBaseData, EXTR_REFS);
extract($masters, EXTR_REFS);

require_once $crud_base_path . 'CrudBaseHelper.php';
$cbh = new CrudBaseHelper($crudBaseData);
$ver_str = '?v=' . $version; // キャッシュ回避のためのバージョン文字列

$role = $userInfo['role']; // 権限

?>
<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex, nofollow">
	<title>ユーザー管理管理画面</title>
	
	<script src="{{ asset('/js/app.js') }}" defer></script>
	<script src="{{ $crud_base_js . $ver_str }}" defer></script>
	<script src="{{ asset('/js/UserMng/index.js')  . $ver_str }}" defer></script>
	<link href="{{ asset('/css/app.css') }}" rel="stylesheet">
	<link href="{{ asset('/js/font/css/open-iconic.min.css') }}" rel="stylesheet">
	<link href="{{ $crud_base_css . $ver_str }}" rel="stylesheet">
	<link href="{{ asset('/css/common.css')  . $ver_str}}" rel="stylesheet">
	
</head>
<body>

@include('layouts.common_header')

<div id="app"></div><!-- vue.js -->

<div class="container-fluid">

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="{{ url('/') }}">ホーム</a></li>
    <li class="breadcrumb-item active" aria-current="page">ユーザー管理画面</li>
  </ol>
</nav>

<div class="cb_func_line">


	<div id="ajax_login_with_cake"></div><!-- ログイン or ログアウト 　AjaxLoginWithCake.js　-->
	<div class="cb_kj_main">
	<!-- 検索条件入力フォーム -->
	<div action="" class="form_kjs" id="user_mngIndexForm" method="post" accept-charset="utf-8">
		
		<?php $cbh->inputKjMain('kj_main','',null,'ID, ユーザー名, ニックネームで検索する');?>
		<input type='button' value='検索' onclick='searchKjs()' class='search_kjs_btn btn btn-success btn-sm' />
		<div class="btn-group">
			<button type="button" class="btn btn-secondary btn-sm" title="詳細検索項目を表示する" onclick="jQuery('.cb_kj_detail').toggle(300)">詳細検索</button>
			<a href="" class="ini_rtn btn btn-primary btn-sm" title="この画面を最初に表示したときの状態に戻します。（検索状態、列並べの状態を解除）">リセット</a>
		</div>
		<div class="cb_kj_detail" style="display:none">
			<table style="width:100%"><tbody><tr>
				<td>詳細検索</td>
				<td style="text-align:right"><button type="button" class="btn btn-secondary btn-sm"  onclick="jQuery('.cb_kj_detail').toggle(300);">閉じる</button></td>
			</tr></tbody></table>
		<?php 
		
		// --- CBBXS-2004
		$cbh->inputKjId();
		$cbh->inputKjText('kj_email','Eメール');
		$cbh->inputKjText('kj_name','ユーザー名');
		$cbh->inputKjText('kj_nickname','ニックネーム');
		$cbh->inputKjSelect('kj_role','権限', $masters['roleList']); 
		$cbh->inputKjHidden('kj_sort_no');
		$cbh->inputKjDeleteFlg();
		$cbh->inputKjText('kj_update_user','更新ユーザー');
		$cbh->inputKjText('kj_ip_addr','更新IPアドレス');
		$cbh->inputKjCreated();
		$cbh->inputKjModified();

		// --- CBBXE
		
		$cbh->inputKjLimit();
		echo "<input type='button' value='検索' onclick='searchKjs()' class='search_kjs_btn btn btn-success' />";
		
		
		?>
				<div class="kj_div" style="margin-top:5px">
					<input type="button" value="検索入力リセット" title="検索入力を初期に戻します" onclick="resetKjs()" class="btn btn-primary btn-sm" />
				</div>
				
				<input id="crud_base_json" type="hidden" value='<?php echo $crud_base_json?>' />
		</div>
	</div>
	</div><!-- cb_kj_main -->
	<div id="cb_func_btns" class="btn-group" >
		<button type="button" onclick="jQuery('#detail_div').toggle(300);" class="btn btn-secondary btn-sm">ツール</button>
	</div>
</div><!-- cb_func_line -->


<div style="clear:both"></div>

<!-- 一括追加機能  -->
<div id="crud_base_bulk_add" style="display:none"></div>

<?php $cbh->divNewPageVarsion(); // 新バージョン通知区分を表示?>
<div id="err" class="text-danger"><?php echo $errMsg;?></div>

<div style="clear:both"></div>

<div id="detail_div" style="background-color:#ebedef;padding:4px;display:none">
	
	<div id="main_tools" style="margin-bottom:10px;margin-top:4px">
		<div style="display:inline-block;width:75%; ">
			<?php 
				// 列表示切替機能
				$cbh->divCsh();
				
				// CSVエクスポート機能
	 			$csv_dl_url =  'user_mng/csv_download';
	 			$cbh->makeCsvBtns($csv_dl_url);
			?>
			
		<!-- CrudBase設定 -->
		<div id="crud_base_config" style="display:inline-block"></div>
		
	</div>
		<div style="display:inline-block;text-align:right;width:24%;">
			<button type="button" class="btn btn-secondary btn-sm" onclick="jQuery('#detail_div').toggle(300);">閉じる</button>
		</div>
	</div><!-- main_tools -->
	
		
</div><!-- detail_div -->

<input type="hidden" id="csrf_token" value="{{ csrf_token() }}" >
<div id="test_ajax_res"></div>


<div id="new_inp_form_point"></div><!-- 新規入力フォーム表示地点 -->

<?php $cbh->divPagenation(); // ページネーション ?>

<div id="calendar_view_k"></div>


<div id="crud_base_auto_save_msg" style="height:20px;" class="text-success"></div>

<?php if(!empty($data)){ ?>
	<button type="button" class="btn btn-warning btn-sm" onclick="newInpShow(this, 'add_to_top');"><span>新規追加</span></button>
<?php } ?>


<!-- 一覧テーブル -->
<table id="user_mng_tbl" class="table table-striped table-bordered table-condensed" style="display:none;margin-bottom:0px">

<thead>
<tr>
	<?php
	foreach($fieldData as $ent){
		$row_order=$ent['row_order'];
		echo "<th class='{$ent['id']}'>{$pages['sorts'][$row_order]}</th>";
	}
	?>
	<th style="min-width:207px"></th>
</tr>
</thead>
<tbody>
<?php

// td要素出力を列並モードに対応させる
$cbh->startClmSortMode();

foreach($data as $i=>&$ent){

	echo "<tr id='ent{$ent['id']}' >";
	// CBBXS-2005
	$cbh->tdId($ent,'id', ['checkbox_name'=>'pwms']);
	$cbh->tdStr($ent, 'name');
	$cbh->tdStr($ent, 'email');
	$cbh->tdPlain($ent, 'email_verified_at');
	$cbh->tdStr($ent, 'nickname');
	$cbh->tdStr($ent, 'password');
	$cbh->tdStr($ent, 'remember_token');
	$cbh->tdList($ent, 'role', $roleList);
	$cbh->tdStr($ent, 'temp_hash');
	$cbh->tdPlain($ent, 'temp_datetime');
	$cbh->tdPlain($ent, 'sort_no');
	$cbh->tdDeleteFlg($ent, 'delete_flg');
	$cbh->tdStr($ent, 'update_user');
	$cbh->tdStr($ent, 'ip_addr');
	$cbh->tdPlain($ent, 'created');
	$cbh->tdPlain($ent, 'modified');

	// CBBXE
	
	$cbh->tdsEchoForClmSort();// 列並に合わせてTD要素群を出力する
	
	// 行のボタン類
	echo "<td><div style='display:inline-block'>";
	$id = $ent['id'];
	echo  "<input type='button' value='↑↓' onclick='rowExchangeShowForm(this)' class='row_exc_btn btn btn-info btn-sm' />";
	$cbh->rowEditBtn($id);
	$cbh->rowCopyBtn($id);
	echo "</div>&nbsp;";
	echo "<div style='display:inline-block'>";
	$cbh->rowDeleteBtn($ent); // 削除ボタン
	$cbh->rowEnabledBtn($ent); // 有効ボタン
	echo "&nbsp;";
	$cbh->rowEliminateBtn($ent);// 抹消ボタン
	echo "</div>";
	echo "</td>";
	echo "</tr>";
}

?>
</tbody>
</table>

<?php $cbh->divPagenationB(); ?>
<br>
	
<button type="button" class="btn btn-warning btn-sm" onclick="newInpShow(this, 'add_to_top');"><span>新規追加</span></button>	

<?php $cbh->divPwms(); // 複数有効/削除の区分を表示する ?>


<table id="crud_base_forms">

	<!-- 新規入力フォーム -->
	<tr id="ajax_crud_new_inp_form" class="crud_base_form" style="display:none;padding-bottom:60px"><td colspan='5'>
	
		<div>
			<div style="color:#3174af;float:left">新規入力</div>
			<div style="float:left;margin-left:10px">
				<button type="button"  onclick="newInpReg();" class="btn btn-success btn-sm reg_btn">登録</button>
			</div>
			<div style="float:right">
					<button type="button" class="close" aria-label="閉じる" onclick="closeForm('new_inp')" >
						<span aria-hidden="true">&times;</span>
					</button>
			</div>
		</div>
		<div style="clear:both;height:4px"></div>
		<div class="err text-danger"></div>
		
		<div style="display:none">
			<input type="hidden" name="form_type">
			<input type="hidden" name="row_index">
			<input type="hidden" name="sort_no">
		</div>
	
	
		<!-- CBBXS-1006 -->
		
		<div class="cbf_inp_wrap">
			<div class='cbf_inp' >ユーザー名: </div>
			<div class='cbf_input'>
				<input type="text" name="name" class="valid " value="" maxlength="50" title="50文字以内で入力してください" />
				<label class="text-danger" for="name"></label>
			</div>
			<aside>※省略時にはEメールがユーザー名になります。</aside>
		</div>
	
		<div class="cbf_inp_wrap">
			<div class='cbf_inp' >ニックネーム: </div>
			<div class='cbf_input'>
				<input type="text" name="nickname" class="valid " value="" maxlength="50" title="50文字以内で入力してください" placeholder="※省略可" />
				<label class="text-danger" for="nickname"></label>
				<aside>※省略時にはユーザー名がニックネームになります。</aside>
			</div>
		</div>

		<div class="cbf_inp_wrap">
			<div class='cbf_inp' >パスワード: </div>
			<div class='cbf_input'>
				<input type="text" name="password" class="valid " value="" required maxlength="50" pattern="^[0-9A-Za-z]{8,24}$" title="パスワードは8～24文字の半角英数字で入力してください。" />
				<label class="text-danger" for="password"></label>
			</div>
		</div>

		<div class="cbf_inp_wrap">
			<div class='cbf_inp_label' >権限: </div>
			<div class='cbf_input'>
				<?php $cbh->selectX('role',null,$roleList,null);?>
				<label class="text-danger" for="role"></label>
			</div>
		</div>

		<div class="cbf_inp_wrap">
			<div class='cbf_inp' >メールアドレス: </div>
			<div class='cbf_input'>
				<input type="email" name="email"  value="" maxlength="256" title="メールアドレス（例：yamada_taro@example.com)" placeholder="※省略可" style="width:400px" />
				<label class="text-danger" for="email"></label>
			</div>
		</div>


		<!-- CBBXE -->
		
		<div style="clear:both"></div>
		<div class="cbf_inp_wrap">
			<button type="button" onclick="newInpReg();" class="btn btn-success reg_btn">登録</button>
		</div>
	</td></tr><!-- new_inp_form -->



	<!-- 編集フォーム -->
	<tr id="ajax_crud_edit_form" class="crud_base_form" style="display:none"><td colspan='5'>
		<div  style='width:100%;'>
	
			<div>
				<div style="color:#3174af;float:left">編集</div>
				<div style="float:left;margin-left:10px">
					<button type="button"  onclick="editReg();" class="btn btn-success btn-sm reg_btn">登録</button>
				</div>
				<div style="float:right">
					<button type="button" class="close" aria-label="閉じる" onclick="closeForm('edit')" >
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
			</div>
			<div style="clear:both;height:4px"></div>
			<div class="err text-danger"></div>
			
			<!-- CBBXS-1007 -->
			<div class="cbf_inp_wrap">
				<div class='cbf_inp' >ID: </div>
				<div class='cbf_input'>
					<span class="id"></span>
				</div>
			</div>

		
    		<div class="cbf_inp_wrap">
    			<div class='cbf_inp' >ユーザー名: </div>
    			<div class='cbf_input'>
				<input type="text" name="name" class="valid " value="" required pattern="^[0-9A-Za-z!-_@]{1,50}$" maxlength="50" title="50文字以内の半角英数字入力してください" />
    				<label class="text-danger" for="name"></label>
    			</div>
    		</div>

		
    		<div class="cbf_inp_wrap">
    			<div class='cbf_inp' >ニックネーム: </div>
    			<div class='cbf_input'>
    				<input type="text" name="nickname" class="valid " value="" maxlength="50" title="50文字以内で入力してください" placeholder="※省略可" />
    				<label class="text-danger" for="nickname"></label>
    				<aside>※省略時にはユーザー名がニックネームになります。</aside>
    			</div>
    		</div>
    
    
    		<div class="cbf_inp_wrap">
    			<div class='cbf_inp' >パスワード: </div>
    			<div class='cbf_input'>
    				<input type="text" name="password" class="valid " value="" maxlength="24" pattern="^[0-9A-Za-z]{8,24}" title="パスワードは8～24文字の半角英数字で入力してください。" />
    				<label class="text-danger" for="password"></label>
    			</div>
    		</div>
    
    
    		<div class="cbf_inp_wrap">
    			<div class='cbf_inp_label' >権限: </div>
    			<div class='cbf_input'>
    				<?php $cbh->selectX('role',null,$roleList,null);?>
    				<label class="text-danger" for="role"></label>
    			</div>
    		</div>
		
    		<div class="cbf_inp_wrap">
    			<div class='cbf_inp' >メールアドレス: </div>
    			<div class='cbf_input'>
    				<input type="email" name="email"  value="" maxlength="256" title="メールアドレス（例：yamada_taro@example.com)" placeholder="※省略可" style="width:400px" />
    				<label class="text-danger" for="email"></label>
    			</div>
    		</div>

			<div class="cbf_inp_wrap">
				<div class='cbf_inp_label' >削除フラグ：</div>
				<div class='cbf_input'>
					<input type="checkbox" name="delete_flg" class="valid"  />
				</div>
			</div>

			<!-- CBBXE -->
			
			<div style="clear:both"></div>
			<div class="cbf_inp_wrap">
				<button type="button"  onclick="editReg();" class="btn btn-success reg_btn">登録</button>
			</div>
			
			<div class="cbf_inp_wrap" style="padding:5px;">
				<input type="button" value="更新情報" class="btn btn-secondary btn-sm" onclick="$('#ajax_crud_edit_form_update').toggle(300)" /><br>
				<aside id="ajax_crud_edit_form_update" style="display:none">
					更新日時: <span class="modified"></span><br>
					生成日時: <span class="created"></span><br>
					ユーザー名: <span class="update_user"></span><br>
					IPアドレス: <span class="ip_addr"></span><br>
				</aside>
			</div>
		</div>
	</td></tr>
</table>







<!-- 削除フォーム -->
<div id="ajax_crud_delete_form" class="panel panel-danger" style="display:none">

	<div class="panel-heading">
		<div class="pnl_head1">削除</div>
		<div class="pnl_head2"></div>
		<div class="pnl_head3">
			<button type="button" class="btn btn-default btn-sm" onclick="closeForm('delete')"><span class="glyphicon glyphicon-remove"></span></button>
		</div>
	</div>
	
	<div class="panel-body" style="min-width:300px">
	<table><tbody>

		<!-- Start ajax_form_new -->
		<tr><td>ID: </td><td>
			<span class="id"></span>
		</td></tr>
		

		<tr><td>ユーザー管理名: </td><td>
			<span class="user_mng_name"></span>
		</td></tr>
		
		<tr><td>画像ファイル: </td><td>
			<label for="img_fn"></label><br>
			<img src="" class="img_fn" width="80" height="80" ></img>
		</td></tr>


		<!-- Start ajax_form_end -->
	</tbody></table>
	<br>
	

	<button type="button"  onclick="deleteReg();" class="btn btn-danger">
		<span class="glyphicon glyphicon-remove"></span>　削除する
	</button>
	<hr>
	
	<input type="button" value="更新情報" class="btn btn-default btn-xs" onclick="$('#ajax_crud_delete_form_update').toggle(300)" /><br>
	<aside id="ajax_crud_delete_form_update" style="display:none">
		更新日時: <span class="modified"></span><br>
		生成日時: <span class="created"></span><br>
		ユーザー名: <span class="update_user"></span><br>
		IPアドレス: <span class="ip_addr"></span><br>
		ユーザーエージェント: <span class="user_agent"></span><br>
	</aside>
	

	</div><!-- panel-body -->
</div>



<!-- 抹消フォーム -->
<div id="ajax_crud_eliminate_form" class="crud_base_form" style="display:none">

	<div class="panel-heading">
		<div class="pnl_head1">抹消</div>
		<div class="pnl_head2"></div>
		<div class="pnl_head3">
			<button type="button" class="btn btn-default btn-sm" onclick="closeForm('eliminate')"><span class="glyphicon glyphicon-remove"></span></button>
		</div>
	</div>
	
	<div class="panel-body" style="min-width:300px">
	<table><tbody>

		<!-- Start ajax_form_new -->
		<tr><td>ID: </td><td>
			<span class="id"></span>
		</td></tr>
		

		<tr><td>ユーザー管理名: </td><td>
			<span class="user_mng_name"></span>
		</td></tr>


		<!-- Start ajax_form_end -->
	</tbody></table>
	<br>
	

	<button type="button"  onclick="eliminateReg();" class="btn btn-danger">
		<span class="glyphicon glyphicon-remove"></span>　抹消する
	</button>
	<hr>
	
	<input type="button" value="更新情報" class="btn btn-default btn-xs" onclick="$('#ajax_crud_eliminate_form_update').toggle(300)" /><br>
	<aside id="ajax_crud_eliminate_form_update" style="display:none">
		更新日時: <span class="modified"></span><br>
		生成日時: <span class="created"></span><br>
		ユーザー名: <span class="update_user"></span><br>
		IPアドレス: <span class="ip_addr"></span><br>
		ユーザーエージェント: <span class="user_agent"></span><br>
	</aside>
	

	</div><!-- panel-body -->
</div><br>


@include('layouts.common_footer')


</div></body>
</html>