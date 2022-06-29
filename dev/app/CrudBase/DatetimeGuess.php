<?php

/**
 * 部分文字列から日時情報を推測するクラス
 * 
 * @note
 * 「2018-3」,「4-1」,「10:30」などの部分的な日時文字列から、フォーマットや日時などの情報を取得する。
 * 
 * @date 2018-3-31
 * @version 1.0
 * @author kenji uehara
 *
 */
class DatetimeGuess{
    
    /**
     * 部分的な日時文字列から日時情報を推測する。
     *
     * @note
     * 部分的な日時文字列とは「2018-8」,「8/31」,「10:30」などを指す。
     *
     * @param string $str 部分的日時文字列
     * @param $option
     *  - time_priority 時刻優先フラグ(あいまいな数値並びである場合、日付と時刻のどちらを優先判定するか)    0:日付フォーマットを優先判定 , 1:時刻フォーマットを優先判定
     *  - format_b 出力の１つであるdatetime_bのフォーマット（デフォルト→ Y-m-d H:i:s)
     * @return array
     *  - orig_datetime 元の日時文字列
     *  - datetime_a 部分日時
     *  - format_a 部分日時フォーマット
     *  - datetime_b 日時
     *  - format_b 日時フォーマット
     *  - format_mysql_a 部分日時フォーマット（MySQL用）
     *  - format_mysql_b 日時フォーマット（MySQL用）
     *  
     */
    public function guessDatetimeInfo($str,$option=array()){
        
        $orig_datetime = $str;
        
        // 番号のみの文字列から日時を推測取得するする（201808など）
        $datetime_a = $this->convNumStr2date($str,$option);
        
        // 部分日付文字列のフォーマットを取得する
        $format_a = $this->getDateFormatFromString($datetime_a,$option);
        
        $format_b = 'Y-m-d H:i:s';
        if(isset($option['format_b'])) $format_b = $option['format_b'];
        
        // 部分的日時のフォーマット変換
        $datetime_b = $this->convDatetimeFormat($datetime_a,$format_a,$format_b);
        
        // 日時フォーマットをMySQL用の日時フォーマットに変換する（例：Y-m-d → %Y-%m-%d)
        $format_mysql_a = $this->convDateformatForMySql($format_a);
        $format_mysql_b = $this->convDateformatForMySql($format_b);
        
        
        return array(
            'orig_datetime' => $orig_datetime,
            'datetime_a' => $datetime_a,
            'format_a' => $format_a,
            'datetime_b' => $datetime_b,
            'format_b' => $format_b,
            'format_mysql_a' => $format_mysql_a,
            'format_mysql_b' => $format_mysql_b,
        );
        
        
    }
    
    
    /**
     * 文字列から適切な日時のフォーマットを取得する
     *
     * @param string $str 日付文字列
     * @param $format =  string フォーマット
     * @param $option
     *  - time＿priority 時刻優先フラグ    0:日付フォーマットを優先判定 , 1:時刻フォーマットを優先判定
     *  - mysql_format_flg MySQLフォーマットフラグ 0:PHP型の日時フォーマット , 1:MySQL型の日時フォーマット
     */
    public function getDateFormatFromString($str,$option=array()){
        
        $time＿priority = 0;
        if(!empty($option['time＿priority'])) $time＿priority = $option['time＿priority'];
        
        $mysql_format_flg = 0;
        if(!empty($option['mysql_format_flg'])) $mysql_format_flg = $option['mysql_format_flg'];
        
        
        $format = '';
        
        if(preg_match('/^\d+$/', $str)){
            
            $len = strlen($str);
            if($len == 14){
                $format =  'Y-m-d H:i:s';
            }else if($len == 8){
                $format =  'Y-m-d';
            }else if($len == 6){
                if($time＿priority == 0){
                    $format =  'Y-m-d';
                }else{
                    $format =  'H:i:s';
                }
                
            }else if($len == 4){
                if($time＿priority == 0){
                    if(preg_match('/^[1-9][0-9]{3}$/', $str)){
                        $format =  'Y';
                    }else{
                        $format =  'm-d';
                    }
                }else{
                    $format =  'H:i';
                }
            }else if($len == 1 || $len == 2){
                if($time＿priority == 0){
                    $format =  'd';
                }else{
                    $format =  'h';
                }
            }
        }
        else if(preg_match('/^[1-9]([0-9]{3})(\/|-)([0-9]{1,2})(\/|-)([0-9]{1,2}) ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})/', $str)){
            $format =  'Y-m-d H:i:s';
        }
        else if(preg_match('/^[1-9]([0-9]{3})(\/|-)([0-9]{1,2})(\/|-)([0-9]{1,2}) ([0-9]{1,2}):([0-9]{1,2})/', $str)){
            $format =  'Y-m-d H:i';
        }
        else if(preg_match('/^[1-9]([0-9]{3})(\/|-)([0-9]{1,2})(\/|-)([0-9]{1,2}) ([0-9]{1,2})/', $str)){
            $format =  'Y-m-d H';
        }
        else if(preg_match('/^[1-9]([0-9]{3})(\/|-)([0-9]{1,2})(\/|-)([0-9]{1,2})/', $str)){
            $format =  'Y-m-d';
        }
        else if(preg_match('/^[1-9]([0-9]{3})(\/|-)([0-9]{1,2})/', $str)){
            $format =  'Y-m';
        }
        else if(preg_match('/^[1-9]([0-9]{3})$/', $str)){
            $format =  'Y';
        }
        else if(preg_match('/([0-9]{1,2})(\/|-)([0-9]{1,2})/', $str)){
            $format =  'm-d';
        }
        else if(preg_match('/([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})/', $str)){
            $format =  'H:i:s';
        }
        else if(preg_match('/([0-9]{1,2}):([0-9]{1,2})/', $str)){
            $format =  'H:i';
        }
        
        // MySQLフォーマットフラグがONであるならば、日時フォーマットをMySQL用の日時フォーマットに変換する（例：Y-m-d → %Y-%m-%d)
        if(!empty($mysql_format_flg)){
            $format = $this->convDateformatForMySql($format);
        }
        
        return $format;
    }
    
