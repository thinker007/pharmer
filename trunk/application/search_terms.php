<?
require_once ("libs/sqllib.php");

$term = @$_GET ['term'];

$sq = new SQLQuery ();

$db_recs= $sq->dbQuery ( 'SELECT DISTINCT term FROM searched_terms WHERE term LIKE :term AND drug_id IS NOT NULL',array('term'=>$term.'%') ); 
$output = array ();
foreach ( $db_recs as $v ) {
	$output[]=$v ['term'];
}
echo json_encode ( $output );
