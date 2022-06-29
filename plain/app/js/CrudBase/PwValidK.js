/**
 * パスワードバリデーションK
 * 
 * @note
 * パスワードのバリデーションチェックを行う。
 * 
 * @date 2019-3-6
 * @varsion 1.0.0
 */
class PwValidK{
	
	/**
	 * パスワードチェック
	 * @param string pw_text パスワード文字列
	 * @parma object option
	 *  - num_req 数値必須フラグ true:数値必須, false:数値不要（デフォルト）
	 *  - alph_req アルファベット必須 true:数値必須（デフォルト）, false:数値不要
	 *  - min_len 最小文字数 デフォルト8文字以上
	 *  - max_len 最大文字数 デフォルト32文字以下
	 * @reutrn bool true:OK, false:FAILE
	 *  - check true:OK, false:FAILE
	 *  - err_msg string エラーメッセージ
	 */
	check(pw_text, option){
		
		// 空チェック
		if(pw_text == null || pw_text=='' || pw_text==0){
			return {'check':false, 'err_msg':'パスワードが空です。'};
		}
		
		if(option == null) option = {};
		if(option['num_req'] == null) option['num_req'] = false;
		if(option['alph_req'] == null) option['alph_req'] = true;
		if(option['min_len'] == null) option['min_len'] = 8;
		if(option['max_len'] == null) option['max_len'] = 32;
		
		// 最小文字数チェック
		if(pw_text.length < option.min_len){
			return {'check':false, 'err_msg':'パスワードは' + option.min_len + '文字以上にしてください。'};
		}
		
		// 最大文字数チェック
		if(pw_text.length > option.max_len){
			return {'check':false, 'err_msg':'パスワードは' + option.max_len + '文字以下にしてください。'};
		}
		
		// 半角英数字チェック
		var res = pw_text.match(/^[a-zA-Z0-9]+$/);
		if(res==null){
			return {'check':false, 'err_msg':'パスワードは半角英数字で入力してください。'};
		}
		
		// パスワードに数字を含めてください。
		if(option.num_req){
			var res = pw_text.match(/[0-9]/);
			if(res == null){
				return {'check':false, 'err_msg':'パスワードに数字を含めてください。'};
			}
		}
		
		// パスワードにアルファベットを含めてください。
		if(option.alph_req){
			var res = pw_text.match(/[a-zA-Z]/);
			if(res == null){
				return {'check':false, 'err_msg':'パスワードにアルファベットを含めてください。'};
			}
		}
		
		if(res==null){
			res = {'check':false, 'err_msg':'パスワードの入力エラー'};
		}else{
			res = {'check':true, 'err_msg':''};
		}
		
		return res;
	}
	
	
	
}