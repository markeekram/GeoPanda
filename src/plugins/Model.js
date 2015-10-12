/**@module Model*/
game.module(
	'plugins.model'
)
.require(
	'engine.pixi',
	'plugins.box2d'
).body(function(){
	/**constructor
	* @constructor GisData
	* @classdesc Class GisData containing all nessary data for building a reprensatation in the GameEngine
	* @param {string} crs - EPSG-Code of the Object
	* @param {string} type - Geomterytype
	* @param {list} coorindates - List of Coordinates; aktually List in List
	* @param {Sytle} style - Style which should be applied on the reprensentation of the Object
	* @param {String} label - Label of the object
	* @param {Object} physic - Object containing the bodeydefinition and the FrixtureDefinition
	* @param {game.PIXI.Geometry} hitArea - Geometry of the HitArea
	*/
	game.createClass('GisData',{
		init: function(crs,type,coordinates,style,label,physic,hitArea){
			this.crs=crs || "EPSG:4326";
			this.type=type || null;
			this.coordinates=coordinates || null;
			this.style=style || new game.Style();
			this.label=label || null;
			this.physic=physic  || {bodyDef: new game.Box2D.BodyDef(),fixtureDef: new game.Box2D.FixtureDef()};
			this.hitArea=hitArea || null;
			this.properties=null;
			this.centroid=null;
			this.popupindex=null;
			this.observer=[];
		},

		/**Adding an observer to the list of observers
		* @function GisData#addObserver
		* @param {Container} obsever - visual reprensentation which is observeing the model
		*/
		addObserver: function(Observer){
			this.observer.push(Observer);
		},

		/**Removes the given observer from the list of observers
		* @function GisData#removeObserver
		* @param {Container} observer - observer which should be removed
		*/
		removeObserver: function(Observer){
			var index=this.observer.indexOf(Observer);
			var re=this.observer[index];
			delete this.observer[index];
			return re;
		},

		/**Notifies all registered observers
		* @function GisData#notify
		* @param {int} index - to be researched
		*/
		notify: function(index){
			//console.log("Notified");
			for(var x=0,cob=this.observer.length;x<cob;x++){
				//console.log(this.observer[x]);
				this.observer[x].update1(index,this);
			}
		},
		
		/**Copys object properties from the given object to the GisData-object if both have the same object attributes.
		* @function GisData#createFromObj
		* @param {object} object - Object which attributes should be copied
		* @return {GisData} - GisData Object
		*/
		createFromObj: function(object){
				for(var x in object){
					if(this.hasOwnProperty(x) && object.hasOwnProperty(x)){
						this[x]=object[x];
					}
				}
				if(object.type == "Feature"){
					for(var x in object.geometry){
						if(this.hasOwnProperty(x) && object.geometry.hasOwnProperty(x)){
							this[x]=object.geometry[x];
						}
					}
				}
		return this;
		}
	});
	/**
	* @constructor Style
	* @classdesc Class containing all necessery parts for a valid style
	* @param {boolean} fill - Determines if object shoudl be fill or not
	* @param {float} fillAlpha - Determines the alpha channel of the graphics [0-1]
	* @param {hex} fillColor - Determines the fillcolor ( hexadezimal 0x000000-0xFFFFFF)
	* @param {float} lineAlpha - Determines the alpha channel of the graphics borderline [0-1]
	* @param {hex} lineColor - Determines the color of the boarderline [0x000000-0xFFFFFF]
	* @param {float} linewidth - Determines the width of the boarderline
	*/
	game.createClass('Style',{
	init: function(fill,fillAlpha,fillColor,lineAlpha,lineColor,lineWidth){
		this.fill=fill || false;
		this.fillAlpha=fillAlpha || 0;
		this.fillColor=fillColor || Math.round(Math.random()* 0xFFFFFF);
		this.lineAlpha=lineAlpha || 1;
		this.lineColor=lineColor || Math.round(Math.random()* 0xFFFFFF);
		this.lineWidth=lineWidth || 0.001;
	}
	});
});
