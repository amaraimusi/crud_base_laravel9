/**
 * カレンダービュー
 * 
 * @note
 * 一覧をカレンダーの構造で表示する
 * 
 * @date 2018-12-1
 * @version 1.0.0
 * 
 */
class CalendarViewK{

	
	/**
	 * カレンダービューを生成する
	 * @param object data 一覧テーブルからのデータ
	 * @param string date_field 日付フィールド
	 * @param function callback カレンダーセル作成のコールバック
	 */
	create(data, date_field, callback){

		// データ中の日付データを整形する
		data = this._shapingDateInData(data, date_field);
		
		// 基準月初日を取得する
		var base_month_start = this._getBaseMonthStart(data, date_field);
		if(base_month_start == null){
			console.log('カレンダービュー：データ中に日付がありません。');
			return;
		}

		// 基準月末日を取得する
		var base_month_end = this._getMonthEndDate(base_month_start);

		// カレンダーデータのフォーマットを作成する。
		var calData = this._createCalendarDataFormat(base_month_start, base_month_end);
		
		// データを日付で集計する
		var dataA = this._aggByDateField(data, date_field);
		
		// カレンダーデータに日付集計データをマッピングする
		calData = this._mappingToCalData(calData, dataA);
		
		// カレンダーデータの週ごとに構造変換する
		calData = this._weekStructConv(calData);
		
		// コールバック関数が空であるなら見本コールバック関数をセットする。
		if(callback == null) callback = this._callback;

		// カレンダービューHTMLを組み立てる
		var html = this._buildCalendarViewHtml(calData, callback, base_month_start);
		
		jQuery('#calendar_view_k').html(html);
	}
	
	
	/**
	 * 見本コールバック
	 */
	_callback(cellData, self){
		
		var html = "";
		if(cellData['ents'] != null){
			var ents = cellData['ents'];
			for(var i in ents){
				var ent = ents[i];
				var name_field = self._getNameField(ent);
				var name = self._xss_sanitize(ent[name_field]);
				html += "<div>" + name + "</div>";
			}

		}
		
		html = "<div style='width:120px;height:80px'>" + html + "</div>";
		
		return html;
	}
	
	_getNameField(ent){
		if(this.name_field == null){
			this.name_field = 'id';
			for(var field in ent){
				if(field.indexOf('name') >= 0){
					this.name_field = field;
				}
				
			}
		}
		
		return this.name_field;
	}
	
	/**
	 * XSSサニタイズ
	 * 
	 * @note
	 * 「<」と「>」のみサニタイズする
	 * 
	 * @param any data サニタイズ対象データ | 値および配列を指定
	 * @returns サニタイズ後のデータ
	 */
	_xss_sanitize(data){
		if(typeof data == 'object'){
			for(var i in data){
				data[i] = _xss_sanitize(data[i]);
			}
			return data;
		}
		
		else if(typeof data == 'string'){
			return data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}
		
		else{
			return data;
		}
	}
	
	
	
