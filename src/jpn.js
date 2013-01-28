
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
if ('webkitIndexedDB' in window) {
	window.IDBTransaction = window.webkitIDBTransaction;
	window.IDBKeyRange = window.webkitIDBKeyRange;
}

/**
 * Un modèle abstrait est une construction simpliste basée sur le souhait
 * que le développeur la réutilisant hérite de sa structure pour mettre 
 * en place un modèle qui lui est propre au sein duquel un ensemble de 
 * donnée en JSoN seront contenu et accessibles. 
 */
function JPNModel(state) {

	this._state = state;

	this.get = function(key) {
		return this._state[key];
	};

	this.set = function(key, value) {
		this._state[key] = value;
	};

	this.toString = function() {
		return JSON.stringify(state, replace);
	};

	function replace(key, value) {
		if (typeof value === 'number' && !isFinite(value)) {
			return String(value);
		}
		return value;
	}
}


function JSpNConfigurationManager(dbname) {

	/** Nom de la base de donnée */
	this._dbname = dbname;


	/** Liste des configurations stockées dans le Manager*/
	this._objectStores = new Array();

	/**
	 * Ajout d'une configuration dans le manager
	 * La description d'un ObjectStore est spécifié
	 * dans 
	 */
	this.add = function(description) {
		// On assure l'unicité de la configuration 
		var i;
		for (i = 0;
		i < this._objectStores.length &&
		description.name != this._objectStores[i].name; i++);
		if (i == this._objectStores.length) {
			this._objectStores.push(description);
		}
	};

	/**
	 * Renvois le nom de la base de donnée
	 */ 
	this.getDbName = function() {
		return this._dbname;
	};

	/**
	 * Récupération de la configuration fonction
	 * de l'id pour laquelle elle est référencé dans 
	 * la configuration
	 */
	this.get = function(name) {
		var i;
		for (i = 0;
		i < this._objectStores.length &&
		name != this._objectStores[i].name; i++);
		if (i != this._objectStores.length) {
			return this._objectStores[i];
		}

	};
}


function JPNDao(configuration) {

	/** Configuration manager de la DAO */
	this.manager = configuration;

	/** Instance unique de la base de donnée courante */
	this.instance = null;

	var self = this;

	/**
	 * Gestion d'erreur des intéractions avec IndexedDB
	 */ 
	this._defaultErrorLog = function(event) {
		console.log("[Error] " + event);
	};

	/**
	 * Appel de la connexion à la base de donnée
	 */
	this.getInstance = function() {
		var deferred = $.Deferred();
		var openRequest = window.indexedDB.open(this.manager.getDbName());

		openRequest.onsuccess = function(event) {
			self.instance = event.target.result;
			deferred.resolve(self.instance);
		};
		openRequest.onerror = self._defaultErrorLog;

		return deferred.promise();
	};
	
	/**
	 * Vide un object store de l'ensemble des objets 
	 * présents.
	 */
	this.clear = function(name) {
		$.when(this.getInstance().then(function() {
			var conf = self.manager.get(name);
			if (conf == null) {
				throw "Absence de configuration pour ce type d'objet";
			}
			
			var objectStoreName = conf.objectStore;
			var request = self.instance.transaction([objectStoreName], "readwrite")
			var objectStore = request.objectStore(objectStoreName);
			objectStore.clear();
			console.log("cleared");
			request.oncomplete = function() {
				console.log(objectStoreName + " vidée");
			};
		}));
	};


	/**
	 * Ajout d'un objet dans la base de donnée s
	 * name   : nom de la configuration
	 * object : l'objet à ajouter
	 */
	this.add = function(name, object) {
		$.when(this.getInstance()).then(function() {
			// Récupération de la configuration
			var conf = self.manager.get(name);
			if (conf == null) {
				throw "Absence de configuration pour ce type d'objet";
			}


			var objectStoreName = conf.objectStore;
			console.log("Nom de l'OStore selectionné: " + objectStoreName);

			// Si l'objectStore n'est pas accessible
			if (!self.instance.objectStoreNames.contains(objectStoreName)) {
				console.log("Création de l'object store: " + objectStoreName);
				// Changement de version
				var version = db.version + 1;
				self.instance.close();

				var request = window.indexedDB.open(_manager.getDbName(), version);
				request.onupgradeneeded = function(event) {
					self.instance = event.target.result;
					self.instance.createObjectStore(objectStoreName, {
						keypath: conf.primary, 
						autoIncrement: true
					});
					console.log("Création d'un nouvel ObjectStore");
				};
			}
			console.log(self.instance);
			console.log("Préparation de la transaction");

			var storageRequest = self.instance.transaction([objectStoreName], "readwrite");
			var storage = storageRequest.objectStore(objectStoreName);
			storage.put(object);

			storageRequest.oncomplete = function() {
				console.log("Succès lors de l'ajout dans le nouvel objectStore");
			};

			storageRequest.onerror = function() {
				throw "Echec lors de l'insertion";
			};
		});
	};

	/**
	 * Recherche d'un ensemble d'élements relativement
	 * aux critère des recherche de l'élément de recherche
	 * que l'on passe en paramêtre
	 */
	this.get = function(name, traitement) {
		$.when(self.getInstance()).then(function(){
			var conf = self.manager.get(name);
			if (conf == null) {
				throw "Absence de configuration pour ce type d'objet";
			}

			var objectStore = self.instance.transaction([conf.objectStore], "readonly")
			.objectStore(conf.objectStore);
			
			var dataSet = [];
			var cur = objectStore.openCursor();
			cur.onsuccess = function(event) {
				var cursor = event.target.result;
				if (cursor) {
					console.log(cursor.value.name);
					dataSet.push(cursor.value);
					cursor.continue();
				} else {
					traitement(dataSet);
				}
			};
		});
	};



	/**
	 * Suppression d'une entité de la base de donnée 
	 */
	this.remove = function(name, id) {
		// recherche

		// suppression
	};

	/**
	 * Modification d'un objet de la base de donnée 
	 */
	this.update = function(name, object) {
		// Do nothing

	};

};



