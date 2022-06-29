<?php
require_once ('LogEx.php');
/**
 * 入力チェックバリデーション | InputCheckValid
 * 
 * @date 2019-7-11 | 2019-8-28
 * @version 1.0.2
 * @license MIT
 * @author k_uehara
 *
 */
class InputCheckValid{
    
    var $param;
    var $logEx; // LogEx.php
    
    /**
     * コンストラクタ
     * @param array $param
     *  - log_flg ログフラグ 0:ログ出力しない（デフォ）, 1:ログ出力する
     *  - log_fp ログファイルパス
     *  - smp_str_len    サンプル文字列長    省略可
     */
    public function __construct($param = []){
        $this->param = $this->setParamIfEmpty($param);
        
        // ログクラスの生成
        if(!empty($this->param['log_flg'])){
            $log_fp = $this->param['log_fp'];
            $this->logEx = new LogEx(['log_fp' => $log_fp]);
        }
    }
    
    /**
     * If Param property is empty, set a value.
     * @param array $param
     * @return array
     */
    private function setParamIfEmpty($param){
        if(empty($param)) $param = [];
        
        if(empty($param['log_flg'])) $param['log_flg'] = 0; // ログフラグ 0:ログ出力しない（デフォ）, 1:ログ出力する
        if(empty($param['log_fp'])) $param['log_fp'] = null; // ログファイルパス
        if(empty($param['smp_str_len'])) $param['smp_str_len'] = 8; // サンプル文字列長
        
        return $param;
    }
    
    /**
     * バリデーションデータを正規化する
     * @param array $validData バリデーションデータ
     * @return array 正規化したバリデーション
     */
    public function normalizeValidData(&$validData){
        
        foreach($validData as $field => &$validEnt){
            if(empty($validEnt['req'])) $validEnt['req'] = null;
            if(empty($validEnt['field'])) $validEnt['field'] = $field;
            if(empty($validEnt['wamei'])) $validEnt['wamei'] = $field;
            $validEnt['field_name'] = "「{$validEnt['wamei']}」";
            
            // バリデーションタイプが数値系である場合、最大値と最小値を定義する。
            $valid_type = $validEnt['valid_type'];
            if($valid_type == 'int' || $valid_type == 'double' || $valid_type == 'natural' ){
                if(!isset($validEnt['max'])) $validEnt['max'] = null;
                if(!isset($validEnt['min'])) $validEnt['min'] = null;
            }

        }
        unset($validEnt);
        
        return $validData;
    }
    
