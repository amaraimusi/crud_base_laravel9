/**
 * ImgCompactK.js
 * 
 * 画像をコンパクト化する。
 * クリックで元のサイズになり、もう一度クリックするとコンパクトになる。
 * 
 * 使い方
 * img要素のclass属性に「img_compact_k」を指定する。
 * 
 * 使用例
 * <img src="xxx" class="img_compact_k" />
 * 
 * @version 1.0
 * @date 2016-4-27 新規作成
 * 
 * 
 */


jQuery(function(){

	imgCompactK();
});


function imgCompactK(){
	jQuery('.img_compact_k').each(function(){
		
		jQuery(this).attr('class','');
		
		jQuery(this).css ({'width':'160px',
			'height':'160px'
		});
		
		jQuery(this).click(function() {
			
			var w = jQuery(this).css('width');
			if(w=='160px'){
				jQuery(this).attr('class','img-responsive');
				
				jQuery(this).css ({
					'width':'auto',
					'height':'auto'
				});
			}else{
				jQuery(this).attr('class','');
				
				jQuery(this).css ({'width':'160px',
					'height':'160px'
				});
			}
		});
	});
}












