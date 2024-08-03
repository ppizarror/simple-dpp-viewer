/**
 * Creates the simple DPP database.
 */

import * as THREE from 'three';

/**
 * Creates a DPP object.
 *
 * @param {string} id - DPP id
 * @param {string} material - DPP materiality
 * @param {number} condition - Material condition (0-100)
 * @param {number} reusability - Material reusability (0-100)
 * @param {THREE.MeshStandardMaterial} viewerTextObj
 * @constructor
 */
function DPP(id, material, condition, reusability, viewerTextObj) {
    this.id = id;
    this.material = material;
    this.condition = condition;
    this.reusability = reusability;
    this.viewerTextObj = viewerTextObj;
}

/**
 * Defines a new Database.
 *
 * @param {Array<DPP>} objects - List of objects that hold the database
 * @param {string} model_path - Model path of the BIM
 */
function DataBase(objects, model_path) {
    this.objects = objects;
    this.model_path = model_path;

    // Initializes rendering
    this.initRender = function () {

    };
}