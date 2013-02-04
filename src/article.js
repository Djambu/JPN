// JavaScript Document
var config = new JSpNConfigurationManager("appliJPNarticles");
config.add({
  name: "article",
	objectStore: "articledb",
	state: new Array("dateAjout", "titre", "description", "lien"),
	primary: "dateAjout",
	foreign: new Array(
		new Array("lien", "simple")
	)
});
config.add({
	name: "lien",
	objectStore: "liendb",
	state: new Array("site", "url", "tags"),
	primary: "url",
	foreign: null
});

var jpn = new JPNDao(config);
jpn.majDb();

function ArticleModel(description) {
	
	this.state = new JPNModel(description);

	/** Getter */
	this.get = function(key) {
		return this.state.get(key);
	};
	
	/** Setter */
	this.set = function (key, value) {
		this.state.set(key, value);
	};
	
	this.desc = function() {
		return description;
	};
	
}

function LienModel(description) {
	
	this.state = new JPNModel(description);

	/** Getter */
	this.get = function(key) {
		return this.state.get(key);
	};
	
	/** Setter */
	this.set = function (key, value) {
		this.state.set(key, value);
	};
	
}

function DaoLien() {
	this.name = "lien";
	
	this.dao = jpn;
	
	this.getLiens = function(callback) {
		this.dao.get(this.name, function(liste) {
			var liens = new Array();
			for(var i = 0; i < liste.length; i++) {
				lien.push(new LienModel(liste[i]));
			}
			console.log(liens);
			callback(liens);
		});
	};
	
	this.clear = function() {
		this.dao.clear(this.name);
	};	
	
}


function DaoArticle() {

	/** Nom de la configuration associée */
	this.name = "article";

	/** Lien avec la Dao Standard de la base de donnée*/
	this.dao = jpn;

	this.add = function(object) {
		this.dao.add(this.name, object);
	};

	this.getArticles = function(callback) {
		var d = this.dao;
		var n = this.name;
		d.get(this.name, function(liste) {
			for (var i = 0; i < liste.length; i++) {
				d.getForeign(n, 0, liste[i], callback);
			}
		});
	};

	this.getArticlesFiltres = function(filtre, callback) {
		var d = this.dao;
		var n = this.name;
		d.get(this.name, function(liste, filtre) {
			for (var i = 0; i < liste.length; i++) {
				d.getForeign(n, 0, liste[i], function(art, filtre) {
					if (filtre.check(filtre, art)) {
						callback(art);
					}
				}, filtre);
			}
		}, filtre);
	};

	
	this.getById = function(id, callback) {
		this.dao.getByKey(this.name, id, function(objet){
			console.log(objet);
			callback(objet);
		});
	};
	
	this.clear = function() {
		this.dao.clear(this.name);
	};
	
	this.remove = function(key) {
		this.dao.remove(this.name, key);	
	};
}
