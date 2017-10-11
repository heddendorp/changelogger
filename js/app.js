new Clipboard('#copy');
var app = angular.module('StarterApp', ['ngMaterial', 'angulartics', 'angulartics.google.analytics']);

app.config(function($mdThemingProvider, $mdIconProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('indigo')
        .accentPalette('pink')
        .dark();
    $mdIconProvider
        .iconSet('app', 'icons.svg');
});

app.controller('AppController', function($http, $mdToast, $log, $analytics, $location, $anchorScroll, $timeout) {
    var vm = this;
    var request = false;
    var proxy = 'https://owldreams.info/loggify.php?url=';
    var attrs = $location.search();
    var prod = ($location.host() == 'isigiel.github.io');
    vm.symbols={
        add: '+',
        update: '^',
        delete: '-'
    };

    vm.prod = prod;
    vm.build1 = '';
    vm.build2 = '';
    vm.selection = {};
    vm.progress = 0;
    vm.update1 = function (build) {
        vm.build1= build;
        vm.update()
    };
    vm.update2 = function (build) {
        vm.build2 = build;
        vm.update();
    };
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
                    vm.build1 = '';
                    vm.build2 = '';
                    $log.info('Solder api loaded');
                    $log.info(res.data);
                    vm.data = res.data;
                    vm.data.builds.sort(compareVersion).reverse();
                    if(prod)
                        $analytics.eventTrack('loaded: '+res.data.name, {  category: 'Pack loaded', label: res.data.display_name });
                    $mdToast.showSimple('Pack data loaded');
                    $timeout(function () {
                        $anchorScroll('builds');
                    }, 300);
                    $location.search('url', vm.url);
                    vm.changes={};
                    if(attrs.from && attrs.to){
                        vm.build1 = attrs.from;
                        vm.build2 = attrs.to;
                        vm.update();
                    }
                }, function (err) {
                    vm.progress = 0;
                    $log.error(err);
                    if(prod)
                        $analytics.eventTrack(vm.url, {  category: 'Changelog error', label: 'Solder api problem' });
                    $mdToast.showSimple('Not able to load pack from solder');
                    vm.changes={};
                })
            } else {
                vm.progress = 0;
                if(prod)
                    $analytics.eventTrack(res.data.name, {  category: 'Changelog error', label: 'Non solder pack entered' });
                $mdToast.showSimple('Pack isn\'t solder enabled');
                vm.changes={};
            }
        }, function (err) {
            vm.progress = 0;
            $log.warn(err);
            if(prod)
                $analytics.eventTrack(vm.url, {  category: 'Changelog error', label: 'Invalid platform link' });
            $mdToast.showSimple('Platform link invalid');
        })
    };

    vm.update = function () {
        if (vm.build1=='' || vm.build2==''){
            if(vm.build2==''){
                vm.build2 = vm.build1;
            }
            return;
        }
        if(compareVersion (vm.build1, vm.build2) > 0){
            var temp = vm.build1;
            vm.build1 = vm.build2;
            vm.build2 = temp;
        }
        vm.progress = 0;
        $log.info('Loading builds '+vm.build1.replace(/ /g,'')+' & '+vm.build2.replace(/ /g,''));
        $location.search('from', vm.build1.replace(/ /g,''));
        $location.search('to', vm.build2.replace(/ /g,''));
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
                $timeout(function () {
                    $anchorScroll('changes');
                }, 300);
            });
        });
        if(prod)
            $analytics.eventTrack(vm.build1+' - '+vm.build2 + ' ('+vm.data.name+')', {  category: 'Changelog display', label: vm.data.display_name });
    };
    if(attrs.url){
        vm.url = attrs.url;
        vm.updateUrl();
    }

    vm.startDemo = function () {
        vm.url = 'http://api.technicpack.net/modpack/the-1710-pack';
        vm.updateUrl();
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

    function compareVersion (a, b) {
        var i, cmp, len, re = /(\.0)+[^\.]*$/;
        a = (a + '').replace(re, '').split('.');
        b = (b + '').replace(re, '').split('.');
        len = Math.min(a.length, b.length);
        for( i = 0; i < len; i++ ) {
            cmp = parseInt(a[i], 10) - parseInt(b[i], 10);
            if( cmp !== 0 ) {
                return cmp;
            }
        }
        return a.length - b.length;
    }
});
