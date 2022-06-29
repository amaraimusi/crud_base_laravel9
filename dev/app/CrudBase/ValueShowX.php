<?php

/**
 * 値の指定表記クラス
 * 
 * @note
 * 値を指定した表記型に変換するクラス。
 * 値をサニタイズして表示したり、金額表記で表示したりする。
 * 
 * @link 
 * Config/crud_base_config.phpの定数を仕様しています。
 * 
 * @version 1.2
 * @date 2016-2-5 新規作成
 * @author k-uehara
 *
 */
class ValueShowX{
	
	/**
	 * 値を指定した表記型に変換する。(ctpへの表示用）
	 *
	 * @param array $ent エンティティ
	 * @param string $key エンティティのキー
	 * @param int $type	0(省略):空対応のみ	1:XSSサニタイズ	2:金額表記	3:有無フラグ用	4:改行文字対応 5:長文字用 6:テキストエリア用
	 * @param array $option:オプションデータ $typeの値によって意味が変わる
	 * @return string 指定表記に変換した値
	 */
	public function show_x($ent,$key,$type=null,$option=array()){

		$v = ( isset($ent[$key]) ) ? $ent[$key] : null;

		if(!empty($option)){
			if(!empty($option[$v])){
				$v= $option[$v];
			}else{
				$v=null;
			}
		}


		switch ($type) {
			case null:
				break;

			case CB_FLD_SANITAIZE://サニタイズ
				$v=h($v);
				break;

			case CB_FLD_MONEY://金額表記

				if(!empty($v) || $v===0){
					$v= '&yen'.number_format($v);
				}

				break;

			case CB_FLD_DELETE_FLG://有無フラグ

				if($v==0){
					$v="<span style='color:#23d6e4;'>有効</span>";
				}elseif($ent['delete_flg']==1){
					$v="<span style='color:#b4b4b4;'>削除</span>";
				}
				break;

			case CB_FLD_BR://改行対応
				if(empty($v)){break;}

				$v= str_replace('\\r\\n', '<br>', h($v));
				$v= str_replace('\\', '', $v);
				break;

			case CB_FLD_BOUTOU://長文字用。テキストエリアなど長文字を指定文字数分表示。

				if(empty($v)){break;}

				$strLen=20;//表示文字数
				if(!empty($option)){
					$strLen=$option;
				}
				$v=mb_strimwidth($v, 0, $strLen, "...");
				$v= str_replace('\\r\\n', ' ', h($v));
				$v= str_replace('\\', '', $v);

				break;

			case CB_FLD_TEXTAREA://テキストエリア用（改行対応）
				if(empty($v)){break;}

				$v = str_replace('\\r\\n', '&#13;', h($ent[$key]));//サニタイズされた改行コードを「&#13;」に置換
				$v = str_replace('\\', '', $v);

				break;
				
			case CB_FLD_NULL_ZERO://nullは0表記
			
				if(empty($v)){
					$v = 0;
				}
			
				break;

			case CB_FLD_TA_CSV://テキストエリアCSV出力用
				if(empty($v)){break;}

				//CSVセル内の改行はLF（復帰）にする。
				$v = "\"".str_replace('\\r\\n', "\n", h($ent[$key]))."\"";

				break;
				
			default:
				break;
		}

		return $v;

	}
	
	
	
	
	
	
	
}