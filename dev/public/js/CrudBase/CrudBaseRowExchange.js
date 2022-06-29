/**
 * 
 * 行入替機能
 * 
 * @note
 * テーブルの行を入れ替えることによる並べ替え
 * 
 * @version 1.2.1 Bootstrap4に対応
 * @since 2017-3-7 | 2021-10-7
 * @license MIT
 * 
 */
class CrudBaseRowExchange{
	
	/**
	 * コンストラクタ
	 * @param crudBase CrudBaseオブジェクト
	 * @param param 当クラス専用パラメータ
	 * @param afterCallback 入替後に実行するコールバック関数
	 */
	constructor(crudBase, param, afterCallback){

		if(param == null) param = {};
		
		var tbl_slt = crudBase.param.tbl_slt;

		this.afterCallback = afterCallback; // 入替後コールバック
		
		this.tbl = crudBase.tbl; // HTMLテーブルのjQueryオブジェクト
		
		// テーブルセレクタからフォームセレクタを作成する
		var form_slt = "#exchange_tr_form_" + tbl_slt;
		param['form_slt'] = form_slt;
		
		// 行入替フォームのHTML文字列を取得する
		var formHtml = this._getFormHtml(form_slt);
		
		// テーブル要素の下に行入替フォームを追加、およびオブジェクトを取得
		this.tbl.after(formHtml);
		this.form = jQuery(form_slt); // 行入替のフォーム
		
		this.param = param;
		
		this.crudBaseData = crudBase.param; 
		
		// 閉じるボタンのクリックイベント
		this.form.find('.exchange_tr_form_close').click( ()=>{
			this.form.hide();
		});
		
		// 行入替ボタンのクリックイベント
		this.form.find('.exchange_tr_btn').click( ()=>{
			this._exchageTrReb(); // 行入替
		});
		
		
		// 行入替フォームのinput系要素にEnterキーによるイベントを組み込む
		jQuery(form_slt + ' input').keypress( (e)=>{
			if(e.which==13){ // Enterキーである場合
				this._exchageTrReb(); // 行入替ボタンによる行入替処理
			}
		});
		
		// 上シフトボタンのクリックイベント
		this.form.find('.exchange_tr_shift_up').click( ()=>{
			this._exchageTrShiftUp(); // 上シフトボタンによる行入替処理
		});
		
		// 下シフトボタンのクリックイベント
		this.form.find('.exchange_tr_shift_down').click( ()=>{
			this._exchageTrShiftDown(); // 下シフトボタンによる行入替処理
		});
		

	}

	
	/**
	 * 行入替フォームを表示する
	 * @param btn 行内の入替ボタン要素
	 */
	showForm(btn){
		
		// 移動元インデックスを取得し、パラメータにセットする
		var btnElm = jQuery(btn);
		var trElm = btnElm.parents('tr');
		var from_row_index = trElm.index();
		from_row_index = from_row_index + 1;// 1からの数えにする。
		this.param['from_row_index'] = from_row_index;
		
		// 移動先テキストボックスが空であるなら、上記で取得した移動元インデックスを初期セットする。
		var sortNoElm = this.form.find('.exchange_tr_sort_no');
		var idx = sortNoElm.val();
		if(this._empty(idx)){
			sortNoElm.val(from_row_index);
		}

		// 行内入替ボタンの下に行入替フォームを表示する
		this._showForm(this.form,btnElm);
	}
	
	
	
	
	/**
	 * 行入替ボタンによる行入替処理
	 */
	_exchageTrReb(){
		
		// 移動元行インデックスを取得する
		var from_row_index = this.param['from_row_index'];
		
		// 移動先行インデックスを取得する
		var to_row_index = this.form.find('.exchange_tr_sort_no').val();

		// 行インデックスをチェックし、不正があれば、処理中断
		if(this._checkRowIndex(to_row_index)==false){
			return;
		}
		
		// 移動元と移動先が同じなら処理中断
		if(from_row_index == to_row_index){
			return;
		}

		// 行入替
		this._exchageTr(from_row_index,to_row_index);
		
	}
	
	/**
	 * 上シフトボタンによる行入替処理
	 */
	_exchageTrShiftUp(){
		// 移動元行インデックスを取得する
		var from_row_index = this.param['from_row_index'];
		
		// 移動先行インデックスを取得する
		var to_row_index = from_row_index - 1;
		
		// 移動先行番が0以下なら上シフト処理を中断する
		if(to_row_index <= 0){
			return;
		}
		
		// 行入替
		this._exchageTr(from_row_index,to_row_index);
		
		// 連続して上シフトボタンを押した時のために、移動先を移動元として保存しておく
		this.param['from_row_index'] = to_row_index;
	}
	
	/**
	 * 下シフトボタンによる行入替処理
	 */
	_exchageTrShiftDown(){
		// 移動元行インデックスを取得する
		var from_row_index = this.param['from_row_index'];
		
		// 移動先行インデックスを取得する
		var to_row_index = from_row_index + 1;
		
		// テーブルの行数を取得する
		var tBody = this.tbl.children('tbody');
		var rowCnt = tBody.children('tr').length;// テーブル行数
		
		// 移動先行番が行数を超えるなら下シフト処理を中断する
		if(to_row_index > rowCnt){
			return;
		}
		
		// 行入替
		this._exchageTr(from_row_index,to_row_index);
		
		// 連続して上シフトボタンを押した時のために、移動先を移動元として保存しておく
		this.param['from_row_index'] = to_row_index;
	}
	
