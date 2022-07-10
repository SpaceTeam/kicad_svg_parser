{
  // Construct an index into each token found in the attribute list of a token (primitives are ignored), by these rules:
  // - for each token with type <token_type> 2 properties are created: "<token_type>" and "$<token_type>"
  // - the normal version references the last found token of type <token_type>, whereas the $-prefixed version references an array of all tokens of type <token_type>
  // - if the token has only one attribute, it is inlined (meaning the index references the attribute of the token directly) if the following conditions are met:
  //       - the attribute has the $allowInline flag set to TRUE
  //       - OR the attribute DOESN'T have the $allowInline flag set to FALSE AND it is not an object
  function constructIndex(a) {
    let index = {};
    a.forEach(function(attr) {
      let idx = attr.token;
      let val = attr;
      if (idx !== undefined && idx != "token" && idx != "attributes") {
      	if(val.attributes !== undefined && val.attributes.length == 1) {
          let attrVal = val.attributes[0]
          if (val.$allowInline === true || (val.$allowInline !== false && typeof attrVal !== "object")) {
        	  val = attrVal
          }
        }
      
        index[idx] = val;
        if (index["$"+idx] === undefined) {
            index["$"+idx] = []
        }
        index["$"+idx].push(val)
      }
    })

    return index
  }
}

// --------------------------------------------------
// TOP LEVEL EXPRESSION
// --------------------------------------------------

sexp "S-EXPRESSION"
  =  _ "(" _ content:sexp_content _ ")" _ {
    return content
  }

// --------------------------------------------------
// SEXP TOKENS
// --------------------------------------------------

sexp_content
  //Tokens with extended / changed accessors: for some tokens the resulting javascript object altered to reflect the semantics of the tokens a bit better
  = "property" a:sexp_attr_list {
  	return {
      ...a,
    	token: "property",
      key: a.attributes[0],
      value: a.attributes[1]
    }
  }
  / "at" a:sexp_attr_list {
    return {
      ...a,
    	token: "at",
      x: a.attributes[0],
      y: a.attributes[1],
      angle: a.attributes[2]
    }
  }
  / token:$("xy" / "start" / "mid" / "end" / "center") a:sexp_attr_list {
  	return {
      ...a,
    	token: token,
      x: a.attributes[0],
      y: a.attributes[1]
    }
  }
  / "size" a:sexp_attr_list {
    return {
      ...a,
      token: "size",
      height: a.attributes[0],
      width: a.attributes[1]
    }
  }
  / "color" a:sexp_attr_list {
    return {
      ...a,
      token: "color",
      r: a.attributes[0],
      g: a.attributes[1],
      b: a.attributes[2],
      a: a.attributes[3]
    }
  }
  / token:$("justify" / "pts" / "lib_symbols") a:sexp_attr_list {
    return {
      ...a,
      token: token,
      attributes: [a.attributes],
      $allowInline: true
    }
  }
  / "symbol" a:sexp_attr_list {
    return {
      ...a,
      token: "symbol",
      id: a.attributes[0]
    }
  }
  / token:$("text" / "name" / "number" / "label" / "global_label" / "hierarchical_label") a:sexp_attr_list {
    return {
      ...a,
      token: token,
      text: a.attributes[0]
    }
  }
  / "pin" a:sexp_attr_list {
    return {
      ...a,
      token: "pin",
      electricalType: a.attributes[0],
      graphicStyle: a.attributes[1],
      hide: a.attributes.includes("hide")
    }
  }
  / token:$("effects" / "pin_names" / "pin_numbers") a:sexp_attr_list {
    return {
      ...a,
      token: token,
      hide: a.attributes.includes("hide"),
      $allowInline: false
    }
  }
  //General tokens
  / sexp_general

//General token structure
sexp_general
  = token:sexp_token a:sexp_attr_list {
      if(a.attributes.length == 1) {
        a[token] = a.attributes[0]
      }
      return {
      	token: token,
        ...a
      }
  }

//Token attribute list
sexp_attr_list
  = end_of_token _ attributes:( sexp_attribute  _ )* {
    let a = attributes.map(x => x[0])
    
    return {
    	attributes: a,
        ...constructIndex(a)
    }
  }

//Symbols allowed as token types
sexp_token
  = $([a-z_]*)

//Allowed token attributes: literals and other s-expression tokens
sexp_attribute 
  = uuid / number / string / literal / sexp

// --------------------------------------------------
// LITERALS
// --------------------------------------------------

// General literal parsed as string, used when a finite amount of values is possible
literal 
   = value:$([^0-9 "();'\t\n\r\/][^ "();'\t\n\r]*) {
       return value
   }

// UUID

uuid
  = $([0-9a-f]+"-"[0-9a-f]+"-"[0-9a-f]+"-"[0-9a-f]+"-"[0-9a-f]+)

// STRINGS

string = value:_string { return value[1] }

_string
  = ('"' $(DoubleStringCharacter*) '"' )
  / ("'" $(SingleStringCharacter*) "'" )
  
DoubleStringCharacter
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
  = !("'" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b";   }
  / "f"  { return "\f";   }
  / "n"  { return "\n";   }
  / "r"  { return "\r";   }
  / "t"  { return "\t";   }
  / "v"  { return "\x0B"; }

// NUMBERS
// <number>::= [<sign>] [<positive_integer> | <real> | <fraction>]
// <sign> ::= [+ | -]
// <real> ::= [<positive_integer>. | <positive_integer>.<positive_integer> | <positive_integer>]
// <fraction> ::= <positive_integer> / <positive_integer>
// <positive_integer>::= [<digit> | <digit><positive_integer>]
number
    = sign:[-+]? value:(fraction/real) {
        return (sign == "-") ? -value : value;
    }

real
  = value:$((digits("."(digits?))?) / "." digits) {
      return parseFloat(value);

  }
  
fraction 
  = n:digits "/" d:digits {
      return parseInt(n)/parseInt(d)
  }

digits = $([0-9]+)

// --------------------------------------------------
// OTHERS
// --------------------------------------------------

_ "whitespace"
  = [ \t\n\r]*

end_of_token
 = &[ \t\n\r()]