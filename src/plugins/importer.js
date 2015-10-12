game.module(
	'plugins.importer'
)
.require(
	'plugins.model'
).body(function(){
	game.createClass('Importer',{
		init: function(type,path){
			switch(type){
				case "GeoJson":
					this.models=new game.GeoJsonImporter(path).getModels();
					break;
				default:
					throw new Error("Data format not supported")
			}
		},

		getModels: function(){
			return this.models;
		}
	});

	game.createClass('GeoJsonImporter',{
		init: function(path){
			this.data=game.getJSON(path);
			},
			
		getModels: function(){
			console.log(this.data);
			switch(this.data.type){
				case "Point":
					return new game.GisData().createFromObj(this.data);
					break;
				case "LineString":
					return new game.GisData().createFromObj(this.data);
					break;
				case "Polygon":
					return new game.GisData().createFromObj(this.data);
					break;
				case "MultiPoint":
					throw new Error('MultiPoints are not supported by this prototype')
					break;
				case "MultiLineString":
					throw new Error('MultiLineStrings are not supported by this prototype')
					break;
				case "MultiPolygon":
					throw new Error('MultiPolygons are not supported by this prototype')
					break;
				case "Feature":
					var model= new game.GisData().createFromObj(this.data);
					break;
				case "FeatureCollection":
				var models=[];
					for(var x=0,cf=this.data.features.length;x<cf;x++){
						models.push(new game.GisData().createFromObj(this.data.features[x]));
					}
					return models
					break;
				case "GeometryCollection":
					throw new Error('GeometryCollection are not supported by this prototype')
					break;
				default:
					throw new Error("Unknown geometry type. Just SimpleFeature geometries are support")
			}
		}
	});
});
