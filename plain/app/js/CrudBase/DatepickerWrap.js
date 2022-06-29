/**
 * カレンダー日付ピッカー・ラッパーコンポーネント
 * 
 * @note
 * カレンダーピッカー関連ライブラリをまとめたコンポーネントクラス。
 * カレンダーピッカーを組み込みたい要素のclass属性にdatepicker,datetimepicker,ympickerを
 * 記述するとそれぞれの特徴をもったカレンダーが組み込まれる。
 * 
 * class属性とカレンダーピッカーの種類
 * 		datepicker 日付ピッカー
 * 		datetimepicker 日時ピッカー（※処理が重いため非推奨）
 * 		ympicker 年月ピッカー
 * 
 * 依存ライブラリ
 * 		jquery-ui.min.js
 * 		jquery.ui.ympicker.js
 * 		jquery.datetimepicker.full.min.js
 * 
 * @version 2.0.1
 * @date 2015-7-1 | 2019-1-25
 * @history
 * 2018-10-09 v2.0.0 YmpickerWrapからDatepickerWrapに名称変更
 * 2015-09-17 バグ修正
 * 2015-07-01 新規作成
 * 
 */
class DatepickerWrap{
	
	
	/**
	 * コンストラクタ
	 * 
	 * @param param
	 * - ja_flg 0:日本語化しない , 1:日本語化する（デフォルト）
	 * - datetimepicker_f 日時ピッカー機能フラグ 0:無効(デフォルト) , 1:有効
	 */
	constructor(param){

		if(jQuery.datepicker == null) return;
		
		this.param = this._setParamIfEmpty(param);
		
		// カレンダーを日本語化する
		if(param['ja_flg'] == 1) this.datepicker_ja();
		
		this._datepickerApply(); // datepickerを適用
		this._datetimepickerApply(); // datetimepickerを適用
		this._ympickerApply(); // ympickerを適用
		
		
		
	}
	
	/**
	 * If Param property is empty, set a value.
	 */
	_setParamIfEmpty(param){
		
		if(param == null) param = {};
		
		if(param['ja_flg'] == null) param['ja_flg'] = 1; 
		if(param['datetimepicker_f'] == null) param['datetimepicker_f'] = 0; 
		
		return param;
	}
	
	
	/**
	 * datepickerを適用
	 * 
	 * @note
	 * class属性に「datepicker」が記述されているすべての要素にdatepickerを適用
	 */
	_datepickerApply(){
		
		jQuery('.datepicker').each((i,elm) => {
			jQuery(elm).datepicker({dateFormat:'yy-mm-dd'});
		});
	}
	
	
	/**
	 * datetimepickerを適用
	 * 
	 * @note
	 * class属性に「datetimepicker」が記述されているすべての要素にdatetimepickerを適用
	 */
	_datetimepickerApply(){
		if(this.param.datetimepicker_f == 0) return;
		
		jQuery('.datetimepicker').each((i,elm) => {
			jQuery(elm).datetimepicker({dateFormat:'Y-m-d H:i'});
		});
	}
	
	
	/**
	 * ympickerを適用
	 * 
	 * @note
	 * class属性に「ympicker」が記述されているすべての要素にympickerを適用
	 */
	_ympickerApply(){
		//年月入力
		var op = {
			closeText: '閉じる',
			prevText: '&#x3c;前',
			nextText: '次&#x3e;',
			currentText: '今日',
			monthNames: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
			monthNamesShort: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
			dateFormat: 'yy/mm',
			yearSuffix: '年',
			onSelect:function(date, instance) {
			}
		};
		
		jQuery('.ympicker').each((i,elm) => {
			jQuery(elm).ympicker(op);
		});
	}
	
	
	
	/**
	 * 年月ダイアログを作成する関数
	 * 
	 * jquery.ui.ympicker.jsを拡張しています。
	 * 年月選択により月初日、月末日らのテキストボックスと連動できるようになっています。
	 *
	 * @param tb_ym_id 年月テキストボックスのID
	 * @param tb_m_start_id 月初日テキストボックスのID
	 * @param tb_m_ent_id 月末日テキストボックスのID
	 *
	 */
	tukishomatu(tb_ym_id,tb_m_start_id,tb_m_ent_id){

		//年月入力
		var op = {
			closeText: '閉じる',
			prevText: '&#x3c;前',
			nextText: '次&#x3e;',
			currentText: '今日',
			monthNames: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
			monthNamesShort: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
			dateFormat: 'yy/mm',
			yearSuffix: '年',
			onSelect:function(date, instance) {

				//月初日の作成と出力
				var d1=date + '/1';
				jQuery('#' + tb_m_start_id).val(d1);

				//月末日の算出と出力
				var dt=new Date(d1);
				var last_d=new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
				var last_d=DateFormat(last_d, 'yyyy/mm/dd'); // 01月23日
				jQuery('#' + tb_m_ent_id).val(last_d);

			}
		};

		//年月ダイアログを適用
		jQuery('#' + tb_ym_id).ympicker(op);


		//年月をクリアしたら月初、月末もクリアする。
		jQuery('#' + tb_ym_id).blur(function () {
			var v = jQuery('#' + tb_ym_id).val();
			if(v =='' || v==null){
				jQuery('#' + tb_m_start_id).val('');
				jQuery('#' + tb_m_ent_id).val('');
			}
		});

	}
	
	
	
	/**
	 * jQuery UIカレンダーを日本語化する
	 */
	datepicker_ja(){
		
		jQuery.datepicker.regional['ja'] = {
				closeText: '閉じる',
				prevText: '<前',
				nextText: '次>',
				currentText: '今日',
				monthNames: ['1月','2月','3月','4月','5月','6月',
				'7月','8月','9月','10月','11月','12月'],
				monthNamesShort: ['1月','2月','3月','4月','5月','6月',
				'7月','8月','9月','10月','11月','12月'],
				dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
				dayNamesShort: ['日','月','火','水','木','金','土'],
				dayNamesMin: ['日','月','火','水','木','金','土'],
				weekHeader: '週',
				dateFormat: 'yy/mm/dd',
				firstDay: 0,
				isRTL: false,
				showMonthAfterYear: true,
				yearSuffix: '年'};
			jQuery.datepicker.setDefaults(jQuery.datepicker.regional['ja']);
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
}