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
'use strict'

import Vue from 'vue'
import Vuex from 'vuex'
import Item from '../models/item.js'
import PQueue from 'p-queue'
import Status from '../models/status'
import Axios from 'axios'
Axios.defaults.headers.common.requesttoken = OC.requestToken

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		items: {},
		item: null,
		loadingItems: false,
		subItems: [],
		parentItems: [],
		relatedItems: [],
		itemCandidates: []
	},
	mutations: {

		/**
		 * Adds multiple items to the store
		 *
		 * @param {Object} state Default state
		 * @param {Array<Item>} items The items to add
		 */
		addItems(state, items = []) {
			state.items = items.reduce(function(list, item) {
				if (item instanceof Item) {
					Vue.set(list, item.id, item)
				} else {
					console.error('Wrong item object', item)
				}
				return list
			}, state.items)
		},

		/**
		 * Adds an item to the store
		 *
		 * @param {Object} state Default state
		 * @param {Item} item The item to add
		 */
		addItem(state, item) {
			Vue.set(state.items, item.id, item)
		},

		/**
		 * Deletes an item from the store
		 *
		 * @param {Object} state Default state
		 * @param {Item} item The item to delete
		 */
		deleteItem(state, item) {
			if (state.items[item.id] && item instanceof Item) {
				Vue.delete(state.items, item.id)
			}
		},

		setItem(state, payload) {
			state.item = payload.item
		},
		setSubItems(state, payload) {
			state.subItems = payload.subItems
		},
		setParentItems(state, payload) {
			state.parentItems = payload.parentItems
		},
		setRelatedItems(state, payload) {
			state.relatedItems = payload.relatedItems
		},
		setItemCandidates(state, payload) {
			state.itemCandidates = payload.itemCandidates
		},
	},

	getters: {

		/**
		 * Returns all items in the store
		 *
		 * @param {Object} state The store data
		 * @param {Object} getters The store getters
		 * @param {Object} rootState The store root state
		 * @returns {Array} All items in store
		 */
		getAllItems: (state, getters, rootState) => {
			return Object.values(state.items)
		},

		/**
		 * Returns whether we currently load items from the server
		 *
		 * @param {Object} state The store data
		 * @param {Object} getters The store getters
		 * @param {Object} rootState The store root state
		 * @returns {Boolean} Are we loading items
		 */
		loadingItems: (state, getters, rootState) => {
			return state.loadingItems
		},
	},

	actions: {

		async loadItems({ commit, state }) {
			state.loadingItems = true
			const response = await Axios.get(OC.generateUrl('apps/inventory/items'))
			const items = response.data.map(payload => {
				return new Item(payload)
			})
			commit('addItems', items)
			state.loadingItems = false
		},

		async createItems(context, items) {
			const queue = new PQueue({ concurrency: 5 })
			items.forEach(async(item) => {
				await queue.add(async() => {
					try {
						const response = await Axios.post(OC.generateUrl('apps/inventory/item/add'), { item: item.response })
						Vue.set(item, 'response', response.data)
						item.updateItem()
						item.syncstatus = new Status('created', 'Successfully created the item.') // eslint-disable-line require-atomic-updates
						context.commit('addItem', item)
					} catch {
						item.syncstatus = new Status('error', 'Item creation failed.') // eslint-disable-line require-atomic-updates
					}
				})
			})
		},

		async getItemById({ commit }, itemID) {
			try {
				const response = await Axios.get(OC.generateUrl('apps/inventory/item/' + itemID))
				const item = new Item(response.data)
				commit('setItem', { item })
			} catch {
				commit('setItem', { item: null })
			}
		},
		async loadSubItems({ commit }, itemID) {
			try {
				const response = await Axios.get(OC.generateUrl('apps/inventory/item/' + itemID + '/sub'))
				const subItems = response.data.map(payload => {
					return new Item(payload)
				})
				commit('setSubItems', { subItems })
			} catch {
				commit('setSubItems', { subItems: [] })
			}
		},
		async loadParentItems({ commit }, itemID) {
			try {
				const response = await Axios.get(OC.generateUrl('apps/inventory/item/' + itemID + '/parent'))
				const parentItems = response.data.map(payload => {
					return new Item(payload)
				})
				commit('setParentItems', { parentItems })
			} catch {
				commit('setParentItems', { parentItems: [] })
			}
		},
		async loadRelatedItems({ commit }, itemID) {
			try {
				const response = await Axios.get(OC.generateUrl('apps/inventory/item/' + itemID + '/related'))
				const relatedItems = response.data.map(payload => {
					return new Item(payload)
				})
				commit('setRelatedItems', { relatedItems })
			} catch {
				commit('setRelatedItems', { relatedItems: [] })
			}
		},
		async loadItemCandidates({ commit }, parameters) {
			try {
				const response = await Axios.get(OC.generateUrl('apps/inventory/item/' + parameters.itemID + '/candidates/' + parameters.relationType))
				const itemCandidates = response.data.map(payload => {
					return new Item(payload)
				})
				commit('setItemCandidates', { itemCandidates })
			} catch {
				commit('setItemCandidates', { itemCandidates: [] })
			}
		},
		async deleteItem({ commit }, item) {
			try {
				await Axios.delete(OC.generateUrl('apps/inventory/item/' + item.id + '/delete'))
				commit('deleteItem', item)
			} catch {
				console.debug('Item deletion failed.')
			}
		},
		async deleteItems(context, items) {
			const queue = new PQueue({ concurrency: 5 })
			items.forEach(async(item) => {
				await queue.add(() => context.dispatch('deleteItem', item))
			})
		},
	}
})
