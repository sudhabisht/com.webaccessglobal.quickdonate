<?php

require_once 'quickdonate.civix.php';

/**
 * Implementation of hook_civicrm_config
 */
function quickdonate_civicrm_config(&$config) {
  _quickdonate_civix_civicrm_config($config);
}

/**
 * Implementation of hook_civicrm_xmlMenu
 *
 * @param $files array(string)
 */
function quickdonate_civicrm_xmlMenu(&$files) {
  _quickdonate_civix_civicrm_xmlMenu($files);
}

/**
 * Implementation of hook_civicrm_install
 */
function quickdonate_civicrm_install() {
  return _quickdonate_civix_civicrm_install();
}

/**
 * Implementation of hook_civicrm_uninstall
 */
function quickdonate_civicrm_uninstall() {
  return _quickdonate_civix_civicrm_uninstall();
}

/**
 * Implementation of hook_civicrm_enable
 */
function quickdonate_civicrm_enable() {
  return _quickdonate_civix_civicrm_enable();
}

/**
 * Implementation of hook_civicrm_disable
 */
function quickdonate_civicrm_disable() {
  return _quickdonate_civix_civicrm_disable();
}

/**
 * Implementation of hook_civicrm_upgrade
 *
 * @param $op string, the type of operation being performed; 'check' or 'enqueue'
 * @param $queue CRM_Queue_Queue, (for 'enqueue') the modifiable list of pending up upgrade tasks
 *
 * @return mixed  based on op. for 'check', returns array(boolean) (TRUE if upgrades are pending)
 *                for 'enqueue', returns void
 */
function quickdonate_civicrm_upgrade($op, CRM_Queue_Queue $queue = NULL) {
  return _quickdonate_civix_civicrm_upgrade($op, $queue);
}

/**
 * Implementation of hook_civicrm_managed
 *
 * Generate a list of entities to create/deactivate/delete when this module
 * is installed, disabled, uninstalled.
 */
function quickdonate_civicrm_managed(&$entities) {
  return _quickdonate_civix_civicrm_managed($entities);
}

/**
 * Implementation of hook_civicrm_caseTypes
 *
 * Generate a list of case-types
 *
 * Note: This hook only runs in CiviCRM 4.4+.
 */
function quickdonate_civicrm_caseTypes(&$caseTypes) {
  _quickdonate_civix_civicrm_caseTypes($caseTypes);
}

/**
 * Implementation of hook_civicrm_alterSettingsFolders
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_alterSettingsFolders
 */
function quickdonate_civicrm_alterSettingsFolders(&$metaDataFolders = NULL) {
  _quickdonate_civix_civicrm_alterSettingsFolders($metaDataFolders);
}

/**
 * @param $angularModule
 */
function quickdonate_civicrm_angularModules(&$angularModule) {
  $angularModule['quickdonate'] = array('ext' => 'com.webaccessglobal.quickdonate', 'js' => array('js/quickdonate.js', 'js/bootstrap.min.js'), 'css' => array('css/bootstrap.min.css'));
}
