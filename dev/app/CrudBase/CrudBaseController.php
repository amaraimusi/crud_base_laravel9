<?php
require_once 'ICrudBaseStrategy.php';
require_once 'CrudBaseModel.php';
require_once 'HashCustom.php';
require_once 'PagenationEx.php';
/**
 * CRUD系画面用の基本クラス
 * 
 * CRUD系のコントローラはこちらを継承することにより、検索条件、ページネーション、ソートなどの開発が簡易になります。
 * 
 *
 */

class CrudBaseController {

	///バージョン
	public $version = "3.6.0";
	
	public $crudBaseData = [];

	///デフォルトの並び替え対象フィールド
	public $defSortFeild='sort_no';

	///デフォルトソートタイプ
	public $defSortType=0;//0:昇順 1:降順
	
	public $userInfo = []; // ユーザー情報

	///検索条件定義（要,オーバーライド）
	public $kensakuJoken=[];

	///検索条件のバリデーション（要,オーバーライド）
	public $kjs_validate = [];

	///フィールドデータ（要、オーバーライド）
	public $fieldData = [];

	///一覧列情報(ソート機能付	 $fieldDataの簡易版）
	public $table_fields=[];

	///編集エンティティ定義（要,オーバーライド）
	public $entity_info=[];

	///編集用バリデーション（要,オーバーライド）
	public $edit_validate = [];

	///巨大データ判定行数
	public $big_data_limit=501;

	//巨大データフィールド
	public $big_data_fields = [];
	
	public $this_page_version = '0.0';
	
	// バージョン情報
	public $verInfo = [];
	
