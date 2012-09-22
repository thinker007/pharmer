<?
require_once ("libs/sqllib.php");

$drug_name= @$_GET ['drug'];

$sq = new SQLQuery ();
$output = array ();
if ( isset ( $drug_name )){
	$db_recs= $sq->dbQuery ( 'SELECT * FROM drug WHERE name LIKE :drug_name ORDER BY name ASC ',array('drug_name'=>'%'.$drug_name.'%') );
	foreach ( $db_recs as $v ) {
		$output_part = array ();
		$output_part ['s'] = $v ['uri'];
		$output_part ['name'] = $v ['name'];
		$output_part ['description'] = $v ['description'];
		$output_part ['absorption'] = $v ['absorption'];
		$output_part ['affectedOrganism'] = $v ['affectedOrganism'];
		$output_part ['biotransformation'] = $v ['biotransformation'];
		$output_part ['halfLife'] = $v ['halfLife'];
		$output_part ['indication'] = $v ['indication'];
		$output_part ['mechanismOfAction'] = $v ['mechanismOfAction'];
		$output_part ['pharmacology'] = $v ['pharmacology'];
		$output_part ['toxicity'] = $v ['toxicity'];
		
		$db_recssub = $sq->dbQuery ('SELECT * FROM dosage_form WHERE drug_id=:drugid', array('drugid'=>$v[id]));
		$tmp = array ();
		foreach ( $db_recssub as $vt ) {
			$tmp[]=$vt['dosageForm'];
		}
		$output_part ['dosageForms']=$tmp;
		
		$db_recssub = $sq->dbQuery ('SELECT * FROM drug_brandmixtures WHERE drug_id=:drugid', array('drugid'=>$v[id]));
		$tmp = array ();
		foreach ( $db_recssub as $vt ) {
			$tmp[]=$vt['brandMixture'];
		}
		$output_part ['brandMixtures']=$tmp;
		
		$db_recssub = $sq->dbQuery ('SELECT * FROM drug_brands WHERE drug_id=:drugid', array('drugid'=>$v[id]));
		$tmp = array ();
		foreach ( $db_recssub as $vt ) {
			$tmp[]=$vt['brandName'];
		}
		$output_part ['brandNames']=$tmp;
		
		$db_recssub = $sq->dbQuery ('SELECT * FROM drug_category WHERE drug_id=:drugid', array('drugid'=>$v[id]));
		$tmp = array ();
		foreach ( $db_recssub as $vt ) {
			$tmp[]=$vt['category'];
		}
		$output_part ['drugCategories']=$tmp;
		
		$db_recssub = $sq->dbQuery ('SELECT * FROM drug_contraindication WHERE drug_id=:drugid', array('drugid'=>$v[id]));
		$tmp = array ();
		foreach ( $db_recssub as $vt ) {
			$tmp[]=$vt['contraindication'];
		}
		$output_part ['contraindications']=$tmp;
		
		$db_recssub = $sq->dbQuery ('SELECT * FROM drug_enzyme WHERE drug_id=:drugid', array('drugid'=>$v[id]));
		$tmp = array ();
		foreach ( $db_recssub as $vt ) {
			$tmp[]=$vt['enzyme'];
		}
		$output_part ['drugEnzymes']=$tmp;
		
		$db_recssub = $sq->dbQuery ('SELECT * FROM drug_target WHERE drug_id=:drugid', array('drugid'=>$v[id]));
		$tmp = array ();
		foreach ( $db_recssub as $vt ) {
			$tmp[]=$vt['target'];
		}
		$output_part ['drugTargets']=$tmp;
		
		$db_recssub = $sq->dbQuery ('SELECT * FROM food_interaction WHERE drug_id=:drugid', array('drugid'=>$v[id]));
		$tmp = array ();
		foreach ( $db_recssub as $vt ) {
			$tmp[]=$vt['interaction'];
		}
		$output_part ['foodInteractions']=$tmp;
		
		$db_recssub = $sq->dbQuery ('SELECT * FROM drug_interaction WHERE drug_id=:drugid', array('drugid'=>$v[id]));
		$tmp = array ();
		foreach ( $db_recssub as $vt ) {
			$comp=array();
			$comp['drug2_uri']=$vt['drug2_uri'];
			$comp['interaction_uri']=$vt['interaction_uri'];
			$comp['description']=$vt['description'];
			$tmp[]=$comp;
		}
		$output_part ['drugInteractions']=$tmp;		
		
		$output [] = $output_part;
	}	
}

header('Content-type: application/json');
echo json_encode ( array('drugs'=>$output) );
