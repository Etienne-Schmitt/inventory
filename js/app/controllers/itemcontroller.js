/**
 * Nextcloud - Inventory
 *
 * @author Raimund Schlüßler
 * @copyright 2017 Raimund Schlüßler <raimund.schluessler@mailbox.org>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

angular.module('Inventory').controller('ItemController', [
	'$scope', '$route', '$timeout', '$location', '$routeParams', 'Persistence', 'ItemsModel', function($scope, $route, $timeout, $location, $routeParams, Persistence, ItemsModel) {
		'use strict';
		var ItemController = (function() {
			function ItemController(_$scope, _$route, _$timeout, _$location, _$routeparams, _persistence, _$itemsmodel) {
				this._$scope = _$scope;
				this._$scope.name = 'newItem';

				this._$route = _$route;
				this._$timeout = _$timeout;
				this._$location = _$location;
				this._$routeparams = _$routeparams;
				this._persistence = _persistence;
				this._$itemsmodel = _$itemsmodel;
				this._$scope.route = this._$routeparams;
				this._persistence.getItems();
				this._$scope.items = this._$itemsmodel.getAll();

				console.log('ItemController loaded.')
			}
			return ItemController;
		})();
		return new ItemController($scope, $route, $timeout, $location, $routeParams, Persistence, ItemsModel);
	}
]);
