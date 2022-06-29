<?php 

//phpinfo();
extract($crudBaseData, EXTR_REFS);
extract($masters, EXTR_REFS);

require_once $crud_base_path . 'CrudBaseHelper.php';
$cbh = new CrudBaseHelper($crudBaseData);
$ver_str = '?v=' . $this_page_version; // キャッシュ回避のためのバージョン文字列


?>
<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>ネコ管理画面</title>
	
	<script src="{{ asset('/js/app.js') }}" defer></script>
	<script src="{{ $crud_base_js . $ver_str }}" defer></script>
	<script src="{{ asset('/js/Neko/index.js')  . $ver_str }}" defer></script>
	<link href="{{ asset('/css/app.css') }}" rel="stylesheet">
	<link href="{{ asset('/js/font/css/open-iconic.min.css') }}" rel="stylesheet">
	<link href="{{ $crud_base_css . $ver_str }}" rel="stylesheet">
	<link href="{{ asset('/css/common.css')  . $ver_str}}" rel="stylesheet">
	<link href="{{ asset('/css/Neko/index.css') . $ver_str }}" rel="stylesheet">
	
</head>
<body>

@include('layouts.common_header')

<div class="container-fluid">

<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
	<li class="breadcrumb-item"><a href="{{ url('/') }}">ホーム</a></li>
	<li class="breadcrumb-item active" aria-current="page">ネコ管理画面</li>
  </ol>
</nav>

<div class="cb_func_line">


	<div id="ajax_login_with_cake"></div><!-- ログイン or ログアウト 　AjaxLoginWithCake.js　-->
	<div class="cb_kj_main">
	<!-- 検索条件入力フォーム -->
	<div class="form_kjs" id="nekoIndexForm" method="post" accept-charset="utf-8">
		
		<?php $cbh->inputKjMain('kj_main','',null,'ネコ名、備考を検索する');?>
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
		$cbh->inputKjText('kj_neko_name','ネコ名前');
		$cbh->inputKjMoDateRng('kj_neko_date','ネコ日付');
		$cbh->inputKjNumRange('neko_val','ネコ数値'); 
		$cbh->inputKjSelect('kj_neko_group','ネコ種別', $masters['nekoGroupList']); 
		$cbh->inputKjText('kj_neko_dt','ネコ日時',150);
		$cbh->inputKjFlg('kj_neko_flg','ネコフラグ');
		$cbh->inputKjText('kj_img_fn','画像ファイル名',200);
		$cbh->inputKjText('kj_note','備考',200,'部分一致検索');
		$cbh->inputKjId(); 
		$cbh->inputKjHidden('kj_sort_no');
		$cbh->inputKjDeleteFlg();
		$cbh->inputKjText('kj_update_user','更新者',150);
		$cbh->inputKjText('kj_ip_addr','更新IPアドレス',200);
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
		<div id="app"></div><!-- vue.js -->
	</div><!-- form_kjs -->
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
	 			$csv_dl_url =  'neko/csv_download';
	 			$cbh->makeCsvBtns($csv_dl_url);
			?>
			
			<button id="crud_base_bulk_add_btn" type="button" class="btn btn-secondary btn-sm" onclick="crudBase.crudBaseBulkAdd.showForm()" >一括追加</button>
			
			<!-- CrudBase設定 -->
			<div id="crud_base_config" style="display:inline-block"></div>
			
			<button id="calendar_view_k_btn" type="button" class="btn btn-secondary btn-sm" onclick="calendarViewKShow()" >カレンダーモード</button>
			
			<button type="button" class="btn btn-secondary btn-sm" onclick="sessionClear()" >セッションクリア</button>
		
			<button id="table_transform_tbl_mode" type="button" class="btn btn-secondary btn-sm" onclick="tableTransform(0)" style="display:none">一覧の変形・テーブルモード</button>	
			<button id="table_transform_div_mode" type="button" class="btn btn-secondary btn-sm" onclick="tableTransform(1)" >一覧の変形・スマホモード</button>
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
	<button type="button" class="btn btn-warning btn-sm" onclick="newInpShow(this, 'add_to_top');">新規追加</button>
<?php } ?>