    /**
     * 日時フォーマットをMySQL用の日時フォーマットに変換する（例：Y-m-d → %Y-%m-%d)
     * @param string $format 日時フォーマット
     * @return string MySQL用の日時フォーマット
     */
    public function convDateformatForMySql($format){
        $format2='';
        $ary = str_split($format);
        for($i=0;$i<count($ary);$i++){
            if($i % 2==0){
                $format2 .= '%' . $ary[$i];
            }else{
                $format2 .= $ary[$i];
            }
        }
        return $format2;
    }
    
    
    /**
     * 番号文字列から適切な日時のフォーマットを取得する
     *
     * @param string $str 日付文字列
     * @param $option
     *  - time＿priority 時刻優先フラグ    0(デフォ）:日付フォーマットを優先判定 , 1:時刻フォーマットを優先判定
     * @return string フォーマット
     */
    public function convNumStr2date($str,$option = array()){
        
        if(empty($str)) return $str;
        if(!preg_match('/^\d+$/', $str)) return $str;
        
        $time＿priority = 0;
        if(isset($option['time＿priority'])) $time＿priority = $option['time＿priority'];
        
        $ary = str_split($str, 2);
        $len = strlen($str);
        if($len == 14){
            
            // Y-m-d H:i:s
            return "{$ary[0]}{$ary[1]}-{$ary[2]}-{$ary[3]} {$ary[4]}:{$ary[5]}:{$ary[6]}";
        }else if($len == 12){
            
            // Y-m-d H:i:s
            return "{$ary[0]}{$ary[1]}-{$ary[2]}-{$ary[3]} {$ary[4]}:{$ary[5]}";
        }else if($len == 10){
            
            // Y-m-d H:i:s
            return "{$ary[0]}{$ary[1]}-{$ary[2]}-{$ary[3]} {$ary[4]}";
            
            
        }else if($len == 8){
            // Y-m-d
            return "{$ary[0]}{$ary[1]}-{$ary[2]}-{$ary[3]}";
            
            
        }else if($len == 6){
            if($time＿priority == 0){

                if(preg_match('/^[1-9]([0-9]{3})([0-9]{1,2})/', $str)){
                    // Y-m-d
                    return "{$ary[0]}{$ary[1]}-{$ary[2]}";
                }else{

                    // H:i:s
                    return "{$ary[0]}:{$ary[1]}:{$ary[2]}";
                }
            }else{
                // H:i:s
                return "{$ary[0]}:{$ary[1]}:{$ary[2]}";
            }
            
        }else if($len == 4){
            if($time＿priority == 0){

                if(preg_match('/^[1,2][0,9]/', $str)){
                    // Y
                    return "{$ary[0]}{$ary[1]}";
                }else{
                    // m-d
                    return "{$ary[0]}-{$ary[1]}";
                }
            }else{
                // H:i
                return "{$ary[0]}:{$ary[1]}:00";
            }
        }else if($len == 1 || $len == 2){
            if($time＿priority == 0){
                return "{$ary[0]}";
            }else{
                return "{$ary[0]}:00:00";
            }
        }
        
        
        return null;
    }
    
    /**
     * 部分的日時のフォーマット変換
     * @param string $str 部分的日時
     * @param string $format1 部分的日時のフォーマット
     * @param string $format2 変換先のフォーマット
     * @param array $option オプション
     *  - digit2_flg 2桁そろえフラグ    0:2桁に揃えず , 1(デフォルト）:2桁に揃える（ 例： 8 → 08）
     * @return string フォーマット変換された日時
     */
    public function convDatetimeFormat($str,$format1,$format2,$option=array()){
        
        $digit2_flg = 1;
        if(isset($option['digit2_flg'])) $digit2_flg = $option['digit2_flg'];
        
        $list = preg_split("/[-\/\s:]/", $str);
        $fmts1 = preg_split("/[-\/\s:]/", $format1);
        $fKeys1 = array_flip($fmts1);
        $fmts2 = preg_split("/[-\/\s:]/", $format2);
        
        $str2 = $format2;
        foreach($fmts2 as $i => $key){
            $v = null;
            if(isset($fKeys1[$key])){
                $fk_i = $fKeys1[$key];
                $v = $list[$fk_i];
            }else{
                switch ($key) {
                    case 'Y': $v = date('Y'); break;
                    case 'm': $v = '1'; break;
                    case 'd': $v = '1'; break;
                    case 'H': $v = '0'; break;
                    case 'i': $v = '0'; break;
                    case 's': $v = '0'; break;
                }
            }
            
            if(!empty($digit2_flg) && strlen($v) == 1){
                $v = '0' . $v;
            }
            
            $str2 = str_replace($key, $v, $str2);
        }
        return $str2;
    }
    
}