<?php

namespace App\Http\Controllers;
use App\Http\Controllers\AppController;
use Illuminate\Http\Request;
use App\Models\Neko;
use Illuminate¥Support¥Facades¥DB;

class NekoController extends AppController
{
	
	// 当画面バージョン (バージョンを変更すると画面に新バージョン通知とクリアボタンが表示されます。）
	public $this_page_version = '1.0.0';
	
	protected $cb; // CrudBase制御クラス
	protected $md; // モデル
	
	/**
	 * ネコCRUDページ
	 */
	public function index(){
	    
// 	    // ログアウトになっていたらログイン画面にリダイレクト
//         if(\Auth::id() == null){
//             return redirect('login');
//         }

		$this->init();
		
 		// CrudBase共通処理（前）
 		$crudBaseData = $this->cb->indexBefore();//indexアクションの共通先処理(CrudBaseController)
 		
 		$userInfo = $this->getUserInfo();
		$crudBaseData['userInfo'] = $userInfo;
 		// CBBXS-2019
 		
 		// CBBXE
		
		//一覧データを取得
		$res = $this->md->getData($crudBaseData);
		$data = $res['data'];
		$non_limit_count = $res['non_limit_count']; // LIMIT制限なし・データ件数

		// CrudBase共通処理（後）
		$crudBaseData = $this->cb->indexAfter($crudBaseData, ['non_limit_count'=>$non_limit_count]);
		
		$masters = []; // マスターリスト群
		
		// CBBXS-2020
		$nekoGroupList = $this->md->getNekoGroupList();
		$masters['nekoGroupList'] = $nekoGroupList;
		// CBBXE

		$crudBaseData['masters'] = $masters;
		
		$crud_base_json = json_encode($crudBaseData,JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS);
		return view('neko.index', compact('data', 'crudBaseData', 'crud_base_json'));
		
		
	}
	
	
	/**
	 * DB登録
	 *
	 * @note
	 * Ajaxによる登録。
	 * 編集登録と新規入力登録の両方に対応している。
	 */
	public function ajax_reg(){
		
		$this->init();
		
		$errs = []; // エラーリスト
		
// 		// すでにログアウトになったらlogoutであることをフロントエンド側に知らせる。
// 		if(\Auth::id() == null){
// 		    $json_str = json_encode(['err_msg'=>'logout']);
// 		    return $json_str;
// 		}
		
		// JSON文字列をパースしてエンティティを取得する
		$json=$_POST['key1'];
		$ent = json_decode($json, true);
		
		// 登録パラメータ
		$reg_param_json = $_POST['reg_param_json'];
		$regParam = json_decode($reg_param_json,true);
		$form_type = $regParam['form_type']; // フォーム種別 new_inp,edit,delete,eliminate

		// CBBXS-2024
		
		// CBBXE
		$ent = $this->setCommonToEntity($ent);
		$ent = $this->md->saveEntity($ent, $regParam);
		

		// ファイルアップロードとファイル名のDB保存
		if(!empty($_FILES)){
			// CBBXS-20271
			$img_fn = $this->cb->makeFilePath($_FILES, "storage/neko/y%Y/{$ent['id']}/%unique/orig/%fn", $ent, 'img_fn');
			$fileUploadK = $this->factoryFileUploadK();
			
			// ▼旧ファイルを指定ディレクトリごと削除する。
			$ary = explode("/", $img_fn);
			$ary = array_slice($ary, 0, 4);
			$del_dp = implode('/', $ary);
			$fileUploadK->removeDirectory($del_dp); // 旧ファイルを指定ディレクトリごと削除
			
			// ファイル配置＆DB保存
			$fileUploadK->putFile1($_FILES, 'img_fn', $img_fn);
			$ent['img_fn'] = $img_fn;
			$this->md->saveEntity($ent, $regParam);
			// CBBXE
		}
		
		$json_str = json_encode($ent, JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS); // JSONに変換
		
		return $json_str;
		
	}
	
	
	/**
	 * 削除登録
	 *
	 * @note
	 * Ajaxによる削除登録。
	 * 削除更新でだけでなく有効化に対応している。
	 * また、DBから実際に削除する抹消にも対応している。
	 */
	public function ajax_delete(){

		$this->init();

// 		// すでにログアウトになったらlogoutであることをフロントエンド側に知らせる。
// 		if(\Auth::id() == null){
// 		    $json_str = json_encode(['err_msg'=>'logout']);
// 		    return $json_str;
// 		}
		
		// JSON文字列をパースしてエンティティを取得する
		$json=$_POST['key1'];
		$ent0 = json_decode($json,true);
		
		
		// 登録パラメータ
		$reg_param_json = $_POST['reg_param_json'];
		$regParam = json_decode($reg_param_json,true);
		
		// 抹消フラグ
		$eliminate_flg = 0;
		if(isset($regParam['eliminate_flg'])) $eliminate_flg = $regParam['eliminate_flg'];
		
		// 削除用のエンティティを取得する
		$ent = $this->cb->getEntForDelete($ent0['id']);
		$ent['delete_flg'] = $ent0['delete_flg'];
		
		// エンティティをDB保存
		if($eliminate_flg == 0){
			$ent = $this->md->saveEntity($ent,$regParam); // 更新
		}else{
			
			// CBBXS-2026
 			$this->cb->eliminateFiles($ent['id'], 'img_fn', $ent); // ファイル抹消（他のレコードが保持しているファイルは抹消対象外）
 			// CBBXE
 			
 			$this->cb->delete($ent['id']); // idに紐づくレコードをDB削除
		}
		
		$json_str =json_encode($ent);//JSONに変換
		
 		return $json_str;
	}
	
	
	/**
	 * Ajax | ソート後の自動保存
	 *
	 * @note
	 * バリデーション機能は備えていない
	 *
	 */
	public function auto_save(){
		
		$this->init();
		
// 		// すでにログアウトになったらlogoutであることをフロントエンド側に知らせる。
// 		if(\Auth::id() == null){
// 		    $json_str = json_encode(['err_msg'=>'logout']);
// 		    return $json_str;
// 		}
		
		$json=$_POST['key1'];
		
		$data = json_decode($json,true);//JSON文字を配列に戻す
		
		$data2 = [];
		foreach($data as $ent){
		    $data2[] = [
		        'id' => $ent['id'],
		        'sort_no' => $ent['sort_no'],
		    ];
		}
		
		// データ保存
		$this->cb->begin();
		$this->cb->saveAll($data2); // まとめて保存。内部でSQLサニタイズされる。
		$this->cb->commit();
		
		$res = ['success'];
		
		$json_str = json_encode($res);//JSONに変換
		
		return $json_str;
	}
	
	
	/**
	 * ファイルアップロードクラスのファクトリーメソッド
	 * @return \App\Http\Controllers\FileUploadK
	 */
	private function factoryFileUploadK(){
		$crud_base_path = CRUD_BASE_PATH;
		require_once $crud_base_path . 'FileUploadK/FileUploadK.php';
		$fileUploadK = new \FileUploadK();
		return $fileUploadK;
	}
	
	
	/**
	 * CrudBase用の初期化処理
	 *
	 * @note
	 * フィールド関連の定義をする。
	 *
	 */
	private function init(){
		
		
		
		/// 検索条件情報の定義
		$kensakuJoken=[
				
				['name'=>'kj_main', 'def'=>null],
				// CBBXS-2000
				['name'=>'kj_id', 'def'=>null],
				['name'=>'kj_neko_val1', 'def'=>null, 'field'=>'neko_val'],
				['name'=>'kj_neko_val2', 'def'=>null, 'field'=>'neko_val'],
				['name'=>'kj_neko_name', 'def'=>null],
				['name'=>'kj_neko_date_ym', 'def'=>null],
				['name'=>'kj_neko_date1', 'def'=>null, 'field'=>'neko_date'],
				['name'=>'kj_neko_date2', 'def'=>null, 'field'=>'neko_date'],
				['name'=>'kj_neko_group', 'def'=>null],
				['name'=>'kj_neko_dt', 'def'=>null],
				['name'=>'kj_neko_flg', 'def'=>-1],
				['name'=>'kj_img_fn', 'def'=>null],
				['name'=>'kj_note', 'def'=>null],
				['name'=>'kj_sort_no', 'def'=>null],
				['name'=>'kj_delete_flg', 'def'=>0],
				['name'=>'kj_update_user', 'def'=>null],
				['name'=>'kj_ip_addr', 'def'=>null],
				['name'=>'kj_created', 'def'=>null],
				['name'=>'kj_modified', 'def'=>null],
				// CBBXE
				
				['name'=>'row_limit', 'def'=>50],
				
		];
		
		
		///フィールドデータ
		$fieldData = ['def'=>[
				
				// CBBXS-2002
				'id'=>[
						'name'=>'ID',//HTMLテーブルの列名
						'row_order'=>'Neko.id',//SQLでの並び替えコード
						'clm_show'=>1,//デフォルト列表示 0:非表示 1:表示
				],
				'neko_val'=>[
						'name'=>'ネコ数値',
						'row_order'=>'Neko.neko_val',
						'clm_show'=>0,
				],
				'neko_name'=>[
						'name'=>'ネコ名前',
						'row_order'=>'Neko.neko_name',
						'clm_show'=>1,
				],
				'neko_group'=>[
						'name'=>'ネコ種別',
						'row_order'=>'Neko.neko_group',
						'clm_show'=>1,
				],
				'neko_date'=>[
						'name'=>'ネコ日',
						'row_order'=>'Neko.neko_date',
						'clm_show'=>1,
				],
				'neko_dt'=>[
						'name'=>'ネコ日時',
						'row_order'=>'Neko.neko_dt',
						'clm_show'=>1,
				],
				'neko_flg'=>[
						'name'=>'ネコフラグ',
						'row_order'=>'Neko.neko_flg',
						'clm_show'=>1,
				],
				'img_fn'=>[
						'name'=>'画像ファイル名',
						'row_order'=>'Neko.img_fn',
						'clm_show'=>1,
				],
				'note'=>[
						'name'=>'備考',
						'row_order'=>'Neko.note',
						'clm_show'=>0,
				],
				'sort_no'=>[
						'name'=>'順番',
						'row_order'=>'Neko.sort_no',
						'clm_show'=>0,
				],
				'delete_flg'=>[
						'name'=>'有効/無効',
						'row_order'=>'Neko.delete_flg',
						'clm_show'=>1,
				],
				'update_user'=>[
						'name'=>'更新者',
						'row_order'=>'Neko.update_user',
						'clm_show'=>0,
				],
				'ip_addr'=>[
						'name'=>'更新IPアドレス',
						'row_order'=>'Neko.ip_addr',
						'clm_show'=>0,
				],
				'created'=>[
						'name'=>'生成日時',
						'row_order'=>'Neko.created',
						'clm_show'=>0,
				],
				'modified'=>[
						'name'=>'更新日時',
						'row_order'=>'Neko.modified',
						'clm_show'=>1,
				],
				// CBBXE
		]];
		
		// 列並び順をセットする
		$clm_sort_no = 0;
		foreach ($fieldData['def'] as &$fEnt){
			$fEnt['clm_sort_no'] = $clm_sort_no;
			$clm_sort_no ++;
		}
		unset($fEnt);
		
		
		$crud_base_path = CRUD_BASE_PATH;
		$crud_base_js = CRUD_BASE_JS;
		$crud_base_css = CRUD_BASE_CSS;
		require_once $crud_base_path . 'CrudBaseController.php';
		
		$model = new Neko(); // モデルクラス
		
		$crudBaseData = [
				'fw_type' => 'laravel7',
				'model_name_c' => 'Neko',
				'tbl_name' => 'nekos', // テーブル名をセット
				'kensakuJoken' => $kensakuJoken, //検索条件情報
				'fieldData' => $fieldData, //フィールドデータ
				'crud_base_path' => $crud_base_path,
				'crud_base_js' => $crud_base_js,
				'crud_base_css' => $crud_base_css,
		];
		
		$crudBaseCon = new \CrudBaseController($this, $model, $crudBaseData);
		
		$model->init($crudBaseCon);
		
		$this->md = $model;
		$this->cb =$crudBaseCon;
		
		$crudBaseData = $crudBaseCon->getCrudBaseData();
		return $crudBaseData;
		
	}

