/**
 * 数値範囲入力スライダー・noUiSliderラップクラス
 * 
 * nouislider.min.jsの拡張クラスです。
 * 入力フォームをテキストボックス形式から、スライダー形式に変更します。
 * 
 * ◇主なメソッド
 * - init noUiSliderの初期化（数値範囲入力スライダーを生成）
 * - reload 数値テキストボックスに合わせて、スライドバーを修正する。
 * 
 * @date 2015-11-25 | 2018-3-9 v1とv2の両方が0であれば、両方を空文字にする。
 */
var NoUiSliderWrap = function(){
	
	this.props;//プロパティ
	this.slider;//スライダーオブジェクト
	
	
	/**
	 * noUiSliderの初期化（数値範囲入力スライダー）
	 * @param param
	 * 
	 * paramの設定例
	 * 	'slider':'#ans_tw_cnt_slider',
	 *	'tb1':'#kj_ans_tw_cnt1',
	 *	'tb2':'#kj_ans_tw_cnt2',
	 *	'step':1,
	 *	'min':0,
	 *	'min':0,
	 *	'max':200,
	 * 
	 */
	this.init=function(myself,param){
		
		this.props=param;
		
		var slider = $(param.slider).get(0);//スライダー要素オブジェクトを取得
		this.slider=slider;
			
		var v1=$(param.tb1).val();
		var v2=$(param.tb2).val();
		
		
		//noUiSliderスライダーの生成と設定をする。
		noUiSlider.create(slider, {
			start: [v1, v2],//初期値
			step:param.step,//ステップ：スライダー一切りの間隔値
			connect: true,
			tooltips: false,// true:スライダーにツールチップを表示
			range: {//入力できる数値の範囲
				'min': param.min,
				'max': param.max
			}
		});
		
		//スライダーを動かしたときのイベント
		slider.noUiSlider.on('update', function ( values, handle ) {
			var v1=values[0];
			var v1=Math.round(v1);

			var v2=values[1];
			var v2=Math.round(v2);
			
			if(v1!=0 || v2!=0){
				$(param.tb1).val(v1);
				$(param.tb2).val(v2);
				$(param.value_preview).html(v1 + '～' + v2);
			}else{
				$(param.tb1).val('');
				$(param.tb2).val('');
				$(param.value_preview).html('OFF');
			}
			
		});
		
		//テキストボックスの値を変更したときに、スライダーにも反映させる。
		$(param.tb1).blur(function(e){
			myself.reload();
		});
		
		//テキストボックスの値を変更したときに、スライダーにも反映させる。（右の値）
		$(param.tb2).blur(function(e){
			myself.reload();
		});
		
		
	};


	/**
	 * 数値テキストボックスに合わせて、スライドバーを修正する。
	 */
	this.reload=function(){
		var v1=$(this.props.tb1).val();
		var v2=$(this.props.tb2).val();
		this.slider.noUiSlider.set([v1,v2]);
	};
};



