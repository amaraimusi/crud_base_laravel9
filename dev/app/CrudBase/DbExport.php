<?php
class DbExport{
	
	public function test(IDao $dao){
		$data = $dao->sqlExe('SELECT * FROM nekos WHERE id=62');
	}
}