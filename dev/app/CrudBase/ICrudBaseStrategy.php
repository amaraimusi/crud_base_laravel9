<?php
interface ICrudBaseStrategy{
	public function setCtrl($ctrl); // クライアントコントローラのセッター
	public function setModel($model); // クライアントモデルのセッター
	public function setWhiteList(&$whiteList); // ホワイトリストのセッター
	public function setCrudBaseData(&$crudBaseData); // ホワイトリストのセッター
	public function sqlExe($sql);
	public function query($sql);
	public function selectValue($sql); // SQLを実行して単一の値を取得する
	public function selectEntity($sql); // SQLを実行してエンティティを取得する
	public function selectData($sql); // SQLを実行してデータを取得する
	public function begin();
	public function rollback();
	public function commit();
	public function sessionWrite($key, $value); // セッションに書き込み
	public function sessionRead($key); // セッションから読み取り
	public function sessionDelete($key); // セッションから削除
	public function getUserInfo(); // ユーザー情報を取得する
	public function getPath(); // パス情報を取得する
	public function saveAll(&$data, &$option=[]); // データをDB保存
	public function save(&$ent, &$option=[]); // エンティティをDB保存
	public function saveSimple(&$ent, $tbl_name); // エンティティをDB保存(シンプル版)
	public function delete($id); // idに紐づくレコードをDB削除
	public function validForKj($data,$validate); // 検索条件のバリデーション
	public function getCsrfToken(); // CSRFトークン ※Ajaxのセキュリティ
	public function passwordToHash($pw); // パスワードをハッシュ化する。
	public function login($option=[]); // ログインする
	public function logout($option = []); // ログアウトする
	public function loginCheck(); // ログインチェック
	public function getAuth(); // ユーザー情報
}