	/**
	 * カレンダービューHTMLを組み立てる
	 * @param object カレンダーデータ
	 * @param function callback カレンダーセル作成のコールバック
	 * @param string 基準月初日
	 * @return string カレンダービューHTML
	 */
	_buildCalendarViewHtml(calData, callback, base_month_start){
		
		// 年月を取得
		var dt1 = new Date(base_month_start);
		var ym = dt1.getFullYear() + '-' + (dt1.getMonth() + 1);

		var html = "<table class='calendar_view_k'><caption>" + ym + "</caption><thead><tr>";
		
		// ▼ 列部分の日 ～ 土を作成
		var weeks = [
			{'code':'sun', 'wamei':'日'}, 
			{'code':'mon', 'wamei':'月'}, 
			{'code':'tue', 'wamei':'火'}, 
			{'code':'wed', 'wamei':'水'}, 
			{'code':'thu', 'wamei':'木'}, 
			{'code':'fri', 'wamei':'金'}, 
			{'code':'sat', 'wamei':'土'}
			];
		for(var w_i in weeks){
			var week_wamei = weeks[w_i]['wamei'];
			var week_code = weeks[w_i]['code'];
			var th_class = 'cvk_' + week_code;
			html += "<th class='" + th_class + "'>" + week_wamei + "</th>";
		}
		html += "</tr></thead><tbody>";
		
		// ▼セル部分を作成
		for(var w_i in calData){
			var wData = calData[w_i];
			html += "<tr>";
			for(var key_date in wData){
				var ent = wData[key_date];
				
				// 日, 曜日番号, 曜日コードを取得する
				var cellDate = new Date(key_date);
				var day = cellDate.getDate();
				var week_no = cellDate.getDay();
				var week_code = weeks[week_no]['code'];
				
				// クラス属性・曜日
				var day_class = 'cvk_' + week_code;
				
				// クラス属性・当月外
				if(ent['cur_month_flg'] == 0) day_class = 'cvk_out_this_month';
				
				// セル内容をコールバック関数にて作成
				var cell_contents = callback(ent, this);

				html += 
					"<td><div class='cvk_cell'>" +
					"<div class='cvk_cell_div1 " + day_class + "'>" + day + "</div>" +
					"<div class='cvk_cell_div2'> " + week_code + " </div>" +
					"<div class='cvk_cell_div3'>" + cell_contents +  "</div>" +
					"</div></td>";
			}
			html += "</tr>";
		}
		
		html += "</tbody></table>";
		return html;
	}
	
	
	/**
	 * カレンダーデータの週ごとに構造変換する
	 * @param object calData カレンダーデータ
	 * @return object 構造変換後のカレンダーデータ
	 */
	_weekStructConv(calData){
		
		var calData2 = [];
		var mw_i = 0;
		var w_i = 0;
		for(var date_key in calData){

			var calEnt = calData[date_key];
	
			if(calData2[mw_i] == null){
				// 第4週以降の日曜日が来月日付になっているならただちに終了する。
				if(mw_i >= 4 && calEnt['cur_month_flg'] == 0){
					return calData2;
				}
				
				calData2[mw_i] = {};
			}
			calData2[mw_i][date_key] = calEnt;
			
			w_i ++;
			if(w_i == 7){
				mw_i ++;
				w_i = 0;
			}
		}
		return calData2;
	}
	

	/**
	 * カレンダーデータに日付集計データをマッピングする
	 * @param object calData カレンダーデータ
	 * @param object dataA 日付集計データ
	 * @return object 日付集計データをマッピングしたカレンダーデータ
	 */
	_mappingToCalData(calData, dataA){
		
		for(var key_date in calData){
			if(dataA[key_date] != null){
				calData[key_date]['ents'] = dataA[key_date];
			}
		}
		
		return calData;
	}
	
	
	
	/**
	 * カレンダーデータのフォーマットを作成する。
	 * @param string base_month_start 基準月初日
	 * @param string base_month_end 基準月末日
	 * @return object カレンダーデータのフォーマット
	 */
	_createCalendarDataFormat(base_month_start, base_month_end){

		var bmsDate = new Date(base_month_start); // 日付オブジェクトに変換する
		
		var cur_year = bmsDate.getFullYear(); // 当年
		var cur_month_no = bmsDate.getMonth(); // 当月番号(0～11)
		
		// 曜日番号を取得する
		var week_no = bmsDate.getDay(); // 0～6(日～土)

		// スタート外部日付を算出
		var sodDate = new Date(base_month_start); // スタート外部日付オブジェクト
		sodDate.setDate(sodDate.getDate() - week_no); // スタート外部日付を算出
		var start_out_date = this._convDateToYMD(sodDate); // スタート外部日付
		
		// カレンダーデータのフォーマットを作成
		var calData = {}; // カレンダーデータ
		var dt = new Date(start_out_date);
		for(var i=0; i<42; i++){
			
			// 当月フラグ：当月なら1, 先月、次月なら0
			var cur_month_flg = 0;
			if(dt.getFullYear() == cur_year && dt.getMonth() ==cur_month_no){
				cur_month_flg = 1;
			}
			
			// フォーマットをセット
			var key_date = this._convDateToYMD(dt);
			calData[key_date] = {
					'index':i,
					'date':key_date,
					'cur_month_flg':cur_month_flg,
			}
			dt.setDate(dt.getDate() + 1);
		}

		return calData;
	}
	
	
	/**
	 * データ中の日付データを整形する
	 * @param object data 一覧テーブルからのデータ
	 * @param string date_field 日付フィールド
	 * @param object 日付を整形したデータ
	 */
	_shapingDateInData(data, date_field){
		for(var i in data){
			var ent = data[i];
			ent[date_field] = this._shapingDate(ent[date_field]); // 日付整形
		}
		return data;
	}
	
