/**@module Controller*/
game.module(
	'plugins.controller'
)
.require(
	'engine.pixi',
	'engine.core',
	'plugins.box2d',
	'plugins.view',
	'plugins.model'
).body(function(){
	/**
	* @constructor Layer
	* @augments Container
	* @classdesc All objects with the same thematic background should be grouped in one layer.
	* Beside that this class is playing the roll of the controller in the MVC-Architectur.
	* @param {string} name - Name of the Layer
	* @param {string} crs - Coordinate referenc system of the GI-data represented in this layer.
	*/
	game.createClass('Layer','Container',{

		init: function(name,crs){
			this._super();
			this.name=name;
			this.supercontroller;
			this.crs=crs;
			this.interactive=true;
		},

		addObj2Lay: function(GisData){
			if(GisData.length != undefined){
				for(var x=0,cd=GisData.length;x<cd;x++){
					this.addObj2Lay(GisData[x]);
				}
			 return;
			}
			if(this.crs != GisData.crs){
				GisData.coordinates=GisData.coordinates.tranform(GisData.coordinates,GisData.crs,this.crs);
			}
			this.drawObj(GisData);
			this.addHitArea(GisData);
		},

		/**Construct GisObject from given GisData; Used if model got updated
		* @function Layer#repaint
		* @param {GisData} model - GisData-Object which should be repainted
		* @return void
		*/
		repaint: function(model){
			console.log("Repaint");
			console.dir(model);
			this.removeChildAt(model.index);
			this.drawObj(model);
			this.addHitArea(model);
			this.addPhysics(model);
			this.addLabel(model);
		},

		/**Transfroms Coordinates from the source referecnsystenm to the destination referencsysten by useing proj4-library
		* @function Layer#transform
		* @param {coordinates[]} coordinates - List of coordintas [[x,y],[x,y]...]
		* @param {string} from - referencsystem of Coordinates
		* @param {string} to - referencsystem coordinates should be transformed to
		* @return {coordinates[]} coordinates - transformed coordintas
		*/
		transform: function(GisData,from,to){
			for(var x=0,cp=GisData.coordinates.length;x<cc;x++){
				if(GisData.coordinates[x][0] instanceof Number && GisData.coordinates[x].length == 2){
					GisData.coordinates=proj4(from,to,GisData.coordinates[x]);
				}
				else{
					for(var y=0,cep=GisData.coordinates[x].length;y<cep;y++){
						if(GisData.coordinates[x][0] instanceof Number && GisData.coordinates[x].length == 2){
						GisData.coordinates[x][y]=proj4(from,to,GisData.coordinates[x][y]);
						}
						else{
							for(var z=0,cip=GisData.coordinates[x][y].length;z<cip;z++){
								GisData.coordinates[x][x][z]=proj4(from,to,GisData.coordinates[x][y][z]);
							}
						}
					}
				}
			}
		},

		/**Creates a new visual representation of model/models ( GeoObject) and adds it to the layer; Draws a game.PIXI.Graphics
		* @function Layer#drawObj
		* @param model: datamodel; single item or aggregation of models in list []
		* @return void
		*/
		drawObj: function(model){
			if( model.length != undefined){		//check for multiple models
				for(var x=0,cgd=model.length;x<cgd;x++){
					this.drawObj(model[x]);  	//recursion
				}
				return;
			}
			var view = new game.GisObject(model,this);		//new visual represention
			view.lineStyle(model.style.lineWidth,model.style.lineColor,model.style.lineAlpha); //set lineproperties: width,color,alpha-channel
			if(model.style.fill){
			view.beginFill(model.style.fillColor,model.style.fillAlpha);	//set fillproperties: color,aplha
			}
			switch(model.type){
				case "Point":
					view.drawCircle(model.coordinates[0],model.coordinates[1],0.001);	//Points are represented by circles
					break;
				case "LineString":
					view.moveTo(model.coordinates[0][0],model.coordinates[0][1]);	//move to startpoint of linestring
					for(var x=1,cp=model.coordinates.length;x<cp;x++){
						view.lineTo(model.coordinates[x][0],model.coordinates[x][1]);	//continue line
					}
					break;
				case "Polygon":
					var cumx=0;
					var cumy=0;
					model.centroid=[]
					for(var k=0,cp=model.coordinates.length;k<cp;k++){
						for(var p = 0,cc=model.coordinates[k].length;p<cc;p++){
							cumx+=model.coordinates[k][p][0]
							cumy+=model.coordinates[k][p][1]	//iterate through coordinate array
						}
						model.centroid[k]={x:cumx/model.coordinates[k].length,y:cumy/model.coordinates[k].length}
						model.physic.bodyDef.position=model.centroid[k]
						view.position=model.centroid[k]
						cumx=0
						cumy=0		// last entry should be same as first entry
					}
					for(var y=0,cp=model.coordinates.length;y<cp;y++){
						view.moveTo(model.coordinates[y][0][0]-model.centroid[y].x,model.coordinates[y][0][1]-model.centroid[y].y);     //move to startpoint
						for(var x = 1,cc =model.coordinates[y].length;x<cc;x++){
							view.lineTo(model.coordinates[y][x][0]-model.centroid[y].x,model.coordinates[y][x][1]-model.centroid[y].y);   //iterate through coordinate array
						}
					}
					break;
			 case "MultiLineString":
						view.moveTo(model.coordinates[0][0][0],model.coordinates[0][0][1]);	//move to startpoint of linestring
						for(var y=1,cp=model.coordinates[0].length;y<cp;y++){
							view.lineTo(model.coordinates[0][y][0],model.coordinates[0][y][1]);	//continue line
						}
					break;
				default:
					throw new Error("Unknown Type"+model.type);	//Unknown geometry type; throw error
			}
			this.addChild(view);	//add graphics to stage/controller
			model.index = this.getChildIndex(view);		//save child index in model, though you can access view of the model by index
		},

		/**Adds a HitArea to a graphical object,set the interactivity flag to true==> clickable
		* @function Layer#addHitArea
		* @description Point ==>Circle with same radius as visual repr
	  * Linestring ==> Buffer constructed with turf.js turf.buffer(feature,distance,unit); unit=enum{'degree','meter'}
		* Polygon ==> Polygon same dimension as visual repr
		* @param {GisData} model - Datamodel of the object you would like the add the HitArea
		* @param {float} dist - Size of the buffer
		* @param {string} unit - unit of the bufferdistance [meter,foot]
		*/
		addHitArea: function(GisData,dist, unit){
			if( GisData.length != undefined){	//check for multiple models
				for(var x=0,cgd=GisData.length;x<cgd;x++){
					this.addHitArea(GisData[x],dist,unit);	//recursion
				}
				return;
			}
			GisData.hitArea={'dist': dist || 0.001,'unit': unit || 'meter'};
			var graph=this.children[GisData.index];
			graph.interactive = true;
			switch(GisData.type){
				case "Point":
					graph.hitArea= new game.PIXI.Circle(GisData.coordinates[0],GisData.coordinates[1],GisData.hitArea.dist);
					break;
				case "LineString":
					console.log(GisData);
					var feature = this.toGeoJsonFeature(GisData);
					var buffer = turf.buffer(feature,GisData.hitArea.dist,GisData.hitArea.unit);
					var buffercord=[];
					buffer = buffer.features[0].geometry.coordinates[0].forEach(
							function(v,i,o){
								buffercord.push(v[0]);
								buffercord.push(v[1]);
								});
					graph.hitArea = new game.PIXI.Polygon(buffercord);
					break;
				case "Polygon":
					graph.hitArea=new game.PIXI.Polygon(this.children[GisData.index].graphicsData[0].shape.points);
					break;
				default:
					throw new Error("Unknown Type");
			}
		},

		/**Adds the physic properties to GisObject
		* @function Layer#addPhysics
		* @description Create the physical body needed for the dynamics calculation and for the collision system
		* @param {GisData} model -  GisData of object you would physics should be added to.
		*/
		addPhysics: function(model){
			if( model.length != undefined){
				for(var x=0,cgd=model.length;x<cgd;x++){
					this.addPhysics(model[x]);	//recursion
				}
				return;
			}
			if(model.physic.bodyDef && model.physic.fixtureDef){
				switch(model.type){
					case "Point":
						model.physic.fixtureDef.shape = new game.Box2D.CircleShape(2)
						model.physic.bodyDef.position = new game.Box2D.Vec2(model.coordinates[0],model.coordinates[1]);
						var  graphic=this.children[model.index];
						graphic.graphicsData[0].shape.x=0;
						graphic.graphicsData[0].shape.y=0;
						this.createPhysic(model)
						break;
					case "LineString":
							var graphic = this.children[model.index];
							graphic.body=game.scene.Box2Dworld.CreateBody(model.physic.bodyDef);
							graphic.update=function(){
									var p = this.body.GetPosition();
									this.position.x = p.x;// game.Box2D.SCALE;
									this.position.y = p.y; // game.Box2D.SCALE;
									this.rotation=this.body.GetAngle().round(2);
									}
							var coord=[]
							for( var x=0;x<model.coordinates.length-1;x++){

								coord[0]=new game.Box2D.Vec2(model.coordinates[x][0],model.coordinates[x][1])
								coord[1]=new game.Box2D.Vec2(model.coordinates[x+1][0],model.coordinates[x+1][1])

								model.physic.fixtureDef.shape = new game.Box2D.PolygonShape.AsEdge(coord[0],coord[1])
								graphic.body.CreateFixture(model.physic.fixtureDef);
							}
							game.scene.addObject(graphic);
							break;
					case "Polygon":
					    var feature=this.toGeoJsonFeature(model);
					    var cen=turf.centroid(feature);
					    var vec=[];
					    for(var x=0,cp=model.coordinates[0].length-1;x<cp;x++){
					    	vec.push(new game.Box2D.Vec2(model.coordinates[0][x][0]-model.centroid[0].x,model.coordinates[0][x][1]-model.centroid[0].y));
					    }
							model.physic.bodyDef.position=model.centroid[0]
							model.physic.fixtureDef.shape =  new game.Box2D.PolygonShape.AsVector(vec);;
							this.createPhysic(model)
							break;
					default:
							throw new Error("Unknown Type");
					}
			}
			else{
				throw new Error("Please add a BodyDefinition and a FrixtureDefinition to your datamodell!")
			}
		},

		createPhysic: function(model){
			try{
				var graphic = this.children[model.index];
				//console.log(graphic);
				graphic.body=game.scene.Box2Dworld.CreateBody(model.physic.bodyDef);
				graphic.body.CreateFixture(model.physic.fixtureDef);
				graphic.startposition=graphic.body.GetPosition()
				graphic.update=function(){
						var p = this.body.GetPosition();
						this.position.x = p.x;// game.Box2D.SCALE;
						this.position.y = p.y; // game.Box2D.SCALE;
						this.rotation=this.body.GetAngle().round(2);
						}
				game.scene.addObject(graphic);
			}
			catch(e){
				console.log(e.message);
				console.log("You should instanciate new game.Box2D.World(gravity, true)");
			}
		},

		/**Adds the specified label to the layers
		* @function Layer#addLabel
		* @param {GisData} model - GisData
	  * @param {object} style - Object with styling information for the text
		*/
		addLabel: function(model,style){
			if( model.length != undefined){
				for(var x=0,cgd=model.length;x<cgd;x++){   //Rekursioon
					this.addLabel(model[x]);
				}
				return;
			}
			if( model.label != null){
				var text = new game.Label(model,this);
				var style=style || {font:"10px Arial",fill:"red"};
				console.log(model.label);
				text.anchor.set(0.5,0.5);
				text.setStyle(style);
				var scalefactor=this.supercontroller.scale.x/2;
				text.scale.set((1/scalefactor),(-1/scalefactor));
				switch(model.type){
					case "Point":
						text.position.set(model.cooridnates[0],model.coordinates[1]);
						break;
					case "Linestring":
						throw new Error("Adding labels to Linestrings is not supported");
						break;
					case "Polygon":
						if(text.controller.children[model.index].centroid!=null){
							text.position=text.controller.children[model.index].centroid;
						}
						else{
							var feature=this.toGeoJsonFeature(model);
					    	var cen=turf.centroid(feature);
						}
						break;
				}
				text.controller.children[model.index].addChild(text);
			}

		},

		editObj: function(model,object){
			console.log(object);
			for(var x in object){
				if(model.hasOwnProperty(x) && object.hasOwnProperty(x)){
					if(model[x] instanceof Object && object[x] instanceof Object){
						for(var y in object[x]){
							if(model.hasOwnProperty(x) && object.hasOwnProperty(x)){
								model[x][y]=object[x][y];
							}
						}
					}
					else{
						model[x]=object[x]
					}
				}
			}
			this.removeChild(this.children[0]);
			this.drawObj(model);
		},

		/**Change the Style of a GisObject
		* @function Layer#changeStyle
		* @param {GisData} model - GisData
		* @param {Style} Style - Styleobject
		*/
		changeStyle: function(model,Style){
			model.style=null;
			model.style=Style;
			var tmp=this.children[model.index].graphicsData[0];
			for(var x in tmp){
				if(tmp.hasOwnProperty(x) && model.style.hasOwnProperty(x)){
					tmp[x]=model.style[x];
				}
			}
			this.children[model.index].dirty=true;
			this.children[model.index].clearDirty=true;
		},

		/**Converts a GisData object to GeoJson object
		* @function Layer#toGeoJsonFeature
		* @param {GisData} GisData - GisData which should be converted
		* @return {GeoJson}
		*/
		toGeoJsonFeature: function(GisData){
			var GeoJsonF={
				type: "Feature",
				id: Math.random()*10000,
				geometry: {
					type: GisData.type,
					coordinates: GisData.coordinates
				},
				feature: {}
			}
		return GeoJsonF;
		},

		/**Transform a point represented by a list to a point reprensented by a Box2D.Vec2
		* @function Layer#toBox2DVec
		* @param {float[2]} GisDataPoint - Position represented by a list/array [x,y]
		* @return {Box2D.Vec2}
		*/
		toBox2DVec: function(GisDataPoint){
			return  new game.Box2D.Vec2(GisDataPoint[0],GisDataPoint[1]);
		},

		/**Constructs a game.PIXI.Text out of the GisData.properties
		* @function Layer#getPropertiesText
		* @param {GisData} model - GisData
		*/
    getPropertiesText: function(model){
            var text="";
            for(k in model.properties){
                    if(model.properties.hasOwnProperty(k)){
                            text+=k+": "+model.properties[k]+"\n";
                    }
            }
            return new game.PIXI.Text(text);
    },

		/**Creates the popup-Menu if right-clicked
		* @param {GisData} model - model
		* @param {Layer} controller - Layer
		* @param {position} position - Position where the PopUp-menu should be placed
		*/
    popupMenu: function(model,controller,position){
    	if(model.popupindex !=null){
    		return;
    	}
    	console.log(this);
		  var edit = new game.Button(controller,"Edit",{font: "100px Arial",fill: "red"});
			var meta = new game.Button(controller,"Meta",{font: "100px Arial",fill: "red"});
			var close = new game.Button(controller,"Close",{font: "100px Arial",fill: "red"});
			edit.click=function(){
				this.controller.edit(model);
				this.controller.removePopUp(model);
			}
			meta.click=function(){
				this.controller.popupMeta(this.controller,model);
			}
			close.click=function(){
				this.controller.removePopUp(model);
			}
			var style=new game.Style(true,'0xFFFFFF',1,1,'0x000000',0.001);
			var menu=new game.Menu([edit,meta,close],style);
		  var popup=new game.PopUp(model,this,menu,position);
		  game.scene.stage.addChild(popup);
		  model.popupindex=game.scene.stage.getChildIndex(popup);
  },

	/** Create the PopUp-Frame for the metadata representation
	* @function Layer#popupMeta
	* @param {GisData} model - GisData
	*/
  popupMeta: function(controller,model){
    	var mess=this.getPropertiesText(model);
			var close = new game.Button(controller,"Close",{font: "100px Arial",fill: "red"});
			close.click=function(){
				console.log(this);
				this.controller.removePopUp(model);
				console.log("Close");
			}
    	var cont=new game.PopUp(model,this,mess,game.scene.stage.children[model.popupindex].children[0].position);
			cont.addChild(close);
    	this.removePopUp(model);
    	game.scene.stage.addChild(cont);
    	model.popupindex=game.scene.stage.getChildIndex(cont);
    },

	/**Remove the PopUp from the canvas
	* @function Layer#removePopUp
	* @param {GisData} model - GisData
	*/
  removePopUp: function(model){
    	game.scene.stage.removeChild(game.scene.stage.children[model.popupindex]);
    	model.popupindex=null;
    },

	/**Creates the EditHandler
	* @function Layer#edit
	* @param {GisData} model - GisData
	*/
	edit: function(model){
		console.log(model);
		var view = this.children[model.index];
		for(var x = 0,ccoord=model.coordinates[0].length;x<ccoord;x++){
			view.addChildAt(new game.EditHandel([model.coordinates[0][x][0]-model.centroid[0].x,model.coordinates[0][x][1]-model.centroid[0].y],0.0005,this,x),0);
		}
		console.log(view);
	},

	/**Calculates the relative movement of a point and  alters the coordinates
	* @function Layer#disp2coord
	* @param {game.Container} circle - Object form whom you want determine the relative movement
	*/
	disp2coord: function(circle){
		console.log("disp2coord");
		console.log("LocalBounds");
		console.log(this.getLocalBounds());
		var coords=this.worldTransform.applyInverse(circle.position);
		var test= this.worldTransform.applyInverse({x:0,y:0});
		var delta={x: coords.x-test.x,y:coords.y-test.y};
		circle.parent.model.coordinates[0][circle.model][0]+=delta.x
		circle.parent.model.coordinates[0][circle.model][1]+=delta.y
		circle.parent.model.notify(circle.model);
	},

	update: function(){
		for(var y=0;y<this.children.length;y++){
			this.children[y].update2();

		}
	}
});
/**Container for all Layers; Supercontroller of the controller;
* @class Map
* @augments game.Container
* @param {string} crs- Coordinate referencsystem of the Map
*/
game.createClass('Map','Container',{
	init: function(crs){
		this._super();
		this.layers=[]; //Referenc to the the maps child elements
		this.interactive=true;
		this.crs=crs; // CoordinateReferencSystem all the Layers should be displayed with ==> if not equale with layer.crs ==>throw new Error("Transform your Layer to the according Coordinatesystem")
		this.dragable=false;
		this.popupindex;
		this.offset={x:0,y:0};
		game.scene.stage.addChild(this);
		this.hitArea=this.parent.parent.hitArea;
		/**Prevent default behavior on rightclick on canvas
		* @function window#oncentextmenu
		* @param {Event} event - Browser Event
		*/
		window.oncontextmenu=function(event){
			event.preventDefault();
		};

		/**Provides the access to mousewhell and binds the zoom functionality to it
		* @description Firefox
		*/
		window.addEventListener('mousewheel',function(event){
			console.log(event.wheelDelta);
			console.log(game.scene.stage.children[0].scale);
			zoom = function(delta){
				var zoomFactor=game.scene.stage.children[0].scale.x*(0.05);
				if(delta>0){
					game.scene.stage.children[0].scale.x+=zoomFactor;
					game.scene.stage.children[0].scale.y-=zoomFactor;
				}
				else{
					game.scene.stage.children[0].scale.x-=zoomFactor;
					game.scene.stage.children[0].scale.y+=zoomFactor;
				}
				game.scene.stage.children[0].dirty=true;
				game.scene.stage.children[0].clearDirty=true;
			}
			zoom(event.wheelDelta);
		});

		/**Provides the access to mousewhell and binds the zoom functionality to it
		* @description Chrome
		*/
		window.addEventListener('DOMMouseScroll',function(event){
			//console.log(event.wheelDelta);
			//console.log(game.scene.stage.children[0].scale);
			zoom = function(delta){
				var zoomFactor=game.scene.stage.children[0].scale.x*(0.05);
				if(delta>0){
					game.scene.stage.children[0].scale.x+=zoomFactor;
					game.scene.stage.children[0].scale.y-=zoomFactor;
				}
				else{
					game.scene.stage.children[0].scale.x-=zoomFactor;
					game.scene.stage.children[0].scale.y+=zoomFactor;
				}
			}
			zoom(event.detail);
		});
	},

	/**Adds a layer to mapcontainer
	* @function Map#addLayer
	* @param {Layer} layer - Layer to be added to the map
	*/
	addLayer: function(layer){
		if(this.crs != layer.crs){
			throw new Error("Please transform the"+layer.name+"to"+this.crs);
		}
		this.addChild(layer);
		this.zoomToExtent();
		this.layers.push(layer);
		layer.layerindex=this.getChildIndex(layer);
		layer.parentscale=this.scale;
		layer.supercontroller=this;
	},

	/** Get all Layers
	* @function Map#getLayer
	* @return Layer[]
	*/
	getLayer: function(){
		return this.layers
	},

	/**Function which sets the view to the centerpoint of the map and zooms to the full extend
	* @function Map#zoomToExtent
	*/
	zoomToExtent: function(){
			var bg_bounds=this.getLocalBounds();
			//console.log(bg_bounds);
			//console.log(this.getBounds())
			var scalex=game.system.width/bg_bounds.width;
			var scaley=game.system.height/bg_bounds.height
			var layerscale=scalex<scaley?scalex:scaley;
			this.pivot.set((bg_bounds.x+bg_bounds.width/2),(bg_bounds.y+bg_bounds.height/2));
			this.scale.set(layerscale,-layerscale);
			this.position.set(game.system.width/2,game.system.height/2);
	},

	update: function (){
		for(var z=0;z<this.children.length;z++){
			this.children[z].update();
		}
	},

	mousedown: function(event){
		this.dragable=true;
		this.offset.x=this.position.x-event.global.x;
		this.offset.y=this.position.y-event.global.y;
	},

	mousemove: function(event){
		if(this.dragable){
			this.position.set(event.global.x+this.offset.x,event.global.y+this.offset.y);
		}
	},

	mouseup: function(event){
		this.dragable=false;
	},

	mouseupoutside: function(event){
		this.mouseup(event);
	},

	rightclick: function(event1){
		console.log(event1);
		if(event1.target.layers){
		var laybuttons=[];
		var close = new game.Button(this,"Close",{font: "100px Arial",fill: "red"});
		laybuttons.push(close);
		close.click=function(){
				console.log("Close");
				game.scene.stage.removeChildAt(game.scene.stage.children[0].popupindex);
		}
		var layers=this.getLayer();
		for(var x=0;x<layers.length;x++){
			var but=new game.Button(layers[x],layers[x].name,{font: "100px Arial",fill: "red"});
			but.click=function(event){
				if(this.controller.visible){
					this.controller.visible=false;
				}
				else{
					this.controller.visible=true;
				}
			}
			laybuttons.push(but);
		}
		var menu=new game.Menu(laybuttons,new game.Style);
		var pop=new game.PopUp(null,this,menu,event1.global);
		pop.update=function(){}
		game.scene.stage.addChild(pop);
		this.popupindex=game.scene.stage.getChildIndex(pop);
		}
	}
});
});
