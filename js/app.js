new Clipboard('#copy');
var app = angular.module('StarterApp', ['ngMaterial']);

app.controller('AppController', function($http, $mdToast, $log) {
    var vm = this;
    var request = false;
    vm.build1 = '';
    vm.build2 = '';
    vm.selection = {};
    vm.updatePack = function () {
        $http.get('http://bochen415.info?url='+vm.url).then(function (data) {
            vm.data = data.data;
            vm.data.builds.reverse();
            $mdToast.showSimple('Pack info loaded');
            $log.info(data);
        }, function (err) {
            $log.warn(err);
            $mdToast.showSimple('URL invalid');
        })
    };

    vm.update = function () {
        if (!vm.build1 || !vm.build2){
            return;
        }
        var build1, build2;
        $http.get('http://bochen415.info?url='+vm.url+'/'+vm.build1.replace(/ /g,'')+'?include=mods').then(function (res) {
            build1 = res.data;
            $log.info(build1);
            if(request)
                vm.changes = generate(build1, build2);
            request = true;
        });
        $http.get('http://bochen415.info?url='+vm.url+'/'+vm.build2.replace(/ /g,'')+'?include=mods').then(function (res) {
            build2 = res.data;
            $log.info(build2);
            if(request)
                vm.changes = generate(build1, build2);
            request = true;
        })
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