	// -- ▽ 内部処理用
	private $m_kj_keys;//検索条件キーリスト
	private $m_kj_defs;//検索条件デフォルト値
	private $m_edit_keys;//編集エンティティキーリスト
	private $m_edit_defs;//編集エンティティのデフォルト値
	private $main_model_name=null;//対応付けるモデルの名称。（例→AnimalX)
	private $main_model_name_s=null;//モデル名のスネーク記法番(例→animal_x)
	private $whiteList=[]; // ホワイトリスト（save用）
	
	
	private $param; // CrudBaseパラメータ
	private $posts = []; // POSTデータ
	private $gets = []; // GETデータ
	private $strategy = null; // ICrudBaseStrategy.php フレームワーク・ストラテジー
	public $crudBaseModel; // CrudBaseModelクラス
	private $MainModel; // クライアントモデル
	
	
	/**
	 * 初期化
	 * 
	 * @param object $clientCtrl クライアントコントローラ
	 * @param object $clientModel クライアントモデル
	 * @param array $crudBaseData
	 *  - fw_type フレームワークタイプ	plain:プレーン(デフォルト), cake:cakephp2.x, wp:wordpress, laravel7:Laravel7
	 *  - model_name_c クライアントモデル名（キャメル記法）
	 *  - crud_base_path CrudBaseライブラリへのパス
	 *  - kensakuJoken array 検索条件情報
	 *  - kjs_validate array 検索条件バリデーション
	 *  - fieldData array フィールドデータ
	 *  - debug デバッグモード 0:OFF 1:OFF
	 *  - func_csv_export CSVエクスポート機能 0:OFF ,1:ON(デフォルト)
	 *  - sql_dump_flg SQLダンプフラグ   true:SQLダンプを表示（デバッグモードである場合。デフォルト） , false:デバッグモードであってもSQLダンプを表示しない。
	 *  - func_file_upload ファイルアップロード機能 0:OFF , 1:ON(デフォルト)
	 *  - $defPages デフォルトページ情報
	 */
	public function __construct(&$clientCtrl, &$clientModel, &$crudBaseData){
		
		$model_name = $crudBaseData['model_name_c'];
		$model_name_s= $this->snakize($model_name);
		
		global $crudBaseConfig;
		if(!empty($crudBaseConfig)){
			foreach($crudBaseConfig as $config_key => $config_value){
				$crudBaseData[$config_key] = $config_value;
			}
		}
	
		$crudBaseData['main_model_name'] = $model_name;
		$crudBaseData['main_model_name_s'] = $model_name_s;
		$crudBaseData['model_name_s'] = $model_name_s;
		
		$crudBaseData['defPages'] = $this->getDefPages($crudBaseData); // デフォルトページ情報を取得する
		
		if (empty($crudBaseData['tbl_name'])) $crudBaseData['tbl_name'] = $model_name_s . 's';;
		if (empty($crudBaseData['func_csv_export'])) $crudBaseData['func_csv_export'] = 1;
		if (empty($crudBaseData['sql_dump_flg'])) $crudBaseData['sql_dump_flg'] = true;
		if (empty($crudBaseData['func_file_upload'])) $crudBaseData['func_file_upload'] = 1;
		if (empty($crudBaseData['kensakuJoken'])) $crudBaseData['kensakuJoken'] = [];
		if (empty($crudBaseData['fieldData'])) $crudBaseData['fieldData'] = ['def'=>[]];
		
		if(empty($crudBaseData['debug'])) $crudBaseData['debug'] = 0; // デバッグモード
		$crudBaseData['fields'] = array_keys($crudBaseData['fieldData']['def']); // フィールドリスト
		
		$this->kensakuJoken = $crudBaseData['kensakuJoken']; // 検索条件情報
		$this->fieldData = $crudBaseData['fieldData']; // フィールドデータ
		$this->MainModel = $clientModel;
		
		$fw_type = $crudBaseData['fw_type']; // フレームワークタイプを取得

		$whiteList = array_keys($crudBaseData['fieldData']['def']); // ホワイトリストを取得

		// フレームワーク・ストラテジーの生成
		$this->strategy = $this->factoryStrategy($fw_type, $clientCtrl, $clientModel, $whiteList, $crudBaseData);

		// CrudBaseモデルクラスの生成
		$this->crudBaseModel = new CrudBaseModel([
				'strategy' => $this->strategy,
				'crudBaseData' => $crudBaseData,
		]); 
		
		$this->defSortFeild = $model_name . '.' . $this->defSortFeild; // デフォルト順番フィールドにモデル名を付加
		
		$this->main_model_name = $model_name;
		$this->main_model_name_s = $model_name_s;
		$this->crudBaseData = $crudBaseData;
		
		$this->crudBaseData['paths'] = $this->getPaths(); // パス情報
		
		// ※非推奨
		$this->crudBaseData['csrf_token'] = $this->strategy->getCsrfToken(); // CSRFトークン ※Ajaxのセキュリティ 
		
		$this->this_page_version = $clientCtrl->this_page_version;
		
		// ホワイトリストを取得(fillableはLaravel標準のホワイトリスト）
		if(property_exists($this->MainModel, 'fillable')){
		    $this->whiteList = $this->MainModel->fillable;
		}
	}
	
	
	/**
	 * デフォルトページ情報を取得する
	 * @param [] $crudBaseData
	 * @return [] デフォルトページ情報
	 */
	private function getDefPages(&$crudBaseData){
		
		$defPages = [];
		if(!empty($crudBaseData['defPages'])){
			$defPages = $crudBaseData['defPages'];
		}
		
		if(empty($defPages['page_no'])) $defPages['page_no'] = 0;
		if(empty($defPages['row_limit'])) $defPages['row_limit'] = 50;
		if(empty($defPages['sort_field'])) $defPages['sort_field'] = $this->defSortFeild;
		if(empty($defPages['sort_desc'])) $defPages['sort_desc'] = $this->defSortType;//0:昇順 1:降順
		
		return $defPages;
	}
	
	
	/**
	 * CrudBaseパラメータのGetter
	 * @return array
	 */
	public function getCrudBaseData(){
		return $this->crudBaseData;
	}
	
	
	/**
	 * ストラテジー・ファクトリー
	 * @param string $fw_type フレームワークタイプ
	 * @param object $clientCtrl クライアントコントローラ・オブジェクト
	 * @param object $clientModel クライアントモデル・オブジェクト
	 * @param [] $whiteList ホワイトリスト
	 * @param [] $crudBaseData
	 * @throws Exception
	 * @return NULL|CrudBaseStrategyForCake|CrudBaseStrategyForLaravel7
	 */
	public function factoryStrategy($fw_type, &$clientCtrl, &$clientModel, &$whiteList, &$crudBaseData){
		$strategy = null;
		if($fw_type == 'laravel8'){
			require_once 'laravel8/CrudBaseStrategyForLaravel8.php';
			$strategy= new CrudBaseStrategyForLaravel8();
		}else if($fw_type == 'cake' || $fw_type == 'cake_php'){
			require_once 'cakephp/CrudBaseStrategyForCake.php';
			$strategy = new CrudBaseStrategyForCake();
			if(isset($clientCtrl)) $strategy->setCtrl($clientCtrl); // クライアントコントローラのセット
			$strategy->setModel($clientModel); // クライアントモデルのセット
			
		}else if($fw_type == 'laravel7' || $fw_type == 'laravel'){
			require_once 'laravel7/CrudBaseStrategyForLaravel7.php';
			$strategy= new CrudBaseStrategyForLaravel7();
			
		}else if($fw_type == 'plain' ){
			require_once 'plain/CrudBaseStrategyForPlain.php';
			$strategy= new CrudBaseStrategyForPlain();
			
		}else{
			throw new Exception('$fw_type is empty! 210614A');
		}
		if(isset($clientCtrl)) $strategy->setCtrl($clientCtrl); // クライアントコントローラのセット
		$strategy->setModel($clientModel); // クライアントモデルのセット
		$strategy->setWhiteList($whiteList); // ホワイトリストのセット
		$strategy->setCrudBaseData($crudBaseData);
		
		return $strategy;
	}
	
	
	
	
	/**
	 * CrudBaseのindexアクション共通処理
	 *
	 * @return [] crudBasedata
	 *
	 */
	public function indexBefore(){

		// ▼ HTTPリクエストを取得
		$this->posts = $_POST;
		$this->gets = $_GET;

		$name = $this->crudBaseData['model_name_c']; 
		// ▼検索POSTデータを取得
		$searchPosts = [];
		if(isset($this->posts[$name])){
			$postData = $this->posts[$name];
		}

		// アクションを判定してアクション種別を取得する（0:初期表示、1:検索ボタン、2:ページネーション、3:ソート）
		$action_type = $this->judgActionType();

 		// 新バージョンであるかチェック。新バージョンである場合セッションクリアを行う。２回目のリクエスト（画面表示）から新バージョンではなくなる。
		$new_version_chg = 0; // 新バージョン変更フラグ: 0:通常  ,  1:新バージョンに変更
	
		$system_version = $this->checkNewPageVersion($this->this_page_version);
		if(!empty($system_version)){
			$new_version_chg = 1;
			$this->sessionClear();
		}
			
		//URLクエリ（GET)にセッションクリアフラグが付加されている場合、当画面に関連するセッションをすべてクリアする。
		if(!empty($this->request->query['sc'])){
			$this->sessionClear();
		}
		
		
		//フィールドデータが画面コントローラで定義されている場合、以下の処理を行う。
		if(!empty($this->fieldData)){
			$res = $this->exe_fieldData($this->fieldData,$this->main_model_name_s);//フィールドデータに関する処理
			$this->table_fields = $res['table_fields'];
			$this->fieldData = $res['fieldData'];

		}
		
		//フィールドデータから列表示配列を取得
		$csh_ary = $this->exstractClmShowHideArray($this->fieldData);
		$csh_json = json_encode($csh_ary);

		//検索条件情報をPOST,GET,デフォルトのいずれから取得。
		$kjs = $this->getKjs($name);
		
		// 検索条件情報のバリデーション
		$errTypes = [];
		$errMsg = $this->valid($kjs,$this->kjs_validate);
		if(!empty($errMsg)){//入力エラーがあった場合。
			//再表示用の検索条件情報をSESSION,あるいはデフォルトからパラメータを取得する。
			$kjs= $this->getKjsSD($name);
			$errTypes[] = 'kjs_err';
		}
		
		//検索ボタンが押された場合
		$pages=[];
		if(!empty($request['search'])){
			
			//ページネーションパラメータを取得
			$pages = $this->getPageParamForSubmit($kjs,$searchPosts);
		}else{
			//ページネーション用パラメータを取得
			$pages=$this->getPageParam($kjs);
			
		}

		$bigDataFlg=$this->checkBigDataFlg($kjs);//巨大データ判定

		//巨大データフィールドデータを取得
		$big_data_fields = $this->big_data_fields;

		//フィールドデータが定義されており、巨大データと判定された場合、巨大フィールドデータの再ソートをする。（列並替に対応）
		if(!empty($this->fieldData) && $bigDataFlg ==true){

			//巨大データフィールドを列並替に合わせて再ソートする。
			$big_data_fields = $this->sortBigDataFields($big_data_fields,$this->fieldData['active']);

		}

		$defKjs = $this->getDefKjsForReset();// 検索条件情報からデフォルト検索情報データを取得する

		

		//アクティブフィールドデータを取得
		$active = [];
		if(!empty($this->fieldData['active'])){
			$active = $this->fieldData['active'];
		}

		// ユーザー情報を取得する
		$userInfo = $this->getUserInfo();
		$this->userInfo = $userInfo;
		
		// アクティブフラグをリクエストから取得する
		$act_flg = $this->getValueFromPostGet('act_flg');
		
		$kjs_json = json_encode($kjs,JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS);

		// セッションへセット（CSVエクスポートで利用）
		if(!empty($this->crudBaseData['func_csv_export'])){
			$this->strategy->sessionWrite($this->main_model_name_s.'_kjs',$kjs);
		}
		
		// エラータイプJSON
		$err_types_json = json_encode($errTypes,JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS);

		$this->crudBaseData['fieldData'] = $active; // アクティブフィールドデータ
		$this->crudBaseData['kjs'] = $kjs; // 検索条件情報
		$this->crudBaseData['defKjs'] = $defKjs; // デフォルト検索情報データ
		$this->crudBaseData['errMsg'] = $errMsg; // エラーメッセージ
		$this->crudBaseData['errTypes'] = $errTypes; // エラータイプ
		$this->crudBaseData['version'] = $this->version; // CrudBaseのバージョン
		$this->crudBaseData['userInfo'] = $userInfo; // ユーザー情報
		$this->crudBaseData['new_version_chg'] = $new_version_chg; // 新バージョン変更フラグ: 0:通常  ,  1:新バージョンに変更
		$this->crudBaseData['new_version_flg'] = $new_version_chg; // 当ページの新バージョンフラグ   0:バージョン変更なし  1:新バージョン
		$this->crudBaseData['csh_ary'] = $csh_ary; // 列表示配列	列表示切替機能用
		$this->crudBaseData['csh_json'] = $csh_json; // 列表示配列JSON	 列表示切替機能用
		$this->crudBaseData['action_type'] = $action_type; // アクション種別（0:初期表示、1:検索ボタン、2:ページネーション、3:ソート）
		$this->crudBaseData['bigDataFlg'] = $bigDataFlg; // 巨大データフラグ	画面に表示する行数が制限数（$big_data_limit）を超えるとONになる。
		$this->crudBaseData['big_data_fields'] = $big_data_fields; //  巨大データ用のフィールド情報 (高速化のため列の種類は少なめ）
		$this->crudBaseData['pages'] = $pages; // ページネーションパラメータ
		$this->crudBaseData['act_flg'] = $act_flg; // アクティブフラグ	null:初期表示 , 1:検索アクション , 2:ページネーションアクション , 3:列ソートアクション
		$this->crudBaseData['header'] = 'header'; //  header.ctpの埋め込み
		$this->crudBaseData['this_page_version'] = $this->this_page_version; // 当ページのバージョン


		return $this->crudBaseData;
	}
	
	
	/**
	 * パス情報を取得する
	 * @return [] パス情報
	 */
	private function getPaths(){
		
		$paths = $this->strategy->getPath();
		
		return $paths;
	}


	/**
	 * アクション種別を取得する
	 * @return int アクション種別   0:初期表示、1:検索ボタン、2:ページネーション、3:ソート
	 */
	private function judgActionType(){

		$postData = $this->posts;
		
		$getData = $this->gets;

		$post_flg =false;
		if($postData){
			$post_flg = true;
		}

		$get_flg = false;
		if($getData){
			$get_flg = true;
		}

		$actionType = null;

		if($post_flg == true && $get_flg == true){
			$actionType = 1 ; // 検索ボタンアクション

		}else if($post_flg == true && $get_flg == false){
			$actionType = 1 ; // 検索ボタンアクション

		}else if($post_flg == false && $get_flg == true){

			// GETのパラメータを判定してアクション種別を取得する
			$actionType = $this->judgActionTypeByGet($getData);

		}else if($post_flg == false && $get_flg == false){
			$actionType = 0 ; // 初期表示アクション

		}

		return $actionType;
	}

