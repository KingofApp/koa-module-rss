(function(){
  'use strict';

  angular
    .controller('rssCtrl', rssCtrl);

  rssCtrl.$inject = ['$scope', '$http', '$location', 'structureService', '$filter'];

  function rssCtrl($scope, $http, $location, structureService, $filter) {
    //Register upper level modules
    structureService.registerModule($location, $scope, 'rss');

    $scope.ready = false;

    $scope.max    = 0;
    $scope.active = 0;

    var format = '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK';
    var query  = 'select * from xml where url = "'+ $scope.rss.modulescope.feed + '"';
    var url    = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + format;

    $http.jsonp(url).success(function(json) {
      $scope.itemsY = json.query.results.rss.channel.item;
      angular.forEach($scope.itemsY, function(post, key){
        $scope.itemsY[key].desc = getDescription($scope.itemsY[key]);

        if(post.thumbnail && post.thumbnail.length > 0){
          $scope.itemsY[key].image = post.thumbnail[0].url;
        }
        else{
          $scope.max++;
          $scope.active++;
          $http.get($scope.itemsY[key].link).success(function(data){
            var images = data.match(/<meta.*property="og:image".*>/gmi)  ||
                         data.match(/<meta.*name="twitter:image".*>/gmi) ||
                         data.match(/<img[^>]*>/gmi);

            for(var i=0; i<images.length; i++){
              images[i] = images[i].match(/(src=")([^"]*)/gmi)[0].replace('src="','');
            }
            $scope.itemsY[key].image = images[$scope.rss.modulescope.image||0];
            $scope.active--;
          });
        }
      });

    });

    $scope.$on("koaAppRendered", function() {
      console.log("rendering");
      if($scope.active === 0) $scope.ready = true;
    });
  }

  function getDescription(item){
    return item.description.replace(/<[^>]*>/gmi, "")
                           .replace(/read more/gmi, "")
                           .replace(/leer mas/gmi, "");
  }

}());
