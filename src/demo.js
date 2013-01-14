window.onload = function() {
    var config = new JSpNConfigurationManager();
    config.add({
	name: "chien",
	objectStore: "chiendb",
	state: new Array("id", "nom", "niche"),
	primary: "id",
	stranger: new Array("niche")
    });
    var dao = new JSpNDao(config);

	
    /**
     * Modèle concret d'accès aux données
     */ 
    function DaoConcrete() {
    
	/** Nom de la configuration associée */
	this._name = "chien";
	    
	/** Lien avec la Dao Standard de la base de donnée*/
	this._dao = dao;
	  
	/**
	 * Renvois la liste des chiens de la base de données
	 */
	this.getListeChiens = function() {
	    var search = {};
	    var chiens = new Array();
	    for chien in this._dao.get(search) {
		chiens.push(new ChienModel(chien));
	    }
	    return chiens;
	}

    }
}
