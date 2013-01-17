/**
 * Un modèle abstrait est une construction simpliste basée sur le souhait
 * que le développeur la réutilisant hérite de sa structure pour mettre 
 * en place un modèle qui lui est propre au sein duquel un ensemble de 
 * donnée en JSoN seront contenu et accessibles. 
 */
function ModelJSpN(state) {
    
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


function JSpNConfigurationManager() {
    
    /** Liste des configurations stockées dans le Manager*/
    this._objectStores = new Array();
    
    
    /**
     * Ajout d'une configuration dans le manager
     */
    this.add = function(description) {
	// TODO ajouter la description à la liste
    };
    
    /**
     * Récupération de la configuration fonction
     * de l'id pour laquelle elle est référencé dans 
     * la configuration
     */
    this.get = function(id) {
	// TODO la récupération de la configuration
    };
}


function JSpNDao(configuration) {
    
    /** Configuration manager de la DAO */
    this._manager = configuration;
    
    /** Instance unique de la base de donnée */
    this._instance = null;
    
    /**
     * Appel de la connexion à la base de donnée
     */
    this.getInstance = function() {
	if (this._instance == null) {
		// TODO création de la connexion avec la base de données
		var requeteConnexion = window.indexedDB.open("catalogueJPN");
		// Succes de l'ouverture
		requeteConnexion.onsuccess = function(event) {
			 this._instance = event.target.result;
		};
		// si échec instance toujours à null
	}
	return this._instance;
	
    };
    
    /**
     * Recherche d'un ensemble d'élements relativement
     * aux critère des recherche de l'élément de recherche
     * que l'on passe en paramêtre
     */
    this.get = function(name, search) {
	// TODO Récupération de l'objet depuis la session ou la base de donnée
	
	// Récupération des objets de la base de donnée name
	
	// Application des filtres de données
	
	// retour d'une liste de valeurs
	
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



