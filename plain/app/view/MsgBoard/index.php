<?php

extract($crudBaseData, EXTR_REFS);

require_once CRUD_BASE_PATH . 'CrudBaseHelper.php';
$cbh = new CrudBaseHelper($crudBaseData);


?>

<div class="container-fluid">

<div id="err" class="text-danger"></div>

<div id="add_msg_div">
	<div class="row" style="margin-top:40px">
		<div class="col-12 col-md-2"></div>
		<div class="col-12 col-md-8">
			<div class="form-group row">
				<div class="col-12 col-md-9">
					<textarea class="form-control" id="ni_message" style="width:100%;height:40px" maxlength="2000" placeholder="-- メッセージ --" title="2000文字まで"></textarea>
					
				</div>
				<div class="btn-group col-12 col-md-3">
					<div class="form-group btn-group">
						<button type="button" class="btn btn-outline-secondary" onclick="jQuery('#ni_option_menu').toggle(300);">
							<span class="oi" data-glyph="menu"></span>
						</button>
						
						<button type="button" class="btn btn-primary" onclick="addMsg();"><span class="oi" data-glyph="check">送信</span></button>
					</div>
				</div>
			</div>
		</div>
		<div class="col-12 col-md-2"></div>
	</div>
	<div id="ni_option_menu" class="row" style="display:none">
		<div class="col-12 col-md-2"></div>
		<div class="col-12 col-md-3 " style="width:100%;height:auto">
			<label for="attach_fn" class="fuk_label" >
				<input type="file" id="attach_fn" style="display:none"  />
				<span class='fuk_msg' style="margin-top:20px;font-size:0.8em">ファイルアップロード</span>
			</label>
		</div><!-- col -->
		<div class="col-12 col-md-5">
			<div class="form-group form-check">
				<div style="<?php echo $sendMailInfo['disp_mail_check']; ?>">
					<input type="checkbox" class="form-check-input send_mail_check" id="send_mail_check" value="1">
					<label class="form-check-label" for="send_mail_check">受講者全員にメールで通知します。</label>
					<aside>※サーバの負荷状況によりメール通知されない可能性もございます。</aside>
				</div>
				<div class="text-secondary send_mail_err_msg" ><?php echo $sendMailInfo['err_msg']; ?></div>
				<div id="mail_send_cont" class="text-success"></div>
			</div>
		</div>
		<div class="col-12 col-md-2"></div>
	</div>
</div>

<div class="row" style="margin-top:10px">
		<div class="col-12 col-md-2"></div>
		<div class="col-12 col-md-8">
			<?php $cbh->divPagenation(); // ページネーション ?>
		</div>
		<div class="col-12 col-md-2"></div>
</div>

<div id="send_mail_debug_mail_text_w" class="" style="display:none;">
	<p class="text-danger">開発環境 メールの内容</p>
	localhostでは実際にメール送信しない。代わりにメール内容を以下に表示する。
	<div id="send_mail_debug_mail_text" class="" ></div>
</div>

<!-- メッセージ一覧 -->
<div id="msg_board_list" style="margin-top:60px">
<?php foreach($data as $ent){ ?>
<div class="row entity" data-id="<?php echo $ent['id']; ?>" style="margin-top:24px">
	<div class="col-12 col-md-2"></div>
	<div class="col-12 col-md-8 entity_box1" >
		<div>
			<div class="text-secondary" style="display:inline-block;margin-right:40px;"><?php echo $cbh->dateFormat($ent['modified'], 'Y-m-d H:i'); ?></div>
			<div class="text-secondary nickname" style="display:inline-block"><?php echo h($ent['nickname']);?></div>
		</div>
		<div class="text-md-left message_div"><?php echo h($ent['message']);?></div>
		<div style="width:320px;height:auto;">
		<?php echo $cbh->filePreviewA($ent['attach_fn']); ?>
		</div>
		<div class="row">
			<div class="col-9" style="padding-top:0.3em">
				<?php  include 'evals.php';?>
			</div>
			<div class="col-3 text-right" >
				<button type="button" class="btn btn-outline-secondary btn-sm menu_btn" onclick="showMenu(this)" style="<?php echo $ent['menu_btn']; ?>"><span class="oi" data-glyph="menu"></span></button>
				<div class="menu_div" style="margin-top:4px;display:none">
					
					<button type="button" class="btn btn-outline-dark btn-sm edit_btn" onclick="showEditDiv(this)" style="<?php echo $ent['edit_btn']; ?>" >
						<span class="oi" data-glyph="pencil"></span>編集
					</button>
					<button type="button" class="btn btn-danger btn-sm delete_btn" title="削除" onclick="deleteAction(this)" style="<?php echo $ent['delete_btn']; ?>" >
						<span class="oi" data-glyph="trash"></span>
					</button>
					<span class="oi oi-trash"></span>
				</div>
			</div>
		</div>
		<div class="edit_div" class="row" style="display:none">
			<div class="form-group col-12 col-md-9" >
				<textarea class="form-control message_edit_ta" maxlength="2000" style="width:100%;height:auto;"><?php echo h($ent['message']);?></textarea>
			</div>
			<div class="form-group col-12 col-md-3">
				<button type="button" class="btn btn-warning btn-sm" onclick="regEdit(this)">変更</button>
				<button type="button" class="btn btn-outline-secondary btn-sm" onclick="returnEdit(this)">戻る</button>
			</div>
		</div>
	<div class="col-12 col-md-2"></div>
	</div>
</div>
<?php } ?>

</div>

<input id="crud_base_json" type="hidden" value='<?php echo $crud_base_json; ?>' />
<div class="yohaku"></div>

</div><!-- container-fluid -->