<!-- 一覧テーブル -->
<table id="neko_tbl" class="table table-striped table-bordered table-condensed" style="display:none;margin-bottom:0px">

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
	$cbh->tdMoney($ent, 'neko_val');
	$cbh->tdStr($ent, 'neko_name');
	$cbh->tdList($ent, 'neko_group',$nekoGroupList);
	$cbh->tdPlain($ent, 'neko_date');
	$cbh->tdPlain($ent, 'neko_dt');
	$cbh->tdFlg($ent, 'neko_flg');
	$cbh->tdImage($ent, 'img_fn');
	$cbh->tdNote($ent, 'note',50);
	$cbh->tdPlain($ent, 'sort_no');
	$cbh->tdDeleteFlg($ent, 'delete_flg');
	$cbh->tdPlain($ent, 'update_user');
	$cbh->tdPlain($ent, 'ip_addr');
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
	
<button type="button" class="btn btn-warning btn-sm" onclick="newInpShow(this, 'add_to_bottom');">新規追加</button>	

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
	
	
		<!-- CBBXS-2006 -->
		
		<div class="cbf_inp_wrap" style="float:left">
			<div class='cbf_inp_label_long' >画像ファイル名: </div>
			<div class='cbf_input' style="width:240px;height:auto;">
				<label for="img_fn_n" class="fuk_label">
					<input type="file" id="img_fn_n" class="img_fn" style="display:none" accept="image/*" title="画像ファイルをドラッグ＆ドロップ(複数可)"  data-inp-ex='image_fuk' data-fp='' />
					<span class='fuk_msg' style="padding:20%">画像ファイルをドラッグ＆ドロップ(複数可)</span>
				</label>
			</div>
		</div>
	
		<div class="cbf_inp_wrap">
			<div class='cbf_inp' >ネコ名: </div>
			<div class='cbf_input'>
				<input type="text" name="neko_name" class="valid " value=""  maxlength="255" title="255文字以内で入力してください" />
				<label class="text-danger" for="neko_name"></label>
			</div>
		</div>
	
		<div class="cbf_inp_wrap">
			<div class='cbf_inp_label' >ネコ数値: </div>
			<div class='cbf_input'>
				<input type="text" name="neko_val" class="valid" value="" pattern="^[0-9]+$" maxlength="11" title="数値を入力してください" />
				<label class="text-danger" for="neko_val" ></label>
			</div>
		</div>
		
		<div class="cbf_inp_wrap">
			<div class='cbf_inp_label' >ネコ日付: </div>
			<div class='cbf_input'>
				<input type="text" name="neko_date" class="valid datepicker" value=""  pattern="([0-9]{4})(\/|-)([0-9]{1,2})(\/|-)([0-9]{1,2})" title="日付形式（Y-m-d）で入力してください(例：2012-12-12)" />
				<label class="text-danger" for="neko_date"></label>
			</div>
		</div>
		
		<div class="cbf_inp_wrap">
			<div class='cbf_inp_label' >ネコ種別: </div>
			<div class='cbf_input'>
				<?php $cbh->selectX('neko_group',null,$nekoGroupList,null);?>
				<label class="text-danger" for="neko_group"></label>
			</div>
		</div>
	
		<div class="cbf_inp_wrap">
			<div class='cbf_inp_label' >ネコ日時: </div>
			<div class='cbf_input'>
				<input type="text" name="neko_dt" class="valid " value=""  pattern="([0-9]{4})(\/|-)([0-9]{1,2})(\/|-)([0-9]{1,2}) \d{2}:\d{2}:\d{2}" title="日時形式（Y-m-d H:i:s）で入力してください(例：2012-12-12 12:12:12)" />
				<label class="text-danger" for="neko_dt"></label>
			</div>
		</div>
		
		<div class="cbf_inp_wrap">
			<div class='cbf_inp_label' >ネコフラグ: </div>
			<div class='cbf_input'>
				<input type="checkbox" name="neko_flg" class="valid"/>
				<label class="text-danger" for="neko_flg" ></label>
			</div>
		</div>
		
		<div class="cbf_inp_wrap_long">
			<div class='cbf_inp_label' >備考： </div>
			<div class='cbf_input'>
				<textarea name="note" maxlength="1000" title="1000文字以内で入力してください" style="height:100px;width:100%"></textarea>
				<label class="text-danger" for="note"></label>
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
		<div  style='width:100%'>
	
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
			
			<!-- CBBXS-2007 -->
			
			<div style="display:none">
				<input type="hidden" name="sort_no">
			</div>
			
			<div class="cbf_inp_wrap">
				<div class='cbf_inp' >ID: </div>
				<div class='cbf_input'>
					<span class="id"></span>
				</div>
			</div>
			
			<div class="cbf_inp_wrap_long">
				<div class='cbf_inp' >ネコ名: </div>
				<div class='cbf_input'>
					<input type="text" name="neko_name" class="valid " value=""  maxlength="255" title="255文字以内で入力してください" />
					<label class="text-danger" for="neko_name"></label>
				</div>
			</div>
			
			<div class="cbf_inp_wrap" style="float:left">
				<div class='cbf_inp_label_long' >画像ファイル名: </div>
				<div class='cbf_input' style="width:180px;height:auto;">
					<label for="img_fn_e" class="fuk_label" >
						<input type="file" id="img_fn_e" class="img_fn" style="display:none" accept="image/*" title="画像ファイルをドラッグ＆ドロップ(複数可)" data-inp-ex='image_fuk' data-fp='' />
						<span class='fuk_msg' style="padding:20%">画像ファイルをドラッグ＆ドロップ(複数可)</span>
					</label>
				</div>
			</div>
		
			<div class="cbf_inp_wrap">
				<div class='cbf_inp_label' >ネコ数値: </div>
				<div class='cbf_input'>
					<input type="text" name="neko_val" class="valid" value="" pattern="^[0-9]+$" maxlength="11" title="数値を入力してください" />
					<label class="text-danger" for="neko_val" ></label>
				</div>
			</div>
			
			<div class="cbf_inp_wrap">
				<div class='cbf_inp_label' >ネコ日付: </div>
				<div class='cbf_input'>
					<input type="text" name="neko_date" class="valid datepicker" value=""  pattern="([0-9]{4})(\/|-)([0-9]{1,2})(\/|-)([0-9]{1,2})" title="日付形式（Y-m-d）で入力してください(例：2012-12-12)" />
					<label class="text-danger" for="neko_date"></label>
				</div>
			</div>
			
			<div class="cbf_inp_wrap">
				<div class='cbf_inp_label' >ネコ種別: </div>
				<div class='cbf_input'>
					<?php $cbh->selectX('neko_group',null,$nekoGroupList,null);?>
					<label class="text-danger" for="neko_group"></label>
				</div>
			</div>

			<div class="cbf_inp_wrap">
				<div class='cbf_inp_label' >ネコ日時: </div>
				<div class='cbf_input'>
					<input type="text" name="neko_dt" class="valid " value=""  pattern="([0-9]{4})(\/|-)([0-9]{1,2})(\/|-)([0-9]{1,2}) \d{2}:\d{2}:\d{2}" title="日時形式（Y-m-d H:i:s）で入力してください(例：2012-12-12 12:12:12)" />
					<label class="text-danger" for="neko_dt"></label>
				</div>
			</div>
			
			<div class="cbf_inp_wrap">
				<div class='cbf_inp_label' >ネコフラグ: </div>
				<div class='cbf_input'>
					<input type="checkbox" name="neko_flg" class="valid"/>
					<label class="text-danger" for="neko_flg" ></label>
				</div>
			</div>
			
			<div class="cbf_inp_wrap">
				<div class='cbf_inp_label' >削除：</div>
				<div class='cbf_input'>
					<input type="checkbox" name="delete_flg" class="valid"  />
				</div>
			</div>
			
			<div class="cbf_inp_wrap_long">
				<div class='cbf_inp_label' >備考： </div>
				<div class='cbf_input'>
					<textarea name="note" maxlength="1000" title="1000文字以内で入力してください" data-folding-ta="40" style="height:100px;width:100%"></textarea>
					<label class="text-danger" for="note"></label>
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
		

		<tr><td>ネコ名: </td><td>
			<span class="neko_name"></span>
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
		

		<tr><td>ネコ名: </td><td>
			<span class="neko_name"></span>
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