(function(){
  'use strict';

  angular
    .controller('rssCtrl', rssCtrl);

  rssCtrl.$inject = ['$scope', '$rootScope', '$http', '$location', 'structureService', '$filter'];

  function rssCtrl($scope, $rootScope, $http, $location, structureService, $filter) {
    //Register upper level modules
    structureService.registerModule($location, $scope, 'rss');
    $scope.ready = false;


    //RENDER!
    $rootScope.$broadcast("renderKoaElements", {});


    $scope.max    = 0;
    $scope.active = 0;

    $scope.goToLink = function(data){
      window.open(data, '_system');
    }

    var format = '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK';
    var query  = 'select * from xml where url = "'+ $scope.rss.modulescope.feed + '"';
    var url    = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + format;

    $http.jsonp(url)
    .success(function(json) {
      structureService.launchSpinner('.transitionloader');
      if (!(json && json.query && json.query.results)) $scope.error = true;
      else{

        $scope.itemsY = (json.query.results.rss)  ? json.query.results.rss.channel :
                        (json.query.results.RDF)  ? json.query.results.RDF         :
                        (json.query.results.feed) ? json.query.results.feed        :
                                                    null;

        if(!$scope.itemsY) $scope.error = 'invalid';
        else{
          $scope.itemsY = $scope.itemsY.item || $scope.itemsY.entry;
          if(!$scope.itemsY) $scope.error = 'empty';
          else               formatFeed();
        }

      }
      hideSpinner();
    })
    .error(function(error){
      $scope.error = 'invalid';
      hideSpinner();
    });

    function formatFeed(){
      angular.forEach($scope.itemsY, function(post, key){
        $scope.itemsY[key].desc = getDescription($scope.itemsY[key]);
        $scope.itemsY[key].desc = limit($scope.itemsY[key].desc, 180);

        if(post.thumbnail && post.thumbnail.length > 0){
          $scope.itemsY[key].image = post.thumbnail[0].url;
        }
        // else{
        //   $scope.max++;
        //   $scope.active++;
        //   $scope.itemsY[key].link = $scope.itemsY[key].link.href || $scope.itemsY[key].link;
        //   $http.get($scope.itemsY[key].link)
        //   .success(function(data){
        //     var images = getImages(data);
        //     for(var i=0; i<images.length; i++){
        //       images[i] = images[i].match(/(src=")([^"]*)/gmi)[0].replace('src="','');
        //     }
        //     $scope.itemsY[key].image = images[$scope.rss.modulescope.image||0];
        //     $scope.active--;
        //   })
        //   .error(function(){
        //     $scope.active--;
        //   });
        // }
      });
  }

    // $scope.$watch('active', function(newValue, oldValue) {
    //   if(oldValue && newValue===0){
    //     document.querySelector("div.iframeLoading").style.visibility = 'hidden';
    //   }
    // });
  }

  function getDescription(item){
    var text = (item.description) ? item.description :
               (item.content)     ? item.content.content :
                                    null;

    return (!text) ? null : text.replace(/<[^>]*>/gmi, "")         // replaces any html tag. Ex: <a href="#"> or </a>
                                .replace(/read more/gmi, "")
                                .replace(/leer mas/gmi, "")
                                .replace(/\[\/?wp[^\]]*\]/gmi, "") // replaces any wordpress tag. Ex: [wpgeoip_filter country_code="MX"]
                                .trim();
  }

  function limit(str, limit){
    return (str === null)        ? "" :
           (str.length <= limit) ? str :
                                   str.substring(0,180)+" ...";
  }

  function getImages(data){
    return data.match(/<meta.*property="og:image".*>/gmi)  ||
           data.match(/<meta.*name="twitter:image".*>/gmi) ||
           data.match(/<img[^>]*>/gmi);
  }
  function hideSpinner() {
    setTimeout(function () {
      document.querySelector(".rss div.iframeLoading").style.visibility = 'hidden';
    }, 1000);
  }

}());
