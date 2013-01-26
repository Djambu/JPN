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
    var _manager = configuration;
    
    /** Instance unique de la base de donnée */
    var instance = null;
   
 
    /**
     * Gestion d'erreur des intéractions avec IndexedDB
     */ 
    this._defaultErrorLog = function(event) {
	console.log("[Error] " + event);
    };

    /**
     * Appel de la connexion à la base de donnée
     */
    this.execute = function(callback) {
	if (instance == null) {
	    
	    // création de la connexion avec la base de données
	    var requeteConnexion = window.indexedDB.open(_manager.getDbName());
	    // Succes de l'ouverture
	    requeteConnexion.onsuccess = function(event) {
		instance = event.target.result;
		callback(instance);
	    };

	    requeteConnexion.onerror = this._defaultErrorLog; 
	    // si échec instance toujours à null
	} else {
	    callback(instance);
	}
    };

        	
    /**
     * Ajout d'un objet dans la base de donnée s
     * name   : nom de la configuration
     * object : l'objet à ajouter
     */
    this.add = function(name, object) {
        // récupération de la configuration correspondante à l'objet à ajouter
        this.execute(function(db) {
	    
	    // Récupération de la configuration
	    var conf = _manager.get(name);
	    if (conf == null) {
		throw "Absence de configuration pour ce type d'objet";
	    }
	    
	    var objectStoreName = conf.objectStore;
	    console.log("Nom de l'OStore selectionné: " + objectStoreName);
	    
	    // Si l'objectStore n'est pas accessible
	    if (!db.objectStoreNames.contains(objectStoreName)) {
		console.log("Création de l'object store: " + objectStoreName);
		// Changement de version
		var version = db.version + 1;
		db.close();
		
		var request = window.indexedDB.open(_manager.getDbName(), version);
		request.onupgradeneeded = function(event) {
		    db = event.target.result;
		    db.createObjectStore(objectStoreName, {
			keypath: conf.primary, 
			autoIncrement: true
		    });
		    console.log("Création d'un nouvel ObjectStore");
		};
	    }
	    console.log(db);
	    console.log("Préparation de la transaction");

	    /**
	     * TODO INSERTION DES STRANGERS
	     */

	    var storageRequest = db.transaction([objectStoreName], "readwrite");
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
    this.get = function(name, search) {
	var list = new Array();
	this.execute(function(db) {
	    console.log("Requete selective sur "+_manager.get(name).objectStore);
	    var request = db.transaction([_manager.get(name).objectStore], "readonly");
	    var store = request.objectStore(_manager.get(name).objectStore);
	    var keyrange = IDBKeyRange.lowerBound(0);
	    var cursorRequest = store.openCursor(keyrange);
	    
	    console.log("waiting for the onsuccess");
	    cursorRequest.onsucccess = function(event) {
		var resultSet = event.target.result;
		console.log("jeu de donnée: " + resultSet);
	    };
	    cursorRequest.onerror = this._defaultErrorLog;

	});
	// TODO Récupération de l'objet depuis la session ou la base de donnée
	
	// Récupération des objets de la base de donnée name
	
	// Application des filtres de données
	
	// retour d'une liste de valeurs
	return list;
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
	
    };
    
}


