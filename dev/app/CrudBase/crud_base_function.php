<?php

/**
 * CrudBase 汎用関数
 * @varsion 1.0.0
 * @since 2021-7-17
 * 
 */

if (!function_exists('h')) {

	function h($text) {
		$double = true;
		$charset = null;
		
		if (is_string($text)) {
		
		} elseif (is_array($text)) {
			$texts = array();
			foreach ($text as $k => $t) {
				$texts[$k] = h($t, $double, $charset);
			}
			return $texts;
		} elseif (is_object($text)) {
			if (method_exists($text, '__toString')) {
				$text = (string)$text;
			} else {
				$text = '(object)' . get_class($text);
			}
		} elseif (is_bool($text)) {
			return $text;
		}
		
		static $defaultCharset = 'UTF-8';
		
		if (is_string($double)) {
			$charset = $double;
			$double = true;
		}
		return htmlspecialchars($text, ENT_QUOTES, ($charset) ? $charset : $defaultCharset, $double);
	}
	
}

if (!function_exists('debug')) {
	function debug($var){
		echo "<pre>";
		var_dump($var);
		echo "</pre>";
	}

}


