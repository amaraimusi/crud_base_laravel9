<?php
require_once('IDao.php');
use Google\Cloud\Translate\TranslateClient;

/**
 * Google翻訳API・キャッシュ機能拡張
 * 
 * @date 2019-1-28 | 2019-2-2
 * @version 1.0.2
 */
class CbGtaCash{

	var $dao;
	
	//Google APIの「プロジェクトID」
	var $project_id;
	
	//「Google Cloud Translation API」の「APIキー」
	var $api_key;
	
	/**
	 * コンストラクタ
	 * @param IDao $dao データベースアクセスオブジェクト
	 */
	public function __construct(IDao &$dao, $project_id, $api_key){
		$this->dao = $dao;
		$this->project_id = $project_id;
		$this->api_key = $api_key;
	}
	
	
	/**
	 * 翻訳処理
	 * 
	 * @note DBに翻訳済みのデータがあればそれを返し、なければAPIで翻訳を実行する
	 * @param array $param
	 *  - page_code ページコード
	 *  - xid ID属性
	 *  - lang 言語コード
	 *  - ja_text 日本語テキスト
	 *  @return array 翻訳データ
	 */
	public function execute(&$param){
		
		$res = null;
		$action_code = $param['action_code'];
		if($action_code == 'get_cash'){
			$res = $this->getCashAction($param); // キャッシュ翻訳アクション
		}else if($action_code == 'api_transe'){
			$res = $this->apiTranseAction($param); // API翻訳アクション
		}
		
		return $res;
	}
	
	
	/**
	 * キャッシュ翻訳アクション
	 * @param array $param
	 * @return array 翻訳データ
	 */
	private function getCashAction(&$param){
		
		$page_code = $param['page_code']; // ページコード
		$data = $param['data']; // 日本語テキストデータ
		$lang = $param['lang']; // 言語コード
		
		foreach($data as $i => $ent){
			$xid = $ent['xid']; // ID属性
			$exiEnt = $this->getEntityFromDb($page_code, $xid, $lang);// DBから既存エンティティを取得する
			
			$t_cash_flg = 0; // 翻訳キャッシュフラグ  0:翻訳テキストなし, 1:翻訳テキストあり
			// 既存エンティティが空である場合
			if(!empty($exiEnt)){
				
				// 既存・日本テキストを取得し、SQLインジェクションサニタイズをデコードする。
				$exi_ja_text = $exiEnt['ja_text'];
				$exi_ja_text = stripslashes($exi_ja_text);
				
				// 一致率を判定（ブラウザの違いがあるだけで文字は完全一致とならない）
				$str1=$ent['ja_text'];
				$str2=$exi_ja_text;
				$percent=null;//一致率
				$str1 = strip_tags($str1);// タグを抜く
				$str2 = strip_tags($str2);
				similar_text($str1,$str2,$percent);//一致率を取得
	
				
				// リクエスト・日本テキストと既存・日本語テキストが95%以上、一致するなら翻訳キャッシュフラグをONにする。
 				if($percent >= 95){
					$t_cash_flg = 1;
					$ent['trans_text'] = $exiEnt['trans_text'];
				}
			}
			
			$ent['t_cash_flg'] = $t_cash_flg;
			unset($ent['ja_text']); // 日本語テキストは通信容量節約のため除去
			$data[$i] = $ent;
			
		}
		
		return $data;
	}
	
	
	/**
	 * API翻訳アクション
	 * @param array $param
	 * @return array 翻訳データ
	 */
	private function apiTranseAction(&$param){
		
		$page_code = $param['page_code']; // ページコード
		$xid = $param['xid']; // ID属性
		$lang = $param['lang']; // 言語コード
		$ja_text = $param['ja_text']; // 日本語テキスト
		
		//「TranslateClient」クラスを呼び出し
		$translate = new TranslateClient([
				'projectId' => $this->project_id,
				'key' => $this->api_key,
		]);

		//翻訳開始
		$res = $translate->translate($ja_text, array('target' => $lang));
		$trans_text = $res['text'];
		$param['trans_text'] = $trans_text;
		
		// DB保存
		$this->reg($page_code, $xid, $lang, $ja_text, $trans_text);
		
		return $param;
	}
	
	
	/**
	 * DB保存
	 * @param string $page_code ページコード（ページごとのユニークキー）
	 * @param string $xid ID属性
	 * @param string $lang 言語コード
	 * @param string $ja_text 日本語テキスト
	 * @param string $trans_text 翻訳テキスト
	 */
	private function reg($page_code, $xid, $lang, $ja_text, $trans_text){
		
		// `cb_gta_cashs テーブル`
		// `id` int(11) NOT NULL,
		// `page_code` varchar(64) DEFAULT NULL COMMENT 'ページコード',
		// `xid` varchar(64) DEFAULT NULL COMMENT 'ID属性',
		// `lang` varchar(8) DEFAULT NULL COMMENT '言語コード',
		// `ja_text` text COMMENT '日本語テキスト',
		// `trans_text` text COMMENT '翻訳テキスト',
		// `ip_addr` varchar(40) DEFAULT NULL COMMENT 'IPアドレス',
		// `created` datetime DEFAULT NULL COMMENT '生成日時',
		// `modified` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日'
		
		// SQLインジェクションサニタイズ
		$ja_text = addslashes($ja_text);
		$trans_text = addslashes($trans_text);
		
		$ent = $this->getEntityFromDb($page_code, $xid, $lang); // DBから翻訳データのエンティティを取得する
		$ip_addr = $_SERVER["REMOTE_ADDR"];//IPアドレス取得
		$created = date('Y-m-d H:i:s'); // 生成日時
		
		$sql = "";
		if(empty($ent)){
			// INSERT
			$sql = "INSERT INTO cb_gta_cashs (page_code, xid, lang, ja_text, trans_text, ip_addr, created) 
						VALUES ('{$page_code}', '{$xid}', '{$lang}', '{$ja_text}', '{$trans_text}', '{$ip_addr}', '{$created}');";
			
		}else{
			// UPDATE
			$sql = "UPDATE cb_gta_cashs SET 
						page_code='{$page_code}',  xid='{$xid}',  lang='{$lang}', 
						ja_text='{$ja_text}',  trans_text='{$trans_text}',  ip_addr='{$ip_addr}' 
  						WHERE id = {$ent['id']};";
		}
		
		$res = $this->dao->sqlExe($sql); // 登録SQLを実行
		
		return $res;
	}
	
	
	
	/**
	 * DBから翻訳データのエンティティを取得する
	 * @param string $page_code ページコード（ページごとのユニークキー）
	 * @param string $xid ID属性
	 * @param string $lang 言語コード
	 * @return array 翻訳データのエンティティ
	 */
	private function getEntityFromDb($page_code, $xid, $lang){
		$sql = "SELECT * FROM cb_gta_cashs WHERE
				 page_code='{$page_code}' AND xid='{$xid}' AND lang='{$lang}'";
		
		$res = $this->dao->sqlExe($sql);
		
		if(empty($res)) return null;

		return $res[0]['cb_gta_cashs'];
		
	}
	

	
	
	
}