	/**
	 * ★ 行入替
	 * @param from_row_index 移動元行インデックス
	 * @param to_row_index 移動先行インデックス
	 */
	_exchageTr(from_row_index,to_row_index){
		// 移動元と移動先のTR要素を取得する
		var tr1 = this.tbl.find('tr').eq(from_row_index);
		var tr2 = this.tbl.find('tr').eq(to_row_index);
		
		// 移動元と移動先のTR要素を入れ替える
		if(from_row_index > to_row_index){
			jQuery(tr2).before(tr1);
			
		}else{
			jQuery(tr2).after(tr1);
			
		}
		
		// コールバックが設定されていれば、コールバックを実行する
		if(this.afterCallback){
			this.afterCallback({
				'from_row_index':from_row_index,
				'to_row_index':to_row_index
			});
		}
	}
	
	
	
	
	/**
	 * 行インデックスをチェックする
	 * @param row_index 行インデックス
	 * @returns {Boolean} true:はい  false:いいえ
	 */
	_checkRowIndex(row_index) {
		
		if(row_index == undefined){
			return false;
		}
		

		if(!row_index.match(/^[0-9]*$/)){
			return false;
		}
		
		if(row_index <= 0){
			return false;
		}
	
		return true;
	
	}
	
	
	
	
	
	
	
	
	/**
	 * 行入替フォームを表示する
	 * 
	 * @param object form フォーム要素オブジェクト
	 * @param string triggerElm トリガー要素  ボタンなど
	 */
	_showForm(form,triggerElm,form_position){
		
		if(!form_position){
			form_position = 'auto';
		}
		
		form.show();
		
		//トリガー要素の右上位置を取得
		triggerElm = jQuery(triggerElm);
		var offset=triggerElm.offset();
		var left = offset.left;
		var top = offset.top;
		
		var ww = jQuery(window).width();// Windowの横幅（ブラウザの横幅）
		var form_width = form.outerWidth();// フォームの横幅
		
		// フォーム位置Yをセット
		var trigger_height = triggerElm.outerHeight();
		var tt_top=top + trigger_height;
		
		var tt_left=0;// フォーム位置X
		
		// フォーム位置の種類毎にフォーム位置Xを算出する。
		switch (form_position) {
		
		case 'left':
			
			// トリガーの左側にフォームを表示する。
			tt_left=left - form_width;
			break;
			
		case 'center':

			// フォームを中央にする。
			tt_left=(ww / 2) - (form_width / 2);
			break;
			
		case 'right':
			
			// トリガーの右側にフォームを表示する
			tt_left=left;
			break;
			

		default:// auto

			// 基本的にトリガーの右側にフォームを表示する。
			// ただし、トリガーが右端付近にある場合、フォームは外側にでないよう左側へ寄せる。
			
			tt_left=left;
			if(tt_left + form_width > ww){
				tt_left = ww - form_width;
			}
			
			break;
		}

		if(tt_left < 0){
			tt_left = 0;
		}

		//フォーム要素に位置をセット
		form.offset({'top':tt_top,'left':tt_left });
	}
	
	
	/**
	 * 行入替フォームのHTML文字列を取得する
	 * @param form_slt フォーム要素のセレクタ
	 * @returns 行入替フォームのHTML
	 */
	_getFormHtml(form_slt){
		
		var xid = this._sltToCode(form_slt);// セレクタから識別子「#」「.」を取り外したコードを取得する
		
		var html = 
			"<div id='" + xid +"_rap'>" +
			"	<div id='" + xid +"' class='card' style='display:none;width:200px;background-color:white'>" +
			"		<div class='card-header bg-primary'>" +
			"			" +
			"			<div class='text-light' style='display:inline-block;width:60%'>行入替</div>" +
			"			<div class='text-light' style='display:inline-block;width:35%;text-align:right'>" +
			"				<button type='button' class='exchange_tr_form_close btn btn-primary btn-sm'  aria-label='閉じる'>" +
			"					<span class='oi' data-glyph='x'></span>" +
			"				</button>" +
			"			</div>" +
			"		</div>" +
			"		<div class='card-body' \">" +
			"			<button type='button' class='exchange_tr_shift_up btn btn-primary btn-sm' style='font-weight:bold;' title='一つ上に移動します。'><span class='oi' data-glyph='arrow-thick-top'></span></button>" +
			"			<button type='button' class='exchange_tr_shift_down btn btn-primary btn-sm' style='font-weight:bold;' title='一つ下に移動します。'><span class='oi' data-glyph='arrow-thick-bottom'></span></button>" +
			"			<div style='margin-top:20px'>" +
			"				<input class='exchange_tr_sort_no' type='number' style='width:60px' min='1' max='9999'  title='移動したい行の位置を数値で入力してください。先頭に移動させたい場合は1を入力して行入替ボタンを押します。上から3番目に移動させたい場合は3を入力します。' />" +
			"				<input type='button' value='行入替' class='exchange_tr_btn btn btn-warning btn-sm' />" +
			"			</div>" +
			"		</div>" +
			"	</div>" +
			"</div>";
		
		return html;
	}
	
	
	/**
	 * セレクタから識別子「#」「.」を取り外したコードを取得する
	 * 
	 * @note
	 * セレクタに空文字を指定すると空を返す。ただしnullを指定した場合はエラーになる。
	 * 
	 * @param slt セレクタ
	 * @returns コード
	 */
	_sltToCode(slt){
		
		var code = slt;
		var s1 = code.charAt(0); // 先頭の一文字を取得
		if(s1=='#' || s1=='.'){
			code = code.substr(1);
		}
		return code;
	}
	
	
	
	
	// 空判定
	_empty(v){
		if(v == null || v == '' || v=='0'){
			return true;
		}else{
			if(typeof v == 'object'){
				if(Object.keys(v).length == 0){
					return true;
				}
			}
			return false;
		}
	}
	
	

}