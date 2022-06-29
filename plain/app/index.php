<?php
session_start(); // セッションを開始。 警告が出るので、echoの前に呼び出すこと。

require_once 'crud_base_config.php';

$place_str = cbStringRight($_SERVER["REQUEST_URI"], CRUD_BASE_URL_BASE);
$places =explode("/",$place_str);
$class_name = $places[0];
$action_name = $places[1] ?? 'index'; // アクション名を取得する

if(!empty($class_name)){
    $class_name = cbCamelize($class_name) . 'Controller'; // クラス名に変換する。
    require_once "controller/{$class_name}.php";
    $ctrl = new $class_name(); // クラスを生成
    echo $ctrl->$action_name(); // アクションを実行
    
}


function cbShortcode($short_code, $param = []){
    
    
    switch ($short_code) {
        case 'MsgBoard': // メッセージボード
            require_once CRUD_BASE_ROOT . 'controller/MsgBoardController.php';
            $msgBoardController = new MsgBoardController($param);
            return $msgBoardController->index();
            break;
            
        default:
            throw new Exception("'{$short_code}' is unown!");
            break;
    }
}


function crudBaseJs($code){
    global $crud_base_js;
    global $crud_base_url_base;
    
    $script_js = "<script src='{$crud_base_js}'></script>";
    
    switch ($code) {
        case 'MsgBoard': // メッセージボード
            $script_js .= "<script src='{$crud_base_url_base}js/MsgBoard/MsgBoard.js?v=1.0.1'></script>";
            $script_js .= "<script src='{$crud_base_url_base}js/MsgBoard/index.js?v=1.0.0'></script>";
            break;
            
        default:
            throw new Exception("crudBaseJs→ '{$code}' is unown!");
            break;
    }
    
    return $script_js;
}

function crudBaseCss($code){
    global $crud_base_css;
    global $crud_base_url_base;
    
    //<link href='/note_prg/css/common2.css' rel="stylesheet">
    $script_js = "<link href='{$crud_base_css}' rel='stylesheet'>";
    
    switch ($code) {
        case 'MsgBoard': // メッセージボード
            $script_js .= "<link href='{$crud_base_url_base}css/MsgBoard/index.css?v=1.0.0' rel='stylesheet'>";
            break;
            
        default:
            throw new Exception("crudBaseCss→ '{$code}' is unown!");
            break;
    }
    
    return $script_js;
}


/**
 * キャメルケースにスネークケースから変換する
 * 
 * 先頭も大文字になる。
 * 
 * @param string $str スネークケースの文字列
 * @return string キャメルケースの文字列
 */
function cbCamelize($str) {
	$str = strtr($str, '_', ' ');
	$str = ucwords($str);
	return str_replace(' ', '', $str);
}


/**
 * 文字列を左側から印文字を検索し、右側の文字を切り出す。
 * @param string $s 対象文字列
 * @param string $mark 印文字
 * @return string 印文字から右側の文字列
 */
function cbStringRight($s,$mark){
    if ($s==null || $s==""){
        return $s;
    }
    
    $a=strpos($s,$mark);
    if($a==null && $a!==0){
        return "";
    }
    $s2=substr($s,$a + strlen($mark),strlen($s));
    return $s2;
}