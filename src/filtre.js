function FiltreJPN() {

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
