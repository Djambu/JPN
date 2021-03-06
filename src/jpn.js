window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
if ('webkitIndexedDB' in window) {
	window.IDBTransaction = window.webkitIDBTransaction;
	window.IDBKeyRange = window.webkitIDBKeyRange;
}

/**
 * Exception sous JPN
 * @param chain
 * @returns
 */
function JPNException(chain) {

	var exceptionListe = {
			1: "UndefinedResult: the object returned by transaction is undefined",
			2: "ConfigurationMissing: impossible to find a configuration in the manager",
			3: "IncorrectObjectConfiguration: trying to insert an object" +
			" with data structure different from that expected by the manager",
			4: "NoDataFound: no data found from this selection statement",
			5: "StorageError: error while trying to store an object",
			6: "OpenDbError: error while opening a database",
			7: "InvalidConfiguration: JSON configuration is not valid",
			8: "InvalidExceptionSelected: exception id does not exist",
			9: "DbNameMissing: missing the name of the database"
	};
	
	if (chain instanceof String) {
		throw "[Exception]: " + chain;
	} else {
		if (!jQuery.inArray(chain, exceptionListe)) {
			new JPNException(8);
		} else {
			throw "[Exception]: "+exceptionListe[chain];
		}
	}
};

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

/**
 * Manager d'un ensemble de configuration pour les objectStore d'une
 * base de donnée. Le modèle géré est standard 
 * {
 *	name: "nom_config",
 *	objectStore: "nom_object_store",
 *	state: new Array([propriete1, propriete2, ...]),
 *	primary: "nom_cle_primaire",
 *	foreign: new Array(
 *		[
 *			new Array("nom_propriete_foreign", "one | many" ),
 *			...
 *		]
 *	  )
 * }
 * @param dbname le nom de la base de donnée à créer
 * @return configuration de JPN à associer avec les DAO
 */
function JPNConfigurationManager(dbname) {

	
	/** Nom de la base de donnée */
	if (dbname) {
		this._dbname = dbname;
	} else {
		new JPNException(9);	
	}

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
			if (this.isValid(description)) {
				this._objectStores.push(description);
			} else {
				new JPNException(7);
			}
		}
	};

	
	/**
	 * Indique si la configuration passée en paramêtre est correct au vue 
	 * de la structure JSON attendue.
	 * @param config le json de configuration
	 * @return true/false si le fichier est correct.
	 */
	this.isValid = function(configuration) {
		if (configuration.name && configuration.objectStore &&
			configuration.state && configuration.primary
			&& configuration.state instanceof Array &&
			( configuration.foreign == null || configuration.foreign instanceof Array)) {
			if ((configuration.foreign instanceof Array) 
				 && jQuery.inArray(configuration.primary, configuration.state)) {
				var i;
				for (var i = 0; i < configuration.foreign.length
						&& (configuration.foreign[i][1] == "many" 
						|| configuration.foreign[i][1] == "one")
						&& jQuery.inArray(configuration[i][0], configuration.state); 
					i++);
				return i == configuration.foreign.length;
			}
			return true;
		}
		
		return false;
	};
	
	/**
	 * @return le nom de la base de donnée concerné par cette configuation
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

/**
 * Data Access Object sur la base de donnée qu'identifie
 * la configuration.
 * @param configuration de la base de donnée
 * @return dao sur la base de donnée objet 
 */