	/**
	 * GETのパラメータを判定してアクション種別を取得する
	 * @param array $getData GETリクエストのパラメータ
	 * @return int アクション種別  0:初期表示、 2:ページネーション、 3:ソート
	 */
	private function judgActionTypeByGet($getData){

		// GETパラメータにkj_○○というフィールドが存在したらアクション種別は「初期表示」と判定する
		foreach($getData as $key => $dummy){
			$s3 =mb_substr($key,0,3);
			if($s3 == 'kj_'){
				return 0; // 初期表示
			}
		}

		// ソートアクションの判定
		if(isset($getData['page_no']) && isset($getData['row_limit']) && isset($getData['sort_field'])){
			return 3; // ソート
		}

		// ページネーションアクションの判定
		else if(isset($getData['page_no']) && isset($getData['row_limit']) && !isset($getData['sort_field'])){
			return 2; // ページネーション・アクション
		}

		return 0; // その他は初期表示
	}




	/**
	 * 当画面に関連するセッションをすべてクリアする
	 * 
	 */
	public function sessionClear(){

		$page_code = $this->main_model_name_s; // スネーク記法のページコード（モデル名）
		$pageCode = $this->main_model_name; // スネーク記法のページコード（キャメル記法）

		$fd_ses_key=$page_code.'_sorter_fieldData';//フィールドデータのセッションキー
		$tf_ses_key=$page_code.'_table_fields';//一覧列情報のセッションキー
		$err_ses_key=$page_code.'_err';//入力エラー情報のセッションキー
		$page_ses_key=$pageCode.'_page_param';//ページパラメータのセッションキー
		$kjs_ses_key=$pageCode;	//検索条件情報のセッションキー
		$csv_ses_key=$page_code.'_kjs';//CSV用のセッションキー
		$mains_ses_key = $page_code.'_mains_cb';//主要パラメータのセッションキー
		$ini_cnds_ses_key = $page_code.'_ini_cnds';// 初期条件データのセッションキー
		
		$this->strategy->sessionDelete($fd_ses_key);
		$this->strategy->sessionDelete($tf_ses_key);
		$this->strategy->sessionDelete($err_ses_key);
		$this->strategy->sessionDelete($page_ses_key);
		$this->strategy->sessionDelete($kjs_ses_key);
		$this->strategy->sessionDelete($csv_ses_key);
		$this->strategy->sessionDelete($mains_ses_key);
		$this->strategy->sessionDelete($ini_cnds_ses_key);

	}

	
	/**
	 * フィールドデータに関する処理
	 *
	 * @param array $def_fieldData コントローラで定義しているフィールドデータ
	 * @param string $page_code ページコード（モデル名）
	 * @return array res
	 * - table_fields 一覧列情報
	 */
	private function exe_fieldData($def_fieldData,$page_code){
		
		//定義フィールドデータをフィールドデータにセットする。
		$fieldData=$def_fieldData;
		
		//defをactiveとして取得。
		$active=$fieldData['def'];
		
		//列並番号でデータを並び替える。データ構造も変換する。
		$active = $this->crudBaseModel->sortAndCombine($active);
		$fieldData['active']=$active;

		//フィールドデータから一覧列情報を作成する。
		$table_fields=$this->crudBaseModel->makeTableFieldFromFieldData($fieldData);
		$res['table_fields']=$table_fields;
		$res['fieldData']=$fieldData;
		
		return $res;

	}
	

	/**
	 * フィールドデータから列表示配列を取得
	 * @param array $fieldData フィールドデータ
	 * @return array 列表示配列
	 */
	private function exstractClmShowHideArray($fieldData){

		$csh_ary=array();
		if(!empty($fieldData)){
			$csh_ary=HashCustom::extract($fieldData, 'active.{n}.clm_show');
		}
		return $csh_ary;
	}

	/**
	 * indexアクションの共通処理（後）
	 *
	 * @param array $crudBaseData
	 * @param $option
	 *  - pagenation_param ページネーションの目次に付加するパラメータ
	 *  - method_url 基本URLのメソッド部分
	 *  - non_limit_count LIMIT制限なし・データ件数
	 * @return $crudBaseData
	 */
	public function indexAfter(&$crudBaseData,$option=[]){
		
		$method_url = '';
		if(!empty($option['method_url'])) $method_url = '/' . $option['method_url'];

		// 検索データ数を取得
		$kjs = $crudBaseData['kjs'];
		
		// LIMIT制限なし・データ件数の取得
		$non_limit_count = 0;
		if(isset($option['non_limit_count'])){
			$non_limit_count = $option['non_limit_count'];
		}else{
			$non_limit_count=$this->MainModel->findDataCnt($kjs); 
		}
		$data_count = $non_limit_count;
		
		// パス情報からホーム相対パスを取得する
		$paths = $crudBaseData['paths'];
		$home_r_path = $paths['home_r_path'];
		
		//ページネーション情報を取得する
		$base_url=parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
		$pages = $crudBaseData['pages'];

		$pagenation_param = null;
		if(isset($option['pagenation_param'])) $pagenation_param = $option['pagenation_param'];
		$this->PagenationEx = new PagenationEx();
		$pages = $this->PagenationEx->createPagenationData($pages,$data_count,$base_url , $pagenation_param,$this->table_fields,$kjs);
		$kjs_json = json_encode($kjs,JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS);

		// 行入替機能フラグを取得する
		$row_exc_flg = $this->getRowExcFlg($crudBaseData,$pages);
		
		$referer_url = empty($_SERVER['HTTP_REFERER']) ? '' : $_SERVER['HTTP_REFERER']; // リファラURL
		
		// 現在URLを組み立てる
		$now_url = (empty($_SERVER["HTTPS"]) ? "http://" : "https://") . $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"];

		$crudBaseData['pages'] = $pages; // ページネーション情報
		$crudBaseData['data_count'] = $data_count; // 検索データ数
		$crudBaseData['kjs_json'] = $kjs_json; // 検索条件ＪＳＯＮ
		$crudBaseData['base_url'] = $base_url; // 基本URL
		$crudBaseData['referer_url'] = $referer_url; // リファラURL
		$crudBaseData['now_url'] = $now_url; // 現在URL
		$crudBaseData['row_exc_flg'] = $row_exc_flg; // 行入替機能フラグ  0:行入替ボタンは非表示 , 1:表示
		

		$this->strategy->sessionWrite($this->main_model_name_s.'_pages',$pages);

		return $crudBaseData;
	}

	
	/**
	 * 初期条件データを取得する
	 * @param array $crudBaseData
	 * @param array $pages ページネーション情報
	 * @return array 初期条件データ
	 */
	private function getIniCnds(&$crudBaseData,&$pages){
		
		$iniCnds = null; // 初期条件データ
		$ses_key = $this->main_model_name_s.'_ini_cnds';
		
		//アクションフラグが空である場合
		if(empty($crudBaseData['act_flg'])){
			
			// 初期条件データにセットする
			$iniCnds = array('kjs' => $crudBaseData['kjs'],'pages'=>$pages);
			
			// ‎セッションにデータをセット
			$this->strategy->sessionWrite($ses_key,$iniCnds);
			
		}
		else{
			// 		セッションにデータが存在する場合
			$iniCnds = $this->strategy->sessionRead($ses_key);
			
			if(empty($iniCnds)){
				
				$iniCnds = array('kjs' => $crudBaseData['kjs'],'pages'=>$pages);
				$this->strategy->sessionWrite($ses_key,$iniCnds);
			}
			
		}
		
		return $iniCnds;
	}
	

	
	/**
	 * 行入替機能フラグを取得する
	 * @param array $crudBaseData
	 * @param array $pages ページネーション情報
	 * @return int 行入替機能フラグ 1:ボタン表示 , 0:ボタン非表示
	 */
	private function getRowExcFlg(&$crudBaseData,&$pages){
		
		// 初期条件データを取得する
		$iniCnds = $this->getIniCnds($crudBaseData,$pages);
		
		// 検索条件情報の初期データと現在データを比較する。
		$iKjs = $iniCnds['kjs']; // 初期の検索条件情報
		$aKjs = $crudBaseData['kjs']; // 現在条件情報
		foreach($aKjs as $field => $a_value){
			
			if($field == 'row_limit') continue;
			
			$i_value = null;
			if(isset($iKjs[$field])) $i_value = $iKjs[$field];
			
			// ゼロ比較
			if($this->_compare0($a_value, $i_value)){
				continue;
			}else{
				return 0;
			}

		}

		// ページネーション情報の初期データと現在データを比較する。
		$list = ['sort_field','sort_desc'];
		
		$iPages = $iniCnds['pages']; // 初期のページネーション情報

		foreach( $list as $field){
			
			$a_value = null;
			if(isset($pages[$field])) $a_value = $pages[$field];
			
			$i_value = null;
			if(isset($iPages[$field])) $i_value = $iPages[$field];
			
			// ゼロ比較
			if($this->_compare0($a_value, $i_value)){
				continue;
			}else{
				return 0;
			}
		}
		
		return 1; // 一致判定
		
	}
	