	/**
	 * AJAX | 一覧のチェックボックス複数選択による一括処理
	 * @return string
	 */
	public function ajax_pwms(){
		$this->init();
		return $this->cb->ajax_pwms();
	}

	
	/**
	 * CSVダウンロード
	 *
	 * 一覧画面のCSVダウンロードボタンを押したとき、一覧データをCSVファイルとしてダウンロードします。
	 */
	public function csv_download(){
		$this->init();
		
		//ダウンロード用のデータを取得する。
		$data = $this->getDataForDownload();
		
		// ダブルクォートで値を囲む
		foreach($data as &$ent){
			unset($ent['xml_text']);
			foreach($ent as $field => $value){
				if(mb_strpos($value,'"')!==false){
					$value = str_replace('"', '""', $value);
				}
				$value = '"' . $value . '"';
				$ent[$field] = $value;
			}
		}
		unset($ent);
		
		//列名配列を取得
		$clms=array_keys($data[0]);
		
		//データの先頭行に列名配列を挿入
		array_unshift($data,$clms);
		
		
		//CSVファイル名を作成
		$date = new \DateTime();
		$strDate=$date->format("Y-m-d");
		$fn='neko'.$strDate.'.csv';
		
		
		//CSVダウンロード
		$crud_base_path = CRUD_BASE_PATH;
		require_once $crud_base_path . 'CsvDownloader.php';
		$csv= new \CsvDownloader();
		$csv->output($fn, $data);

	}

	
	//ダウンロード用のデータを取得する。
	private function getDataForDownload(){
		
		//セッションから検索条件情報を取得
		$kjs=session('neko_kjs');

		// セッションからページネーション情報を取得
		$pages = session('neko_pages');
		
		$page_no = 0;
		$row_limit = 100000;
		$sort_field = $pages['sort_field'];
		$sort_desc = $pages['sort_desc'];
		
		$crudBaseData = [
				'kjs' => $kjs,
				'pages' => $pages,
				'page_no' => $page_no,
				'row_limit' => $row_limit,
				'sort_field' => $sort_field,
				'sort_desc' => $sort_desc,
		];
		
		
		//DBからデータ取得
		$res = $this->md->getData($crudBaseData);
		$data = $res['data'];
		if(empty($data)){
			return [];
		}
		
		return $data;
	}
	
	
	/**
	 * 一括登録 | AJAX
	 *
	 * @note
	 * 一括追加, 一括編集, 一括複製
	 */
	public function bulk_reg(){
		$this->init();
		
		$crud_base_path = CRUD_BASE_PATH;
		require_once $crud_base_path . 'BulkReg.php';
		
		// すでにログアウトになったらlogoutであることをフロントエンド側に知らせる。
		if(\Auth::id() == null){
		    $json_str = json_encode(['err_msg'=>'logout']);
		    return $json_str;
		}
		
		$update_user = \Auth::user()->name; // ユーザー名
		
		// 更新ユーザーを取得
		$update_user = 'none';

		
		$json_param=$_POST['key1'];
		$param = json_decode($json_param,true);//JSON文字を配列に戻す
		
		// 一括登録
		$strategy = $this->cb->getStrategy(); // フレームワークストラテジーを取得する
		$bulkReg = new \BulkReg($strategy, $update_user);
		$res = $bulkReg->reg('nekos', $param);
		
		//JSONに変換
		$str_json = json_encode($res,JSON_HEX_TAG | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_HEX_APOS);
		
		return $str_json;
	}
	
	public function getCb(){
	    return $this->cb;
	}
	
	public function getMd(){
	    return $this->md;
	}
	
	
}


