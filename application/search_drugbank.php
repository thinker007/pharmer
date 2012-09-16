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
	$db_recs = $sq->dbQuery ( 'SELECT drug.id,drug.uri,drug.name,drug.description,drug.absorption,drug.affectedOrganism, drug.biotransformation,drug.halfLife,drug.indication,drug.mechanismOfAction,drug.pharmacology,drug.toxicity FROM searched_terms,drug WHERE searched_terms.drug_id=drug.id AND searched_terms.term=:term',array('term'=>$drug_name) );    
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
	
	$sparql = 'SELECT DISTINCT ?s ?name ?description ?absorption ?affectedOrganism ?biotransformation ?halfLife ?indication ?mechanismOfAction ?pharmacology ?toxicity WHERE { ?s drugbank:genericName ?name . ?s drugbank:description ?description .?s drugbank:absorption ?absorption . ?s  drugbank:affectedOrganism ?affectedOrganism .?s  drugbank:biotransformation ?biotransformation .?s  drugbank:brandName ?brandName . ?s drugbank:halfLife ?halfLife.?s drugbank:indication ?indication . ?s drugbank:mechanismOfAction ?mechanismOfAction . ?s drugbank:pharmacology ?pharmacology. ?s drugbank:toxicity ?toxicity. ?s rdf:type drugbank:drugs . FILTER (REGEX(?name, "' . $drug_name . '", "i") || REGEX(?brandName, "' . $drug_name . '", "i"))}';
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
	//var_dump($output);
	if (count ( $output )) {
		foreach ( $output as $i=>$v ) {
			$lastid=$sq->dbInsert ( 'drug', array ('uri' => $v ['s'], 'name' => $v ['name'], 'description' => $v ['description'], 'absorption' => $v ['absorption'], 'affectedOrganism' => $v ['affectedOrganism'], 'biotransformation' => $v ['biotransformation'], 'halfLife' => $v ['halfLife'], 'indication' => $v ['indication'], 'mechanismOfAction' => $v ['mechanismOfAction'], 'pharmacology' => $v ['pharmacology'], 'toxicity' => $v ['toxicity'] ) );
			$sq->dbInsert('searched_terms',array('term'=>$drug_name,'drug_id'=>$lastid));
			//get food interactions
			$sparql ='SELECT DISTINCT ?foodInteraction WHERE {  <'.$v ['s'].'> drugbank:foodInteraction ?foodInteraction.  <'.$v ['s'].'> rdf:type drugbank:drugs . }';
			$result = sparql_query ( $sparql );
			$fields = sparql_field_array ( $result );
			$tmp = array ();
			while ( $row = sparql_fetch_array ( $result ) ) {
				foreach ( $fields as $field ) {
					$sq->dbInsert('food_interaction',array('drug_id'=>$lastid,'interaction'=>$row [$field]));
					$tmp [] = $row [$field];
				}
			}
			$output[$i] ['foodInteractions'] = $tmp;
			//get brands
			$sparql ='SELECT DISTINCT ?brandName WHERE {  <'.$v ['s'].'> drugbank:brandName ?brandName.  <'.$v ['s'].'> rdf:type drugbank:drugs . }';
			$result = sparql_query ( $sparql );
			$fields = sparql_field_array ( $result );
			$tmp = array ();
			while ( $row = sparql_fetch_array ( $result ) ) {
				foreach ( $fields as $field ) {
					$sq->dbInsert('drug_brands',array('drug_id'=>$lastid,'brandName'=>$row [$field]));
					$tmp [] = $row [$field];
				}
			}
			$output[$i] ['brandNames'] = $tmp;	
			//get brand mixtures
			$sparql ='SELECT DISTINCT ?brandMixture WHERE {  <'.$v ['s'].'> drugbank:brandMixture ?brandMixture.  <'.$v ['s'].'> rdf:type drugbank:drugs . }';
			$result = sparql_query ( $sparql );
			$fields = sparql_field_array ( $result );
			$tmp = array ();
			while ( $row = sparql_fetch_array ( $result ) ) {
				foreach ( $fields as $field ) {
					$sq->dbInsert('drug_brandmixtures',array('drug_id'=>$lastid,'brandMixture'=>$row [$field]));
					$tmp [] = $row [$field];
				}
			}
			$output[$i] ['brandMixtures'] = $tmp;	
			//get doage forms
			$sparql ='SELECT DISTINCT ?dosageForm WHERE {  <'.$v ['s'].'> drugbank:dosageForm ?dosageForm.  <'.$v ['s'].'> rdf:type drugbank:drugs . }';
			$result = sparql_query ( $sparql );
			$fields = sparql_field_array ( $result );
			$tmp = array ();
			while ( $row = sparql_fetch_array ( $result ) ) {
				foreach ( $fields as $field ) {
					$sq->dbInsert('dosage_form',array('drug_id'=>$lastid,'dosageForm'=>$row [$field]));
					$tmp [] = $row [$field];
				}
			}
			$output[$i] ['dosageForms'] = $tmp;		
			//get drug categories
			$sparql ='SELECT DISTINCT ?drugCategory WHERE {  <'.$v ['s'].'> drugbank:drugCategory ?drugCategory.  <'.$v ['s'].'> rdf:type drugbank:drugs . }';
			$result = sparql_query ( $sparql );
			$fields = sparql_field_array ( $result );
			$tmp = array ();
			while ( $row = sparql_fetch_array ( $result ) ) {
				foreach ( $fields as $field ) {
					$sq->dbInsert('drug_category',array('drug_id'=>$lastid,'category'=>$row [$field]));
					$tmp [] = $row [$field];
				}
			}
			$output[$i] ['drugCategories'] = $tmp;		
			//get drug enzymes
			$sparql ='SELECT DISTINCT ?enzyme WHERE {  <'.$v ['s'].'> drugbank:enzyme ?enzymeid. ?enzymeid drugbank:name ?enzyme .  <'.$v ['s'].'> rdf:type drugbank:drugs . }';
			$result = sparql_query ( $sparql );
			$fields = sparql_field_array ( $result );
			$tmp = array ();
			while ( $row = sparql_fetch_array ( $result ) ) {
				foreach ( $fields as $field ) {
					$sq->dbInsert('drug_enzyme',array('drug_id'=>$lastid,'enzyme'=>$row [$field]));
					$tmp [] = $row [$field];
				}
			}
			$output[$i] ['drugEnzymes'] = $tmp;
			//get drug targets
			$sparql ='SELECT DISTINCT ?target WHERE {  <'.$v ['s'].'> drugbank:target ?target.  <'.$v ['s'].'> rdf:type drugbank:drugs . }';
			$result = sparql_query ( $sparql );
			$fields = sparql_field_array ( $result );
			$tmp = array ();
			while ( $row = sparql_fetch_array ( $result ) ) {
				foreach ( $fields as $field ) {
					$sq->dbInsert('drug_target',array('drug_id'=>$lastid,'target'=>$row [$field]));
					$tmp [] = $row [$field];
				}
			}
			$output[$i] ['drugTargets'] = $tmp;		
			//get drug contraindication
			$sparql ='SELECT DISTINCT ?contraindicationInsert WHERE {  <'.$v ['s'].'> drugbank:contraindicationInsert ?contraindicationInsert.  <'.$v ['s'].'> rdf:type drugbank:drugs . }';
			$result = sparql_query ( $sparql );
			$fields = sparql_field_array ( $result );
			$tmp = array ();
			while ( $row = sparql_fetch_array ( $result ) ) {
				foreach ( $fields as $field ) {
					$sq->dbInsert('drug_contraindication',array('drug_id'=>$lastid,'contraindication'=>$row [$field]));
					$tmp [] = $row [$field];
				}
			}
			$output[$i] ['contraindications'] = $tmp;	
			//get drug interactions
			$sparql ='SELECT DISTINCT ?drug2 ?interactionDrug1 ?interactionType WHERE {  ?interactionDrug1 drugbank:interactionDrug1 <'.$v ['s'].'> .  <'.$v ['s'].'> rdf:type drugbank:drugs . ?interactionDrug1 drugbank:text  ?interactionType. ?interactionDrug1 drugbank:interactionDrug2 ?drug2. }';
			$result = sparql_query ( $sparql );
			$fields = sparql_field_array ( $result );
			$tmp = array ();
			while ( $row = sparql_fetch_array ( $result ) ) {
				$output_part = array ();
				$output_part['drug2_uri']=$row['drug2'];
				$output_part['interaction_uri']=$row['interactionDrug1'];
				$output_part['description']=$row['interactionType'];				
				$sq->dbInsert('drug_interaction',array('drug_id'=>$lastid,'drug2_uri'=>$row ['drug2'],'interaction_uri'=>$row ['interactionDrug1'],'description'=>$row ['interactionType']));
				$tmp [] = $output_part;				
			}		
			$output[$i] ['drugInteractions'] = $tmp;			
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
		$sparql = 'SELECT DISTINCT ?s ?name ?description ?indication ?contraindication ?pharmacology ?toxicity WHERE { ?s dailymed:genericMedicine ?name . ?s dailymed:description ?description . ?s dailymed:indication ?indication. ?s dailymed:contraindication ?contraindication. ?s dailymed:clinicalPharmacology ?pharmacology. ?s dailymed:overdosage ?toxicity. ?s rdf:type dailymed:drugs . FILTER (REGEX(?name, "' . $drug_name . '", "i"))}';
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
				$lastid=$sq->dbInsert ( 'drug', array ('uri' => $v ['s'], 'name' => $v ['name'], 'description' => $v ['description'],'indication' => $v ['indication'],'pharmacology' => $v ['pharmacology'], 'toxicity' => $v ['toxicity'] ) );
				$sq->dbInsert('drug_contraindication',array('drug_id'=>$lastid,'contraindication'=>$v ['contraindication']));
				$sq->dbInsert('searched_terms',array('term'=>$drug_name,'drug_id'=>$lastid));
			}
		}else{
			$sq->dbInsert('searched_terms',array('term'=>$drug_name,'drug_id'=>null));
		}
	}
}
header('Content-type: application/json');
echo json_encode ( array('drugs'=>$output) );
