<?php



/**
 * リロード対策クラス
 * 
 * ブラウザでリロードやF5キーを押した時の対策用です。
 * リロード対策することにより、新規登録系の登録完了画面で、リロードされたとき2重登録されないようにします。
 * 
 * 当クラスだけは対策はできません。
 * JavaScriptとビューファイル側にも記述が必要です。下記の「このクラスを使う上での準備」を参考に記述してください。
 * 
 * 
 * @date 2011/7/21 新規作成
 * @date 2014/6/6 empty参照によるバグを修正。キー名をreloadに統一。説明書きも更新。
 * 
 * @author k-uehara
 * 
 * ------------------ このクラスを使う上での準備  ---------------------------
 * 
 * 1.入力画面のビューに、以下のJavaScriptをページに埋め込むこと。
 * 
 * 	 //▼リロード対策（サブミット時に呼び出す）
 * 	function reload2(){
 *  	var d=new Date;
 * 		jQuery('#reload').val(d);
 * 	}
 * 
 * 2.入力画面のサブミット時に上記のreload2()関数を呼び出すこと。
 * 
 * 	例1：<form onsubmit="reload2(); ...
 * 	例2：<input type="submit" value="実行" onclick="reload2();"/>
 * 
 * 3.入力画面のform1内に、以下のhiddenエレメントを埋め込むこと
 * 
 * 	<input type="hidden" id="reload" name="reload" value="" />
 * 
 * 4.結果画面は当クラスを生成して、check()メソッドを呼び出せば、リロードかそうでなかが分かる。
 * 
 * 	※注意
 * 	１回のリクエスト処理中に２回以上、check()を呼び出さないこと。２回目に呼び出された場合、リロード中として返すため。
 * 
 * 
 * 
 * 
 * 
 * 
 * ------------------ 処理の流れを解説 -------------------------------------------------
 * 
 * 入力画面のサブミットボタンを押すと結果画面に遷移される流れについて。
 *
 * 1.入力画面が表示する。このときには何も行われない。
 *
 * 2.入力画面でサブミットを押す。POSTのreloadに現在日時をセット。そして結果画面へ。
 *
 * 3.結果画面の表示。当クラスのcheck()を呼び出す。
 *   sessin内にreload値が入っていないのを確認したらリロードでないと判定する。
 *   この際、sessionにPOSTから送られてきたreload値をセット。
 *
 * 4.結果画面でリロードをした。
 *   session内にreload値とpostのreload値を比較し同じならリロードと判定する。
 *   この時にもsessionにPOSTから送られてきたreload値をセット。
 *
 * 5.もう一度、入力画面から入力しサブミット
 *   POSTのreloadに新しい現在日時をセット。そして結果画面へ。
 *
 * 6.結果画面の表示。当クラスのcheck()を呼び出す。
 *   session内にreload値とpostのreload値を比較する。
 *   異なる日付になっているはずなので、リロードでないと判定。
 *   "3."と同様に、sessionにPOSTからのreload値をセット。
 *   リロードしても"4."と同じ状態になる。
 *
 * 7.直接結果画面が呼び出される場合。
 *   本来このクラスが行うリロードの処理ではないが、一応リロード判定する。
 *   POST内にreload値が入っていない時点でリロードと即判定。
 * 
 * 
 * 
 * 
 */
class ReloadCheck{


	/**
	 * リロードチェック
	 * 
	 * @return int チェック結果 -1:直接アクセス,0:リロード,1:リロード以外のアクション
	 */
	public function check(){


		$p_r=null;

		//POSTのreload値が空のときは、直接アクセスと判定。
		if (empty($_POST['reload'])){

			return -1;
		}else{
			$p_r=$_POST['reload'];
		}

		if( !isset($_SESSION) ) {
			session_start();
		}

		//セッションのreload値が空である場合、リロードでないと判定。
		if (empty($_SESSION['reload'])){

			$_SESSION['reload']=$p_r;
			return 1;
		}else{
			$s_r=$_SESSION['reload'];
		}



		//POSTのreload値とSESSIONのreload値が同じである場合、リロードと判定する。
		if($s_r==$p_r){

			$_SESSION['reload']=$p_r;
			return 0;


		//POSTのreload値とSESSIONのreload値が同じである場合、リロードでない判定する。
		}else{

			$_SESSION['reload']=$p_r;
			return 1;
		}


	}
}