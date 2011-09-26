/** 
 * Parse template string to invocable function.
 * @param {String} template
 * @returns {function}
 */
function parseTmpl( template ) {
    
    var body = "var out = ''; out+=" + "'" +
    
    template.replace( /[\r\t\n]/g, " " )
        .replace( /'(?=[^#]*#>)/g, "\t" )
        .split( "'" ).join( "\\' ")
        .split( "\t" ).join( "'" )
        .replace( /<#=(.+?)#>/g, "'; out += $1; out += '" )
        .split( "<#").join( "';" )
        .split( "#>").join( "out+='" )
        + "'; return out;";
 
    return new Function( "data", body );
};

/*
var array = "[1,2,3,4,5,6]"; // an array of objects with properties guid, name, price etc...
var hello = parseTmpl(  $ ( "#Dick" ).text ()); // input string, output function
$ ( "#something" ).html ( hello (  array )): // array will become magic word "data" in the template...


         <script id="Dick" type="text/x-template">
            <# data.forEach ( function ( p ) { #>
                <li class="ui-menuitem">
	                <a class="icon-arrow-right" target="following" href="~Product?id=<#= p.guid #>">
	                    <ul>
	                        <li><em><#= p.name #></em></li>
	                        <li>$<#= p.price #>/<#= p.unit #></li>
	                        <li>For <#= p.avail #></li>
	                    </ul>
	                </a>
	            </li>
            <# }); #>
        </script> 
*/