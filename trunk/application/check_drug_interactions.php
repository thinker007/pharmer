<?
require_once ("libs/sqllib.php");

$drugs= @$_POST ['drugs'];
$drugs=split(',',$drugs);
$drugs= array_unique($drugs);
$interactions= array();

$sq = new SQLQuery ();
foreach($drugs as $key=>$drug_uri){
	$row= $sq->dbGetRow ( 'SELECT * FROM drug WHERE drug.uri=:drug_uri LIMIT 1',array('drug_uri'=>$drug_uri) );
	$drug_id=$row['id'];
	$drug_name=$row['name'];
	$db_recs= $sq->dbQuery ( 'SELECT * FROM drug_interaction WHERE drug_id=:drug_id',array('drug_id'=>$drug_id) );
	$interactions = array ();
	foreach ( $db_recs as $v ) {
		if (in_array($v ['drug2_uri'], $drugs)) {
			$row2= $sq->dbGetRow ( 'SELECT * FROM drug WHERE drug.uri=:drug_uri LIMIT 1',array('drug_uri'=>$v ['drug2_uri']) );
			$interactions[]=array("drug_1"=>$drug_name,"drug_2"=>$row2 ['name'],"description"=>$v ['description'],"interaction_uri"=>$v ['interaction_uri']);
		}
	}	
}
header('Content-type: application/json');
echo json_encode ( array('interactions'=>$interactions) );
