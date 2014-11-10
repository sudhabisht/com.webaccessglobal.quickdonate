<?php
/*
 +--------------------------------------------------------------------+
 | CiviCRM version 4.5                                                |
 +--------------------------------------------------------------------+
 | Copyright CiviCRM LLC (c) 2004-2014                                |
 +--------------------------------------------------------------------+
 | This file is a part of CiviCRM.                                    |
 |                                                                    |
 | CiviCRM is free software; you can copy, modify, and distribute it  |
 | under the terms of the GNU Affero General Public License           |
 | Version 3, 19 November 2007 and the CiviCRM Licensing Exception.   |
 |                                                                    |
 | CiviCRM is distributed in the hope that it will be useful, but     |
 | WITHOUT ANY WARRANTY; without even the implied warranty of         |
 | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.               |
 | See the GNU Affero General Public License for more details.        |
 |                                                                    |
 | You should have received a copy of the GNU Affero General Public   |
 | License and the CiviCRM Licensing Exception along                  |
 | with this program; if not, contact CiviCRM LLC                     |
 | at info[AT]civicrm[DOT]org. If you have questions about the        |
 | GNU Affero General Public License or the licensing of CiviCRM,     |
 | see the CiviCRM license FAQ at http://civicrm.org/licensing        |
 +--------------------------------------------------------------------+
*/

/**
 *
 * @package CRM
 * @copyright CiviCRM LLC (c) 2004-2014
 * $Id$
 *
 */

/**
 * This class generates form components for Component
 */
class CRM_QuickDonate_Form_QuickDonationSetting extends CRM_Admin_Form_Setting {
  /**
   * This function sets the default values for the form.
   * default values are retrieved from the database
   *
   * @access public
   *
   * @return void
   */
  function setDefaultValues() {
    $domainID = CRM_Core_Config::domainID();
    $settings = civicrm_api3('Setting', 'get', array(
      'domain_id' => $domainID,
    ));
    $this->_defaults['quickDonation'] = CRM_Utils_Array::value('quick_donation_page', $settings['values'][$domainID]);
    return $this->_defaults;
  }

  /**
   * Function to build the form
   *
   * @return void
   * @access public
   */
  public function buildQuickForm() {
    CRM_Utils_System::setTitle(ts('Settings - Enable Quick Donation Form'));
    $quickDonationPage = CRM_Contribute_PseudoConstant::contributionPage();
    $this->addElement('select', 'quickDonation', ts('Donation Form'), array(ts('- Select -')) + $quickDonationPage);
    $this->addElement('checkbox', "ziptastic", ts('Is Default country selected'));
    parent::buildQuickForm();
  }

  public function postProcess() {
    $params = $this->controller->exportValues($this->_name);
    $donationParams = array(
      'domain_id' => CRM_Core_Config::domainID(),
      'quick_donation_page' => $params['quickDonation'],
    );
    $result = civicrm_api3('setting', 'create', $donationParams);
    if (CRM_Utils_Array::value('is_error', $result, FALSE)) {
      CRM_Core_Error::debug_var('setting-create result for angular_donation', $result);
      throw new CRM_Core_Exception('Failed to create settings for angular_donation');
    }

    $zipParams = array(
      'domain_id' => CRM_Core_Config::domainID(),
      'ziptastic_enable' => CRM_Utils_Array::value('ziptastic', $params) ? 1 : 0,
    );
    $result = civicrm_api3('setting', 'create', $zipParams);
    if (CRM_Utils_Array::value('is_error', $result, FALSE)) {
      CRM_Core_Error::debug_var('setting-create result for angular_donation', $result);
      throw new CRM_Core_Exception('Failed to create settings for angular_donation');
    }
  }
}
