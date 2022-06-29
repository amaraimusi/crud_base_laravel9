/**
 * バリデーション関数群
 * 
 * @note
 * InputCheckAの後継
 * 
 * @version 5.0.1
 * @date 2009-7-9 | 2020-4-15
 * @license MIT
 */
class CrudBaseValidation{
	
	/**
	 * 文字数チェックのバリデーション
	 * @param v			対象文字列
	 * @param maxLen	制限文字数
	 * @param req		trueは必須入力。0と半角SPは入力ありとみなす。引数省略時はfalse
	 * @return true:正常  false:エラー
	 */
	isMaxLength(v,maxLen,req){

		//必須入力チェック
		if(req==true){
			if(v == null || v === '' || v === false){
				return false;
			}
		}

		//最大文字数チェックをする。
		var n=v.length;
		if (n > maxLen){
			return false;

		}

		return true;
	}
	
	
	/**
	 * 自然数のチェック
	 * @param mixed value
	 * @return true:正常  false:エラー
	 */
	isNaturalNumber(value){

		var regexp = /^[0-9]*$/;
		if(!regexp.test(value)){
			return false;
		}

		return true;
	}
	
	
	/**
	 * 整数のチェック
	 * @note
	 * null, 空文字は正常と見なす。
	 * 文字列型の整数値も正常と見なす。
	 * 半角スペースが混じっていればエラーと見なす。
	 * 符号付き整数（+100, -100）は正常と見なす。
	 * 
	 * @param mixed value
	 * @return true:正常  false:エラー
	 */
	isInteger(value){
		
		if(value === null) return true;
		if(value === '') return true;
		
		if(Number.isNaN(value)) return false;
		let value2 = Number(value); // 数値型に変換
		if(Number.isInteger(value2) ) return true; // 整数判定
		
		return false;
	}
	
	
	/**
	 * 日付チェック
	 * 
	 * @note
	 * yyyy/mm/dd形式とyyyy-mm-dd形式に対応
	 * 閏年に対応
	 * 空値ならfalseを返す。
	 * 
	 * @param value
	 * @returns true:入力OK    false:入力エラー
	 */
	isDate(value){

		var ary=value.split("/");
		if(ary.length != 3){
			ary=value.split("-");
			if(ary.length != 3){
				return false;;
			}
		}
		
		let y = ary[0];
		let m = ary[1];
		let d = ary[2];

		let regexp = /^[0-9]*$/;
		if(!regexp.test(y)) return false;
		if(!regexp.test(m)) return false;
		if(!regexp.test(d)) return false;
		
		var dt=new Date(y,m-1,d);
		if(dt.getFullYear()!=y || dt.getMonth()!=m-1 || dt.getDate()!=d){
			return false;
		}
		
		return true;
	}
	
	
	/**
	 * カタカナチェック
	 * 
	 * @note
	 * 全角スペースが含まれているとエラー
	 * 
	 * @param value
	 * @returns true:入力OK, false:入力エラー
	 */
	isKatakana(value){
		
		var regexp = /^[ァ-ヶー]*$/;
		if(!regexp.test(value)){
			return false;
		}

		return true;

	}
	
	
	/**
	 * ひらがなチェック
	 * 
	 * @note
	 * 全角スペースが含まれているとエラー
	 * 
	 * @param value
	 * @returns true:入力OK, false:入力エラー
	 */
	isHiragana(value){
		
		var regexp = /^[ぁ-んー]*$/;
		if(!regexp.test(value)){
			return false;
		}

		return true;

	}
	
	
	/**
	 * メールアドレスチェック
	 * 
	 * @note
	 * 空値はエラー
	 * 
	 * @param value
	 * @returns true:入力OK, false:入力エラー
	 */
	isMail(value){
		var regexp = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9]{1,}$/;
		if(!regexp.test(value)){
			return false;
		}
		return true;
	}
	
	
	/**
	 * 電話番号チェック
	 * 
	 * @note
	 * 空値はエラー。
	 * 全角数字はエラー。
	 * 
	 * @param value
	 * @returns true:入力OK, false:入力エラー
	 */
	isTell(value){
		let regexp = /^[0-9+-]*$/;
		if(!regexp.test(value)){
			return false;
		}
		return true;
	}
	
	
	/**
	 * 郵便番号チェック
	 * 
	 * @note
	 * ハイフンなしの7桁数も入力OK
	 * 空値はエラー。
	 * 全角数字はエラー。
	 * 
	 * @param value
	 * @returns true:入力OK, false:入力エラー
	 */
	isPost(value){
		let regexp = /^\d{3}-?\d{4}$/;
		if(!regexp.test(value)){

			regexp = /^¥d{7}$/;
			if(!regexp.test(value)){
				return false;
			}
		}
		
		return true;
	}
	
	
	/**
	 * パスワードチェック
	 * 
	 * @note
	 * アルファベットまた数字を最低1字ずつ含める。
	 * 空値はエラー。
	 * 
	 * @param value
	 * @returns true:入力OK, false:入力エラー
	 */
	isPassword(value){
		let regexp = /^(?=.*?[a-zA-Z])(?=.*?\d)[a-zA-Z\d]{8,100}$/;
		if(!regexp.test(value)){
			return false;
		}
		
		return true;
	}
	
	
	/**
	 * コードチェック
	 * 
	 * @note
	 * アルファベット、数字、ハイフン、アンダースコア
	 * 空値はエラー。
	 * 
	 * @param value
	 * @returns true:入力OK, false:入力エラー
	 */
	isAlphaNum(value){
		let regexp = /^[a-zA-Z0-9_\-]+$/;
		if(!regexp.test(value)){
			return false;
		}
		
		return true;
	}
	
	
	
	
	
	
}