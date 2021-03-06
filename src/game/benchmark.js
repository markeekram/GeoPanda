game.module(
'game.benchmark'
).
require(
'plugins.model',
'plugins.view',
'plugins.controller'
).body(function(){
game.createScene('Main',{
  backgroundColor: 0xF1EEE8,
  interactive: true,
  init: function(){
    this.vertexCountL=[3,5,10,15,20,30,50];
    this.geometryCountL=[10,25,50,100,150,200];
    this.radiusL=[1];
    this.countV=0;
    this.countG=0;

    var map=new game.Map("EPSG:4326");
    this.Box2Dworld = new game.Box2D.World(new game.Box2D.Vec2(0,-9), true);
    this.layer=new game.Layer("BenchmarkLayer","EPSG:4326");
    var style= new game.Style(true,1,'0xFFFFFF',1,'0x2E3436',0.5);

    var lineVertex=[[0,100],[0,0],[100,0],[100,100],[0,100]];
    var linemodel=new game.GisData(4326,"LineString",lineVertex,style);
    linemodel.physic.bodyDef.type=game.Box2D.Body.b2_staticBody;
    linemodel.physic.fixtureDef.filter.groupIndex=1
    
    this.layer.drawObj(linemodel);
    this.layer.addHitArea(linemodel);
    this.layer.addPhysics(linemodel);

    this.benchmark(this.vertexCountL[0],this.geometryCountL[0],this.radiusL[0]);

    map.addLayer(this.layer);

  },

  clearStage: function(){
    for(var c=this.layer.children.length-1;c>=1;c--){
      this.Box2Dworld.DestroyBody(this.layer.children[c].body);
      this.layer.removeChild(this.layer.children[c]);
    }
  },

  benchmark: function(vertex,geom,radius){
    this.clearStage();

    var style= new game.Style(true,1,'0xFFFFFF',1,'0x2E3436',0.5);
    this.geomtryCount=geom; 
    this.vertexCount=vertex; 
    this.radius=radius; 

    var vertex=this.makeConvexPolygon(this.vertexCount,this.radius);

    var model=new game.GisData(4326,"Polygon",vertex,style,null);
    model.physic.bodyDef.type=game.Box2D.Body.b2_dynamicBody
    model.physic.bodyDef.bullet=true
    model.physic.fixtureDef.density =1
    model.physic.fixtureDef.friction =0.5
    model.physic.fixtureDef.restitution =1
    model.physic.fixtureDef.filter.groupIndex=1
    for(var c=0; c < this.geomtryCount; c++){
      model.label="label "+c;
      this.layer.drawObj(model);
      this.layer.addHitArea(model);
      this.layer.addPhysics(model);
    }
    for(var c=0; c < model.observer.length; c++){
        var position = new game.Box2D.Vec2(Math.random()*100,95);
        var angle=Math.random()*Math.PI;
        model.observer[c].body.SetPositionAndAngle(position,angle);
     }

  },

  makeConvexPolygon: function(vertexC,radius){
    var phi=(2*Math.PI)/vertexC;
    var vertex=[]
    for(var c=1;c<=vertexC;c++){
      var x=radius*Math.cos(c*phi);
      var y=radius*Math.sin(c*phi);
      vertex.push([x,y]);
    }
    vertex.push(vertex[0]);
    return [vertex]
  },

  update: function(){
    if(game.system.debug.fpsl.length>100){
      var data=JSON.stringify({'vertexCount':this.vertexCountL[this.countV],
      'geomCount': this.geometryCountL[this.countG],
      'fps':game.system.debug.fpsl});
      var url = 'data:text/json;charset=utf8,' + encodeURIComponent(data);
      window.open(url, '_blank');
      game.system.debug.fpsl=[];
      this.countV++;
      if(this.countV >= this.vertexCountL.length-1){
        this.countV=0;
        this.countG++;
      }
      this.benchmark(this.vertexCountL[this.countV],this.geometryCountL[this.countG],this.radiusL);

      }
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
