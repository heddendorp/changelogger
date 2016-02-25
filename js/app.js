new Clipboard('#copy');
var app = angular.module('StarterApp', ['ngMaterial', 'angulartics', 'angulartics.google.analytics']);

app.controller('AppController', function($http, $mdToast, $log, $analytics) {
  var vm = this;
  var request = false;
  var proxy = 'http://bochen415.info/loggify.php?url=';
  vm.build1 = '';
  vm.build2 = '';
  vm.selection = {};
  vm.updateUrl = function () {
    $http.get(proxy+vm.url+'?build=99').then(function (res) {
      $log.info('Platform api loaded');
      $log.info(res.data);
      if( res.data.solder != null){
        vm.solder = res.data.solder+'modpack/'+res.data.name;
        $http.get(proxy+vm.solder).then(function (res) {
          $log.info('Solder api loaded');
          $log.info(res.data);
          vm.data = res.data;
          vm.data.builds.reverse();
          $mdToast.showSimple('Pack data loaded');
        }, function (err) {
          $log.error(err);
          $mdToast.showSimple('Not able to load pack from solder');
        })
      } else {
        $mdToast.showSimple('Pack isn\'t solder enabled');
      }
    }, function (err) {
      $log.warn(err);
      $mdToast.showSimple('Platform link invalid');
    })
  };

  vm.update = function () {
    if (!vm.build1 || !vm.build2){
      return;
    }
    var build1, build2;
    $http.get('http://bochen415.info/loggify.php?url='+vm.solder+'/'+vm.build1.replace(/ /g,'')+'?include=mods').then(function (res) {
      build1 = res.data;
      $log.info(build1);
      if(request)
        vm.changes = generate(build1, build2);
      request = true;
    });
    $http.get('http://bochen415.info/loggify.php?url='+vm.solder+'/'+vm.build2.replace(/ /g,'')+'?include=mods').then(function (res) {
      build2 = res.data;
      $log.info(build2);
      if(request)
        vm.changes = generate(build1, build2);
      request = true;
    });
    $analytics.eventTrack(vm.build1+' - '+vm.build2 + ' ('+vm.data.name+')', {  category: 'Changelog display', label: vm.data.display_name });
  };

  function generate (b1, b2){
    var changes = {
      adds: [],
      updates: [],
      removes: []
    };
    var premods = {}, nowmods = {};
    b1.mods.forEach(function (mod) {
      premods[mod.name] = mod;
    });
    b2.mods.forEach(function (mod) {
      if(premods[mod.name]){
        if(premods[mod.name].version != mod.version){
          changes.updates.push(mod.pretty_name+" to "+ mod.version);
        }
      } else {
        changes.adds.push(mod.pretty_name);
      }
    });
    b2.mods.forEach(function (mod) {
      nowmods[mod.name] = mod;
    });
    b1.mods.forEach(function (mod) {
      if(!nowmods[mod.name])
        changes.removes.push(mod.pretty_name);
    });
    return changes;
  }
});