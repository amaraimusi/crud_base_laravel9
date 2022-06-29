<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * モデルクラスのベースクラス
 * 
 * @desc 各管理画面のモデルで共通するメソッドを記述する。
 * @version 1.0.0
 * @since 2021-10-28
 * @author kenji uehara
 *
 */
class AppModel extends Model{
    
    protected $cb; // CrudBase制御クラス
    protected $table = false; // 紐づけるテーブル名
    
    
    public function __construct(){
       
    }
    
    /**
     * 初期化
     * @param object $cb CrudBase制御クラス
     */
    protected function init($cb){
        $this->cb = $cb;
    }
    
    protected function setTableName($table){
        $this->table = $table;
    }
    

    // 外部結合文字列を作成する。
    protected function makeOuterJoinStr(&$crudBaseData){
        $fieldData = $crudBaseData['fieldData'];
        $model_name_c = $crudBaseData['model_name_c'];
        $str = '';
        
        foreach($fieldData as $fEnt){
            if(empty($fEnt['outer_tbl_name'])) continue;
            $field = $fEnt['id'];
            $str .= " LEFT JOIN {$fEnt['outer_tbl_name']} AS {$fEnt['outer_tbl_name_c']} ON {$model_name_c}.{$field} = {$fEnt['outer_tbl_name_c']}.id";
            
        }
        
        return $str;
    }
    
    
    // 外部SELECT文字列を作成する。
    protected function makeOuterSelectStr(&$crudBaseData){
        $fieldData = $crudBaseData['fieldData'];
        
        $str = '';
        
        foreach($fieldData as $fEnt){
            
            if(empty($fEnt['outer_tbl_name'])) continue;
            $str .= " ,{$fEnt['outer_tbl_name_c']}.{$fEnt['outer_field']} AS {$fEnt['outer_alias']} ";
            
        }
        
        
        return $str;
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
    public function sql_sanitize(&$data){
        
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
     * エンティティをDB保存(シンプル版)
	 * ※SQLインジェクションのサニタイズは当メソッドで行っていないためよく注意すること。
     * @param [] $ent エンティティ
     * @param string $tbl_name
     */
    public function saveSimple(&$ent, $tbl_name){
        return $this->cb->saveSimple($ent, $tbl_name);
        
    }
}