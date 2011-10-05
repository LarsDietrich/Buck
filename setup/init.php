<?php
ini_set('display_errors',1);
error_reporting( -1 );
date_default_timezone_set('Europe/Copenhagen');

session_start();

define('BUCK_ID_LEN', 3);

define('BUCK_MAX_SIZE', 50000); //size of queries

require_once('elasticsearch.php');
$es = new ElasticSearch();
$es->index = 'buck';

require_once('couchdb.php');
$couchOptions['host'] = 'localhost'; 
$couchOptions['port'] = 5984;
$couch = new CouchSimple($couchOptions);