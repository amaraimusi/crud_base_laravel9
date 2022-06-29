<?php

/**
 * サブ画像集約ライブラリ
 * @author user
 *
 */
class SubImgAgg {
	
	/**
	 * サブ画像集約し、サブ画像リストHTMLを作成
	 * 
	 * @note
	 * ノートが空のフィールドを集約する
	 * @param array $data
	 * @param array $param パラメータ
	 *  - note_field ノートフィールド名
	 *  - img_field 画像フィールド名
	 *  - midway_dp 中間ディレクトリパス
	 * @return array 集約後のデータ
	 */
	public function agg(&$data, $param){
		
		// パラメータの初期化
		if(empty($param['note_field'])) $param['note_field'] = 'note';
		if(empty($param['img_field'])) $param['img_field'] = 'img_fn';
		if(empty($param['midway_dp'])) $param['midway_dp'] = '../';

		// データを集約する
		$data2 = $this->aggByNote($data,$param);
		
		// サブ画像リストHTMLを作成
		$data2 = $this->makeSubImgListHtml($data2, $param);
		
		

		return $data2;
	}
	
	/**
	 * ノートが空のフィールドを集約する
	 * @param array $data
	 * @param array $param パラメータ
	 *  - note_field ノートフィールド名
	 * @return array 集約後のデータ
	 */
	private function aggByNote(&$data,&$param){
		if(empty($data)) return $data;
		
		$note_field = $param['note_field'];
		$data2 = array();
		$data2[0] = $data[0];
		$data2[0]['childs'] = array();
		
		$i2 = 0;
		foreach($data as $i => $ent){
			if($i == 0) continue;
			
			$str = $ent[$note_field];
			$str = trim($str);
			
			// ▼ 対象フィールドが空であるならサブレコード（子要素）として追加。
			if(empty($str)) {
				$data2[$i2]['childs'][] = $ent;
			}else{
				// ▼ 対象フィールドが空でないなら主体レコード（親要素）とする。
				$ent2 = $ent;
				$ent2['childs'] = array();
				$data2[] = $ent2;
				$i2 ++;
			}
		}
		return $data2;
	}
	
	/**
	 * サブ画像リストHTMLを作成
	 * @param array $data
	 * @param array $param パラメータ
	 *  - img_field 画像フィールド名
	 *  - midway_dp 中間ディレクトリパス
	 * @return array サブ画像リストHTMLをセットした$data
	 */
	private function makeSubImgListHtml(&$data,&$param){
		
		$img_field = $param['img_field']; // 画像パスのフィールド
		$midway_dp = $param['midway_dp'];
		
		foreach($data as &$ent){
			
			$sub_img_list_html = "";
			if(empty($ent['childs'])){
				$ent['sub_img_list_html'] = $sub_img_list_html;
				
			}else{
				$sub_img_list_html = "<td class='td_sub_img_list td_image'>";
				foreach($ent['childs'] as $cEnt){
					$orig_fp = $midway_dp . $cEnt[$img_field];
					$mid_fp = str_replace('/orig/', '/mid/', $orig_fp);
					$sub_img_list_html .= "
						<div style='display:inline-block'>
							<img src='{$mid_fp}' class='' style='width: 160px; height: 160px;'><br>
							<a href='{$orig_fp}' class='btn btn-link btn-xs' target='blank'>拡大</a>
						</div>
					";
				}
				$sub_img_list_html .= "</td>";
				$ent['sub_img_list_html'] = $sub_img_list_html;
			}
		}
		unset($ent);
		
		
		return $data;
		
	}
	
	private function debug($v){
		var_dump('<pre>');
		var_dump($v);
		var_dump('</pre>');
	}
}

