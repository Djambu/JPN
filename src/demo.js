
var config = new JSpNConfigurationManager("JPNTest");
config.add({
	name: "chien",
	objectStore: "chiendb",
	state: new Array("nom", "niche"),
	primary: "nom",
	foreign: new Array(
		new Array("niche", "simple")
	)
});
config.add({
	name: "niche",
	objectStore: "nichedb",
	state: new Array("nom", "size"),
	primary: "nom",
	foreign: null
});

var jpn = new JPNDao(config);
jpn.majDb();


function NicheModel(description) {
	
	/** 
	 * Etat courant d'une niche 
	 * {id, nom, size}
	 */
	this.state = new JPNModel(description);

	/** Getter */
	this.get = function(key) {
		return this.state.get(key);
	};
	
	/** Setter */
	this.set = function (key, value) {
		this.state.set(key, value);
	};
	
	this.giveSize = function() {
		return "Taille de la niche: " + this.state.get("size");
	};
}

function DaoNiche() {
	this.name = "niche";
	
	this.dao = jpn;
	
	this.getNiches = function(callback) {
		this.dao.get(this.name, function(liste) {
			var niches = new Array();
			for(var i = 0; i < liste.length; i++) {
				niches.push(new NicheModel(liste[i]));
			}
			console.log(niches);
			callback(niches);
		});
	};
	
	this.clear = function() {
		this.dao.clear(this.name);
	};
	
	
}


function ChienModel(description) {
	/* Etat issue de la base de donnée  */
	this.state = new JPNModel(description);

	/** Getter */
	this.get = function(key) {
		return this.state.get(key);
	};
	
	/** Setter */
	this.set = function (key, value) {
		this.state.set(key, value);
	};
	
	
	/** Colle un wouaf en console */
	this.sayWouaf = function() {
		console.log(this.state.get("name") + ": WOUAF WUOAF");
	};
}

/**
 * Modèle concret d'accès aux données
 * pour le chien
 */ 
function DaoChien() {

	/** Nom de la configuration associée */
	this.name = "chien";

	/** Lien avec la Dao Standard de la base de donnée*/
	this.dao = jpn;

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
	
	this.getById = function(id, callback) {
		this.dao.getByKey(this.name, id, function(objet){
			console.log(objet);
			//callback(new ChienModel(objet));
		});
	};
	
	this.clear = function() {
		this.dao.clear(this.name);
	};
}