    /**
     * エンティティのバリデーション
     * @param array $ent エンティティ
     * @param array $validData バリデーションデータ
     * @param int $row_no 行番号
     * @param int $res_type レスポンスタイプ 0:文字列, 1:配列(キー:フィールド, 値:エラーメッセージ)
     * @return mixed エラー情報 null:すべて正常
     */
    public function validEnt(&$ent, &$validData, $row_no=null, $res_type=0){
        
        $errs = [];
        foreach($validData as $field => &$validEnt){
            $valid_type = $validEnt['valid_type'];
            $err_msg = null;
            switch ($valid_type){
                case null:
                    $err_msg = null;
                    break;
                case 'string':
                    $err_msg = $this->validString($ent, $validEnt); // 文字列バリデーション
                    break;
                case 'int':
                    $err_msg = $this->validInt($ent, $validEnt); // 整数バリデーション
                    break;
                case 'natural':
                    $err_msg = $this->validNatural($ent, $validEnt); // 自然数バリデーション
                    break;
                case 'double':
                    $err_msg = $this->validDouble($ent, $validEnt); // 浮動小数バリデーション
                    break;
                case 'float':
                    $err_msg = $this->validDouble($ent, $validEnt); // 浮動小数バリデーション
                    break;
                case 'date':
                    $err_msg = $this->validDate($ent, $validEnt); // 日付バリデーション
                    break;
                case 'datetime':
                    $err_msg = $this->validDatetime($ent, $validEnt); // 日時バリデーション
                    break;
                case 'none':
                    $err_msg = null;
                    break;
                default:
                    throw new Exception("Unknown valid_type:{$valid_type}");
                    
            }
            if(!empty($err_msg)) $errs[$field] = $err_msg;
        }
        unset($validEnt);
        
        // エラーがなければnullを返す
        if(empty($errs)) return null;
        
        $err_line =  implode(' | ', $errs); // エラー行
        
        // 行番が指定されている場合、行情報を追記する。
        if($row_no !== null){
            $err_line = 'テキストファイルの' . $row_no . '行目: ' . $err_line;
        }
        
        // ログファイルにエラー行を出力
        if($this->param['log_flg'] != 0){
            $this->logEx->write($err_line);
        }
        
        // エラーメッセージのレスポンス
        $res = null;
        if($res_type == 1){
            $res = $errs;
        }else{
            $res = $err_line;
        }
        
        return $res;
    }
    
    
    /**
     * 文字列バリデーション
     * @param array $ent データのエンティティ
     * @param array $validEnt バリデーションエンティティ
     * @return string エラーメッセージ
     */
    private function validString(&$ent, &$validEnt){
        $field = $validEnt['field'];
        
        $value = '';
        if(!empty($ent[$field])) $value = $ent[$field];
        
        // 必須入力チェック
        if($validEnt['req']!=null && $value==''){
            return "{$validEnt['field_name']}は必須入力です。";
        }
        
        // 長さチェック
        if(!empty($validEnt['len'])){
            $len = $validEnt['len'];
            $smp_str = $value;
            if($len < mb_strlen($smp_str)){
                $smp_str_len = $this->param['smp_str_len'];
                if(mb_strlen($smp_str) > $smp_str_len){
                    $smp_str = mb_substr($smp_str, 0, $smp_str_len);
                    $smp_str .= '...';
                }
                return "{$validEnt['field_name']}は{$len}文字以内にしてください。→'{$smp_str}'";
            }
        }
        
        return "";
    }
    
    
    /** 
     * 整数バリデーション
     * @param array $ent データのエンティティ
     * @param array $validEnt バリデーションエンティティ
     * @return string エラーメッセージ
     */
    private function validInt(&$ent, &$validEnt){
        $field = $validEnt['field'];
        
        // 数値用必須バリデーション
        $err_msg = $this->validReqForNum($field, $ent, $validEnt);
        if(!empty($err_msg)) return $err_msg;

        $value = 0;
        if(!empty($ent[$field]))  $value = $ent[$field];
        
        // 整数チェック
        if(!preg_match('/^[-]?[0-9]+?$/', $value)){
            return "{$validEnt['field_name']}は整数にしてください。→{$value}";
        }
        
        // 最大値と最小値のバリデーション
        $err_msg = $this->validMaxAndMin($value, $validEnt);
        if(!empty($err_msg)) return $err_msg;
        
        return "";
    }
    
    
    /**
     * 自然数バリデーション
     * @param array $ent データのエンティティ
     * @param array $validEnt バリデーションエンティティ
     * @return string エラーメッセージ
     */
    private function validNatural(&$ent, &$validEnt){
        $field = $validEnt['field'];
        
        // 数値用必須バリデーション
        $err_msg = $this->validReqForNum($field, $ent, $validEnt);
        if(!empty($err_msg)) return $err_msg;
        
        $value = 0;
        if(!empty($ent[$field]))  $value = $ent[$field];
        
        // 整数チェック
        if(!preg_match('/^[0-9]+?$/', $value)){
            return "{$validEnt['field_name']}は自然数にしてください。→{$value}";
        }
        
        // 最大値と最小値のバリデーション
        $err_msg = $this->validMaxAndMin($value, $validEnt);
        if(!empty($err_msg)) return $err_msg;
        
        return "";
    }
    
    
    /**
     * 浮動小数バリデーション
     * @param array $ent データのエンティティ
     * @param array $validEnt バリデーションエンティティ
     * @return string エラーメッセージ
     */
    private function validDouble(&$ent, &$validEnt){
        
        $field = $validEnt['field'];

        // 数値用必須バリデーション
        $err_msg = $this->validReqForNum($field, $ent, $validEnt);
        if(!empty($err_msg)) return $err_msg;
        
        $value = 0;
        if(!empty($ent[$field]))  $value = $ent[$field];

        // 浮動小数チェック
        if(!is_numeric($value)){
            return "{$validEnt['field_name']}は数値にしてください。→{$value}";
        }

        // 最大値と最小値のバリデーション
        $err_msg = $this->validMaxAndMin($value, $validEnt);
        if(!empty($err_msg)) return $err_msg;
        
        return "";
    }
    
    
    /**
     * 数値用必須バリデーション
     * @param string $field
     * @param array $ent
     * @param array $validEnt
     * @return string エラーメッセージ
     */
    private function validReqForNum($field, $ent, &$validEnt){
        // 必須入力チェック
        if($validEnt['req'] != null){
            if(!isset($ent[$field])){
                return  "{$validEnt['field_name']}が存在しません。";
            }
            
            if(empty($ent[$field]) && $ent[$field]!==0 && $ent[$field] !=='0'){
                return "{$validEnt['field_name']}は必須入力です。";
            }
        }
        return '';
    }
    
    
    /**
     * 最大値と最小値のバリデーション
     * @param int $value
     * @param array $validEnt
     * @return string エラーメッセージ
     */
    private function validMaxAndMin($value, &$validEnt){
        
        // 最大値チェック
        if($validEnt['max'] !== null){
            $max = intval($validEnt['max']);
            if($max < $value){
                return "{$validEnt['field_name']}は{$max}を超えてはなりません。→{$value}";
            }
        }
        
        // 最小値チェック
        if($validEnt['min'] !== null){
            $min = intval($validEnt['min']);
            if($min > $value){
                return "{$validEnt['field_name']}は{$min}を下回ってはなりません。→{$value}";
            }
        }
        
        return "";
    }
    
    
    /**
     * 日付バリデーション
     * @param array $ent データのエンティティ
     * @param array $validEnt バリデーションエンティティ
     * @return string エラーメッセージ
     */
    private function validDate(&$ent, &$validEnt){
        $field = $validEnt['field'];
        
        $value = '';
        if(!empty($ent[$field])) $value = $ent[$field];
        
        // 必須入力チェック
        if($value == ''){
            if(empty($validEnt['req'])){
                return "";
            }else{
                return "{$validEnt['field_name']}は必須入力です。";
            }
            
        }
        
        //日付を年月日時分秒に分解する。
        $aryA =preg_split( '|[ /:_-]|', $value );
        if(count($aryA)!=3){
            return "{$validEnt['field_name']}は日付型（Y-m-dもしくはY/m/d)で入力してください。→{$value}";
        }
        
        foreach ($aryA as $key => $val){
            
            //▼正数以外が混じっているば、即座にfalseを返して処理終了
            if (!preg_match("/^[0-9]+$/", $val)) {
                return "{$validEnt['field_name']}は日付を入力してください。→{$value}";
            }
            
        }
        
        //▼グレゴリオ暦と整合正が取れてるかチェック。（閏年などはエラー） ※さくらサーバーではemptyでチェックするとバグになるので注意。×→if(empty(checkdate(12,11,2012))){・・・}
        if(checkdate($aryA[1], $aryA[2], $aryA[0])==false){
            return "{$validEnt['field_name']}は実在する日付を入力してください。→{$value}";
        }
        
        return "";
    }
    
    
    /**
     * 日時バリデーション
     * @param array $ent データのエンティティ
     * @param array $validEnt バリデーションエンティティ
     * @return string エラーメッセージ
     */
    private function validDatetime(&$ent, &$validEnt){
        $field = $validEnt['field'];
        
        $value = '';
        if(!empty($ent[$field])) $value = $ent[$field];
        
        // 必須入力チェック
        if($value == ''){
            if(empty($validEnt['req'])){
                return "";
            }else{
                return "{$validEnt['field_name']}は必須入力です。";
            }
            
        }
        
        //日付を年月日時分秒に分解する。
        $aryA =preg_split( '/[-: \/]/', $value );
        if(count($aryA)!=6){
            return "{$validEnt['field_name']}は日時型（Y-m-d h:i:sもしくはY/m/d h:i:s)で入力してください。→{$value}";
        }
        
        foreach ($aryA as $key => $val){
            
            //▼正数以外が混じっているば、即座にfalseを返して処理終了
            if (!preg_match("/^[0-9]+$/", $val)) {
                return "{$validEnt['field_name']}は日時を入力してください。→{$value}";
            }
            
        }
        
        //▼グレゴリオ暦と整合正が取れてるかチェック。（閏年などはエラー） ※さくらサーバーではemptyでチェックするとバグになるので注意。×→if(empty(checkdate(12,11,2012))){・・・}
        if(checkdate($aryA[1], $aryA[2], $aryA[0])==false){
            return "{$validEnt['field_name']}は実在する日付を入力してください。→{$value}";
        } 
        
        //▼時刻の整合性をチェック
        if($aryA[3] < 0 || $aryA[3] > 23){
            return "{$validEnt['field_name']}の時間部分(時）が異常です。→{$value}";
        }
        if($aryA[4] < 0 ||  $aryA[4] > 59){
            return "{$validEnt['field_name']}の時間部分(分）が異常です。→{$value}";
        }
        if($aryA[5] < 0 || $aryA[5] > 59){
            return "{$validEnt['field_name']}の時間部分(秒）が異常です。→{$value}";
        }
        
        return "";
    }
    
    
    /**
     * 日時入力チェックのバリデーション
     * ※日付のみあるいは時刻は異常と見なす。
     * @param string $strDateTime 日時文字列
     * @param string $reqFlg 必須許可フラグ
     * @return boolean    true:正常, false:異常
     * @date 2015-10-5    改良
     */
    private function isDatetime($strDateTime, $reqFlg){
        
        //空値且つ、必須入力がnullであれば、trueを返す。
        if(empty($strDateTime) && empty($reqFlg)){
            return true;
        }
        
        //空値且つ、必須入力がtrueであれば、falseを返す。
        if(empty($strDateTime) && !empty($reqFlg)){
            return false;
        }
        
        
        //日時を　年月日時分秒に分解する。
        $aryA =preg_split( '|[ /:_-]|', $strDateTime );
        if(count($aryA)!=6){
            return false;
        }
        
        foreach ($aryA as $key => $val){
            
            //▼正数以外が混じっているば、即座にfalseを返して処理終了
            if (!preg_match("/^[0-9]+$/", $val)) {
                return false;
            }
            
        }
        
        //▼グレゴリオ暦と整合正が取れてるかチェック。（閏年などはエラー） ※さくらサーバーではemptyでチェックするとバグになるので注意。×→if(empty(checkdate(12,11,2012))){・・・}
        if(checkdate($aryA[1],$aryA[2],$aryA[0])==false){
            return false;
        }
        
        //▼時刻の整合性をチェック
        if($aryA[3] < 0 || $aryA[3] > 23){
            return false;
        }
        if($aryA[4] < 0 ||  $aryA[4] > 59){
            return false;
        }
        if($aryA[5] < 0 || $aryA[5] > 59){
            return false;
        }
        
        return true;
    }
    
