<?php
/**
 * ログEXクラス
 * 
 * @note
 * ディレクトリごとログファイルを作成、また旧ログファイルの除去も行う。
 * @date 2019-7-13
 * @version 1.0
 * @license MIT
 * @author k_uehara
 *
 */
class LogEx{
    
    
    var $param;
    
    /**
     * コンストラクタ
     * @param array $param
     *  - log_fp  ログファイルパス
     */
    public function __construct($param = []){
        $this->param = $this->setParamIfEmpty($param);
        
        $log_fp = $this->param['log_fp'];
        $this->makeLogFile($log_fp); // ログファイルを作成
        
        // 指定日数より古い更新日のファイルをすべて削除する
        $pi = pathinfo($log_fp);
        $log_dp = $pi['dirname'];
        $this->removeFileByOldDay($log_dp, $this->param['del_file_day'], 'log');
        
        $this->param['log_dp'] = $log_dp;
        
    }
    
    /**
     * If Param property is empty, set a value.
     * @param array $param
     * @return array
     */
    private function setParamIfEmpty($param){
        if(empty($param)) $param = [];
        
        if(empty($param['log_fp'])) $param['log_fp'] = 'log/a' . date('Ymdhis') . '.log';
        if(empty($param['del_file_day'])) $param['del_file_day'] = 1;
        
        return $param;
    }
    