	/**
	 * ユーザー情報を取得する
	 * 
	 * @return array ユーザー情報
	 *  - update_user 更新ユーザー
	 *  - ip_addr IPアドレス
	 *  - user_agent ユーザーエージェント
	 *  - role 権限
	 *  - authority 権限データ
	 */
	public function getUserInfo(){

		$userInfo = $this->crudBaseModel->getUserInfo();

		return $userInfo;
	}

	/**
	 * editアクションの共通処理
	 *
	 * エンティティ、入力エラーメッセージ、モードを取得します。
	 * エンティティはテーブルのレコードのことです。
	 * エラーメッセージは登録ボタン押下時の入力エラーメッセージです。
	 *
	 * @param $name 対象モデル名（キャメル記法）
	 * @return array
	 * - noData <bool> true:エンティティが空(※非推奨)
	 * - ent <array> エンティティ（テーブルのレコード）$this
	 * - errMsg <string> 入力エラーメッセージ
	 * - mode <string> new:新規入力モード, edit:編集モード
	 *
	 */
	protected function edit_before($name){
		$this->main_model_name=$name;
		$this->main_model_name_s=$this->snakize($name);

		$err=$this->strategy->sessionRead($this->main_model_name_s.'_err');
		$this->strategy->sessionDelete($this->main_model_name_s.'_err');
		$noData=false;
		$ent=null;
		$errMsg=null;
		$mode=null;

		//入力エラー情報が空なら通常の遷移
		if(empty($err)){

			$id=$this->getGet('id');//GETからIDを取得
			$id = null;
			if(!empty($_GET['id'])) $id = $_GET['id'];
			
			//IDがnullなら新規登録モード
			if(empty($id)){

				$ent=$this->getDefaultEntity();
				$mode='new';//モード（new:新規追加  edit:更新）

				//IDに数値がある場合、編集モード。
			}else if(is_numeric($id)){

				//IDに紐づくエンティティをDBより取得
				$ent=$this->MainModel->findEntity($id);
				$mode='edit';//モード（new:新規追加  edit:更新）

			}else{

				//数値以外は「NO DATA」表示
				$noData=true;
			}

		}

		//入力エラーによる再遷移の場合
		else{

			$ent=$err['ent'];
			$mode=$err['mode'];
			$errMsg=$err['errMsg'];

 			//エンティティには入力フォーム分のフィールドしか入っていないため、不足分のフィールドをDBから取得しマージする
 			$ent2=$this->MainModel->findEntity($ent['id']);
 			$ent=HashCustom::merge($ent2,$ent);

		}

		//リファラを取得
		$referer = ( !empty($this->params['url']['referer']) ) ? $this->params['url']['referer'] : null;

		$this->set(array(
				'noData'=>$noData,
				'mode'=>$mode,
				'errMsg'=>$errMsg,
				'referer'=>$referer,
		));

		$ret=array(
				'ent'=>$ent,
				'noData'=>$noData,
				'errMsg'=>$errMsg,
				'mode'=>$mode,
				'referer'=>$referer,
		);


		return $ret;

	}

	/**
	 * regアクション用の共通処理
	 *
	 * 結果エンティティとモードを取得します。
	 * 結果エンティティは登録したエンティティで、また全フィールドを持っています。
	 * @param string $name 対象モデル名
	 * @return array
	 * - ent <array> 結果エンティティ
	 * - mode <string> new:新規入力モード,edit:編集モード
	 *
	 */
	protected function reg_before($name){
		$this->main_model_name=$name;
		$this->main_model_name_s=$this->snakize($name);

		//リロードチェック
		if(empty($this->ReloadCheck)){
			App::uses('ReloadCheck','Vendor/CrudBase');
			$this->ReloadCheck=new ReloadCheck();
		}

		if ($this->ReloadCheck->check()!=1){//1以外はリロードと判定し、一覧画面へリダイレクトする。
			return $this->redirect(array('controller' => $this->main_model_name_s, 'action' => 'index'));
		}

		$ent=$this->getEntityFromPost();

		$mode=$this->request->data[$this->main_model_name]['mode'];
		$errMsg=$this->valid($ent,$this->edit_validate);

		if(isset($errMsg)){

			//エラー情報をセッションに書き込んで、編集画面にリダイレクトで戻る。
			$err=array('mode'=>$mode,'ent'=>$ent,'errMsg'=>$errMsg);
			$this->strategy->sessionWrite($this->main_model_name_s.'_err',$err);
			$this->redirect(array('action' => 'edit'));

			return null;
		}

		//更新関係のパラメータをエンティティにセットする。
		$ent=$this->setUpdateInfo($ent,$mode);

		//リファラを取得
		$referer = ( !empty($this->request->data[$this->main_model_name]['referer']) ) ? $this->request->data[$this->main_model_name]['referer'] : null;

		$this->set(array(
				'mode'=>$mode,
				'referer'=>$referer,
		));

		$res = array(
				'ent'=>$ent,
				'mode'=>$mode,
				'referer'=>$referer,
				);

		return $res;


	}

	/**
	 * 編集画面へリダイレクトで戻ります。その際、入力エラーメッセージも一緒に送られます。
	 *
	 * @param string $errMsg 入力エラーメッセージ
	 * @return なし。（編集画面に遷移する）
	 */
	protected function errBackToEdit($errMsg){

		$ent=$this->getEntityFromPost();
		$mode=$this->request->data[$this->main_model_name]['mode'];

		//エラー情報をセッションに書き込んで、編集画面にリダイレクトで戻る。
		$err=array('mode'=>$mode,'ent'=>$ent,'errMsg'=>$errMsg);
		$this->strategy->sessionWrite($this->main_model_name_s.'_err',$err);
		$this->redirect(array('action' => 'edit'));

	}


	/**
	 * 検索条件のバリデーション
	 *
	 * 引数のデータを、バリデーション情報を元にエラーチェックを行います。
	 * その際、エラーがあれば、エラーメッセージを作成して返します。
	 *
	 * @param array $data バリデーション対象データ
	 * @param array $validate バリデーション情報
	 * @return string 正常な場合、nullを返す。異常値がある場合、エラーメッセージを返す。
	 */
	private function valid($data,$validate){

		return $this->strategy->validForKj($data,$validate);
		
	}

	/**
	 * POST,またはSESSION,あるいはデフォルトから検索条件情報を取得します。
	 *
	 * @param $formKey form要素のキー。通常はモデル名をキーにしているので、モデルを指定すれば良い。
	 * @return array 検索条件情報
	 */
	protected function getKjs($formKey){

		$def = $this->getDefKjs();//デフォルトパラメータ
		$keys = $this->getKjKeys();//検索条件キーリストを取得
		$kjs = $this->getParams($keys,$formKey,$def);
		
		if(empty($kjs)) return [];
		
		foreach($kjs as $k=>$v){
			if(is_array($v)){
				$kjs[$k]=$v;
			}else{
				$kjs[$k]=trim($v);
			}

		}
		
		//SQLインジェクション対策
		foreach($kjs as $i => $kj){
			if(!empty($kj)){
				$kjs[$i] = str_replace("'", '\'', $kj);
			}
		}

		return $kjs;

	}


	/**
	 * 検索条件キーリストを取得
	 *
	 * 検索条件情報からname要素だけを、キーリストとして取得します。
	 * @return array 検索条件キーリスト
	 */
	protected function getKjKeys(){

		if(empty($this->m_kj_keys)){
			foreach($this->kensakuJoken as $ent){
				$this->m_kj_keys[]=$ent['name'];
			}
		}

		return $this->m_kj_keys;
	}

