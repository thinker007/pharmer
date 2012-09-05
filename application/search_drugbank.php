<?
require_once ("libs/sqllib.php");
require_once ("libs/sparqllib.php");
$drug_name = @$_GET ['name'];
if (! isset ( $drug_name ))
	$drug_name = 'acetaminophen';
else
	$drug_name=trim($drug_name);
$sq = new SQLQuery ();
//first check it in local db
$db_recs_check = $sq->dbQuery ( 'SELECT * FROM searched_terms WHERE term=:term',array('term'=>$drug_name) ); 
$output = array ();
if (count ( $db_recs_check )) {
	$db_recs = $sq->dbQuery ( 'SELECT drug.uri,drug.name,drug.description FROM searched_terms,drug WHERE searched_terms.drug_id=drug.id AND searched_terms.term=:term',array('term'=>$drug_name) );    
	foreach ( $db_recs as $v ) {
		$output_part = array ();
		$output_part ['s'] = $v ['uri'];
		$output_part ['name'] = $v ['name'];
		$output_part ['description'] = $v ['description'];
		$output [] = $output_part;
	}
} else {
	//if not found check internet
	//first drugbank
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
	if (count ( $output )) {
		foreach ( $output as $v ) {
			$lastid=$sq->dbInsert ( 'drug', array ('uri' => $v ['s'], 'name' => $v ['name'], 'description' => $v ['description'] ) );
			$sq->dbInsert('searched_terms',array('term'=>$drug_name,'drug_id'=>$lastid));
		}
	} else {
		//not found in drugbank check dailymed
		$db = sparql_connect ( "http://www4.wiwiss.fu-berlin.de/dailymed/sparql" );
		if (! $db) {
			print sparql_errno () . ": " . sparql_error () . "\n";
			exit ();
		}
		
		sparql_ns ( "rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#" );
		sparql_ns ( "dailymed", "http://www4.wiwiss.fu-berlin.de/dailymed/resource/dailymed/" );
		$sparql = 'SELECT DISTINCT ?s ?name ?description WHERE { ?s dailymed:genericMedicine ?name . ?s dailymed:fullName ?description . ?s rdf:type dailymed:drugs . FILTER (REGEX(?name, "' . $drug_name . '", "i"))}';
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
		if (count ( $output )) {
			foreach ( $output as $v ) {
				$lastid=$sq->dbInsert ( 'drug', array ('uri' => $v ['s'], 'name' => $v ['name'], 'description' => $v ['description'] ) );
				$sq->dbInsert('searched_terms',array('term'=>$drug_name,'drug_id'=>$lastid));
			}
		}else{
			$sq->dbInsert('searched_terms',array('term'=>$drug_name,'drug_id'=>null));
		}
	}
}
header('Content-type: application/json');
echo json_encode ( array('drugs'=>$output) );
