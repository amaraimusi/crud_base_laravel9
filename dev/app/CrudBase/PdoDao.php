<?php
require_once 'IDao.php';

/**
 * PDOのDAO（データベースアクセスオブジェクト）
 * 
 * @date 2019-10-26 | 2022-6-17
 * @version 1.4.0
 * @license MIT
 * @author Kenji Uehara
 *
 */
class PdoDao implements IDao
{
	
    private $dao;
    
    /**
     * 初期化方法は下記の2通りある。
     * 1. 引数$dbConfにDB接続情報を指定する方法。フレームワーク未使用ならこちらの方法を採用。
     * 2. 引数$pdoを指定する方法。Laravelなどのフレームワークを利用している場合は、Laravelが保有するPDOのインスタンスを指定する。
     * @param array $dbConf
     * @param PDO $pdo 
     */
    public function __construct($dbConf=[], $pdo = null){
        
        if(!empty($pdo)){
            $this->dao = $pdo;
            return;
        }
        
        if(empty($dbConf)){
            global $crudBaseConfig;
            $dbConf = $crudBaseConfig['dbConfig'];
        }

        try {
            $this->dao = new PDO("mysql:host={$dbConf['host']};dbname={$dbConf['db_name']};charset=utf8",$dbConf['user'],$dbConf['pw'],
            array(PDO::ATTR_EMULATE_PREPARES => false));

        } catch (PDOException $e) {
            exit('データベース接続失敗。'.$e->getMessage());
            die;
        }

    }
	
	
	
	/**
	 * DAO(データベースアクセスオブジェクト）を取得する
	 * @return object Dao
	 */
	public function getDao(){

        return $this->dao;
	}
	
	/**
	 * SQLを実行してデータを取得する
	 * @return boolean|PDOStatement[][]
	 */
	public function getData($sql){
		$dao = $this->getDao();
		$stmt = $dao->query($sql);
		if($stmt === false) {
			var_dump('SQLエラー→' . $sql);
			return false;
		}
		
		$data = [];
		foreach ($stmt as $row) {
			$ent = [];
			foreach($row as $key => $value){
				if(!is_numeric($key)){
					$ent[$key] = $value;
				}
			}
			$data[] = $ent;
		}
		
		return $data;
	}
	
	/**
	 * SQLを実行
	 * @param string $sql
	 * {@inheritDoc}
	 * @see IDao::sqlExe()
	 * @return [][] 2次元構造データ
	 */
	public function sqlExe($sql){
	    return $this->query($sql);
	}
	
	/**
	 * SQLを実行
	 * @param string $sql
	 * @return string エラーメッセージ
	 */
	public function query($sql){
	    $stmt = $this->dao->query($sql);

	    if($stmt === false){
	        $errInfo = $this->dao->errorInfo();
	        $err_msg = "
				<pre>
					SQLエラー→{$sql}
					$errInfo[0]
					$errInfo[1]
					$errInfo[2]
				</pre>
			";
			var_dump($err_msg);
	    }
	    
	    $data = $stmt->fetchAll();
	    if($data === false){
	        $errInfo = $this->dao->errorInfo();
	        $err_msg = "
				<pre>
					SQLエラー→{$sql}
					$errInfo[0]
					$errInfo[1]
					$errInfo[2]
				</pre>
			";
					var_dump($err_msg);
	    }
	    
	    return $data;

	}
	
	
	
	public function begin(){
		$dao = $this->getDao();
		$stmt = $dao->query('BEGIN');
	}
	
	public function rollback(){
		$dao = $this->getDao();
		$stmt = $dao->query('ROLLBACK');

	}
	
	public function commit(){
		$dao = $this->getDao();
		$stmt = $dao->query('COMMIT');

	}
}