	/**
	 * デフォルト検索条件を取得
	 *
	 * 検索条件情報からdef要素だけを、デフォルト検索条件として取得します。
	 * @return array デフォルト検索条件
	 */
	protected function getDefKjs(){

		if(empty($this->m_kj_defs)){
			foreach($this->kensakuJoken as $ent){
				$this->m_kj_defs[$ent['name']]=$ent['def'];
			}
		}

		return $this->m_kj_defs;

	}

	/**
	 * SESSION,あるいはデフォルトから検索条件情報を取得する
	 *
	 * @param string $formKey モデル名、またはformタグのname要素
	 * @return array 検索条件情報
	 */
	protected function getKjsSD($formKey){

		$def=$this->getDefKjs();//デフォルトパラメータ
		$keys=$this->getKjKeys();
		$kjs=$this->getParamsSD($keys,$formKey,$def);

		return $kjs;
	}

	/**
	 * 
	 * POSTからデータを取得。ついでにサニタイズする。
	 *
	 * POSTからデータを取得する際、ついでにサニタイズします。
	 * サニタイズはSQLインジェクション対策用です。
	 *
	 * @param string $key リクエストキー
	 * @return string リクエストの値
	 * 
	 */
	protected function getPost($key){
		$v=null;
		if(isset($this->request->data[$this->main_model_name][$key])){
			$v=$this->request->data[$this->main_model_name][$key];
		}
		return $v;
	}


	/**
	 * GET情報（URLのクエリ）からページネーション情報を取得します。
	 *
	 * ページネーション情報は、ページ番号の羅列であるページ目次のほかに、ソート機能にも使われます。
	 *
	 * @return array
	 * - page_no <int> 現在のページ番号
	 * - limit <int> 表示件数
	 * - sort_field <string> ソートする列フィールド
	 * - sort_desc <int> 並び方向。 0:昇順 1:降順
	 */
	protected function getPageParam(&$kjs){
		$defPages = $this->crudBaseData['defPages']; // デフォルトページ情報
		
		if(!empty($kjs['row_limit'])){
			$defPages['row_limit'] = $kjs['row_limit'];
			$this->crudBaseData['defPages'] = $defPages;
		}

		//GETよりパラメータを取得する。
		$pages = $this->gets; 
		
		$defs = $this->getDefKjs();//デフォルト情報を取得

		//空ならデフォルトをセット
		if(empty($pages['page_no'])){
			$pages['page_no']=0;
		}
		if(empty($pages['row_limit'])){
			$pages['row_limit'] = $defPages['row_limit'];
		}
		if(empty($pages['sort_field'])){
			$pages['sort_field'] = $defPages['sort_field'];
		}
		if(!isset($pages['sort_desc'])){
			$pages['sort_desc'] = $defPages['sort_desc'];
		}

		return $pages;
	}


	/**
	 * サブミット時用のページネーション情報を取得
	 *
	 * GET情報（URLのクエリ）からページネーション情報を取得します。
	 * ついでにセッションへのページネーション情報を保存します。
	 * このメソッドはサブミット時の処理用です。
	 *
	 * @param array $kjs 検索条件情報。row_limitのみ利用する。
	 * @param $postData POST
	 * @return array ページネーション情報
	 * - page_no <int> ページ番号
	 * - limit <int> 表示件数
	 *
	 */
	protected function getPageParamForSubmit(&$kjs,&$postData){
		
		$pages =  array();
		$defs=$this->getDefKjs();//デフォルト情報を取得
		
		$pages['page_no'] = 0;
		
		if(isset($postData['row_limit'])){
			$pages['row_limit'] = $postData['row_limit'];
		}else{
			$pages['row_limit'] = $defs['row_limit'];;
		}
		
		if(isset($postData['sort_field'])){
			$pages['sort_field'] = $postData['sort_field'];
		}else{
			$pages['sort_field'] = $this->defSortFeild;;
		}
		
		if(isset($postData['sort_desc'])){
			$pages['sort_desc'] = $postData['sort_desc'];
		}else{
			$pages['sort_desc'] = $this->defSortType;//0:昇順 1:降順;
		}
		

		return $pages;
	}

	
	

	/**
	 * デフォルトからパラメータを取得する。
	 * @param string $keys キーリスト
	 * @param string $formKey フォームキー
	 * @param string $def デフォルトパラメータ
	 * @return array フォームデータ
	 */
	protected function getParamsSD($keys,$formKey,$def){

		$prms=null;
		foreach($keys as $key){
			$prms[$key] = $def[$key];
		}
		return $prms;

	}




	/**
	 * POST,GET,デフォルトのいずれかからパラメータリストを取得する
	 * @param array $keys キーリスト
	 * @param string $formKey フォームキー
	 * @param array $def デフォルトパラメータ
	 * @return array パラメータ
	 */
	protected function getParams($keys,$formKey,$def){
		
		$prms = null;
		if(empty($keys)) return $prms;
		
		foreach($keys as $key){
			$prms[$key]=$this->getParam($key, $formKey,$def);
		}

		return $prms;
	}

	/**
	 * POST,GET,SESSION,デフォルトのいずれかからパラメータを取得する。
	 * @param string $key パラメータのキー
	 * @param string $formKey フォームキー
	 * @param string $def デフォルトパラメータ
	 *
	 * @return array パラメータ
	 */
	protected function getParam($key,$formKey,&$def){
		$v=null;

		if(isset($this->posts[$formKey][$key])){
			$v = $this->posts[$formKey][$key];
		}
		else if(isset($this->posts[$key])){
			$v = $this->posts[$key];
		}
		else if(isset($this->gets[$key])){
			$v = $this->gets[$key];
		}
		else{
			$v = $def[$key];
		}
		
		return $v;
	}
	
	
	/**
	 * POST、ＧＥＴの順にキーに紐づく値を探して取得する。
	 * 
	 * @param string $key キー
	 * @return string リクエスト値
	 */
	protected function getValueFromPostGet($key){
		$value = null;

		//POSTからデータ取得を試みる。
		$model_name = $this->main_model_name;
		if(isset($this->request->data[$model_name][$key])){
			$value = $this->request->data[$model_name][$key];
			return $value;
		}
		
		//GETからデータ取得を試みる。
		if(isset($this->params['url'][$key])){
			$value = $this->params['url'][$key];
			return $value;
		}
		
		return $value;
	}
	
	
	/**
	 * ＧＥＴ、POSTの順にキーに紐づく値を探して取得する。
	 *
	 * @param string $key キー
	 * @return string リクエスト値
	 */
	protected function getValueFromGetPost($key){
		$value = null;
		
		//GETからデータ取得を試みる。
		if(isset($this->params['url'][$key])){
			$value = $this->params['url'][$key];
			return $value;
		}
		
		//POSTからデータ取得を試みる。
		$model_name = $this->main_model_name;
		if(isset($this->request->data[$model_name][$key])){
			$value = $this->request->data[$model_name][$key];
			return $value;
		}
		
		return $value;
	}

	/**
	 * キャメル記法に変換
	 * @param string $str スネーク記法のコード
	 * @return string キャメル記法のコード
	 */
	protected function camelize($str) {
		$str = strtr($str, '_', ' ');
		$str = ucwords($str);
		return str_replace(' ', '', $str);
	}

	/**
	 * スネーク記法に変換
	 * @param string $str キャメル記法のコード
	 * @return string スネーク記法のコード
	 */
	protected function snakize($str) {
		$str = preg_replace('/[A-Z]/', '_\0', $str);
		$str = strtolower($str);
		return ltrim($str, '_');
	}


	/**
	 * 巨大データ判定
	 * @param array $kjs 検索条件情報
	 * @return int 巨大データフラグ 0:通常データ  1:巨大データ
	 *
	 */
	private function checkBigDataFlg($kjs){

		$bigDataFlg=0;//巨大データフラグ

		//制限行数
		$row_limit=0;
		if(empty($kjs['row_limit'])){
			return $bigDataFlg;
		}else{
			$row_limit=$kjs['row_limit'];
		}

		// 制限行数が巨大データ判定行数以上である場合
		if($row_limit >= $this->big_data_limit){

			// SQLインジェクションサニタイズ
			$kjs = sqlSanitizeW($kjs);
			
			// DBよりデータ件数を取得
			$cnt=$this->MainModel->findDataCnt($kjs);

			// データ件数が巨大データ判定行数以上である場合、巨大データフラグをONにする。
			if($cnt >= $this->big_data_limit){
				$bigDataFlg=1;
			}

		}

		return $bigDataFlg;
	}

