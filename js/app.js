new Clipboard('#copy');
var app = angular.module('StarterApp', ['ngMaterial', 'angulartics', 'angulartics.google.analytics']);

app.controller('AppController', function($http, $mdToast, $log, $analytics) {
  var vm = this;
  var request = false;
  var proxy = 'http://bochen415.info/loggify.php?url=';
  vm.build1 = '';
  vm.build2 = '';
  vm.selection = {};
  vm.progress = 0;
  vm.updateUrl = function () {
    vm.progress = 0;
    $http.get(proxy+vm.url+'?build=99').then(function (res) {
      vm.progress = 50;
      $log.info('Platform api loaded');
      $log.info(res.data);
      if( res.data.solder != null){
        vm.solder = res.data.solder+'modpack/'+res.data.name;
        $http.get(proxy+vm.solder).then(function (res) {
          vm.progress = 100;
          $log.info('Solder api loaded');
          $log.info(res.data);
          vm.data = res.data;
          vm.data.builds.reverse();
          $analytics.eventTrack('loaded: '+res.data.name, {  category: 'Pack loaded', label: res.data.display_name });
          $mdToast.showSimple('Pack data loaded');
        }, function (err) {
          vm.progress = 0;
          $log.error(err);
          $analytics.eventTrack(vm.url, {  category: 'Changelog error', label: 'Solder api problem' });
          $mdToast.showSimple('Not able to load pack from solder');
        })
      } else {
        vm.progress = 0;
        $analytics.eventTrack(res.data.name, {  category: 'Changelog error', label: 'Non solder pack entered' });
        $mdToast.showSimple('Pack isn\'t solder enabled');
      }
    }, function (err) {
      vm.progress = 0;
      $log.warn(err);
      $analytics.eventTrack(vm.url, {  category: 'Changelog error', label: 'Invalid platform link' });
      $mdToast.showSimple('Platform link invalid');
    })
  };

  vm.update = function () {
    if (!vm.build1 || !vm.build2){
      return;
    }
    vm.progress = 0;
    $log.info('Loading builds '+vm.build1.replace(/ /g,'')+' & '+vm.build2.replace(/ /g,''));
    var build1, build2;
    $http.get(proxy+vm.solder+'/'+vm.build1.replace(/ /g,'')+'?include=mods').then(function (res) {
      vm.progress = 50;
      build1 = res.data;
      $http.get(proxy+vm.solder+'/'+vm.build2.replace(/ /g,'')+'?include=mods').then(function (res) {
        vm.progress = 100;
        build2 = res.data;
        $log.info('Build 2 loaded, request is '+request);
        $log.info(build2);
        vm.changes = generate(build1, build2);
      });
    });
    $analytics.eventTrack(vm.build1+' - '+vm.build2 + ' ('+vm.data.name+')', {  category: 'Changelog display', label: vm.data.display_name });
  };

  function generate (b1, b2){
    $log.info('Generate changelog');
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