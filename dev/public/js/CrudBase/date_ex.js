
/**
 * 日付フォーマット変換(推奨)
 * @param mixed date1 日付
 * @param string format フォーマット Y-m-d, Y/m/d h:i:s など
 * @returns string 「yyyy-mm-dd」形式の日付文字列
 */
function dateFormat(date1, format){
	
	if(date1 == null) date1 = new Date().toLocaleString();
	if(format == null) format = 'Y-m-d';
	
	// 引数が文字列型であれば日付型に変換する
	if((typeof date1) == 'string'){
		date1 = new Date(date1);
		if(date1 == 'Invalid Date'){
			return null;
		}
	}
	
	var year = date1.getFullYear();
	
	var month = date1.getMonth() + 1;
	month = ("0" + month).slice(-2); // 2桁の文字列に変換する
	
	var day = date1.getDate();
	day = ("0" + day).slice(-2);
	
	var houre = date1.getHours();
	houre = ("0" + houre).slice(-2);
	
	var minute = date1.getMinutes();
	minute = ("0" + minute).slice(-2);
	
	var second = date1.getSeconds();
	second = ("0" + second).slice(-2); // 2桁の文字列に変換する
	
	var date_str = format;
	date_str = date_str.replace('Y', year);
	date_str = date_str.replace('m', month);
	date_str = date_str.replace('d', day);
	date_str = date_str.replace('h', houre);
	date_str = date_str.replace('i', minute);
	date_str = date_str.replace('s', second);
	
	//var date_str = year + '-' + month + '-' + day;
	return date_str;
}

/**
 * 日付オブジェクトから文字列に変換します（非推奨）
 * 
 * @param date 対象の日付オブジェクト
 * @param format フォーマット
 * @return フォーマット後の文字列
 * @date 2012/06/10 新規作成
 */
function DateFormat(date, format){

	var result = format;

	var f;
	var rep;

	var yobi = new Array('日', '月', '火', '水', '木', '金', '土');

	f = 'yyyy';
	if ( result.indexOf(f) > -1 ) {
		rep = date.getFullYear();
		result = result.replace(/yyyy/, rep);
	}

	f = 'mm';
	if ( result.indexOf(f) > -1 ) {
		rep = PadZero(date.getMonth() + 1, 2);
		result = result.replace(/mm/, rep);
	}

	f = 'ddd';
	if ( result.indexOf(f) > -1 ) {
		rep = yobi[date.getDay()];
		result = result.replace(/ddd/, rep);
	}

	f = 'dd';
	if ( result.indexOf(f) > -1 ) {
		rep = PadZero(date.getDate(), 2);
		result = result.replace(/dd/, rep);
	}

	f = 'hh';
	if ( result.indexOf(f) > -1 ) {
		rep = PadZero(date.getHours(), 2);
		result = result.replace(/hh/, rep);
	}

	f = 'ii';
	if ( result.indexOf(f) > -1 ) {
		rep = PadZero(date.getMinutes(), 2);
		result = result.replace(/ii/, rep);
	}

	f = 'ss';
	if ( result.indexOf(f) > -1 ) {
		rep = PadZero(date.getSeconds(), 2);
		result = result.replace(/ss/, rep);
	}

	f = 'fff';
	if ( result.indexOf(f) > -1 ) {
		rep = PadZero(date.getMilliseconds(), 3);
		result = result.replace(/fff/, rep);
	}

	return result;

}


/**
 * 文字列から日付オブジェクトに変換します（非推奨）
 * 
 * @param date 対象の日付オブジェクト
 * @param format フォーマット
 * @return 変換後の日付オブジェクト
 * 
 * @date 2012/06/10 新規作成
 */
function DateParse(date, format){

	var year = '1990';
	var month = '01';
	var day = '01';
	var hour = '00';
	var minute = '00';
	var second = '00';
	var millisecond = '000';

	var f;
	var idx;

	f = 'yyyy';
	idx = format.indexOf(f);
	if ( idx > -1 ) {
		year = date.substr(idx, f.length);
	}

	f = 'MM';
	idx = format.indexOf(f);
	if ( idx > -1 ) {
		month = parseInt(date.substr(idx, f.length), 10) - 1;
	}

	f = 'dd';
	idx = format.indexOf(f);
	if ( idx > -1 ) {
		day = date.substr(idx, f.length);
	}

	f = 'HH';
	idx = format.indexOf(f);
	if ( idx > -1 ) {
		hour = date.substr(idx, f.length);
	}

	f = 'mm';
	idx = format.indexOf(f);
	if ( idx > -1 ) {
		minute = date.substr(idx, f.length);
	}

	f = 'ss';
	idx = format.indexOf(f);
	if ( idx > -1 ) {
		second = date.substr(idx, f.length);
	}

	f = 'fff';
	idx = format.indexOf(f);
	if ( idx > -1 ) {
		millisecond = date.substr(idx, f.length);
	}

	var result = new Date(year, month, day, hour, minute, second, millisecond);

	return result;

}


/**
 * ゼロパディングを行います
 * @param value	対象の文字列
 * @param length	長さ
 * @return 結果文字列
 * 
 */
function PadZero(value, length){
    return new Array(length - ('' + value).length + 1).join('0') + value;
}

