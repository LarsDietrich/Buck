<?php
require_once('init.php');

$email = 'some@domain.com';
$password = 'secret';
$domain = "domain.com";
require_once('secret.php'); //here are the actual email/pw/domain values >D

require_once('Zend/Loader/Autoloader.php');
Zend_Loader_Autoloader::getInstance();
$client = Zend_Gdata_ClientLogin::getHttpClient($email, $password, Zend_Gdata_Gapps::AUTH_SERVICE_NAME);
$service = new Zend_Gdata_Gapps($client, $domain);


echo 'retrieving all users from '.$domain."\n";
$feed = $service->retrieveAllUsers();

foreach ($feed as $user) {
    $couch->send('PUT','/buck/'.$user->login->username,json_encode(
		array(
			'_id' => $user->login->username,
			'resource' => 'Member',
			'handle' => $user->login->username,
			'name' => $user->name->givenName.' '.$user->name->familyName
		)
	));
}
