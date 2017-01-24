/* Copyright (c) 2015 - 2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 * This file belongs to the business-ecosystem-logic-proxy of the
 * Business API Ecosystem
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @author Francisco de la Vega <fdelavega@conwet.com>
 *         Jaime Pajuelo <jpajuelo@conwet.com>
 *         Aitor Magán <amagan@conwet.com>
 */
(function () {

    'use strict';

    angular
        .module('app')
        .controller('IndividualUpdateCtrl', IndividualUpdateController);

    function IndividualUpdateController($state, $scope, $rootScope, $controller, EVENTS, DATA_STATUS, COUNTRIES, PROMISE_STATUS, Utils, Party, User) {
        /* jshint validthis: true */
        var vm = this;

        angular.extend(vm, $controller('FormMixinCtrl', {$scope: $scope}));

        vm.COUNTRIES = COUNTRIES;
        vm.STATUS = PROMISE_STATUS;

        vm.status = DATA_STATUS.LOADING;
        vm.update = update;
        vm.createContactMedium = createContactMedium;
        vm.updateContactMedium = updateContactMedium;
        vm.removeContactMedium = removeContactMedium;
	vm.isOrganization = isOrganization;
	vm.hasAdminRole = hasAdminRole;
	vm.loggedUser = User.loggedUser;
	vm.individual = User.loggedUser;

        $scope.$on(Party.EVENTS.CONTACT_MEDIUM_UPDATED, function (event, index, contactMedium) {
            updateContactMediumPromise = vm.item.updateContactMedium(index, contactMedium).then(function () {
                angular.merge(vm.data.contactMedium[index], contactMedium);
                $rootScope.$broadcast(EVENTS.MESSAGE_ADDED, 'success', {
                    message: 'The contact medium was updated.'
                });
            }, function (response) {
                $rootScope.$broadcast(EVENTS.MESSAGE_ADDED, 'error', {
                    error: Utils.parseError(response, 'Unexpected error trying to update the contact medium.')
                });
            });
        });

	// Now, this function is called at the beginning of the execution and every change call this function in order to keep frontend and backend coherence
	$scope.$on(Party.EVENTS.USER_SESSION_SWITCHED, function (event, message, obj) {
	    if (isOrganization() || User.loggedUser.currentUser.id === User.loggedUser.id){
		initialiceData();
	    }
	});

	initialiceData()

	function initialiceData() {  
            Party.detail(User.loggedUser.currentUser.id, isOrganization()).then(function (infoRetrieved) {
		if (isOrganization()) {
		    vm.orgData = infoRetrieved;
		}
		retrievePartyInfo(infoRetrieved);
            }, function (response) {
		if (response.status === 404) {
		    retrievePartyInfo();
		} else {
                    vm.status = DATA_STATUS.ERROR;
                    vm.errorMessage = Utils.parseError(response, 'Unexpected error trying to retrieve your personal information.')
		}
            });
	};
	
	function isOrganization() {
	    return User.loggedUser.id !== User.loggedUser.currentUser.id;
	};

	function hasAdminRole(){
	    return Party.hasAdminRole();
	};

	function retrieveProfile(profile) {
	    vm.status = DATA_STATUS.LOADED;
	    vm.item = profile;
            vm.data = angular.copy(profile);
	};

	function retrievePartyInfo(party) {
	    if (party == null) {
		party = Party.launch(isOrganization());
		vm.isNotCreated = true;
	    }
	    retrieveProfile(party);
	};

        var updatePromise = null;

        function update() {
            if (vm.isNotCreated) {
                updatePromise = Party.create(vm.data, isOrganization());
                updatePromise.then(function () {
                    $state.go('settings.general', {}, {
                        reload: true
                    });
                    $rootScope.$broadcast(EVENTS.MESSAGE_ADDED, 'success', {
                        message: 'Your profile was created.'
                    });
                }, function (response) {
                    $rootScope.$broadcast(EVENTS.MESSAGE_ADDED, 'error', {
                        error: Utils.parseError(response, 'Unexpected error trying to create your profile.')
                    });
                });
            } else {
                updatePromise = Party.update(vm.item, vm.data, isOrganization());
                updatePromise.then(function () {
                    $state.go('settings.general', {}, {
                        reload: true
                    });
                    $rootScope.$broadcast(EVENTS.MESSAGE_ADDED, 'success', {
                        message: 'Your profile was updated.'
                    });
                }, function (response) {
                    $rootScope.$broadcast(EVENTS.MESSAGE_ADDED, 'error', {
                        error: Utils.parseError(response, 'Unexpected error trying to update your profile.')
                    });
                });
            }
        }

        Object.defineProperty(update, 'status', {
            get: function () { return updatePromise != null ? updatePromise.$$state.status : -1; }
        });

        var createContactMediumPromise = null;

        function createContactMedium(data) {
            createContactMediumPromise = vm.item.appendContactMedium(data);
            createContactMediumPromise.then(function () {
                vm.data.contactMedium.push(data);
                $rootScope.$broadcast(EVENTS.MESSAGE_ADDED, 'success', {
                    message: 'The contact medium was created.'
                });
            }, function (response) {
                $rootScope.$broadcast(EVENTS.MESSAGE_ADDED, 'error', {
                    error: Utils.parseError(response, 'Unexpected error trying to create the contact medium.')
                });
            });

            return createContactMediumPromise;
        }

        Object.defineProperty(createContactMedium, 'status', {
            get: function () { return createContactMediumPromise != null ? createContactMediumPromise.$$state.status : -1; }
        });

        var updateContactMediumPromise = null;

        function updateContactMedium(index) {
            $rootScope.$broadcast(Party.EVENTS.CONTACT_MEDIUM_UPDATE, index, vm.item.contactMedium[index]);
        }

        Object.defineProperty(updateContactMedium, 'status', {
            get: function () { return updateContactMediumPromise != null ? updateContactMediumPromise.$$state.status : -1; }
        });

        var removeContactMediumPromise = null;

        function removeContactMedium(index) {
            removeContactMediumPromise = vm.item.removeContactMedium(index);
            removeContactMediumPromise.then(function () {
                vm.data.contactMedium.splice(index, 1);
                $rootScope.$broadcast(EVENTS.MESSAGE_ADDED, 'success', {
                    message: 'The contact medium was removed.'
                });
            }, function (response) {
                $rootScope.$broadcast(EVENTS.MESSAGE_ADDED, 'error', {
                    error: Utils.parseError(response, 'Unexpected error trying to remove the contact medium.')
                });
            });
        }

        Object.defineProperty(removeContactMedium, 'status', {
            get: function () { return removeContactMediumPromise != null ? removeContactMediumPromise.$$state.status : -1; }
        });

    }

})();
