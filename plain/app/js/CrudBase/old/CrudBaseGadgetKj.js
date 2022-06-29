/**
 * CrudBaseガシェット管理クラス（検索条件の入力要素用）
 * 
 * @note
 * 下記のモジュール群に依存している。
 * - NoUiSliderWrap NOスライダー
 * - YmpickerWrap.js 年月ピッカーのラッパー
 * 
 * @date 2018-3-23
 * @version 1.0
 */
class CrudBaseGadgetKj{

	constructor(kjElms){
		this.kjElms = kjElms; // 検索条件要素リスト
		this.gadgets; // ガジェットオブジェクトリスト
		this.ympickerWrap; // 年月ピッカーのラッパークラス <YmpickerWrap.js>
	}
	
	
	/**
	 * ガシェットを各入力要素に組み込む
	 */
	onGadgetsToElms(){
 
		var gadgets = {};
		
		for(var field in this.kjElms){

			var kjElm = this.kjElms[field];
			var gadget_name = kjElm.attr('data-gadget');

			if(gadget_name == null) continue;
			
			if(gadgets[gadget_name] == null) gadgets[gadget_name] = {};

			// NOスライダー
			if(gadget_name == 'nouislider'){
				gadgets[gadget_name][field] = this._initNouislider(field);
			}
			
			// 月・日付範囲検索
			else if(gadget_name == 'mo_date_rng'){
				gadgets[gadget_name][field] = this._initMoDateRng(field);
			}
			
			// 日時ピッカー
			else if(gadget_name == 'datetimepicker'){
				gadgets[gadget_name][field] = this._initDateTimePicker(field);
			}
			
			

		}
		this.gadgets = gadgets;
	}
	
	/**
	 * Noスライダーを検索条件要素に組み込む
	 * @param string field フィールド
	 */
	_initNouislider(field){
		
		field = this._removeKjHash(field); // フィールドから「kj_」部分を除去する
		
		var noUiSlider = new NoUiSliderWrap();///ネコ数値の数値範囲入力スライダー
		
		var slider = '#' + field + '_slider';
		var tb1 = '#kj_' + field + '1';
		var tb2 = '#kj_' + field + '2';
		var value_preview = '#' + field + '_preview';
		
		//noUiSliderの初期化（数値範囲入力スライダー）
		noUiSlider.init(noUiSlider,{
				'slider':slider,
				'tb1':tb1,
				'tb2':tb2,
				'value_preview':value_preview,
				'step':5,
				'min':0,
				'max':200,
			});
		
		return noUiSlider;
	}
	
	
	
	/**
	 * 月・日付範囲機能を組み込む
	 * @param string field フィールド
	 */
	_initMoDateRng(field){
		
		var tb_ym_id = field + '_ym';
		var tb_m_start_id = field + '1';
		var tb_m_ent_id = field + '2';
		
		//日付系の検索入力フォームにJQueryカレンダーを組み込む。
		$('#' + tb_m_start_id).datepicker({
			dateFormat:'yy-mm-dd'
		});
		$('#' + tb_m_ent_id).datepicker({
			dateFormat:'yy-mm-dd'
		});
		
		if(!this.ympickerWrap) this.ympickerWrap = new YmpickerWrap();// 年月ピッカーのラッパークラス

		// 年月選択により月初日、月末日らのテキストボックスを連動させる。
		this.ympickerWrap.tukishomatu(tb_ym_id,tb_m_start_id,tb_m_ent_id);

		return null;
	}
	
	
	
	/**
	 * 日時ピッカー機能を組み込む
	 * @param string field フィールド
	 */
	_initDateTimePicker(field){
		
		jQuery('#' + field).datetimepicker({
			format:'Y-m-d H:i',
		});

		return null;
	}
	
	
	
	/**
	 * フィールドから「kj_」部分を除去する
	 * @param string field フィールド
	 * @return string 「kj_」部分を除去したフィールド
	 */
	_removeKjHash(field){
		 
		if(field==null) return field;
		if(field.length <= 3) return field;
		
		var s3=field.substring(0,3);
		if(s3 == 'kj_'){
			field = field.substring(3,field.length);
		}
		
		return field;
	}
	
	
	
	/**
	 * 各ガシェットのリセット
	 */
	reset(){
		
		// noUiSliderの再表示
		if (this.gadgets['nouislider']){
			var nouisliderList = this.gadgets['nouislider'];
			for(var i in nouisliderList){
				var nouislider = nouisliderList[i];
				
				nouislider.reload();//数値範囲入力スライダー・noUiSliderの再表示(nouislider_rap.js)
			}
		}
		
	}
}