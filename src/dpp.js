/**
 * Creates the simple DPP database.
 */

import * as THREE from 'three';
import {MD5} from 'https://cdn.skypack.dev/crypto-js';
import {initViewer} from "./viewer.js";

// Util: Apply hash to md5 string
export function md5Hash(string) {
    return MD5(string).toString();
}

/**
 * Creates a DPP object.
 *
 * @param {string} id - DPP id
 * @param {string} material - DPP materiality
 * @param {string} label - DPP label
 * @param {number} condition - Material condition (0-100)
 * @param {number} reusability - Material reusability (0-100)
 * @param {string} dimensions - Dimensions
 * @constructor
 */
function DPP(id, material, label, condition, reusability, dimensions) {
    let self = this;
    this.id = id;
    this.material = material;
    this.label = label;
    this.condition = condition;
    this.reusability = reusability;
    this.dimensions = dimensions;
    /** @type {THREE.MeshStandardMaterial} */ this.viewerTextObj = null;

    this.bindMaterial = function (material) {
        self.viewerTextObj = material;
        self.viewerTextObj.color = new THREE.Color(0xffffff);
        self.viewerTextObj.emissive = new THREE.Color(0xff0000); // Set emissive color
        self.viewerTextObj.emissiveIntensity = 0;
    };
}

/**
 * Defines a new Database.
 *
 * @param {Array<DPP>} objects - List of objects that hold the database
 * @param {string} model_name - Model name
 * @param {string} model_path - Model path of the BIM
 */
function DataBase(objects, model_name, model_path) {
    let self = this;
    this.objects = objects;
    this.model_name = model_name;
    this.model_path = model_path;

    /** @param {THREE.MeshStandardMaterial} texture */
    this.bindMaterial = function (texture) {
        const texture_id = md5Hash(texture['name']);
        self.objects.forEach((obj) => {
            if (obj.id === texture_id) obj.bindMaterial(texture);
        });
    };

    // Initializes the viewer
    this.initViewer = function () {
        document.title = `DPP Viewer: ${self.model_name}`;
        initViewer(self);
    };
}

export {DataBase, DPP}