function JPNDao(configuration) {

	/** Configuration manager de la DAO */
	this.manager = configuration;

	/** Instance unique de la base de donnée courante */
	this.instance = null;

	/** prototype */
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
		$.when(this.getInstance()).done(function(db) {
			console.log(db);
			var aAjouter = new Array();
			for (var i = 0; i < self.manager._objectStores.length; i++) {
				if (!db.objectStoreNames.contains(self.manager._objectStores[i].objectStore)) {
					aAjouter.push(self.manager._objectStores[i].objectStore);
				}
			}

			if (aAjouter.length > 0) {
				var version = db.version + 1;
				db.close();
				var request = window.indexedDB.open(self.manager.getDbName() , version);
				request.onupgradeneeded = function(event) {
					console.log("Nouvel objectStore");
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
	 * @return promesse de création d'une instance de base de donnée ouverte
	 */
	this.getInstance = function() {
		var deferred = $.Deferred();
		if (this.instance instanceof IDBDatabase) {
			deferred.resolve(this.instance);
		} else {
			var openRequest = window.indexedDB.open(this.manager.getDbName());
			openRequest.onupgradeneeded = function(event) {
				console.log("Nouvel objectStore");
				this.instance = event.target.result;
				console.log(self.manager);
				for (var i = 0; i < self.manager._objectStores.length; i++) {
					this.instance.createObjectStore(self.manager._objectStores[i].objectStore, {
						keypath: self.manager._objectStores[i].primary, 
						autoIncrement: true
					}).createIndex(self.manager._objectStores[i].primary,
								 self.manager._objectStores[i].primary, { unique: true });
					console.log("Création de " + self.manager._objectStores[i].objectStore 
							+ " avec pour clé " + self.manager._objectStores[i].primary);
				}
				deferred.resolve(this.instance);			
			}; 
			openRequest.onsuccess = function(event) {
				this.instance = event.target.result;
				deferred.resolve(this.instance);	
			};
			openRequest.onerror = function(event) {
				new JPNException(6);
			};
		}
		return deferred.promise();
	};

	/**
	 * Vide un object store de l'ensemble des objets 
	 * présents.
	 * @param name le nom de l'object store à vider
	 */
	this.clear = function(name) {
		$.when(this.getInstance().then(function(db) {
			var conf = self.manager.get(name);
			if (conf == null) {
				new JPNException(2);
			}

			var objectStoreName = conf.objectStore;
			var request = db.transaction([objectStoreName], "readwrite");
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
					if (object[conf.foreign[i][0]] != null) {
						// gestion des clés one to one
						if (conf.foreign[i][1] == "one") {
							var osForeign = conf.foreign[i][0];
							var FConf = self.manager.get(conf.foreign[i][0]);
							var fObject = object[osForeign];
							// Si la clé n'existe pas 
	
							self.add(osForeign, fObject);
							object[osForeign] = fObject[FConf['primary']];
						} 
						// Gestion des clés many
						else if (conf.foreign[i][1] == "many") {
							//TODO
						} 
					}
				}
		
				var storageRequest = db.transaction([objectStoreName], "readwrite");
				var storage = storageRequest.objectStore(objectStoreName);
				storage.put(object);
				console.log(object);
				storageRequest.oncomplete = function(event) {
					console.log("Succès de l'ajout de l'objet dans " + objectStoreName);
				};

				storageRequest.onerror = function() {
					new JPNException(5);
				};
			} else {
				
				var storageRequest = db.transaction([objectStoreName], "readwrite");
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
		$.when(self.getInstance()).then(function(db) {
			var conf = self.manager.get(name);
			if (conf == null) {
				new JPNException(2);
			}

			var transact = db.transaction([conf.objectStore], "readonly");
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
			request.onerror = self._defaultErrorLog;
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
		$.when(this.getInstance()).then(function(db) {
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

				var transact = db.transaction([fConf.objectStore], "readonly");
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
				request.onerror = self._defaultErrorLog;
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
		$.when(self.getInstance()).then(function(db){
			var conf = self.manager.get(name);
			if (conf == null) {
				new JPNException(2);
			}

			var objectStore = db.transaction([conf.objectStore], "readonly").objectStore(conf.objectStore);
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
					};
				};
			};
			
			cur.onerror = self._defaultErrorLog;
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



/**
 * Filtre de recherche pour les données de selection JPN
 * @returns un filtre sur les données extraites
 */
function JPNFiltre() {

	/* 
	 * Contraintes ajoutées sur les attributs de l'objet
	 */
	this._criteresEt = new Array();
	/* 
	 * Contraintes ajoutées sur les attributs des sous-objets de l'objet
	 */
	this._criteresFo = new Array();
	/* 
	 * Contraintes sur les attributs tableaux des sous-objets de l'objet
	 */
	this._criteresFac = new Array();

	/**
	 * Ajoute une contrainte sur un attribut de l'objet
	 * @param att l'attribut sélectionné
	 * @param ope l'opérateur de la contrainte ( = | != | > | < | >= | <= )
	 * @param val la valeur de la contrainte
	 */
	this.where = function(att, ope, val) {
		this._criteresEt.push({ champ : att, operateur : ope, valeur : val });
	};

	/**
	 * Ajoute une contrainte sur un attribut d'une cle etrangere de l'objet
	 * @param fo  l'attribut clé étrangère de l'objet
	 * @param att l'attribut de la clé étrangère sélectionné
	 * @param ope l'opérateur de la contrainte ( = | != | > | < | >= | <= )
	 * @param val la valeur de la contrainte
	 */
	this.where_foreign = function(fo, att, ope, val) {
		this._criteresFo.push({ foreign :fo, champ : att, operateur : ope, valeur : val });
	};

	/**
	 * Ajoute une contrainte sur un attribut d'une cle etrangere de l'objet
	 * @param fo  l'attribut clé étrangère de l'objet
	 * @param tab l'attribut tableau de la clé étrangère sélectionné
	 * @param att l'attribut interne du tableau
	 * @param val la valeur qui doit être contenu
	 */
	this.where_foreign_array_contain = function(fo, tab, att, val) {
		this._criteresFac.push({ foreign : fo, tableau : tab, champ : att, valeur : val });
	};

	Array.prototype.contains = function(obj) {
		var i;
		for ( i = 0; ( i<this.length ) && !( this[i]===obj ); i++);
		return i!=this.length;
	}

	/**
	 * Vérifie que l'objet passé en arguments respecte
	 * toutes les contraintes ajoutées au filtre
	 * @param filtre le filtre courant (utilisé pour appel dans callbacks)
	 * @param aVerifier l'objet à vérifier
	 * @return true si l'objet répond à toutes les contraintes, false sinon
	 */
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
			case '!=' :
				//
				if (aVerifier[ss_filtre.champ] == ss_filtre.valeur) {
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
			case '!=' :
				//
				if (aVerifier[ss_filtre.foreign][ss_filtre.champ] == ss_filtre.valeur) {
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

		// si l'objet correspond à tous les critères
		return true;

	};


}
