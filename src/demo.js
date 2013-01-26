window.onload = function() {
    var config = new JSpNConfigurationManager("JPNTest");
    config.add({
	name: "chien",
	objectStore: "chiendb",
	state: new Array("id", "nom", "niche"),
	primary: "id",
	stranger: new Array("niche")
    });

    function ChienModel(description) {
	/* Etat issue de la base de donnée  */
	this.state = new JPNModel(description);

	/** Colle un wouaf en console */
	this.sayWouaf = function() {
	    console.log(state.get(nom) + ": WOUAF WUOAF");
	}
    }
	
    /**
     * Modèle concret d'accès aux données
     * pour le chien
     */ 
    function DaoChien(config) {
    
	/** Nom de la configuration associée */
	this.name = "chien";
	    
	/** Lien avec la Dao Standard de la base de donnée*/
	this.dao = new JPNDao(config);
	  
	/**
	 * Renvois la liste des chiens de la base de données
	 */
	this.getListeChiens = function() {
	    var chiens = new Array();
	    var argSearch = {}

	    var resultSet = this.dao.get(this.name, argSearch);
	    for (var chien in resultSet) {
		chiens.push(new ChienModel(chien));
	    }
	    return chiens;
	}

	this.add = function(object) {
	    this.dao.add(this.name, object);
	}

	this.getAllTheDog = function() {
	    this.dao.get(this.name, {});
	}

    }

    var dao = new DaoChien(config);
    console.log(dao);

    var chienEtat = {
	id: null,
	name: "Maurice",
	niche: "Niche de maurice" 
    }

    dao.add(chienEtat);

    console.log("Fin de la procédure d'ajout d'un simple chien");
    
    dao.getAllTheDog();
}