	/**
	 * 巨大データフィールドを列並替に合わせて再ソートする
	 * 
	 * @param array $big_data_fields 巨大データフィールド
	 * @param array $active アクティブフィールドデータ
	 * @return array ソート後の巨大データフィールド
	 */
	private function sortBigDataFields($big_data_fields,$active){

		//巨大データフィールドのキーと値を入れ替えて、マッピングを作成する。
		$map = array_flip($big_data_fields);

		//巨大データフィールドを列並替に合わせて再ソートする
		$big_data_fields2 = array();
		foreach($active as $ent){
			$f = $ent['id'];
			if(isset($map[$f])){
				$big_data_fields2[] = $f;
			}
		}

		return $big_data_fields2;

	}

	/**
	 * 検索条件情報からデフォルト検索データを取得する
	 *
	 * @note
	 * デフォルト検索データはリセットボタンの処理に使われます。
	 *
	 * @param {} $noResets リセット対象外フィールドリスト 省略可
	 * @return {} デフォルト検索データ
	 */
	private function getDefKjsForReset($noResets=null){

		$kjs=$this->kensakuJoken;//メンバの検索条件情報を取得

		$defKjs=HashCustom::combine($kjs, '{n}.name','{n}.def');//構造変換

		//リセット対象外フィールドリストが空でなければ、対象外のフィールドをはずす。
		if(!empty($noResets)){
			foreach($noResets as $noResetField){
				unset($defKjs[$noResetField]);
			}
		}

		return $defKjs;
	}





	////////// 編集画面用 ///////////////////////


	/**
	 * デフォルトエンティティを取得
	 * 
	 * @note
	 * 編集画面の内部処理用です。
	 */
	protected function getDefaultEntity(){

		if(empty($this->m_edit_defs)){
			foreach($this->entity_info as $ent){
				$this->m_edit_defs[$ent['name']]=$ent['def'];
			}
		}

		return $this->m_edit_defs;

	}

	/**
	 * 編集エンティティのキーリストを取得
	 *
	 * @note
	 * 編集画面の内部処理用です。
	 */
	protected function getKeysForEdit(){
		if(empty($this->m_edit_keys)){
			foreach($this->entity_info as $ent){
				$this->m_edit_keys[]=$ent['name'];
			}
		}

		return $this->m_edit_keys;
	}


	////////// 登録完了画面用 ///////////////////////

	/**
	 * POSTからエンティティを取得する。
	 *
	 * @note
	 * 登録完了画面の内部処理用です。
	 */
	protected function getEntityFromPost(){

		$keys=$this->getKeysForEdit();
		foreach($keys as $key){
			$v=$this->getPost($key);
			$ent[$key]=trim($v);
		}

		return $ent;
	}

	/**
	 * 更新関係のパラメータをエンティティにセット。
	 *
	 * @note
	 * 登録完了画面の内部処理用です。
	 *
	 * @param array $ent エンティティ
	 * @param string $mode モード new or edit
	 * @return array 更新関係をセットしたエンティティ
	 */
	protected function setUpdateInfo($ent,$mode){

		//更新者をセット
		$user=$this->Auth->user();
		$ent['update_user']=$user['username'];

		//更新者IPアドレスをセット
		$ent['ip_addr'] = $_SERVER["REMOTE_ADDR"];

		//新規モードであるなら作成日をセット
		if($mode=='new'){
			$ent['created']=date('Y-m-d H:i:s');
		}

		//※更新日はDBテーブルにて自動設定されているので省略

		return $ent;
	}





	/**
	 * 拡張コピー　存在しないディテクトリも自動生成
	 * 
	 * @note
	 * 日本語ファイルに対応
	 * 
	 * @param string $sourceFn コピー元ファイル名
	 * @param string $copyFn コピー先ファイル名 
	 * @param string $permission パーミッション（ファイルとフォルダの属性。デフォルトはすべて許可の777。8進数で指定する）
	 */
	protected function copyEx($sourceFn,$copyFn,$permission=0777){

		if(empty($this->CopyEx)){
			App::uses('CopyEx', 'Vendor/CrudBase');
			$this->CopyEx = $this->Animal=new CopyEx();
		}

		$this->CopyEx->copy($sourceFn,$copyFn,$permission);

	}

	/**
	 * 日本語ディレクトリの存在チェック
	 * 
	 * @param string $dn ディレクトリ名
	 * @return boolean true:存在 , false:未存在
	 */
	protected function isDirEx($dn){
		$dn=mb_convert_encoding($dn,'SJIS','UTF-8');
		if (is_dir($dn)){
			return true;
		}else{
			return false;
		}
	}

	/**
	 * パス指定によるディレクトリ作成（パーミッションをすべて許可）
	 *
	 * @note
	 * ディレクトリが既に存在しているならディレクトリを作成しない。
	 * パスに新しく作成せねばならないディレクトリ情報が複数含まれている場合でも、順次ディレクトリを作成する。
	 *
	 * @param string $path ディレクトリのパス
	 *
	 */
	protected function mkdir777($path,$sjisFlg=false){

		if(empty($this->MkdirEx)){
			App::uses('MkdirEx', 'Vendor/CrudBase');
			$this->MkdirEx = new MkdirEx();
		}

		$this->MkdirEx->mkdir777($path,$sjisFlg);

	}

	/**
	 * 更新ユーザーなど共通フィールドをエンティティにセットする。
	 * @param [] $ent エンティティ
	 * @return [] エンティティ
	 */
	public function setCommonToEntity($ent){

		// 更新ユーザーの取得とセット
		$userInfo = $this->getUserInfo();
		$ent['update_user'] = $userInfo['update_user'];

		// ユーザーエージェントの取得とセット
		$user_agent = $_SERVER['HTTP_USER_AGENT'];
		$user_agent = mb_substr($user_agent, 0, 255);
		$ent['user_agent'] = $user_agent;

		// IPアドレスの取得とセット
		$ip_addr = $_SERVER["REMOTE_ADDR"];
		$ent['ip_addr'] = $ip_addr;

		// idが空（新規入力）なら生成日をセットし、空でないなら除去
		if(empty($ent['id'])){
			$ent['created'] = date('Y-m-d H:i:s');
		}else{
			unset($ent['created']);
		}

		// 更新日時は除去（DB側にまかせる）
		unset($ent['modified']);

		return $ent;

	}

	// 更新ユーザーなど共通フィールドをデータにセットする。
	protected function setCommonToData($data){

		// 更新ユーザー
		$update_user = $this->Auth->user('username');

		// ユーザーエージェント
		$user_agent = $_SERVER['HTTP_USER_AGENT'];
		$user_agent = mb_substr($user_agent,0,255);

		// IPアドレス
		$ip_addr = $_SERVER["REMOTE_ADDR"];

		// 本日
		$today = date('Y-m-d H:i:s');

		// データにセットする
		foreach($data as $i => $ent){

			$ent['update_user'] = $update_user;
			$ent['user_agent'] = $user_agent;
			$ent['ip_addr'] = $ip_addr;

			// idが空（新規入力）なら生成日をセットし、空でないなら除去
			if(empty($ent['id'])){
				$ent['created'] = $today;
			}else{
				unset($ent['created']);
			}

			// 更新日時は除去（DB側にまかせる）
			unset($ent['modified']);

			$data[$i] = $ent;
		}


		return $data;

	}



	/**
	 * 新バージョンであるかチェックする。
	 * @param string $this_page_version 当ページバージョン
	 * @return int 新バージョンフラグ  0:バージョン変更なし   1:新バージョンに変更されている
	 */
	public function checkNewPageVersion($this_page_version){

		$sesKey = $this->main_model_name_s.'_ses_page_version_cb';

		// セッションページバージョンを取得する
		$ses_page_version = $this->strategy->sessionRead($sesKey);
		
		// セッションページバージョンがセッションに存在しない場合
		if(empty($ses_page_version)){
			// 当ページバージョンを新たにセッションに保存し、バージョン変更なしを表す"0"を返す。
			$this->strategy->sessionWrite($sesKey,$this_page_version);
			return 0;
		}

		// セッションページバージョンがセッションに存在する場合
		else{
			
			// セッションページバージョンと当ページバージョンが一致する場合、バージョン変更なしを表す"0"を返す。
			if($this_page_version == $ses_page_version){
				return 0;
			}

			// セッションページバージョンと当ページバージョンが異なる場合、新バージョンによる変更を表す"1"を返す。
			else{
				$this->strategy->sessionWrite($sesKey,$this_page_version);
				return 1;
			}
		}
		
	}


