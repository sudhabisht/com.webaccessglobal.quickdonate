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
        var deferred = $q.defer();
        var priceList= [];
        var contributionId;

        //get contribution id
        CRM.api3('Setting', 'get', {
          "sequential": 1,
          "return": "quick_donation_page"
        }).done(function(result) {
          contributionId = result.values[0]['quick_donation_page'];
        });

        //get priceSetId and Amount List
        CRM.api3('PriceSet', 'get', {
          "sequential": 1,
        }).done(function(result) {
          $.each(result.values, function(key, value) {
            if (value.entity['civicrm_contribution_page'] && ($.inArray(contributionId, value.entity['civicrm_contribution_page']) >=0 )) {
              CRM.api3('PriceField', 'get', {
                "sequential": 1,
                "price_set_id": value.id,
              }).done(function(fieldVal) {
                $.each(fieldVal.values, function(fieldKey, fieldVal){
                  CRM.api3('PriceFieldValue', 'get', {
                    "sequential": 1,
                    "price_field_id": fieldVal.id,
                  }).done(function(amtList) {
                    $.each(amtList.values, function(amtkey, amtval) {
                      priceList.push(amtval);
                    });
                    deferred.resolve(priceList);
                  });
                });
              });
            }
          });
        });
        return deferred.promise;
      }
    };
  });

  quickDonation.controller('QuickDonationCtrl', function($scope, priceListService) {
    priceListService.getpriceList().then(function(data){$scope.priceListInfo = data;});
    $scope.hideValue=true;
    $scope.amountSelected = function(price) {
      $scope.amount = price;
    }
    $scope.amountActive = function(price) {
      return $scope.amount === price;
    }
    $scope.amounthover = function(price) {
      $scope.message = price;
      $scope.hideValue = false;
      return $scope.message;
    }
  });
})(angular, CRM.$, CRM._);