    /**
     * ログ書き出し
     * @param string $text テキスト
     */
    public function write($text){
        
        $h = fopen ( $this->param['log_fp'], 'ab' ); // ファイルを追記モードで開く
        flock ( $h, LOCK_EX ); // ファイルを排他ロックする
        fwrite ( $h, $text . "\n" ); // データをファイルに書き込む
        fclose ( $h ); // ファイルを閉じる
    }
    
    
    /**
     * ログファイルを作成
     * @param string $log_fp
     */
    private function makeLogFile($log_fp){
        if(empty($log_fp)) return;
        
        $paths = pathinfo($log_fp);
        $dp = $paths['dirname']; // ディレクトリパス
        $fn = $paths['basename']; // ファイル名
        
        // ディレクトリが存在しないなら作成
        if (!is_dir($dp)){
            $this->makeDirEx($dp, '0755');
        }
        
        // ログファイルファイルの作成（テキストファイルの作成)
        $h = fopen ( $log_fp, 'ab' ); // ファイルを追記モードで開く
        flock ( $h, LOCK_EX ); // ファイルを排他ロックする
        fclose ( $h ); // ファイルを閉じる
    }
    
    
    /**
     * ディレクトリを作成する
     *
     * @note
     * ディレクトリが既に存在しているならディレクトリを作成しない。
     * パスに新しく作成せねばならないディレクトリ情報が複数含まれている場合でも、順次ディレクトリを作成する。
     * 日本語ディレクトリ名にも対応。
     * パスセパレータは「/」と「¥」に対応。
     * ディレクトリのパーミッションの変更をを行う。(既にディレクトリが存在する場合も）
     * セパレータから始まるディレクトリはホームルートパスからの始まりとみなす。
     *
     * @version 1.3
     * @date 2014-4-13 | 2018-8-18
     *
     * @param string $dir_path ディレクトリパス
     */
    private function makeDirEx($dir_path,$permission = 0666){
        
        if(empty($dir_path)){return;}
        
        $home_flg = false; // ホームディレクトリパス  1:ホーム(htdocsより以降）からのパス
        $s1 = mb_substr($dir_path,0,1);
        if($s1 == '/' || $s1 == DIRECTORY_SEPARATOR){
            $home_flg = 1;
        }
        
        // 日本語名を含むパスに対応する
        $dir_path=mb_convert_encoding($dir_path,'SJIS','UTF-8');
        
        // ディレクトリが既に存在する場合、書込み可能にする。
        if (is_dir($dir_path)){
            chmod($dir_path,$permission);// 書込み可能なディレクトリとする
            return;
        }
        
        // パスセパレータを取得する
        $sep = DIRECTORY_SEPARATOR;
        if(strpos($dir_path,"/")!==false){
            $sep = "/";
        }
        
        //パスを各ディレクトリに分解し、ディレクトリ配列をして取得する。
        $ary=explode($sep, $dir_path);
        
        //ディレクトリ配列の件数分以下の処理を繰り返す。
        $dd = '';
        foreach ($ary as $i => $val){
            
            if($i==0){
                $dd=$val;
                if($home_flg == 1){
                    $dd = $_SERVER['DOCUMENT_ROOT'] . $sep . $dd;
                }
            }else{
                $dd .= $sep.$val;
            }
            
            //作成したディレクトリが存在しない場合、ディレクトリを作成
            if (!is_dir($dd)){
                mkdir($dd,$permission);//ディレクトリを作成
                chmod($dd,$permission);// 書込み可能なディレクトリとする
            }
        }
    }
    
    
    /**
     * 危険処理
     * 指定日数より古い更新日のファイルをすべて削除する
     *
     * @note
     *指定日数に2を指定した場合、二日以上前のファイルをすべて削除。
     *0を指定すると、すべてのファイルを削除
     *
     * @param string $dp ディレクトリパス
     * @param number $day_num 指定日数
     * @param string $ext 削除ファイルの拡張子（小文字） null:すべてのファイルが対象
     */
    public function removeFileByOldDay($dp, $day_num = 1, $ext = null){
        
        $fps = $this->scandir3($dp); // ディレクトリ内にあるすべてのファイルのファイルパスを取得する
        $today = date("Y-m-d");
        
        foreach($fps as $fp){
            $dt = date("Y-m-d", filemtime($fp));
            $diff_day = $this->diffDay($today, $dt); // 2つの日付の日数差を算出する

            // 日付差が指定日数以上なら、ファイル削除とする。
            if($day_num <= $diff_day){
                
                // ファイルパスから拡張子（小文字）を取得
                $pi = pathinfo($fp);
                $ext2 = mb_strtolower($pi['extension']); 
                
                // 拡張子が一致するなら、このファイルを削除する
                if($ext == $ext2){
                    unlink($fp);
                }
            }
        }
    }
    
    
    /**
     * 2つの日付の日数差を算出する
     *
     * diff = d2 - d1
     *
     * @param date or string $d2
     * @param date or string $d1
     * @return int 日数差
     */
    private function diffDay($d2,$d1){
        
        $u1=strtotime($d1);
        $u2=strtotime($d2);
        
        //日数を算出
        $diff=$u2-$u1;
        $d_cnt=$diff/86400;
        
        return $d_cnt;
    }
    
    
    /**
     * scandir関数の拡張関数。
     *
     * @note
     * 「.」「..」となっているファイル名は除外する。
     *
     * @param  string $dp ディレクトリ名
     * @param string $sep セパレータ（省略可）
     * @return array ファイルパスリスト
     */
    private function scandir3($dp, $sep = '/'){
        $files = scandir($dp);
        
        // ディレクトリパスの末尾にセパレータを付け足す
        $dp2 = $dp;
        if(mb_substr($dp2, -1) != $sep){
            $dp2 .= $sep;
        }
        
        // 「.」,「..」名のファイルを除去、および日本語ファイルに対応。
        $fps = [];
        foreach($files as $file){
            if($file=='.' || $file=='..'){
                continue;
            }
            $fps[] = $dp2 . $file;
        }
        
        return $fps;
    }
    
    
    /**
     * ログのテキストを取得
     * @param int $limit 行制限  テキストファイルから取得するログ取得制限  nullを指定した場合、10万行になる。
     * @return string ログのテキスト
     */
    public function getLogText($limit = 200){
        if($limit == null) $limit = 100000;
        $log_text = ''; // ログテキスト
        $log_fp = $this->param['log_fp'];
        $i=0;
        if ($h = fopen ( $log_fp, "r" )) {
            while ( false !== ($line = fgets ( $h )) ) {
                $log_text .= $line;
                $i++;
                if($limit == $i) break;
            }
        }
        fclose ( $h );
        
        return $log_text;
    }
    
}
