
<div class="msg_board_eval_w">
    <?php
    $msg_board_id = $ent['id'];
    $evalData = $evals[$msg_board_id];
    foreach($evalData as $evalEnt){
        $eval_type_id = $evalEnt['eval_type_id'];
        $evalTypeEnt = $evalTypeHm[$eval_type_id];
        $icon_fn = CRUD_BASE_STORAGE_URL . $evalTypeEnt['icon_fn'];
        $eval_count = $evalEnt['eval_count'];
        
        $pushed_class = 'eval_btn_color_unpushed';
        if($evalEnt['pushed'] == 1) $pushed_class = 'eval_btn_color_pushed';
        
        $eval_btn_xid = "eval_btn_{$msg_board_id}_{$eval_type_id}";
        $eval_user_count_btn_xid = "eval_user_count_btn_{$msg_board_id}_{$eval_type_id}";
        
    	?>
    	<div class="msg_board_eval_div" style="margin-right:1.2em;">
    		<button type="button"
    			 id="<?php echo $eval_btn_xid?>" 
    			 class="eval_btn_base <?php echo $pushed_class; ?>" 
    			 onclick="evaluateForMsgBoard(this)" 
    			 data-msg-board-id = "<?php echo $msg_board_id; ?>" 
    			 data-eval-type-id = "<?php echo $eval_type_id; ?>" 
    			 style="mask-image: url(<?php echo $icon_fn; ?>);-webkit-mask-image: url(<?php echo $icon_fn; ?>"></button>
    		<button type="button"  
    			id="<?php echo $eval_user_count_btn_xid?>" 
    			class="eval_user_count_btn" onclick="openEvalUsers(this);" 
    			data-msg-board-id = "<?php echo $msg_board_id; ?>" 
    			data-eval-type-id = "<?php echo $eval_type_id; ?>"> 
    			<?php echo $eval_count?></button>
    	</div>
    	<div class="eval_users_div" style="display:none"></div><!-- 評価ユーザーズ区分 -->
    <?php } ?>
    <pre id="err_eval_<?php echo $msg_board_id;?>" class="text-danger" ></pre>
</div>