<?
require_once ("libs/sqllib.php");
require_once ("libs/sparqllib.php");
$drug_name = @$_GET ['name'];
if (! isset ( $drug_name ))
	$drug_name = 'acetaminophen';
$sq = new SQLQuery ();

//first check it in local db
$db_recs = $sq->dbQuery ( 'SELECT * FROM drug WHERE name LIKE "%' . $drug_name . '%"' );
//var_dump($db_recs);
$output = array ();
if (count ( $db_recs )) {
	foreach ( $db_recs as $v ) {
		$output_part = array ();
		$output_part ['s'] = $v ['uri'];
		$output_part ['name'] = $v ['name'];
		$output_part ['description'] = $v ['description'];
		$output [] = $output_part;
	}
} else {
//if not found check internet
	$db = sparql_connect ( "http://www4.wiwiss.fu-berlin.de/drugbank/sparql" );
	if (! $db) {
		print sparql_errno () . ": " . sparql_error () . "\n";
		exit ();
	}
	
	sparql_ns ( "rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#" );
	sparql_ns ( "drugbank", "http://www4.wiwiss.fu-berlin.de/drugbank/resource/drugbank/" );
	
	$sparql = 'SELECT DISTINCT ?s ?name ?description WHERE { ?s drugbank:genericName ?name . ?s drugbank:description ?description . ?s rdf:type drugbank:drugs . FILTER (REGEX(?name, "' . $drug_name . '", "i"))}';
	$result = sparql_query ( $sparql );
	if (! $result) {
		print sparql_errno () . ": " . sparql_error () . "\n";
		exit ();
	}
	$fields = sparql_field_array ( $result );

	while ( $row = sparql_fetch_array ( $result ) ) {
		$output_part = array ();

		foreach ( $fields as $field ) {
			$output_part [$field] = $row [$field];
		}
		$output [] = $output_part;
	}

	foreach ( $output as $v ) {
		$sq->dbInsert ( 'drug', array ('uri' => $v ['s'], 'name' => $v ['name'], 'description' => $v ['description'] ) );
	}
}
var_dump ( $output );