	/**
	 * 基準月初日を取得する
	 * @param object data 一覧テーブルからのデータ
	 * @param string date_field 日付フィールド
	 * @return string 基準月初日
	 */
	_getBaseMonthStart(data, date_field){
		
		// データ中に最初に登場する日付を取得し、その日付の月初日を基準月初日として取得する。
		for(var i in data){
			var ent = data[i];
			if(ent[date_field] != null){
				var base_month_start = ent[date_field];
				base_month_start = this._getMonthStartDate(base_month_start); // 対象日付の月初日を取得
				return base_month_start;
			}
		}
		
		return null;
	}
	
	/**
	 * 対象日付の月初日を取得
	 * @param mixed date1 対象日付
	 * @return string 対象日付の月初日
	 */
	_getMonthStartDate(date1){
		if(date1 == null) return null;
		if((typeof date1) == 'string'){
			date1 = new Date(date1);
		}
		
		var year = date1.getFullYear();
		var month = date1.getMonth() + 1;
		var date_str = year + '-' + month + '-1';
		return date_str;
	}
	
	/**
	 * 対象日付の月末日を取得する
	 * @param mixed date1 対象日付
	 * @return string 月末日
	 */
	_getMonthEndDate(date1){
		if(date1 == null) return null;
		if((typeof date1) == 'string'){
			date1 = new Date(date1);
		}

		// 月末日の算出
		var mEndDate = new Date(date1.getFullYear(), date1.getMonth() + 1, 0);
		
		var year = mEndDate.getFullYear();
		var month = mEndDate.getMonth() + 1;
		var day = mEndDate.getDate();
		var date_str = year + '-' + month + '-' + day;
		return date_str;
	}
	
	/**
	 * データを日付で集計する
	 * @param object data 一覧テーブルからのデータ
	 * @param string date_field 日付フィールド
	 * @return object 日付集計データ
	 */
	_aggByDateField(data, date_field){
		
		var dataA = {}; // 日付集計データ
		for(var i in data){
			var ent = data[i];
			var date1 = ent[date_field];

			if(date1 == null) continue;
			if(dataA[date1] == null) dataA[date1] = [];
			dataA[date1].push(ent);
		}
		
		return dataA;
		
	}
	
	/**
	 * 日付整形
	 * @param date1 整形前日付
	 * @return string 整形後日付
	 */
	_shapingDate(date1){
		if(date1 == null) return null;
		
		if((typeof date1) == 'string'){
			date1 = new Date(date1);
		}
		var date1 = this._convDateToYMD(date1);
		return date1;
		
	}
	
	/**
	 * 日付オブジェクトを「y-m-d」形式の日付書式に変換する
	 * @param Date date1 日付オブジェクト
	 * @returns string 「y-m-d」形式の日付文字列
	 */
	_convDateToYMD(date1){
		var year = date1.getFullYear();
		var month = date1.getMonth() + 1;
		var day = date1.getDate();
		var date_str = year + '-' + month + '-' + day;
		return date_str;
	}
	
	
}