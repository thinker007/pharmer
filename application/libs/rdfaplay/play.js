  RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
  RDF_PLAIN_LITERAL = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral';
  RDF_TYPED_LITERAL = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#TypedLiteral';
  RDF_OBJECT = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#object';
	var knownPrefixes = {
   // w3c
    'grddl': 'http://www.w3.org/2003/g/data-view#',
    'ma': 'http://www.w3.org/ns/ma-ont#',
    'owl': 'http://www.w3.org/2002/07/owl#',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfa': 'http://www.w3.org/ns/rdfa#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'rif': 'http://www.w3.org/2007/rif#',
    'skos': 'http://www.w3.org/2004/02/skos/core#',
    'skosxl': 'http://www.w3.org/2008/05/skos-xl#',
    'wdr': 'http://www.w3.org/2007/05/powder#',
    'void': 'http://rdfs.org/ns/void#',
    'wdrs': 'http://www.w3.org/2007/05/powder-s#',
    'xhv': 'http://www.w3.org/1999/xhtml/vocab#',
    'xml': 'http://www.w3.org/XML/1998/namespace',
    'xsd': 'http://www.w3.org/2001/XMLSchema#',
    // non-rec w3c
    'sd': 'http://www.w3.org/ns/sparql-service-description#',
    'org': 'http://www.w3.org/ns/org#',
    'gldp': 'http://www.w3.org/ns/people#',
    'cnt': 'http://www.w3.org/2008/content#',
    'dcat': 'http://www.w3.org/ns/dcat#',
    'earl': 'http://www.w3.org/ns/earl#',
    'ht': 'http://www.w3.org/2006/http#',
    'ptr': 'http://www.w3.org/2009/pointers#',
    // widely used
    'cc': 'http://creativecommons.org/ns#',
    'ctag': 'http://commontag.org/ns#',
    'dc': 'http://purl.org/dc/terms/',
    'dcterms': 'http://purl.org/dc/terms/',
    'foaf': 'http://xmlns.com/foaf/0.1/',
    'gr': 'http://purl.org/goodrelations/v1#',
    'ical': 'http://www.w3.org/2002/12/cal/icaltzd#',
    'og': 'http://ogp.me/ns#',
    'rev': 'http://purl.org/stuff/rev#',
    'sioc': 'http://rdfs.org/sioc/ns#',
    'v': 'http://rdf.data-vocabulary.org/#',
    'vcard': 'http://www.w3.org/2006/vcard/ns#',
    'schema': 'http://schema.org/'
  }
  
  function toD3TreeGraph (data) {
    var bnodeNames = {};
    var bnodeCount = 1;
    var rval = {
      'name': 'Prescription',
      'children': []
    };
    
    var subjects = data.getSubjects();
    
    // Pre-generate names for all bnodes in the graph
    for(si in subjects) {
      var s = subjects[si];
      
      // calculate the short name of the node
      if(s.charAt(0) == '_' && !(s in bnodeNames)) {
        bnodeNames[s] = bnodeCount;
        bnodeCount += 1;
      }
    }
    
    // Generate the D3 tree graph
    for(si in subjects) {
      var s = subjects[si];
      var triples = data.getSubjectTriples(s);
      var predicates = data.getSubjectTriples(s).predicates;
      var node = {
        'name': '',
        'children': []
      };
      
      // calculate the short name of the node
      if(s.charAt(0) == '_') {
        node.name = 'Item ' + bnodeNames[s];
      }
      else {
        node.name = getIriShortName(s, true);
      }
      
      // create nodes for all predicates and objects
      for(p in predicates)
      {
        // do not include which vocabulary was used in the visualization
        if(p == "http://www.w3.org/ns/rdfa#usesVocabulary") {
          continue;
        }
      
        var objects = triples.predicates[p].objects;
        for(oi in objects) {
          var value = '';
          var o = objects[oi];
          var child = {
             'name': ''
          };
          
          // if the object is a bnode, use the generated name
          if(o.type == RDF_OBJECT && o.value.charAt(0) == '_')
          {            
            if(bnodeNames.hasOwnProperty(o.value)) {
              value = 'Item ' + bnodeNames[o.value];
            }
          }
          else if(o.type == RDF_OBJECT && p == RDF_TYPE)
          {
            // if the property is an rdf:type, shorten the IRI
            value = getIriShortName(o.value);
          }
          else
          {
            value = o.value;
          }
          
          // generate the leaft node name
          child.name = getIriShortName(p) + ': ' + value;
          
          node.children.push(child);
        }        
      }
      
      rval.children.push(node);
    }
    
    // clean up any top-level children with no data
    for(c in rval.children)
    {
      var child = rval.children[c];
      if(child.children && child.children.length == 0)
      {
        rval.children.splice(c, 1);
      }
    }
    
    return rval;
  };
  /**
   * Attempts to retrieve the short name of an IRI based on the fragment
   * identifier or last item in the path.
   *
   * @param iri the IRI to process
   * @param hashify if true, pre-pend a hash character if the shortening results
   *                in a fragment identifier.
   * @returns a short name or the original IRI if a short name couldn't be
   *          generated.
   */
  function getIriShortName(iri, hashify) {
    var rval = iri;
    
    // find the last occurence of # or / - short name is everything after it
    if(iri.indexOf('#') >= 0) {
      if(hashify) {
        rval = '#' + iri.split('#').pop();
      }
      else {
        rval = iri.split('#').pop();
      }
    }
    else if(iri.indexOf('/') >= 0) {
      rval = iri.split('/').pop();
    }
    
    // don't allow the entire IRI to be optimized away
    if(rval.length < 1) {
      rval = iri;
    }
    
    return rval;
  };
  /**
   * Converts the RDFa data in the page to a N-Triples representation.
   *
   * @param data the reference to the RDFa DataDocument API.
   */
  function toTurtleLite(data) {
    var rval = '';
    var subjects = data.getSubjects();
    for(si in subjects) {
      var s = subjects[si];
      var triples = data.getSubjectTriples(s);
      var predicates = triples.predicates;
      
      for(p in predicates)
      {
        var objects = triples.predicates[p].objects;
                
        for(oi in objects) {
          var o = objects[oi];

          // print the subject
          if(s.charAt(0) == '_') {
            rval += s + ' ';
          }
          else {
            rval += '<' + s + '> ';
          }

          // print the predicate
          rval += '<' + p + '> ';

          //console.log(o);
          // print the object
          if(o.type == RDF_PLAIN_LITERAL) {
             rval += '"' + o.value.replace('"', '\\"') + '"';
             if(o.language != null) {
                rval += '@' + o.language;
             }
          }
          else if(o.type == RDF_OBJECT) {
            if(o.value.charAt(0) == '_') {
              rval += o.value;
            }
            else {
              rval += '<' + o.value + '>';
            }
          }
          else
          {
             rval += o.value;
          }
          
          rval += ' .\n';
        }
      }      
    }
    
    return rval;
  };  

  /**
   * Converts the RDFa data in the page to a TURTLE representation of the data.
   *
   * @param data the reference to the RDFa DataDocument API.
   */
  function toTurtle(data) {
    var rval = '';
    var prefixesUsed = {};

    var subjects = data.getSubjects();
    for(si in subjects) {
      var s = subjects[si];
      var triples = data.getSubjectTriples(s);
      var predicates = triples.predicates;

      // print the subject
      if(s.charAt(0) == '_') {
        rval += s + ' ';
      }
      else {
        rval += '<' + s + '>';
      }
      rval += '\n';

      pList = [];
      for(p in predicates) { pList.push(p) }
      var lastP = pList.length - 1;

      for(pi in pList)
      {
        var p = pList[pi];
        var objects = triples.predicates[p].objects;
        var lastO = objects.length - 1;

        for(oi in objects) {
          var o = objects[oi];

          // print the predicate, as a CURIE if possible
          rval += '   ' + iriToCurie(p, prefixesUsed) + ' ';

          //console.log(o);
          // print the object
          if(o.type == RDF_PLAIN_LITERAL) {
             var lit = o.value.replace('"', '\\"');
             var sep = '"';
             if (lit.indexOf('\n') > -1) {
               sep = '"""';
             }
             rval += sep + lit + sep;
             if(o.language != null) {
                rval += '@' + o.language;
             }
          }
          else if(o.type == RDF_OBJECT) {
            if(o.value.charAt(0) == '_') {
              rval += o.value;
            }
            else {
              rval += iriToCurie(o.value, prefixesUsed);
            }
          }
          else if(o.type != null) {
            rval += '"' + o.value.replace('"', '\\"') + '"' + '^^' +
              iriToCurie(o.type, prefixesUsed);
          }
          else
          {
             console.log("UNCAUGHT TYPE", o);
             rval += o.value;
          }
          
          // place the proper TURTLE statement terminator on the data
          if (pi == lastP && oi == lastO) {
            rval += ' .\n';
          } else {
            rval += ';\n';
          }
        }
      }      
    }

    // prepend the prefixes used to the TURTLE representation.
    var prefixHeader = '';
    for(prefix in prefixesUsed)
    {
       prefixHeader += 
          '@prefix ' + prefix +': <' + prefixesUsed[prefix] + '> .\n';
    }
    rval = prefixHeader + '\n' + rval;
    
    return rval;
  };  
/**
   * Attempts to compress an IRI and updates a map of used prefixes if the
   * compression was successful.
   *
   * @param iri the IRI to compress into a Compact URI Expression.
   * @param prefixes the map of prefixes that have already been compressed.
   */
  function iriToCurie(iri, prefixes)
  {
     var rval = iri;
     var detectedPrefix = false;
     
     for(prefix in knownPrefixes) {
        var expanded = knownPrefixes[prefix];
        
        // if the IRI starts with a known CURIE prefix, compact it
        if(iri.indexOf(expanded) == 0) {
           rval = prefix + ':' + iri.replace(expanded, '');
           prefixes[prefix] = expanded;
           break;
        }
     }
     
     if(rval.length == iri.length) {
        rval = '<' + iri + '>';
     }
     
     return rval;
  };
  