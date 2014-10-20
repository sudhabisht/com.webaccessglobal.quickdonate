(function(angular, $, _) {

  var resourceUrl = CRM.resourceUrls['com.webaccessglobal.quickdonate'];
  var quickDonation = angular.module('quickdonate', ['ngRoute']);

  quickDonation.config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/donation', {
        templateUrl: resourceUrl + '/partials/quickdonate.html',
        controller: 'QuickDonationCtrl'
      });
    }
  ]);

  quickDonation.factory('priceListService', function($q) {
    return {
      getpriceList:function() {
        var holdPriceList = $q.defer();
        var priceList= [];
        var contributionId;

        //get contribution id
        CRM.api3('Setting', 'get', {
          "return": "quick_donation_page"
        }).done(function(result) {
          contributionId = result.values[result.id]['quick_donation_page'];
        });

        //get priceSetId and Amount List
        CRM.api3('PriceSet', 'get', {
          "sequential": 1,
          "extends":"CiviContribute",
        }).done(function(result) {
          $.each(result.values, function(key, value) {
            if ($.inArray(contributionId, value.entity['civicrm_contribution_page']) >=0 ) {
              CRM.api3('PriceField', 'get', {
                "sequential": 1,
                "price_set_id": value.id,
              }).done(function(fieldVal) {
                $.each(fieldVal.values, function(fieldKey, fieldVal) {
                  CRM.api3('PriceFieldValue', 'get', {
                    "sequential": 1,
                    "price_field_id": fieldVal.id,
                  }).done(function(amtList) {
                    $.each(amtList.values, function(amtKey, amtVal) {
                      priceList.push(amtVal);
                    });
                    holdPriceList.resolve(priceList);
                  });
                });
              });
            }
          });
        });
        return holdPriceList.promise;
      }
    };
  });

  quickDonation.controller('QuickDonationCtrl', function($scope, priceListService) {
    priceListService.getpriceList().then(function(data) {
      $scope.priceListInfo = data;
    });

    $scope.hidePriceVal=true;
    $scope.amountSelected = function(price) {
      $scope.amount = price;
    }

    $scope.amounthover = function(price) {
    $scope.message = price;
    $scope.hidePriceVal = false;
      return $scope.message;
    }

    //manually binds Parsley--Validation Library to this form.
    $('#quickDonationForm').parsley();
    $scope.formInfo = {}; //property is set to bind input value
  });
})(angular, CRM.$, CRM._);
