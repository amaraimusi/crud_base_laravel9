<?php
/**
 * JSON関連の拡張機能
 * 
 * @date 2017-2-21
 * @version 1.0
 *
 */
class JsonEx{
	
	/**
	 * PHP5.4からでないと対応していないUnicodeアンエスケープをPHP5.3でもできるようにしたラッパー関数
	 * @note
	 * 第一引き数にのみデータ指定すればよい。
	 * 
	 * @param mixed   $value
	 * @param int     $options
	 * @param boolean $unescapee_unicode
	 * @link http://kohkimakimoto.hatenablog.com/entry/2012/05/17/180738
	 */
	public function jsonEncodeUnEscapeUnicode($value, $options = 0, $unescapee_unicode = true)
	{
		$v = json_encode($value, $options);
		if ($unescapee_unicode) {
			$v = $this->unicode_encode($v);
			// スラッシュのエスケープをアンエスケープする
			$v = preg_replace('/\\\\\//', '/', $v);
		}
		return $v;
	}
	
	/**
	 * Unicodeエスケープされた文字列をUTF-8文字列に戻す。
	 * 
	 * @note
	 * For jsonEncodeUnEscapeUnicode
	 * 参考:http://d.hatena.ne.jp/iizukaw/20090422
	 * @param string $str
	 * @link http://kohkimakimoto.hatenablog.com/entry/2012/05/17/180738
	 */
	private function unicode_encode($str)
	{
		return preg_replace_callback("/\\\\u([0-9a-zA-Z]{4})/", array($this,"encode_callback"), $str);
	}
	private function encode_callback($matches) {
		return mb_convert_encoding(pack("H*", $matches[1]), "UTF-8", "UTF-16");
	}
}