    /**
     * エラーログテキストを取得
     * @param int $limit 行制限  テキストファイルから取得するログ取得制限  nullを指定した場合、10万行になる。
     * @return string ログのテキスト
     */
    public function getErrLogText($limit = 200){
        $err_log_text = '';
        if(!empty($this->param['log_flg'])){
            $err_log_text = $this->logEx->getLogText($limit);
        }
        return $err_log_text;
    }
   
    /**
     * CSVフィールドからバリデーションデータを作成する
     * @param array $csvFieldData CSVフィールドデータ
     * @return array バリデーションデータ
     */
    public function makeValidDataFromCsvFieldData(&$csvFieldData){
        $validData = [];

        foreach($csvFieldData as $cfEnt){
            
            $field = $cfEnt['field'];
            $vEnt = ['wamei'=>$cfEnt['clm_name']];
            
            $valid = [];
            if(empty($cfEnt['valid'])){
                $valid = ['valid_type'=>null];
            }else if(is_string($cfEnt['valid'])){
                $valid = ['valid_type'=>$cfEnt['valid']];
            }else{
                $valid = $cfEnt['valid'];
            }
            
            // 必須フラグ
            $req = 1;
            if(empty($cfEnt['req_flg'])) $req = 0;
            $vEnt['req'] = $req;

            $valid_type = $valid['valid_type'];
            $vEnt['valid_type'] = $valid_type;
            
            // 文字列系の属性設定
            if($valid_type == 'string'){
                $len = null;
                if(!empty($valid['len'])) $len = $valid['len'];
                $vEnt['len'] = $len;
            }
            
            // 数値系の属性設定
            if($valid_type == 'int' || $valid_type == 'natural' || $valid_type == 'double' || $valid_type == 'float'){
                $max = null;
                if(!empty($valid['max'])) $max = $valid['max'];
                $vEnt['max'] = $max;
                
                $min = null;
                if(!empty($valid['min'])) $min = $valid['min'];
                $vEnt['min'] = $min;
                
            }

            $validData[$field] = $vEnt;
        }
        
        // バリデーションデータを正規化する
        $validData = $this->normalizeValidData($validData);

        return $validData;
    }
    
    
}