	/**
	 * 主要パラメータをkjsにセットする。
	 * 
	 * @note
	 * kj_idなど特に主要なパラメータをセットする。
	 * 主要パラメータを単にリクエストで保持すると、常にそのパラメータを受け渡しをしなければならず不便である。
	 * 当メソッドでは、主要パラメータをセッションで保持し、リクエストで主要パラメータを保持する必要がなくなる。
	 * 
	 * @param string $mains 主要パラメータのキー。配列指定も可能。
	 * @param array $kjs 検索条件情報
	 * @param array kjs( 検索条件情報)
	 */
	protected function setMainsToKjs($mains,$kjs){

		// 配列でないなら配列化する
		if(!is_array($mains)){
			$mains = array($mains);
		}

		// 主要パラメータのセッションキー
		$sesKey = $this->main_model_name_s.'_mains_cb';

		// セッションで保持している主要パラメータ
		$sesMains = array();

		// kjsに主要パラメータをセットする。
		foreach($mains as $key){

			// kjs内のパラメータが空である場合
			if(empty($kjs[$key])){

				// セッションの主要パラメータが空ならセッションから取得
				if(empty($sesMains)){
					$sesMains = $this->strategy->sessionRead($sesKey);
				}

				// セッションのパラメータをkjsにセットする
				if(!empty($sesMains[$key])){
					$kjs[$key] = $sesMains[$key];
				}

			}else{
				$sesMains[$key] = $kjs[$key];
			}
		}

		// 主要パラメータをセッションで保持する。
		$this->strategy->sessionWrite($sesKey,$sesMains);

		return $kjs;

	}


	/**
	 * AJAX | 一覧のチェックボックス複数選択による一括処理
	 * @return string
	 */
	public function ajax_pwms(){

		$json_param=$_POST['key1'];

		$param=json_decode($json_param,true);//JSON文字を配列に戻す

		// IDリストを取得する
		$ids = $param['ids'];

		// アクション種別を取得する
		$kind_no = $param['kind_no'];
		
		// ユーザー情報を取得する
		$userInfo = $this->getUserInfo();

		// 更新ユーザーを取得する
		$update_user = $userInfo['update_user'];

		// アクション種別ごとに処理を分岐
		switch ($kind_no){
			case 10:
				$this->crudBaseModel->switchDeleteFlg($ids, 0, $update_user); // 有効化
				break;
			case 11:
				$this->crudBaseModel->switchDeleteFlg($ids, 1 ,$update_user); // 削除化(無効化）
				break;
			default:
				return "'kind_no' is unknown value";
		}

		return 'success';
	}
	

	/**
	 * パラメータ内の指定したフィールドが数値であるかチェックする
	 * 
	 * @note
	 * リクエストパラメータ内のidなどを調べる。
	 * idにSQLインジェクションを引き起こすコードが入っていないかなどを調べる。
	 * 
	 * @param array $param リクエストパラメータ
	 * @param array $numProps 数値フィールドリスト： チェック対象のフィールドを配列で指定する
	 * @return bool 指定したフィールドに紐づくパラメータの値のうち、一つでも数値でないものがあればfalseを返す。
	 */
	protected function checkNumberParam($param,$numProps=array('id')){

		foreach($numProps as $field){
			if(!is_numeric($param[$field])){
				return false;
			}
		}
		return true;
	}

	
	
	/**
	 * 0以外の空判定
	 *
	 * @note
	 * いくつかの空値のうち、0と'0'は空と判定しない。
	 *
	 * @param $value
	 * @return int 判定結果 0:空でない , 1:空である
	 */
	protected function _empty0($value){
		if(empty($value) && $value!==0 && $value!=='0'){
			return 1;
		}
		return 0;
	}
	
	
	/**
	 *	ゼロ比較
	 *
	 * @note
	 * 比較用のカスタマイズ関数。
	 * ただし、空の値の比較は0とそれ以外の空値（null,"",falseなど）で仕様が異なる。
	 * 0とそれ以外の空値（null,"",falseなど）は不一致のみなす。
	 * 0と'0'は一致と判定する。
	 * null,'',falseのそれぞれの組み合わせは一致である。
	 * bool型のtrueは数字の1と同じ扱い。（※通常、2や3でもtrueとするが、この関数では1だけがtrue扱い）
	 * 1.0 , 1 , '1' など型が異なる数値を一致と判定する。
	 *
	 * @param $a_value
	 * @param $b_value
	 * @return bool false:不一致 , true:一致
	 */
	function _compare0($a_value,$b_value){
		if(empty($a_value) && empty($b_value)){
			if($a_value === 0 || $a_value === '0'){
				if($b_value === 0 || $b_value === '0'){
					return true;
				}else{
					return false;
				}
				
			}else{
				if($b_value === 0 || $b_value === '0'){
					return false;
				}else{
					return true;
				}
				
			}
			
		}else{
			
			if(gettype($a_value) == 'boolean'){
				if($a_value){
					$a_value = 1;
				}else{
					$a_value = 0;
				}
			}
			if(gettype($b_value) == 'boolean'){
				if($b_value){
					$b_value = 1;
				}else{
					$b_value = 0;
				}
			}
			
			
			if(is_numeric($a_value) && is_numeric($b_value)){
				if($a_value == $b_value) return true;
			}else{
				if($a_value === $b_value) return true;
				
			}
		}
		
		return false;
	}
	
	/**
	 * テンプレートからファイルパスを組み立てる
	 * @param array $FILES $_FILES
	 * @param string $path_tmpl ファイルパステンプレート
	 * @param array $ent エンティティ
	 * @param string $field
	 * @param string $date 
	 * @return string ファイルパス
	 */
	public function makeFilePath(&$FILES, $path_tmpl, $ent, $field, $date=null){
		
		// $_FILESにアップロードデータがなければ、既存ファイルパスを返す
		if(empty($FILES[$field])){
			return $ent[$field];
		}

		$fp = $path_tmpl;
		
		if(empty($date)){
			$date = date('Y-m-d H:i:s');
		}
		$u = strtotime($date);
		
		// ファイル名を置換
		$fn = $FILES[$field]['name']; // ファイル名を取得
		
		// ファイル名が半角英数字でなければ、日時をファイル名にする。（日本語ファイル名は不可）
		if (!preg_match("/^[a-zA-Z0-9-_.]+$/", $fn)) {
			
			// 拡張子を取得
			$pi = pathinfo($fn);
			$ext = $pi['extension'];
			if(empty($ext)) $ext = 'png';
			$fn = date('Y-m-d_his',$u) . '.' . $ext;// 日時ファイル名の組み立て
		}
		
		$fp = str_replace('%fn', $fn, $fp);
		
		// フィールドを置換
		$fp = str_replace('%field', $field, $fp);
		
		if(strpos($fp, '%unique')){
			$unique = uniqid(rand(1, 1000)); // ユニーク値を取得
			$fp = str_replace('%unique', $unique, $fp);
		}

		// 日付が空なら現在日時をセットする
		$Y = date('Y',$u);
		$m = date('m',$u);
		$d = date('d',$u);
		$H = date('H',$u);
		$i = date('i',$u);
		$s = date('s',$u);
		
		$fp = str_replace('%Y', $Y, $fp);
		$fp = str_replace('%m', $m, $fp);
		$fp = str_replace('%d', $d, $fp);
		$fp = str_replace('%H', $H, $fp);
		$fp = str_replace('%i', $i, $fp);
		$fp = str_replace('%s', $s, $fp);
		
		return $fp;
	
	}
	
	
	/**
	 * トランザクション・スタート
	 */
	public function begin(){
		$this->strategy->begin();
	}
	
	/**
	 * トランザクション・ロールバック
	 */
	public function rollback(){
		$this->strategy->rollback();
	}
	
