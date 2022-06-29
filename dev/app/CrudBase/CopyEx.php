<?php
/**
 * 拡張ファイルコピー。
 * 日本語ファイル名のファイルコピーとディレクトリ作成コピーができる。
 *
 * ディレクトリ存在チェックメソッドを備える。
 * ディレクトリ内のファイルをすべて削除するメソッドを備える。
 *
 * @version 2.3
 * ★履歴
 * 2010/10/22	新規作成
 * 2015/8/6		リニューアル
 * 2015/8/10	dirClearメソッドを追加
 * 2016/10/27	copyにコピー成功可否レスポンスを追加する
 * 2017/2/21	パーミッションに対応
 *
 * @author uehara
 */
class CopyEx{

	public  function __construct(){
		
	}

	/**
	 * 拡張コピー　存在しないディテクトリも自動生成
	 * 日本語ファイルに対応
	 * @param string $sourceFn コピー元ファイル名
	 * @param string $copyFn コピー先ファイル名
	 * @param int $permission ディレクトリまたはファイルのパーミッション
	 * @return true:コピー成功  false:コピー失敗
	 */
	public function copy($sourceFn,$copyFn,$permission = 0777){

		$res = null;
		
		//フルファイル名からパスを取得する。
		$di=dirname($copyFn);

		//コピー先ファイル名とコピー元ファイル名が同名であれば、Nullを返して処理を終了
		if($sourceFn==$copyFn){
			return null;
		}

		//ディレクトリが存在するかチェック。
		if ($this->is_dir_ex($di)){

			//存在するならそのままコピー処理
			$sourceFn=mb_convert_encoding($sourceFn,'SJIS','UTF-8');
			$copyFn=mb_convert_encoding($copyFn,'SJIS','UTF-8');
			$res = @copy($sourceFn,$copyFn);
			if($res){
				chmod($copyFn,$permission);
			}

			
		}else{

			//存在しない場合。
			//パスを各ディレクトリに分解し、ディレクトリ配列をして取得する。
			$ary=explode('/', $di);
			//ディレクトリ配列の件数分以下の処理を繰り返す。
			$iniFlg=true;
			foreach ($ary as $key => $val){

				//作成したディレクトリが存在しない場合、ディレクトリを作成
				if ($iniFlg==true){
					$iniFlg=false;
					$dd=$val;
				}else{
					$dd.='/'.$val;
				}

				if (!($this->is_dir_ex($dd))){
					mkdir($dd,$permission);//ディレクトリを作成
					chmod($dd,$permission);
				}

			}

			$sourceFn=mb_convert_encoding($sourceFn,'SJIS','UTF-8');
			$copyFn=mb_convert_encoding($copyFn,'SJIS','UTF-8');
			$res = @copy($sourceFn,$copyFn);//ファイルをコピーする。
			chmod($copyFn,$permission);

		}
		
		return $res;
	}


	/**
	 * 日本語ディレクトリの存在チェック
	 * @param string $dn	ディレクトリ名
	 * @return boolean	true:存在	false:未存在
	 */
	public function is_dir_ex($dn){
		$dn=mb_convert_encoding($dn,'SJIS','UTF-8');
		if (is_dir($dn)){
			return true;
		}else{
			return false;
		}
	}


	/**
	 * ディレクトリ内のファイルをまとめて削除する。
	 * @param string $dir_name ファイル削除対象のディレクト名
	 * @return
	 */
	public function dirClear($dir_name){
		//フォルダ内のファイルを列挙
		$files = scandir($dir_name);
		$files = array_filter($files, function ($file) {
			return !in_array($file, array('.', '..'));
		});

			foreach($files as $fn){
				$ffn=$dir_name.'/'.$fn;
				try {
					unlink($ffn);//削除
				} catch (Exception $e) {
					throw e;
				}
			}

			return true;
	}

}