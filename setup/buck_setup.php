<?php
require_once('init.php');
echo 'i guess you shouldn\'t run this without checking what it does first ;) [hint: it\'s destructive!]';
exit;
echo 'deleting couchdb/buck'."\n";
var_dump($couch->send('DELETE', '/buck')); 
sleep(1);
echo 'creating couchdb/buck'."\n";
var_dump($couch->send('PUT', '/buck'));

echo 'creating couchdb filters for river'."\n";
$designs = json_encode(
	array(
		'_id' => '_design/buck',
		'language' => 'javascript',
		'filters' => array(
			'all' => 'function(doc,req){return true;}',
			'buckets' => 'function(doc,req){if(doc.resource===\'Bucket\'){return true;}return false;}',
			'items' => 'function(doc,req){if(doc.resource===\'Item\'){return true;}return false;}',
			'members' => 'function(doc,req){if(doc.resource===\'Member\'){return true;}return false;}',
		)
	)
);
$designs = <<<A
{
"_id":"_design\/buck",
"filters":{
"all":"function(doc,req){return true;}",
"buckets":"function(doc,req){if(doc.resource==='Bucket'){return true;}return false;}",
"items":"function(doc,req){if(doc.resource==='Item'){return true;}return false;}",
"members":"function(doc,req){if(doc.resource==='Member'){return true;}return false;}"
}
}
A;
var_dump($couch->send('POST','/buck',$designs)); 

echo 'deleting es/buck'."\n";
$es->drop();
echo 'creating es/buck'."\n";
$es->create(); //create index

echo 'clearing river settings in es'."\n";
echo `curl -XDELETE 'http://localhost:9200/_river/bucket'`;
echo `curl -XDELETE 'http://localhost:9200/_river/item'`;
echo `curl -XDELETE 'http://localhost:9200/_river/member'`;

echo 'creating river settings in es'."\n";
echo `curl -XPUT 'http://localhost:9200/_river/bucket/_meta' -d '{ 
    "type" : "couchdb", 
    "couchdb" : { 
        "host" : "localhost", 
        "port" : 5984, 
        "db" : "buck", 
        "filter" : "buck/buckets"
    } ,
    "index" : {
    	"index" : "buck",
    	"type" : "bucket"
    }
}'`;

echo `curl -XPUT 'http://localhost:9200/_river/item/_meta' -d '{ 
    "type" : "couchdb", 
    "couchdb" : { 
        "host" : "localhost", 
        "port" : 5984, 
        "db" : "buck", 
        "filter" : "buck/items"
    } ,
    "index" : {
    	"index" : "buck",
    	"type" : "item"
    }
}'`;
echo `curl -XPUT 'http://localhost:9200/_river/member/_meta' -d '{ 
    "type" : "couchdb", 
    "couchdb" : { 
        "host" : "localhost", 
        "port" : 5984, 
        "db" : "buck", 
        "filter" : "buck/members"
    } ,
    "index" : {
    	"index" : "buck",
    	"type" : "member"
    }
}'`;

echo 'creating es mappings'."\n";
$es->map('member','{
	"member": {
		"properties": {
			"_id": {
				"type": "string", 
				"store": "no"
			},
			"_rev": {
				"type": "string", 
				"store": "yes"
			},
			"handle": {
				"type": "string", 
				"store": "yes"
			},
			"name": {
				"type": "string",
				"store": "yes"
			}
		}
	}
}');

$es->map('item','{
	"item": {
		"properties": {
			"_id": {
				"type": "string", 
				"store": "no"
			},
			"_rev": {
				"type": "string", 
				"store": "yes"
			},
			"itemId": {
				"type": "string", 
				"store": "yes"
			},
			"name": {
				"type": "string",
				"store": "yes"
			},
			"desc": {
				"type": "string",
				"store": "yes"
			},
			"created": {
				"type": "integer",
				"store": "yes"
			},
			"modified": {
				"type": "integer",
				"store": "yes"
			},
			"decay": {
				"type": "integer",
				"store": "yes"
			},
			"status": {
				"type": "integer",
				"store": "yes"
			},
			"submitter": {
				"type": "string",
				"store": "yes"
			},
			"owner": {
				"type": "string",
				"store": "yes"
			}
			"bucketId": {
				"type": "string",
				"store": "yes"
			}
		}
	}
}');

$es->map('bucket','{
	"bucket": {
		"properties": {
			"_id": {
				"type": "string", 
				"store": "no"
			},
			"_rev": {
				"type": "string", 
				"store": "yes"
			},
			"bucketId": {
				"type": "string", 
				"store": "yes"
			},
			"name": {
				"type": "string",
				"store": "yes"
			},
			"desc": {
				"type": "string",
				"store": "yes"
			},
			"memberHandles": {
				"type": "string",
				"store": "yes"
			}
		}
	}
}');

require_once('getmembers.php');
