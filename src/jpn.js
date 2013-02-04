window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
if ('webkitIndexedDB' in window) {
	window.IDBTransaction = window.webkitIDBTransaction;
	window.IDBKeyRange = window.webkitIDBKeyRange;
}




function JPNException(id) {

	var exceptionListe = {
			1: "UndefinedResult: the object returned by transaction is undefined",
			2: "ConfigurationMissing: impossible to find a configuration in the manager",
			3: "IncorrectObjectConfiguration: trying to insert an object" +
			" with data structure different from that expected by the manager",
			4: "NoDataFound: no data found from this selection statement",
			5: "StorageError: error while trying to store an object"
	};

	throw "[Exception]: "+exceptionListe[id];

};

/**
 * Filtre de recherche pour les données de selection JPN
 * @returns un filtre sur les données extraites
 */
function JPNFiltre() {

	this._champs_s = new Array();
	this._criteresEt = new Array();
	this._criteresFo = new Array();
	this._criteresFac = new Array();


	this.reset = function() {
		this._champs_s = new Array();
		this._criteresEt = new Array();
		this._criteresFo = new Array();
		this._criteresFac = new Array();
	};

	this.select = function() {
		for (var i = 0; i < arguments.length; i++) {
			this._champs_s.push(arguments[i]);
		}
	};

	this.where = function(c, o, v) {
		this._criteresEt.push({ champ : c, operateur : o, valeur : v });
	};

	this.where_foreign = function(f, c, o, v) {
		this._criteresFo.push({ foreign :f, champ : c, operateur : o, valeur : v });
	};

	this.where_foreign_array_contain = function(f, t, c, v) {
		this._criteresFac.push({ foreign :f, tableau : t, champ : c, valeur : v });
	};

	// cheat pour utiliser la fonction contains sur un tableau
	Array.prototype.contains = function(obj) {
		var i;
		for ( i = 0; ( i<this.length ) && !( this[i]===obj ); i++);
		return i!=this.length;
	}

	this.check = function(filtre, aVerifier) {

		// critère &
		for (var i=0; i<filtre._criteresEt.length; i++) {
			var ss_filtre = filtre._criteresEt[i];

			switch (ss_filtre.operateur) {
			case '=' :
				//
				if (aVerifier[ss_filtre.champ] != ss_filtre.valeur) {
					return false;
				}
				break;
			case '>' :
				//
				if (aVerifier[ss_filtre.champ] <= ss_filtre.valeur) {
					return false;
				}
				break;
			case '<' :
				//
				if (aVerifier[ss_filtre.champ] >= ss_filtre.valeur) {
					return false;
				}
				break;
			case '>=' :
				//
				if (aVerifier[ss_filtre.champ] < ss_filtre.valeur) {
					return false;
				}
				break;
			case '<=' :
				//
				if (aVerifier[ss_filtre.champ] > ss_filtre.valeur) {
					return false;
				}
				break;
			}
		}
		// critère sur sous-objet

		for (var i=0; i<filtre._criteresFo.length; i++) {
			var ss_filtre = filtre._criteresFo[i];
			switch (ss_filtre.operateur) {
			case '=' :
				//
				if (aVerifier[ss_filtre.foreign][ss_filtre.champ] != ss_filtre.valeur) {
					return false;
				}
				break;
			case '>' :
				//
				if (aVerifier[ss_filtre.foreign][ss_filtre.champ] <= ss_filtre.valeur) {
					return false;
				}
				break;
			case '<' :
				//
				if (aVerifier[ss_filtre.foreign][ss_filtre.champ] >= ss_filtre.valeur) {
					return false;
				}
				break;
			case '>=' :
				//
				if (aVerifier[ss_filtre.foreign][ss_filtre.champ] < ss_filtre.valeur) {
					return false;
				}
				break;
			case '<=' :
				//
				if (aVerifier[ss_filtre.foreign][ss_filtre.champ] > ss_filtre.valeur) {
					return false;
				}
				break;
			}
		}

		// critere sur tableau dun sous objet

		for (var i=0; i<filtre._criteresFac.length; i++) {
			var ss_filtre = filtre._criteresFac[i];

			var f = aVerifier[ss_filtre.foreign];
			var tab = f[ss_filtre.tableau];

			var z=0;
			for (z=0; z<tab.length && tab[z][ss_filtre.champ]!= ss_filtre.valeur; z++);
			if (z==tab.length) {
				return false;
			}
		}

		// ELSE else else
		return true;

	};


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
	 * @param description d'un object store
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
con	 * @return le nom de la base de donnée concerné par cette figuation
	 */ 
	this.getDbName = function() {
		return this._dbname;
	};

	/**
	 * Récupération de la configuration fonction
	 * de l'id pour laquelle elle est référencé dans 
	 * la configuration
	 * @param name le nom de la configuration à récupérer
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

	/**
	 * @param le nom de la configuration que l'on veux récupérer
	 * @return la configuration 
	 */
	this.getByDbName = function(name) {
		var i;
		for (i = 0;
		i < this._objectStores.length &&
		name != this._objectStores[i].objectStore; i++);
		if (i != this._objectStores.length) {
			return this._objectStores[i];
		}

	};

	/**
	 * Vérifie si l'object passé en paramètre correspond à la configuration
	 * donnée.
	 * @param object l'objet à vérifier
	 * @param name le nom de la configuratio à évaluer
	 * @return true si la configuration est correct / false sinon
	 */
	this.isCorrect = function(object, name) {
		var conf = this.get(name);
		var i = 0;
		for (var properties in object) {
			if (properties == conf.state[i]) i++;
		}
		return i == conf.state.length;
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
	 * Mise à jour de la base de donnée si nécessaire
	 */
	this.majDb = function() {
		$.when(this.getInstance()).done(function() {
			var aAjouter = new Array();
			for (var i = 0; i < self.manager._objectStores.length; i++) {
				if (!self.instance.objectStoreNames.contains(self.manager._objectStores[i].objectStore)) {
					aAjouter.push(self.manager._objectStores[i].objectStore);
				}
			}
			if (aAjouter.length > 0) {
				var version = self.instance.version + 1;
				self.instance.close();
				var request;

				request = window.indexedDB.open(self.manager.getDbName() , version);
				request.onupgradeneeded = function(event) {
					self.instance = event.target.result;
					for (var i = 0; i < aAjouter.length; i++) {
						var conf = self.manager.getByDbName(aAjouter[i]);
						self.instance.createObjectStore(aAjouter[i], {
							keypath: conf.primary, 
							autoIncrement: true
						}).createIndex(conf.primary, conf.primary, { unique: true });
						console.log("Création de " + conf.objectStore + " avec pour clé " + conf.primary);
					};
					console.log("Mise à jour de la base de donnée");
				};
			};
		});
	};


	/**
	 * Création d'une connexion avec la base de donnée IndexedDb
	 * Utilisation d'une promesse pour gérer la pile d'appels 
	 * asynchrone.
	 * @return promsesse de création d'une instance de base de donnée ouverte
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
	 * @param name le nom de l'object store à vider
	 */
	this.clear = function(name) {
		$.when(this.getInstance().then(function() {
			var conf = self.manager.get(name);
			if (conf == null) {
				new JPNException(2);
			}

			var objectStoreName = conf.objectStore;
			var request = self.instance.transaction([objectStoreName], "readwrite");
			var objectStore = request.objectStore(objectStoreName);
			objectStore.clear();
			request.oncomplete = function() {
				console.log(objectStoreName + " vidée");
			};
		}));
	};



	/**
	 * Ajout d'un objet dans l'objectStore défini par le nom de 
	 * configuration name.
	 * @param name nom de la configuration
	 * @object l'objet à ajouter
	 */
	this.add = function(name, object) {
		$.when(self.getInstance()).done(function(db){
			var conf = self.manager.get(name);
			if (conf == null) {
				new JPNException(2);
			}

			if (!self.manager.isCorrect(object, name)) {
				new JPNException(3);
			}

			var objectStoreName = conf.objectStore;

			if (conf['foreign'] != null) {
				// extraction de l'objet à ajouter
				for (var i = 0; i < conf.foreign.length; i++) {
					var osForeign = conf.foreign[i][0];
					var FConf = self.manager.get(conf.foreign[i][0]);
					var fObject = object[osForeign];
					// Si la clé n'existe pas 

					self.add(osForeign, fObject);

					object[osForeign] = fObject[FConf['primary']];

					var storageRequest = self.instance.transaction([objectStoreName], "readwrite");
					var storage = storageRequest.objectStore(objectStoreName);
					storage.put(object);

					storageRequest.oncomplete = function(event) {
						console.log("Succès de l'ajout de l'objet dans " + objectStoreName);
					};

					storageRequest.onerror = function() {
						new JPNException(5);
					};
				}
			} else {

				var storageRequest = self.instance.transaction([objectStoreName], "readwrite");
				var storage = storageRequest.objectStore(objectStoreName);
				storage.put(object);

				storageRequest.oncomplete = function(event) {
					console.log("Succès de l'ajout de l'objet dans " + objectStoreName);
				};

				storageRequest.onerror = function() {
					new JPNException(5);
				};

			}	

		});
	};

	/**
	 * Execute un traitement sur un objet référencé par sa clé primaire
	 * @param name le nom de l'object store à atteindre
	 * @param id la clé primaire de l'objet à traiter
	 * @param traitement le callback à éxecuter
	 */
	this.getByKey = function(name, id, traitement) {
		$.when(self.getInstance()).then(function(){
			var conf = self.manager.get(name);
			if (conf == null) {
				new JPNException(2);
			}

			var transact = self.instance.transaction([conf.objectStore], "readonly");
			var objectStore = transact.objectStore(conf.objectStore).index(conf.primary);

			var request = objectStore.get(id);
			request.onsuccess = function(event) {
				var objet = event.target.result;
				if (objet == undefined) {
					new JPNException(4);
				}
				if (conf.foreign != null) {
					self.getForeign(name, 0, objet, traitement);
				} else {
					traitement(objet);
				}
			};
		});
	};

	/**
	 * Récupération de l'ensemble des objets composant d'un objet passé en paramêtre
	 * Reconstitution complète de l'arbre des dépendances
	 * @param le nom de l'object store ou se trouve l'objet à reconstruire
	 * @param index_cle l'index de l'objet à récupérer dans la liste des composants.
	 * @param objet l'objet à reconstruire
	 * @param callback le traitement à effectuer sur l'objet
	 * @param filtre le seleccteur de données si nécessaire.
	 */
	this.getForeign = function(name, index_cle, objet, callback, filtre) {
		$.when(this.getInstance()).then(function(instance) {
			var conf = self.manager.get(name);
			if (conf == null) {
				new JPNException();
			}
			if (index_cle >= conf.foreign.length) {
				if (!filtre) {
					callback(objet);
				} else {
					callback(objet, filtre);
				}
			} else {
				var fConf = self.manager.get(conf.foreign[index_cle][0]);

				var transact = self.instance.transaction([fConf.objectStore], "readonly");
				var objectStore = transact.objectStore(fConf.objectStore).index(fConf.primary);

				var request = objectStore.get(objet[conf.foreign[index_cle][0]]);
				request.onsuccess = function(event) {
					var foreign = event.target.result;
					objet[conf.foreign[index_cle][0]] = foreign;

					if (!filtre) {
						self.getForeign(name, index_cle + 1 , objet, callback);
					} else {
						self.getForeign(name, index_cle + 1 , objet, callback, filtre);
					}
				};
			}

		});
	};


	/**
	 * Recherche d'un ensemble d'élements relativement
	 * aux critère des recherche de l'élément de recherche
	 * que l'on passe en paramêtre
	 * @param name le nom de l'object store ou se trouve l'objet à reconstruire
	 * @param traitement le traitement à éxecuter sur le jeu de donnée
	 * @param le filtre à mettre ene place sur le jeu de donnée
	 */
	this.get = function(name, traitement, filtre) {
		$.when(self.getInstance()).then(function(){
			var conf = self.manager.get(name);
			if (conf == null) {
				new JPNException(2);
			}

			var objectStore = self.instance.transaction([conf.objectStore], "readonly")
			.objectStore(conf.objectStore);
			var dataSet = [];
			var cur = objectStore.openCursor();
			cur.onsuccess = function(event) {
				var cursor = event.target.result;
				if (cursor) {
					var object = cursor.value;
					object.key = cursor.key;
					dataSet.push(object);
					cursor.continue();
				} else {
					if (!filtre) {
						traitement(dataSet);
					} else {
						traitement(dataSet, filtre);
					}
				};
			};
		});
	};

	/**
	 * Suppression d'une entité de l'objectStore 
	 * @param name le nom de l'object store à atteindre
	 * @param id la clé de l'élément à supprimer	 
	 */
	this.remove = function(name, id) {
		$.when(self.getInstance()).then(function() {
			var conf = self.manager.get(name);
			if (conf == null) {
				new JPNException();
			}
			console.log(id);
			// Suppression d'un item en base de donnée
			var transaction = self.instance.transaction([conf.objectStore], "readwrite");
			var request = transaction.objectStore(conf.objectStore).delete(Number(id));
			request.onsuccess = function(event) {
				console.log("Suppression de l'objet :" + id + " de l'objet " + conf.objectStore);
			};
			request.onerror = self._defaultErrorLog;
		});
	};

	/**
	 * Modification d'un objet de la base de donnée, pour ce faire, on supprime
	 * l'ensemble des données concernant l'ancien objet et on stock le nouveau à 
	 * sa place. /!\ La clé d'IDB en est modifiée
	 * @param name le nom de l'object store dans lequel se trouve l'objet à modifier
	 */
	this.update = function(name, object) {
		var conf = self.manager.get(name);
		if (conf == null) {
			JPNException(2);
		}

		self.getByKey(name, object[conf.primary], function(old) {
			self.remove(name, old[conf.primary]);
			self.add(name, object);
		});
	};

};

