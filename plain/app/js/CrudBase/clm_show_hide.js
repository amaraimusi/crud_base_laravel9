/**
 * 列表示切替クラス 
 * 
 * 初期化(init)を実行すると、対象HTMLテーブルの列から、列表示切替チェックボックスを自動生成します。
 * 列表示切替チェックボックスにチェックを入れると列の表示を切り替えられます。
 * 
 * ◇主なメソッド
 * - init 初期化
 * - refresh 一覧テーブルをリフレッシュする
 * 
 * @version 1.6.1
 * @date 2014-4-1 │ 2020-6-16
 * @license MIT
 * @author k-uehara 
 */
var ClmShowHide =function(){


	/// コールバック関数用
	var my=this;
	
	/// プロパティ
	this.props={};

	/// デフォルト列データ
	this.defClmData={};
	
	// アクティブ列データ
	this.actClmData={};
	
	
	/**
	 * 初期化
	 * @param tblId 対象テーブルのID属性
	 * @param chBoxsId 列表示切替チェックボックス群を出力する要素を指定
	 * @param iniClmData 初期列表示配列 例→iniClmData=[-1,1,0,0,0,1];// -1:機能無効  0:非表示  1:表示
	 * @param unique 画面毎に異なる一意なコード。省略時は引数tblIdを使用する。
	 *
	 */
	this.init=function(tblId,chBoxsId,iniClmData,unique){

		//引数をメンバのプロパティにセットする。
		this.props['tblId']=tblId;
		this.props['chBoxsId']=chBoxsId;
		this.props['unique']=unique;


		if(unique==null){
			unique=tblId;
		}
		
		// デフォルト列データを作成する
		var defClmData=[];
		for(var i=0;i < iniClmData.length ;i++){
			var show_flg=iniClmData[i];

			var clm_ent={'clm_name':null,'show_flg':show_flg};
			defClmData[i]=clm_ent;
			

		}
		
		
		// テーブルヘッダー要素から列名を取得して、デフォルト列データにセットする。
		var i=0;
		$.each(jQuery('#' + tblId + " thead tr th"), function() {

			var clm_name=jQuery(this).html();
			try{
				defClmData[i]['clm_name']=clm_name;
			}catch( e ){
				return;
			}

			i++;
		});


		// ローカルストレージから列JSONを取得する
		var j_clmData=localStorage.getItem(unique + '_clmData');
		

		
		// ローカルストレージに列JSONが存在しない場合、デフォルトをアクティブ列データにコピーする
		var actClmData={};// アクティブ列データ
		if(j_clmData =='' || j_clmData==null){
			actClmData = $.extend(true, {}, defClmData);
		}
		
		// ローカルストレージに列JSONが存在する場合、列JSONをパースしてアクティブ列データにセットする
		else{
			actClmData=JSON.parse(j_clmData);
		}


		// メンバへ列データをセットする
		this.defClmData = defClmData;
		this.actClmData = actClmData;
		
		// 列名からタグを除去する
		actClmData = _removeTagOfClmName(actClmData);


		//列表示チェックボックスを作成
		createClmShowCheckBox_csh(tblId,chBoxsId,actClmData);


		//列表示チェックボックスのクリックイベント。
		jQuery(".csh_cb").click(function(event){
			var checked=jQuery(this).prop('checked');
			var index=jQuery(this).attr('index');

			//列表示の切替処理
			if(checked==true){
				my.clm_show_csh(tblId,index);//列表示
			}else{
				my.clm_hide_csh(tblId,index);//列非表示
			}

		});


		//列表示切替
		for (var i in actClmData) {
			var clm_ent=actClmData[i];

			//表示フラグ＝0ならその列を非表示にする。
			if(clm_ent.show_flg==0){

				this.clm_hide_csh(tblId,i);//インデックスに紐づく列を非表示にする
			}

		}


		//保存ボタンにイベントを追加。
		jQuery("#" + tblId + "_save_btn").click(function(event){

			//列の表示状態をローカルストレージに保存
			saveClmData(tblId,chBoxsId,unique);

		});

		//「すべてチェック」ボタンにイベントを追加。
		jQuery("#" + tblId + "_all_checked_btn").click(function(event){

			//すべての列表示チェックボックスにチェックを入れる。
			allChecked(tblId,chBoxsId,my.actClmData);

		});

		//「すべてはずす」ボタンにイベントを追加。
		jQuery("#" + tblId + "_all_uncheck_btn").click(function(event){

			//すべての列表示チェックボックスからチェックをはずす
			allUnchecke(tblId,chBoxsId,my.actClmData);

		});

		//「初期に戻す」ボタンにイベントを追加。
		jQuery("#" + tblId + "_default_btn").click(function(event){

			//列表示チェックボックスを初期状態に戻す。
			defaultClmCb(tblId,chBoxsId,unique);

		});


	};
	
	/**
	 * 列表示配列を取得
	 * 
	 * 列表示チェックボックスから列表示配列を取得する。
	 * @return 列表示配列
	 * 
	 */
	this.getCshAry = function(){
		
		// チェックボックス群要素のjQueyオブジェクトを取得する
		var chBox = jQuery('#' + my.props.chBoxsId);
		
		

		var csh_ary=[];

		//列表示切替チェックボックス群から列データの表示フラグにセットする。
		for (var i in this.defClmData) {

			// チェックボックス要素を取得する
			var cb = chBox.find("[index=" + i + "]");
			if(cb[0]){
				var checked= cb.prop('checked');
	
				if(checked==true){
					csh_ary.push(1);
				}else{
					csh_ary.push(0);
				}
			}
		}
		
		return csh_ary;
	};
	
	/**
	 * 列表示切替情報を初期状態にリセットする
	 * 
	 * ローカルストレージ内の値もクリアする。
	 */
	this.reset=function(){
		
		//列表示チェックボックスを初期状態に戻す。
		defaultClmCb(this.props.tblId,this.props.chBoxsId,this.props.unique);

	};
	
	/**
	 * 一覧テーブルをリフレッシュする。
	 * 何らかの処理で崩れたテーブルを、現在の列表示状態に戻す。
	 */
	this.refresh=function(){
		
		var tblId = this.props.tblId;
		
		//一旦、列をすべて表示する
		for (var i in this.defClmData) {
			this.clm_show_csh(tblId,i);//列を表示
		}
		
		var clmData = getClmDataFromCheckbox();//列表示切替チェックボックス群から列データを取得する。
		
		for (var i in clmData) {
			
			var show_flg=clmData[i].show_flg;
			
			if(show_flg==1){
				this.clm_show_csh(tblId,i);//列表示
			}else if(show_flg==0){
				this.clm_hide_csh(tblId,i);//列非表示
			}

		}
		
		
	}
	
	
	/**
	 * 列名からタグを除去する
	 * @parma array actClmData 列データ
	 * @return array 列名からリンク部分を除去した列データ
	 */
	function _removeTagOfClmName(actClmData){

		for(let i in actClmData){
			let ent =actClmData[i];
			let clm_name = ent.clm_name;
			if(clm_name == null) clm_name = '';
			
			// 列名からタグを除去
			ent.clm_name = clm_name.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,'');
		}
		
		return actClmData;
	}



	/**
	 * 列表示チェックボックスを初期状態に戻す
	 */
	function defaultClmCb(tblId,chBoxsId,unique){
		
		// チェックボックス群要素のjQueyオブジェクトを取得する
		var chBox = jQuery('#' + my.props.chBoxsId);
		
		for(var i in my.defClmData){

			
			var ent = my.defClmData[i]
			var show_flg = ent.show_flg;
			
			var cb = chBox.find("[index=" + i + "]");

			if(cb[0]){
				if(show_flg==1){
					cb.prop('checked',true);
					my.clm_show_csh(tblId,i);//列表示
				}else if(show_flg==0){
					cb.prop('checked',false);
					my.clm_hide_csh(tblId,i);//列非表示
				}
			}

		}

		//ローカルストレージの列データをクリア
		var storage = localStorage;
		storage.removeItem(unique + '_clmData');


	};


	/**
	 * すべての列表示チェックボックスにチェックを入れる
	 */
	function allChecked(tblId,chBoxsId,clmData){
		
		// チェックボックス群要素のjQueyオブジェクトを取得する
		var chBox = jQuery('#' + my.props.chBoxsId);
		
		for (var i in clmData) {

			// チェックボックス要素を取得する
			var cb = chBox.find("[index=" + i + "]");

			if(cb[0]){
				var checked= cb.prop('checked');
	
				if(checked==false){
					cb.prop('checked',true);//列表示チェックボックスにチェックを入れる。
					my.clm_show_csh(tblId,i);//列を表示
				}
			}


		}

	};


	/**
	 * すべての列表示チェックボックスからチェックをはずす
	 */
	function allUnchecke(tblId,chBoxsId,clmData){
		
		// チェックボックス群要素のjQueyオブジェクトを取得する
		var chBox = jQuery('#' + my.props.chBoxsId);
		
		for (var i in clmData) {

			// チェックボックス要素を取得する
			var cb = chBox.find("[index=" + i + "]");

			if(cb[0]){
				var checked= cb.prop('checked');
	
				if(checked==true){
					cb.prop('checked', false);//列表示チェックボックスにチェックをはずす
					my.clm_hide_csh(tblId,i);//列を隠す
				}
			}
		}

	};


	/**
	 * 列の表示状態をローカルストレージに保存
	 */
	function saveClmData(tblId,chBoxsId,unique){

		var clmData = getClmDataFromCheckbox(); //列表示切替チェックボックス群から列データを取得する。

		//ローカルストレージに列データを保存
		var j_clmData=JSON.stringify(clmData);
		localStorage.setItem(unique + '_clmData',j_clmData);

		jQuery('#csh_msg').show();
		jQuery('#csh_msg').fadeOut(3000);
	};




	/**
	 * チェックボックス群を生成する
	 * @param tblId テーブルのID属性
	 * @param chBoxsId チェックボックス群要素のID属性
	 * @param clmData 列データ
	 */
	function createClmShowCheckBox_csh(tblId,chBoxsId,clmData){
		var cbs=jQuery("#" + chBoxsId);
		cbs.empty();

		for (var i in clmData) {
			
			var clm_ent=clmData[i];
			
			if(clm_ent.show_flg == -1){
				continue;
			}

			var checked='';
			if(clm_ent.show_flg==1){
				checked='checked'
			}
			let xid = 'csh_cb' + i;
			var cb="<div class='csh_cb_div'><input id='" + xid + "' type='checkbox' class='csh_cb' " + checked + " index='" + i + "' /><label for='" + xid + "'>"  + clm_ent['clm_name'] + "</label></div>";

			cbs.append(cb);
		}

		cbs.append("<div style='clear:both'></div>");

		//列表示保存ボタンを作成
		var saveBtn="<div class='csh_func_btn'><input type='button' value='列表示を保存' id='" + tblId + "_save_btn' class='btn btn-primary btn-sm' /></div>";
		cbs.append(saveBtn);

		//すべてチェックボタンを作成
		var allCheckedBtn="<div class='csh_func_btn'><input type='button' value='すべてチェック' id='" + tblId + "_all_checked_btn' class='btn btn-primary btn-sm' /></div>";
		cbs.append(allCheckedBtn);
		
		//すべてはずすボタンを作成
		var allUncheckBtn="<div class='csh_func_btn'><input type='button' value='すべてはずす' id='" + tblId + "_all_uncheck_btn' class='btn btn-primary btn-sm' /></div>";
		cbs.append(allUncheckBtn);		

		//「初期に戻す」ボタンを作成
		var defaultBtn="<div class='csh_func_btn'><input type='button' value='初期に戻す' id='" + tblId + "_default_btn' class='btn btn-primary btn-sm' /></div>";
		cbs.append(defaultBtn);


		cbs.append("<div id='csh_msg' class='csh_func_btn' style='display:none;color:#de5246'>列の表示状態を記憶しました。</div>");

	};

	//列表示
	this.clm_show_csh=function(tblId,index){


		var th=jQuery("#" + tblId + " thead tr th").eq(index);
		th.show();

		$.each(jQuery("#" + tblId + " tbody tr"), function() {

			var td=jQuery(this).children();
			td.eq(index).show();

		});

	};



	//列非表示
	this.clm_hide_csh=function(tblId,index){
		var th=jQuery("#" + tblId + " thead tr th").eq(index);
		th.hide();

		$.each(jQuery("#" + tblId + " tbody tr"), function() {

			var td=jQuery(this).children();
			td.eq(index).hide();

		});
	};

	/**
	 * 列表示切替チェックボックス群から列データを取得する。
	 */
	function getClmDataFromCheckbox(){

		// チェックボックス群要素のjQueyオブジェクトを取得する
		var chBox = jQuery('#' + my.props.chBoxsId);

		// アクティブ列データを取得する
		var clmData = my.actClmData;

		//列表示切替チェックボックス群から列データの表示フラグにセットする。
		for (var i in clmData) {

			// チェックボックス要素を取得する
			var cb = chBox.find("[index=" + i + "]");
			
			// チェック状態を取得し、列データにセットする
			if(cb[0]){
				var checked= cb.prop('checked');
	
				if(checked==true){
					clmData[i]['show_flg'] = 1;
				}else{
					clmData[i]['show_flg'] = 0;
				}
			}
		}
		
		return clmData;
		
		
	};

};












