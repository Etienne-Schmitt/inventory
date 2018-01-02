<?php
/**
 * Nextcloud - Inventory
 *
 * @author Raimund Schlüßler
 * @copyright 2017 Raimund Schlüßler raimund.schluessler@mailbox.org
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

namespace OCA\Inventory\Service;

use OCP\IConfig;
use OCA\Inventory\Db\Item;
use OCA\Inventory\Db\ItemMapper;
use OCA\Inventory\Db\CategoryMapper;
use OCA\Inventory\Db\ItemcategoriesMapper;
use OCA\Inventory\Db\ItemparentMapper;
use OCA\Inventory\Service\IteminstanceService;

class ItemsService {

	private $userId;
	private $AppName;
	private $itemMapper;
	private $categoryMapper;
	private $itemCategoriesMapper;
	private $iteminstanceService;
	private $itemParentMapper;

	public function __construct($userId, $AppName, ItemMapper $itemMapper, IteminstanceService $iteminstanceService,
		CategoryMapper $categoryMapper, ItemcategoriesMapper $itemcategoriesMapper, ItemparentMapper $itemParentMapper) {
		$this->userId = $userId;
		$this->appName = $AppName;
		$this->itemMapper = $itemMapper;
		$this->categoryMapper = $categoryMapper;
		$this->itemCategoriesMapper = $itemcategoriesMapper;
		$this->iteminstanceService = $iteminstanceService;
		$this->itemParentMapper = $itemParentMapper;
	}

	/**
	 * get items
	 *
	 * @return array
	 */
	public function getAll() {
		$items = $this->itemMapper->findAll($this->userId);
		foreach ($items as $nr => $item) {
			$categories = $this->itemCategoriesMapper->findCategories($item->id, $this->userId);
			$categoriesNames = array();
			foreach ($categories as $category) {
				$name = $this->categoryMapper->findCategory($category->categoryid, $this->userId);
				$categoriesNames[] = array(
					'id'	=> $category->categoryid,
					'name'	=> $name->name
				);
			}
			$items[$nr]->categories = $categoriesNames;
			$items[$nr]->instances = $this->iteminstanceService->getByItemID($item->id);
		}
		return $items;
	}

	/**
	 * get items
	 *
	 * @return array
	 */
	public function get($itemID) {
		$item = $this->itemMapper->find($itemID, $this->userId);
		$categories = $this->itemCategoriesMapper->findCategories($item->id, $this->userId);
		$categoriesNames = array();
		foreach ($categories as $category) {
			$name = $this->categoryMapper->findCategory($category->categoryid, $this->userId);
			$categoriesNames[] = array(
				'id'	=> $category->categoryid,
				'name'	=> $name->name
			);
		}
		$item->categories = $categoriesNames;
		$item->instances = $this->iteminstanceService->getByItemID($item->id);
		return $item;
	}

	/**
	 * get related items
	 *
	 * @return array
	 */
	public function getRelated($itemID) {
		$relations = $this->itemParentMapper->findRelated($itemID);
		foreach ($relations as $relation) {
			$item = $this->itemMapper->find($relation->itemid, $this->userId);
			$categories = $this->itemCategoriesMapper->findCategories($item->id, $this->userId);
			$categoriesNames = array();
			foreach ($categories as $category) {
				$name = $this->categoryMapper->findCategory($category->categoryid, $this->userId);
				$categoriesNames[] = array(
					'id'	=> $category->categoryid,
					'name'	=> $name->name
				);
			}
			$item->categories = $categoriesNames;
			$item->instances = $this->iteminstanceService->getByItemID($item->id);
			$items[] = $item;
		}
		return $items;
	}

	/**
	 * get parent items
	 *
	 * @return array
	 */
	public function getParent($itemID) {
		$relations = $this->itemParentMapper->findParent($itemID);
		$items = [];
		foreach ($relations as $relation) {
			$item = $this->itemMapper->find($relation->parentid, $this->userId);
			$categories = $this->itemCategoriesMapper->findCategories($item->id, $this->userId);
			$categoriesNames = array();
			foreach ($categories as $category) {
				$name = $this->categoryMapper->findCategory($category->categoryid, $this->userId);
				$categoriesNames[] = array(
					'id'	=> $category->categoryid,
					'name'	=> $name->name
				);
			}
			$item->categories = $categoriesNames;
			$item->instances = $this->iteminstanceService->getByItemID($item->id);
			$items[] = $item;
		}
		return $items;
	}

	/**
	 * add item
	 *
	 * @return array
	 */
	public function enlist($item) {
		$item['uid'] = $this->userId;
		$added = $this->itemMapper->add($item);

		foreach ($item['categories'] as $category) {
			$categoryEntity = $this->categoryMapper->findCategoryByName($category['name'], $this->userId);
			if (!$categoryEntity) {
				$categoryEntity = $this->categoryMapper->add($category['name'], $this->userId);
			}
			$mapping = $this->itemCategoriesMapper->add(array(
				'itemid' => $added->id,
				'uid' => $this->userId,
				'categoryid' => $categoryEntity->id
			));
		}

		foreach ($item['instances'] as $instance) {
			$instance['itemid'] = $added->id;
			$this->iteminstanceService->add($instance);
		}
	}
}
