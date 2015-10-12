game.module(
	'game.phytest'
)
.require(
	//'engine.core',
	'engine.pixi',
	'plugins.model',
	'plugins.controller',
	'plugins.view',
	'plugins.importer'
).body(function(){
game.createScene('Main',{
	backgroundColor: 0xF1EEE8,
	alpha: 0.5,
	interactive: true,
	init: function(){
		var debug=game.Box2D.DebugDraw
    var map=new game.Map("EPSG:4326");
    this.Box2Dworld = new game.Box2D.World(new game.Box2D.Vec2(0,0), true);
		var graphic=new game.Graphics()
		graphic.lineStyle(1,'0x000000',1);
		graphic.update2=function(){}
    var style= new game.Style(true,1,'0xFFFFFF',1,'0x2E3436',0.5);
    var coords1=[[[58,78],[62,78],[62,82],[58,82],[58,78]]]
    var coords2=[[[58,40],[60,38],[62,40],[60,42],[58,40]]]
		var coords3=[[[86,60],[88,58],[92,58],[92,62],[88,62],[86,60]]]
		var coords4=[[[28,62],[28,58],[32,58],[34,60],[32,62],[28,62]]]
		var coords5=[[20,100],[20,20],[100,20],[100,100],[25,100]] //[0,-100],
    var model1=new game.GisData(4326,"Polygon",coords1,style,"model1")
    var model2=new game.GisData(4326,"Polygon",coords2,style,"model2")
		var model3=new game.GisData(4326,"Polygon",coords3,style,"model3")
		var model4=new game.GisData(4326,"Polygon",coords4,style,"model4")
		var model5 = new game.GisData(4326,"Point",[60,60],style,"model3")
		var model6 = new game.GisData(4326,"LineString",coords5,{},"model6")
		model1.physic.bodyDef.type=game.Box2D.Body.b2_dynamicBody
		model1.physic.bodyDef.bullet=true
		model1.physic.fixtureDef.density =1
		model1.physic.fixtureDef.friction =0.5
		model1.physic.fixtureDef.restitution =0.2
		model1.physic.fixtureDef.filter.groupIndex=1
		model2.physic.bodyDef.type=game.Box2D.Body.b2_dynamicBody
		model2.physic.bodyDef.bullet=true
		model2.physic.fixtureDef.density =1
		model2.physic.fixtureDef.friction =0.5
		model2.physic.fixtureDef.restitution =0.2
		model2.physic.fixtureDef.filter.groupIndex=1
		model3.physic.bodyDef.type=game.Box2D.Body.b2_dynamicBody
		model3.physic.bodyDef.bullet=true
		model3.physic.fixtureDef.density =10
		model3.physic.fixtureDef.friction =0.7
		model3.physic.fixtureDef.restitution =1
		model3.physic.fixtureDef.filter.groupIndex=1
		model4.physic.bodyDef.type=game.Box2D.Body.b2_dynamicBody
		model4.physic.bodyDef.bullet=true
		model4.physic.fixtureDef.density =10
		model4.physic.fixtureDef.friction =0.7
		model4.physic.fixtureDef.restitution =1
		model4.physic.fixtureDef.filter.groupIndex=1
		model5.physic.bodyDef.type=game.Box2D.Body.b2_kinematicBody
		model5.physic.bodyDef.linearVelocity=new game.Box2D.Vec2(0,5);
		model6.physic.bodyDef.type=game.Box2D.Body.b2_staticBody
		model6.physic.bodyDef.bullet=true
		model6.physic.fixtureDef.density =5
		model6.physic.fixtureDef.friction =0.7
		model6.physic.fixtureDef.restitution =1
		model6.physic.fixtureDef.filter.groupIndex=1
    var layer=new game.Layer("PhysikTestLayer","EPSG:4326")
		layer.addChild(graphic)
    layer.drawObj(model1)
		layer.addHitArea(model1)
		layer.addPhysics(model1)
		layer.drawObj(model2)
		layer.addHitArea(model2)
		layer.addPhysics(model2)
		layer.drawObj(model3)
		layer.addHitArea(model3)
		layer.addPhysics(model3)
		layer.drawObj(model4)
		layer.addHitArea(model4)
		layer.addPhysics(model4)
    layer.drawObj(model5)
		layer.addHitArea(model5,2,"meter")
		layer.addPhysics(model5)
		layer.drawObj(model6)
		layer.addHitArea(model6)
		layer.addPhysics(model6)
		layer.children[model5.index].graphicsData[0].shape.radius=2;
		layer.children[model1.index].click=function(){
					this.body.ApplyImpulse(new game.Box2D.Vec2(0,-500),this.body.GetPosition());
		}
		layer.children[model2.index].click=function(){
			this.body.ApplyImpulse(new game.Box2D.Vec2(0,500),this.body.GetPosition());
		}
		layer.children[model3.index].click=function(){
			this.body.ApplyImpulse(new game.Box2D.Vec2(0,-500),this.body.GetPosition());
		}
		layer.children[model4.index].click=function(){
			this.body.ApplyImpulse(new game.Box2D.Vec2(0,500),this.body.GetPosition());
		}
    map.addLayer(layer)
		/*var debugDraw=new game.Box2D.DebugDraw()
		var ctx=document.getElementById("debug").getContext("2d")
		ctx.translate(0,0)
		debugDraw.SetSprite(ctx); //document.getElementById("canvas").getContext("2d")
		debugDraw.m_sprite.graphics = new game.Graphics();
		debugDraw.SetDrawScale(map.scale.x);
		debugDraw.SetFillAlpha(0.5);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(game.Box2D.DebugDraw.e_shapeBit | game.Box2D.DebugDraw.e_pairBit );
		this.Box2Dworld.SetDebugDraw(debugDraw);*/
    },
  	update: function(){
  		this._super();
  		this.Box2Dworld.Step(
  			game.system.delta, //time elapsed game.system.delta
  			6,	//world Velocity Iterations 6
  			2	//world Position Iterations	 6
  		);
			//this.Box2Dworld.DrawDebugData();
  		this.Box2Dworld.ClearForces();
  		this.stage.children[0].update();
  	}
  });
})
