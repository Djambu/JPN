
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
		console.log(this.state.get("name") + ": WOUAF WUOAF");
	};
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

	this.add = function(object) {
		this.dao.add(this.name, object);
	};

	this.getAllTheDog = function(callback) {
		this.dao.get(this.name, function(liste) {
			var chiens = new Array();
			for (var i = 0; i < liste.length; i++) {
				chiens.push(new ChienModel(liste[i]));
			} 
			callback(chiens);
		});
	};
	
	this.clear = function() {
		this.dao.clear(this.name);
	};

}


