game.module(
	'game.mvc'
)
.require(
	//'engine.core',
	'plugins.model',
	'plugins.controller',
	'plugins.view',
	'plugins.importer'
).body(function(){
game.addAsset('bezirksgrenzen_wien.json');
game.addAsset('autoblands_wien.json');
game.addAsset('polizei_wien.json');
game.createScene('Main',{
	backgroundColor: 0xF1EEE8,
	interactive: true,
	init: function(){
		var paths=['polizei_wien.json',"autoblands_wien.json",'bezirksgrenzen_wien.json'];
		var map=new game.Map("EPSG:4326");
		this.Box2Dworld = new game.Box2D.World(new game.Box2D.Vec2(0,0), false);
		var bodyDef= new game.Box2D.BodyDef();
		var fixtureDef= new game.Box2D.FixtureDef();
		bodyDef.type = game.Box2D.Body.b2_dynamicBody;
		bodyDef.allowSleep=true;
		bodyDef.awake=false;
		fixtureDef.density=5;
		fixtureDef.friction=0.7;
		fixtureDef.restitution=1;
		//Polygon import and visualisation ( plus hitArea,physical body, label)
		var style= new game.Style(true,1,'0xFFFFFF',1,'0x2E3436',0.001);
		console.log(style);
		var bezimporter = new game.Importer("GeoJson",paths[2]); 	//Create Importer for loading Datamodel
		var bezmodel=bezimporter.getModels();		//Get model
		for(var x=0,cm=bezmodel.length;x<cm;x++){
			bezmodel[x].label=bezmodel[x].properties.BEZ_RZ;			//Iterate over model an set some properties
			bezmodel[x].physic.bodyDef=bodyDef;
			bezmodel[x].physic.fixtureDef=fixtureDef;
			bezmodel[x].style=style;
		}
		var bezlayer = new game.Layer("bezirksgrenzen wien","EPSG:4326");       //Create new Layer
		bezlayer.drawObj(bezmodel);		//Draw the GisObjects
		bezlayer.addHitArea(bezmodel,0.01,"meter");		//Add the Hitareas for the GisObjects
		bezlayer.addPhysics(bezmodel);		//Add the physical body
		map.addLayer(bezlayer);		//Add layer to map
		bezlayer.addLabel(bezmodel);
		//LineString/MulitLineString import and visualisation
		var strStyle = new game.Style(false,null,null,1,'0x9AD49A',0.00001);
		var straimporter = new game.Importer("GeoJson",paths[1]);
		var strmodel = straimporter.getModels();
		console.log(strmodel);
		for(var x=0;x<strmodel.length;x++){
			strmodel[x].style=strStyle;
		}
		var strlayer= new game.Layer("autoblands wien","EPSG:4326");
		strlayer.drawObj(strmodel);
		map.addLayer(strlayer)
		//Point import and visualisation
		var poliimporter = new game.Importer("GeoJson",paths[0])
		var polimodel = poliimporter.getModels();
		var polistyle= new game.Style(false,null,null,1,'0x0000FF',0.01)
		for(var x=0,cp=polimodel.length;x<cp;x++){
			polimodel[x].style=polistyle;
		}
		var polilayer= new game.Layer("polizei wien","EPSG:4326");
		polilayer.drawObj(polimodel);
		polilayer.addHitArea(polimodel);
		map.addLayer(polilayer);
		//Determine all policestation within the given polygon and change lineColor and fill to red
		var within = turf.featurecollection([turf.polygon(bezmodel[5].coordinates,{properties: bezmodel[5].properties,index: bezmodel[5].index})]);
		var featurelist=[];
		polimodel.forEach(
			function(v,i,a){
				featurelist.push(turf.point(v.coordinates,{properties: v.properties,index: v.index}))
			}
		);
		var points = turf.featurecollection(featurelist); //game.getJSON(paths[0]); //polilayer.toGeoJsonFeature(polimodel);
		var re= turf.within(points,within);
		console.log(re);
		for(var x=0;x<re.features.length;x++){
			polilayer.children[re.features[x].properties.index].graphicsData[0].lineColor=0xFF0000;
			polilayer.children[re.features[x].properties.index].graphicsData[0].fill=true;
			polilayer.children[re.features[x].properties.index].graphicsData[0].fillColor=0xFF0000;
			polilayer.children[re.features[x].properties.index].clearDirty=true;
			polilayer.children[re.features[x].properties.index].dirty=true;
		}
		bezlayer.children[bezmodel[5].index].click= function(){
			console.log("Kollision");
			console.log(this);
			this.body.ApplyImpulse(new game.Box2D.Vec2(0,0.000001),this.body.GetPosition());
		}
	},
	update: function(){
		this._super();
		this.Box2Dworld.Step(
			game.system.delta, //time elapsed game.system.delta
			6,	//world Velocity Iterations 6
			2	//world Position Iterations	 6
		);
		this.Box2Dworld.ClearForces();
		this.stage.children[0].update();
	}
	});
});
