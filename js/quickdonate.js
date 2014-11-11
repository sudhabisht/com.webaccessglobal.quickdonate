(function(angular, $, _) {

  var resourceUrl = CRM.resourceUrls['com.webaccessglobal.quickdonate'];
  var quickDonation = angular.module('quickdonate', ['ngRoute']);
  quickDonation.config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/donation', {
        templateUrl: resourceUrl + '/partials/quickdonate.html',
        controller: 'QuickDonationCtrl'
      });
      $routeProvider.when('/donation/:thanks', {
        templateUrl: resourceUrl + '/partials/thankYou.html',
        controller: 'QuickDonationCtrl'
      });
    }
  ]);

  quickDonation.factory('formFactory', function($q) {
    var savedData = {}
    return {
      getUser:function(contactID) {
        var deferred = $q.defer();
        var resultParams = null;
	if (contactID) {
          CRM.api3('Contact', 'get', {
            "sequential": 1,
            "id": contactID,
          }).success(function(data) {
            $.each( data.values, function( key, value ) {
              resultParams = value;
            });
            deferred.resolve(resultParams);
          }).error(function(data, status, headers, config) {
            deferred.reject("there was an error");
          });
	}
	return deferred.promise;
      },
      createRecur: function(param, isRecur) {
        var deferred = $q.defer();
        resultParams = null;
        if (isRecur) {
          CRM.api3('ContributionRecur', 'create', param ).success(function(data) {
            if (data.is_error == 0) {
              $recurID = {"contribution_recur_id": data.id};
              resultParams = $recurID;
            }
            else {
              deferred.reject("there was an error");
            }
          });
        }
        deferred.resolve(resultParams);
        return deferred.promise;
      },
      setEmail: function(data) {
        savedData = data;
      },
      getEmail: function(data) {
        return savedData;
      },
      createContri: function(action, contributionparams) {
         var deferred = $q.defer();
         param = null;
         CRM.api3('Contribution', action, contributionparams ).success(function(data, status, headers, config) {
           if (data.is_error == 0) {
             param = data;
             deferred.resolve(param);
           }
           else {
             deferred.reject("Error"+data.error_message);
           }
         });
         return deferred.promise;
       }
     };
  });

  quickDonation.controller('QuickDonationCtrl', function($scope, formFactory, $route, $location) {
    //set donaiton page ID
    $scope.donationID = CRM.quickdonate.donatePageID;
    $scope.ziptasticIsEnabled = CRM.quickdonate.ziptasticEnable;
    $scope.thanks = $route.current.params.thanks;
    $scope.currencySymbol = CRM.quickdonate.currency;
    $scope.paymentProcessor = CRM.quickdonate.paymentProcessor;
    $scope.donationConfig = CRM.quickdonate.config;
    $scope.priceListInfo = CRM.quickdonate.priceList;
    $scope.htmlPriceList = CRM.quickdonate.htmlPriceList;
    $scope.quickConfig = CRM.quickdonate.isQuickConfig;
    $scope.otherAmount = CRM.quickdonate.otherAmount;
    $scope.test = CRM.quickdonate.isTest;
    $scope.countryList = CRM.quickdonate.countryList;
    $scope.stateList = CRM.quickdonate.stateList;
    $scope.section = 1;

    //manually binds Parsley--Validation Library to this form.
    $('#quickDonationForm').parsley({
    excluded: "input[type=button], input[type=submit], input[type=reset], input[type=hidden], input:hidden"
    });
    $scope.formInfo = {}; //property is set to bind input value
    $scope.formInfo.email = formFactory.getEmail();
    $scope.formInfo.donateAmount = 0;

    if ($scope.ziptasticIsEnabled == 1) {
      $('#country').parent().hide();
      $('#stateList').parent().hide();
    }
    //get session
    formFactory.getUser(CRM.quickdonate.sessionContact).then(function(resultParams) {
      if (resultParams) {
        $scope.formInfo.email = resultParams.email;
        $('#email').addClass('parsley-success');
        if (resultParams.first_name) {
          $scope.formInfo.user = resultParams.first_name +' '+ resultParams.last_name;
          $('#user').addClass('parsley-success');
        }
        if (resultParams.street_address) {
          $scope.formInfo.address = resultParams.street_address;
          $('#address').addClass('parsley-success');
        }
        if (resultParams.postal_code) {
          $scope.formInfo.zip = resultParams.postal_code;
          $('#zip').addClass('parsley-success');
          $scope.formInfo.city = resultParams.city;

          if ($scope.ziptasticIsEnabled == 1) {
            $scope.formInfo.state = $.map(CRM.quickdonate.allStates, function(obj, index) {
              if(obj == resultParams.state_province_id) {
                return index;
              }
            });
            $('#state').parent().show();
            $('#state').addClass('parsley-success');
            $('#country').parent().hide();
            $('#stateList').parent().hide();
          }
          else {
            $scope.formInfo.country = resultParams.country_id;
            $('#country').addClass('parsley-success');
            $scope.formInfo.stateList = resultParams.state_province_id;
            $('#stateList').addClass('parsley-success');
            $('#state').parent().hide();
          }
          $('#city').parent().show();
          $('#city').addClass('parsley-success');
        }
      }
    });

    $scope.hidePriceVal = true;
    $scope.amountSelected = function(price) {
      $scope.hidePriceVal = false;
      $scope.amount = price;
    }

    $scope.amountActive = function(price) {
     return $scope.amount === price;
    }

    $scope.amounthover = function(price) {
      $scope.formInfo.donateAmount = price;
      $scope.hidePriceVal = false;
      return $scope.message;
    }

    $scope.amountDefault = function(price, isDefault) {
      if (isDefault == 1 && !$scope.formInfo.donateAmount) {
        $scope.amount = $scope.formInfo.donateAmount = price;
        $scope.hidePriceVal = false;
        return $scope.amountActive(price);
      }
      return false;
    }

    //HTML PRICE SETS
    $scope.subtleAmount = 0;
    $scope.selectedAmount = 0;
    $scope.formInfo.selectDonateAmount = 0;
    $scope.formInfo.checkbxDonateAmount = 0;
    $scope.formInfo.textDonateAmount = 0;
    $scope.formInfo.CheckBoxAmount = 0;

    $scope.calcAmount = function(amnt) {
      $scope.hidePriceVal = false;
      $scope.amount = parseInt($scope.amount) + parseInt(amnt);
    }
    $scope.hamountEnter = function(price,type) {
      $scope.subtleAmount = parseInt($scope.formInfo.donateAmount) + parseInt(price);
      if (type === 'radio' && $scope.formInfo.radioDonateAmount) {
        $scope.subtleAmount = parseInt($scope.formInfo.donateAmount) + parseInt(price) - parseInt($scope.formInfo.radioDonateAmount);
      }
      $scope.hidePriceVal = false;
    }

    $scope.hamountLeave = function(price,type) {
      if ($scope.formInfo.donateAmount != $scope.subtleAmount) {
        $scope.subtleAmount = parseInt($scope.subtleAmount) - parseInt(price);
        $scope.hidePriceVal = false;
      }
    }

    $scope.hamountClick = function(price, type, name) {
      if (price && type=='radio') {
        $scope.formInfo.radioDonateAmount = price;
      }
      $scope.subtleAmount = $scope.formInfo.donateAmount = $scope.amount = parseInt($scope.formInfo.CheckBoxAmount) + parseInt($scope.formInfo.selectDonateAmount) + parseInt($scope.formInfo.radioDonateAmount) + parseInt($scope.formInfo.textDonateAmount);
      $scope.hidePriceVal = false;
    }

    $scope.selectedRow = null;
    $scope.selectedCardType = function(row) {
      $scope.selectedRow = row;
      if (row) {
        $('.cardNumber').parent('div').parent('div').removeClass("ng-invalid shake");
        $('#invalidNumber').removeClass('help-block');
      }
    };

    $scope.sectionShow = function() {
      $scope.section = $scope.section + 1;
    };

    ccDefinitions = {
      'Visa': /^4/,
      'MasterCard': /^5[1-5]/,
      'Amex': /^3(4|7)/,
      'Discover': /^6011/
    };

    $scope.selectedSection = function(sectionNo) {
      return sectionNo <= $scope.section ;
    };

    $scope.getCreditCardType = function(number){
      var ccType;
      $.each(ccDefinitions, function (i, v) {
        if (v.test(number)) {
          ccType = i;
          return false;
        }
      });
      return ccType;
    };

    $scope.createContribution = function (contactId,params) {
      //get contribution page
      var resultParams =$scope.donationConfig;//<?php echo json_encode($contributionPage);?>;
      $scope.amount = $scope.formInfo.otherAmount || $scope.formInfo.donateAmount || 1;
      $scope.action = 'transact';
      $scope.paymentParams = {};
      $scope.recurID = {};
      $scope.contributionparams = {
        "billing_first_name": params.first_name,
        "first_name": params.first_name,
        "billing_middle_name": params.middle_name,
        "middle_name": params.middle_name,
        "billing_last_name": params.last_name,
        "last_name": params.last_name,
        "billing_street_address-5": params.street_address,
        "street_address": params.street_address,
        "billing_city-5": params.city,
        "city": params.city,
        "billing_country_id-5": params.country_id,
        "country_id": params.country_id,
        "billing_state_province_id-5": params.state_province_id,
        "state_province_id": params.state_province_id,
        "billing_postal_code-5": params.postal_code,
        "postal_code": params.postal_code,
        "year": "20"+$scope.year,
        "month": $scope.month,
        "email": params.email,
        "contribution_page_id": resultParams.id,
        "payment_processor_id": $scope.formInfo.payment_processor,
        "is_test": $scope.test,
        "is_pay_later": $scope.formInfo.is_pay_later,
        "total_amount": $scope.amount,
        "financial_type_id": resultParams.financial_type_id,
        "currencyID": resultParams.currency,
        "currency": resultParams.currency,
        "skipLineItem": 0,
        "skipRecentView": 1,
        "contact_id": contactId,
        "address_id": params.address_id,
        "source": "Online Contribution: " + resultParams.title,
      };

      if ($scope.creditType) {
        $scope.paymentParams = {
          "credit_card_number": $scope.cardNumberValue,
          "cvv2": $scope.formInfo.securityCode,
          "credit_card_type": $scope.getCreditCardType($scope.cardNumberValue)
        };
      }
      if ($scope.formInfo.is_pay_later) {
        $scope.paymentParams = {"contribution_status_id": 2};
        $scope.action = 'create';
      }
      if ($scope.formInfo.payment_processor) {
        $scope.payment_processor_id = $scope.formInfo.payment_processor;
      }
      $scope.recurParams = {
        'contact_id': contactId,
        "auto_renew": 1,
        "frequency_unit": 'month',
        "frequency_interval": 1,
        "is_test": $scope.test,
        "amount":$scope.amount,
        "invoice_id": CRM.quickdonate.invoiceID,
        "contribution_status_id":2,
        "payment_processor_id": $scope.payment_processor_id,
        "is_email_receipt": 1,
        "trxn_id": CRM.quickdonate.invoiceID,
        "financial_type_id": resultParams.financial_type_id,
        "payment_instrument_id": 1
      };

      formFactory.createRecur($scope.recurParams, $scope.formInfo.recur).then(function(resultParams) {
        $scope.thanks = 0;
        $.extend($scope.contributionparams, $scope.paymentParams, resultParams);
        formFactory.createContri($scope.action, $scope.contributionparams).then(function(param) {
          $location.path('/donation/thanks');
        });
      });
    }

    $scope.userContri = function(contactId, addressID) {
      primaryValue = 1;
      action = "create";
      if (addressID) {
        action = "update";
        primaryValue = 0;
      }
      CRM.api3('Address', 'create', {
        'contact_id': contactId,
        'location_type_id': 5,
        'country_id' : $scope.country,
        'street_address': $scope.formInfo.address,
        'city': $scope.formInfo.city,
        'state_province_id': $scope.state,
        'postal_code': $scope.formInfo.zip,
        'name': $scope.formInfo.user,
        'is_billing': 1,
        'is_primary': primaryValue || 1
      });
      formFactory.getUser(contactId).then(function(resultParams) {
        $scope.createContribution(contactId,resultParams);
      });
    };

    $scope.saveData = function() {
      $scope.amount = $scope.formInfo.otherAmount || $scope.formInfo.donateAmount;
      $scope.state = $scope.ziptasticIsEnabled == 1 ? CRM.quickdonate.allStates[$scope.formInfo.state] : $scope.formInfo.stateList ;
      $scope.country = $scope.ziptasticIsEnabled == 1 ? CRM.quickdonate.country : $scope.formInfo.country;
      $scope.names = $scope.formInfo.user.split(' ');

      if ($scope.creditType) {
        $scope.expiry = $scope.formInfo.cardExpiry.split('/');
        $scope.month = $scope.expiry[0];
        $scope.year = $scope.expiry[1];
        $scope.ccType = true;
      }

      CRM.api3('Contact', 'get', {
        "email": $scope.formInfo.email,
        "contact_type":"Individual"
      }).success(function(data, status, headers, config) {
        var counter = 0, resultParams = {};
        cj.each( data.values, function( key, value ) {
          counter++;
          if (counter == 1) {
            resultParams = value;
          }
        });

        if (resultParams.contact_id){
          $scope.userContri(resultParams.contact_id, resultParams.address_id);
        }
        else{
          CRM.api3('Contact', 'create', {
            "email":$scope.formInfo.email,
            "first_name": $scope.names[0],
            "last_name": $scope.names[1],
	    "contact_type":"Individual"
          }).success(function(data, status, headers, config) {
            $scope.userContri(data.id);
          });
        }
        formFactory.setEmail($scope.formInfo.email);
      });
    };

    $scope.creditType = false;
    $scope.directDebitType = false;
    $scope.hiddenProcessor = false;

    $scope.setPaymentBlock = function(value) {
      $scope.creditType = false;
      $scope.directDebitType = false;
      $scope.hiddenProcessor = false;
      $scope.payLater = false;

      if (value == 'payLater') {
        $scope.payLater = true;
        $scope.formInfo.payment_processor = 0
      }
      else {
        $scope.formInfo.is_pay_later = 0;
        $billingmodeform = 1;//billing-mode-form = 1
	//billing-mode-button = 2
	//billing-mode-notify = 4
	//payment-type-credit-card = 1
	//payemt-type-direct-debit = 2
	if($scope.paymentProcessor[value]['billing_mode'] & $billingmodeform /*billing_mode_form*/) {
	  if($scope.paymentProcessor[value]['payment_type'] == 1) {
	    $scope.creditType = true;
	  }
	  else if($scope.paymentProcessor[value]['payment_type'] == 2) {
	    $scope.directDebitType = true;
	  }
	}
	else {
	  $scope.hiddenProcessor = true;
	}
      }
    };

    $scope.processorDefault= function(processorID, isDefault){
      if (isDefault && !$scope.formInfo.payment_processor && !$scope.formInfo.is_pay_later) {
	$scope.formInfo.payment_processor = processorID;
        $scope.setPaymentBlock(processorID);
        return true;
      }
      return false;
    };

  });

  quickDonation.directive('creditCardExpiry', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        expirationComplete = function() {
          elm.addClass("full").unbind("blur").bind("keydown", function (e) {
            if (e.keyCode === 8 && $(this).val() === "") {
              $(this).removeClass("full");
              if (window.navigator.standalone || !Modernizr.touch) {
                $("#cardNumber").focus();
              }
            }
          });
          setTimeout(function () {
            $("#securityCode").focus();
          }, 220);
        }
        $(elm).inputmask({mask: "m/q", placeholder:" ", clearIncomplete: true, oncomplete: expirationComplete, showMaskOnHover: false, overrideFocus: true});
      }
    }
    return directive;
  });

  quickDonation.directive('validCreditBlock', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        elm.bind('keyup', function() {
          //check if all field are valid
          if (scope.quickDonationForm.zip.$valid && scope.quickDonationForm.securityCode.$valid && scope.quickDonationForm.cardExpiry.$valid) {
            $(elm).parent('div').parent('div').removeClass("blockInValid");
            $(elm).parent('div').parent('div').addClass("blockIsValid");
          }
          else if ($(elm).parent('div').parent('div').hasClass('blockIsValid')) {
            $(elm).parent('div').parent('div').removeClass("blockIsValid");
            $(elm).parent('div').parent('div').addClass("blockInValid");
            $('.errorBlock').addClass("help-block");
          }
        });
      }
    }
    return directive;
  });

  quickDonation.directive('securityCode', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        elm.bind('keyup', function() {
          if (scope.quickDonationForm.securityCode.$valid) {
            $('#zipCode').focus();
	  }
        });
      }
    }
    return directive;
  });

  quickDonation.directive('creditCardType', function() {
    var directive = {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl){
        scope.cardcomplete = false;

        creditCardComplete = function() {
          // We need to get the credit card field and the unmasked value of the field.
          scope.maskedVal = elm.val();
          scope.cardcomplete = true;
          scope.cardNumberValue = scope.formInfo.cardNumberValue = uvalue = elm.inputmask("unmaskedvalue");
          ccType = scope.getCreditCardType(uvalue);
          // Let's make sure the card is valid
          if (ccType === undefined) {
            $(elm).addClass("ng-invalid invalid shake");
            $(elm).parent('div').parent('div').addClass("ng-invalid shake");
            $('#invalidNumber').addClass("help-block");
            scope.formInfo.cardNumberValue = null;
            scope.ccType = false;
            scope.cardcomplete = false;
            $(elm).focus();
            return;
          }
          // Replace the value with the last four numbers of the card.
          elm.bind("saveValues", function () {
	    if ((ccType === "Amex" && uvalue.length === 15) || (ccType !== "Amex" && uvalue.length === 16)) {
              scope.cardcomplete = true;
              elm.data("ccNumber", uvalue).val(uvalue.substr(uvalue.length - 4, uvalue.length));
            }
          });
          // Once this function is fired, we need to add a "transitioning" class to credit
          // card element so that we can take advantage of our CSS animations.
          elm.addClass("transitioning-out");
          setTimeout(function () {
            elm.removeClass("transitioning-out");
            elm.bind("blur", function () {
              elm.trigger("saveValues");
            }).blur();
            elm.addClass("full");
          }, 600);
          // We have to set a timeout so that we give our animations time to finish. We have to
	  // blur the element as well to fix a bug where our credit card field was losing its
	  // value prematurely.

	  setTimeout(function () {
	    $("#card-expiration").show();
	    $("#securityCode").show();
	    $("#zipCode").show();
	  }, 150);

	  // After the credit card field is initially filled out, bind a click event
	  // that will allow us to edit the number again if we want to. We also bind
	  // a focus event (for mobile) and a keydown event in case of shift + tab
          elm.unbind("focus click keydown keypress keyup")
	    .bind("focus click keydown keyup", function (e) {
              if (e.type === "focus" || e.type === "click" || (e.shiftKey && e.keyCode === 9)) {
                beginCreditCard(elm);
              }
            });

          if (window.navigator.standalone || !Modernizr.touch) {
            // Focus on the credit card expiration input.
            elm.data("ccNumber", uvalue).val(uvalue.substr(uvalue.length - 4, uvalue.length));
            $("#card-expiration").show().focus();
	  }
	};
	beginCreditCard= function(elms) {
          elms.val(elm.data("ccNumber")).addClass("transitioning-in");
          scope.cardcomplete = false;

          // Wait for the animation to complete and then remove our classes.
          setTimeout(function () {
            elms.removeClass("transitioning-in full");
          }, 600);

          elms.unbind("keyup blur")
            .bind("keyup blur", function (e) {
              uvalues = elms.inputmask("unmaskedvalue");
              if (e.keyCode === 13 || e.type === "blur" || (e.type==="keyup" && e.key !== "Backspace" && uvalues.length >= 15)) {
                uvalue = elm.inputmask("unmaskedvalue");
                ccType = scope.getCreditCardType(uvalue);
                // Make sure the number length is valid
                if ((ccType === "Amex" && uvalue.length === 15) || (ccType !== "Amex" && uvalue.length === 16)) {
		  creditCardComplete();

                }
              }
            })
            .unbind("focus click keydown");
	    maskValues();
	};

	maskValues = function() {
	  $("#card-expiration").hide();
	  $("#securityCode").hide();
	  $("#zipCode").hide();
	};
        maskValues();
        scope.$watch('cardcomplete',function(newvalue,oldvalue){
          if (newvalue) {
            $('#card-expiration').show().trigger('click');
          }
        });
        ctrl.$parsers.unshift(function(value){
          scope.atype = scope.type = scope.getCreditCardType(value);
          if (value) {
            scope.selectedCardType(scope.type);
          }

          if (value.length > 0 && value.length <= 1 && scope.type != undefined && scope.type !== "Amex") {
            elm.inputmask({ mask: "9999 9999 9999 9999", placeholder: " ", oncomplete: creditCardComplete,showMaskOnHover: false, overrideFocus: true});
            scope.quickDonationForm.cardNumber.$setValidity("minLength", false);
          }
          else if (value.length > 0 && value.length <= 2 && scope.type === "Amex") {
            elm.inputmask({ mask: "9999 999999 99999", placeholder: " ", oncomplete: creditCardComplete,showMaskOnHover: false,	overrideFocus: true });
            scope.quickDonationForm.cardNumber.$setValidity("minLength", false);
          }
          if (!scope.cardcomplete) {
            if (scope.type === 'Amex' && value.length < 16 && value.length > 2) {
              scope.quickDonationForm.cardNumber.$setValidity("minLength", false);
            }
            else if(value.length < 18 && value.length > 2) {
              scope.quickDonationForm.cardNumber.$setValidity("minLength", false);
            }
            else if(value.length > 2 ) {
              scope.quickDonationForm.cardNumber.$setValidity("minLength", true);
            }
          }
          else {
            scope.atype = scope.type = scope.getCreditCardType(scope.cardNumberValue);
            scope.selectedCardType(scope.type);
            scope.quickDonationForm.cardNumber.$setValidity("minLength", true);
          }
          return value;
        });
      }
    }
    return directive;
  });

  quickDonation.directive('submitButton', function() {
    return {
      restrict: 'A',
      scope: {
        loadingText: "@",
        enableButton: "="
      },
      link: function ($scope, ele) {
        var defaultSaveText = ele.html();
        ele.bind('click', function(){
          ele.attr('disabled','disabled');
          ele.html($scope.loadingText);
        });
      }
    };
  });

  quickDonation.directive('zipCodeInfo', function() {
    var directive = {
      require: 'ngModel',
      link: function($scope, elm, attrs, ctrl){
        if ($scope.ziptasticIsEnabled == 1) {
          var duration = 100;
          var elements = {
            country: $('#country'),
            state: $('#state'),
            city: $('#city')
          }
          elements.state.parent().hide();
          elements.city.parent().hide();

          elm.ziptastic().on('zipChange', function(evt, country, state, state_short, city, zip) {
            // State
            $('#state').val(state).parent().show(duration);
            $scope.formInfo.state = state;
            $('#state').addClass('parsley-success')
            // City
            $('#city').val(city).parent().show(duration);
            $('#city').addClass('parsley-success')
            $scope.formInfo.city = city;
          });
        }
        else {
          $('#state').parent().hide();
        }
      },
    };
    return directive;
  });

  quickDonation.directive('radioLabel', function() {
    var directive = {
      link: function($scope, elm, attrs, ctrl) {
        elm.bind('click change', function(e) {
          $scope.formInfo.donateAmount = null;
          elm.parent().find('input').attr('checked', true);
          $scope.hidePriceVal = false;
          $scope.formInfo.otherAmount = null;
	  $scope.formInfo.donateAmount = elm.parent().find('input').val();
	});
      },
    };
    return directive;
  });

  quickDonation.directive('hradioLabel', function() {
    var directive = {
      link: function($scope, elm, attrs, ctrl) {
        elm.bind('click', function(e) {
          if (elm.parent().find('input:checked').length) {
            $(this).parent().parent().parent().find('label').removeClass('active');
            $(this).addClass('active');
          }
        });
      },
    };
    return directive;
  });

  quickDonation.directive('checkbxLabel', function() {
    var directive = {
      link: function($scope, elm, attrs, ctrl) {
        elm.bind('click', function(e) {
          $scope.hidePriceVal = false;
          if (!elm.parent().find('input:checked').length) {
            elm.parent().find('input').attr('checked', true);
            $(this).addClass('active');
            $scope.formInfo.CheckBoxAmount = parseInt($scope.formInfo.CheckBoxAmount) + parseInt(elm.parent().find('input').val());
            $scope.subtleAmount = $scope.formInfo.donateAmount = parseInt($scope.formInfo.donateAmount) + parseInt(elm.parent().find('input').val());
          }
          else if (elm.parent().find('input:checked').length) {
            elm.parent().find('input').attr('checked', false);
            elm.parent().find('input').trigger('click');
            $(this).removeClass('active');
            $scope.formInfo.CheckBoxAmount = parseInt($scope.formInfo.CheckBoxAmount) - parseInt(elm.parent().find('input').val());
            $scope.subtleAmount = $scope.formInfo.donateAmount = parseInt($scope.formInfo.donateAmount) - parseInt(elm.parent().find('input').val());
          }
	});
      },
    };
    return directive;
  });
})(angular, CRM.$, CRM._);