	/**
	 * トランザクション・コミット
	 */
	public function commit(){
		$this->strategy->commit();
	}
	
	
	/**
	 * XSSサニタイズ
	 *
	 * @note
	 * XSSサニタイズ
	 * 記号「<>」を「&lt;&gt;」にエスケープする。
	 *
	 * @param mixed $data 対象データ | 値および配列を指定
	 * @return void
	 */
	public function xssSanitizeW(&$data){
		$this->xss_sanitize($data);
		return $data;
	}
	
	/**
	 * XSSエスケープ（XSSサニタイズ）
	 *
	 * @note
	 * XSSサニタイズ
	 * 記号「<>」を「&lt;&gt;」にエスケープする。
	 * 高速化のため、引数は参照（ポインタ）にしており、返値もかねている。
	 *
	 * @param mixed $data 対象データ | 値および配列を指定
	 * @return void
	 */
	private function xss_sanitize(&$data){
		
		if(is_array($data)){
			foreach($data as &$val){
				$this->xss_sanitize($val);
			}
			unset($val);
		}elseif(gettype($data)=='string'){
			$data = str_replace(array('<','>'),array('&lt;','&gt;'),$data);
		}else{
			// 何もしない
		}
	}
	
	
	/**
	 * SQLインジェクションサニタイズ
	 * @param mixed $data 文字列および配列に対応
	 * @return mixed サニタイズ後のデータ
	 */
	public function sqlSanitizeW(&$data){
		$this->sql_sanitize($data);
		return $data;
	}
	
	
	/**
	 * SQLインジェクションサニタイズ(配列用)
	 *
	 * @note
	 * SQLインジェクション対策のためデータをサニタイズする。
	 * 高速化のため、引数は参照（ポインタ）にしている。
	 *
	 * @param array サニタイズデコード対象のデータ
	 * @return void
	 */
	private function sql_sanitize(&$data){
		
		if(is_array($data)){
			foreach($data as &$val){
				$this->sql_sanitize($val);
			}
			unset($val);
		}elseif(gettype($data)=='string'){
			$data = addslashes($data);// SQLインジェクション のサニタイズ
		}else{
			// 何もしない
		}
	}
	
	
	/**
	 * SELECT SQLを実行して単一の値を取得する
	 * @param string $sql
	 * @return mixed 単一の値
	 */
	public function selectValue($sql){
		return $this->strategy->selectValue($sql);
	}
	
	/**
	* SQLを実行してエンティティを取得する
	* @param string $sql
	* @return [] エンティティ
	*/
	public function selectEntity($sql){
		return $this->strategy->selectEntity($sql);
	}
	
	
	/**
	 * SQLを実行してデータを取得する
	 * @param string $sql
	 * @return [] データ（エンティティの配列）
	 */
	public function selectData($sql){
		return $this->strategy->selectData($sql);
	}
	
	
	/**
	* エンティティのDB保存
	* @param [] $ent エンティティ
	* @param [] DB保存パラメータ
	*  - form_type フォーム種別  new_inp:新規入力 edit:編集 delete:削除
	*  - ni_tr_place 新規入力追加場所フラグ 0:末尾(デフォルト） , 1:先頭
	*  - tbl_name DBテーブル名
	*  - whiteList ホワイトリスト（省略可）
	* @return [] エンティティ(insertされた場合、新idがセットされている）
	*/
	public function saveEntity(&$ent, $regParam = []){
		
	    // ホワイトリストを取得する
	    $whiteList = [];
	    if(!empty($regParam['whiteList'])){
	        $whiteList = $regParam['whiteList'];
	    }else if(!empty($this->whiteList)){
	        $whiteList = $this->whiteList;
	    }else if(!empty($this->crudBaseData['fields'])){
	        $whiteList = $this->crudBaseData['fields'];
	    }else{
	        throw new Exception('ERR whitList i s empty!');
	    }

		$tbl_name = $this->crudBaseData['tbl_name'];

		$form_type = $regParam['form_type'] ?? '';
		// idが空、つまり新規入力時のみ順番を取得してセットする。
		if($form_type == 'new_inp'){
			$ni_tr_place = $regParam['ni_tr_place'];
			$ent['sort_no'] = $this->crudBaseModel->getSortNo($tbl_name, $ni_tr_place); // 順番を取得する
		}

		return $this->crudBaseModel->saveEntity($ent, $whiteList); // エンティティをDB保存
	}
	
	
	/**
	 * エンティティをDB保存(シンプル版)
	 * ※SQLインジェクションのサニタイズは当メソッドで行っていないためよく注意すること。
	 * @param [] $ent エンティティ
	 * @param string $tbl_name
	 */
	public function saveSimple(&$ent, $tbl_name){
	    return $this->crudBaseModel->saveSimple($ent, $tbl_name);
	    
	}
	
	
	/**
    * 順番を取得する
	 * @param int $ni_tr_place 新規入力追加場所フラグ 0:末尾(デフォルト） , 1:先頭
	 * @return int 順番
	 */
	public function getSortNo($tbl_name, $ni_tr_place){
		return $this->crudBaseModel->getSortNo($tbl_name, $ni_tr_place); // 順番を取得する
	}
	
	
	/**
	 * データのDB保存
	 * @param [] $data データ（エンティティの配列）
	 * @return [] データ(insertされた場合、新idがセットされている）
	 */
	public function saveAll(&$data){

		$whiteList = $this->crudBaseData['fields'];
		
		return $this->crudBaseModel->saveAll($data, $whiteList);
		
	}
	
	
	/**
	 * idに紐づくレコードをDB削除
	 * @param int $id
	 */
	public function delete($id){
		return $this->crudBaseModel->delete($id);
	}
	
	
	/**
	 * 削除用のエンティティを取得する
	 * @param int $id ID
	 */
	public function getEntForDelete($id){
		if(empty($id)){
			throw new Exception('IDが空です。');
		}
		
		$ent2 = array(
				'id'=>$id,
				'delete_flg'=>1,
		);
		
		// 更新ユーザーなど共通フィールドをセットする。
		$ent2 = $this->setCommonToEntity($ent2);
		
		return $ent2;
	}
	
	
	/**
	 * アップロードファイルの抹消処理
	 *
	 * @note
	 * 他のレコードが保持しているファイルは抹消対象外
	 *
	 * @param int $id
	 * @param string $fn_field_strs ファイルフィールド群文字列（複数ある場合はコンマで連結）
	 * @param array $ent エンティティ
	 */
	public function eliminateFiles($id, $fn_field_strs, &$ent){
		return $this->crudBaseModel->eliminateFiles($id, $fn_field_strs, $ent);
	}
	
	/**
	 * フレームワーク・ストラテジーのオブジェクトを取得する
	 * @return ICrudBaseStrategy フレームワーク・ストラテジー
	 */
	public function getStrategy(){
		return $this->strategy;
	}
	
	/**
	 * 権限リストを取得する
	 * @param [] $userInfo ユーザー情報
	 * @return [] 権限リスト
	 */
	public function getRoleList($userInfo = []){
		return $this->crudBaseModel->getRoleList($userInfo);
	}
	
	/**
	 * 許可権限リストを作成(扱える下位権限のリスト）
	 * @return array 許可権限リスト
	 */
	public function makePermRoles(){
		return $this->crudBaseModel->makePermRoles();
	}
	
	
	/**
	 * 外部名称をエンティティにセットする
	 * @param [] $ent エンティティ
	 */
	public function setOuterNameFromDb(&$ent){
		
		// フィールドデータを取得する
		$fieldData = $this->crudBaseData['fieldData']['def'];
		foreach($ent as $field=>$value){
			if(empty($fieldData[$field])) continue;
			$fEnt = $fieldData[$field];
			
			if(!empty($fEnt['outer_tbl_name'])){
				if(empty($value)) continue;
				if(!is_numeric($value)) throw new Exception('システムエラー CBC210605C');
				$outer_tbl_name = $fEnt['outer_tbl_name'];
				$outer_field = $fEnt['outer_field'];
				$outer_alias = $fEnt['outer_alias'];
				$sql = "SELECT {$outer_field} AS {$outer_alias} FROM {$outer_tbl_name} WHERE id={$value}";
				$outer_name = $this->strategy->selectValue($sql);
				if($outer_name === null) $outer_name = '';
				$ent[$outer_alias] = $outer_name;
				
			}
			
		}
	
		return $ent;
	}
	
	/**
	 * SQLを実行する
	 * @param string $sql
	 * @return mixed
	 */
	public function query($sql){
		return $this->strategy->query($sql);
	}

}