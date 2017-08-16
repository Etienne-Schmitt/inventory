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

angular.module('Inventory').factory('Publisher', [
	'ItemsModel', function(ItemsModel) {
		'use strict';
		var Publisher = (function() {
			function Publisher(_$itemsmodel) {
				this._$itemsmodel = _$itemsmodel;
				this._subscriptions = {};
				this.subscribeObjectTo(this._$itemsmodel, 'items');
			}

			Publisher.prototype.subscribeObjectTo = function(object, name) {
				var base = this._subscriptions;
				if (!base[name]) {
					base[name] = [];
				}
				return this._subscriptions[name].push(object);
			};

			Publisher.prototype.publishDataTo = function(data, name) {
				var ref, results, subscriber, _i, _len;
				ref = this._subscriptions[name] || [];
				results = [];
				for (_i = 0, _len = ref.length; _i < _len; _i++) {
					subscriber = ref[_i];
					results.push(subscriber.handle(data));
				}
				return results;
			};
			return Publisher;
		})();
		return new Publisher(ItemsModel);
	}
]);
