/**@module View*/
game.module(
	'plugins.view'
)
.require(
	'engine.pixi',
	'engine.core',
	'plugins.box2d'
).body(function(){
	/**Visual Representation of the GisData;
	* @constructor GisObject
	* @augments game.Graphics
	* @param {GisData} model - GisData which should be drawm
	* @param {Layer} controller - Layer/Controller of the visual Representation
	*/
	game.createClass('GisObject','Graphics',{
		init: function(model,controller){
			this._super();
			this.model=model;
			this.controller=controller;
			this.model.addObserver(this);
		},

		/**Function which gets called if the underlieing GisData-object has changed and the visual reprensetation should be redrawn
		* @function GisObject#update1
		* @param {int} index -  Child index in the layer
		* @param {GisData} model - GisData *?*
		*/
		update1: function(index,model){
			//console.log("Observer Aktiv");
		  this.controller.repaint(model);
		},

		update2: function(){
			//console.log("Update GisObject");
			this.graphicsData[0].lineWidth=(1/(this.controller.supercontroller.scale.x*2))*5
			for(var x=0;x<this.children.length;x++){
				this.children[x].update();
			}
		},

		/**Dummyfunction can be filled with whatever you want
		* @function GisObject#click
		*/
		click: function(event){
			this.graphicsData[0].fill=true;
			this.graphicsData[0].fillColor=0x000000;
			var tween = new game.Tween(this.graphicsData[0]);
			tween.to({fillColor: 16777215 },10000);
			tween.start();
		},

		/**Handles the rightclick on the GisObject and creates the PopUp-menu
		* @function GisObject#rightclick
		* @param {Event} event - Interaction event
		*/
		rightclick: function(event){
			if(this.controller.supercontroller.popupindex > 0){
				game.scene.stage.removeChildAt(this.controller.supercontroller.popupindex);
			}
			this.controller.popupMenu(this.model,this.controller,event.global);
		}
	});
	/**Class which adds the capability to add a label
	* @constructor Label
	* @augments game.PIXI.Text
	* @param {GisData} model - GisData
	* @param {Layer} controller - Layer/Controller
	*/
	game.createClass("Label","Text",{
		init: function(model,controller){
			this._super(model.label,{});
			this.model=model;
			this.controller=controller;
			this.supscale=this.controller.supercontroller.scale.x;
		},

		update: function(){
			var newscale=this.controller.supercontroller.scale.x;
			if(this.supscale != newscale){
				this.scale.set((1/newscale*2),(-1/newscale*2));
				this.supscale=this.scale.x;
			}
		}
	});
	/**Class Popup
	* @constructor PopUp
	* @augments Container
	* @param {GisData} model - DataModel
	* @param {Layer} controller - Layer
	* @param {Container} content - Any type of game.PIXI.Container
	* @param {position} position - Position object {x:X,y:Y}
	*/
	game.createClass("PopUp","Container",{
		init: function(model,controller,content,position){ //model,controller
			this._super();
			var box = new game.Graphics();
			var scont=content.getLocalBounds();
			content.position.set(7,15);
			box.addChild(content);
			box.lineStyle(1,'0x000000',1);
			box.beginFill('0x888A85',1);
			box.drawRect(0,0,scont.width+15,scont.height+30);
			box.position.set(position.x,position.y);
			this.addChild(box);
		}
	});
	/**Visual presentation of an button
	* @constructor Button
	* @augments game.Graphics
	* @param {string} text - Text which should be written on the button
	* @param {object} style - Style object to style the game.PIXI.Text e.g. {font:"1000px Arial",fill:"red"}
	*/
	game.createClass("Button","Graphics",{
		init: function(controller,text,style){
			this._super();
			this.controller=controller;
			this.interactive=true;
			var style=style || {font:"1000px Arial",fill:"red"};
			var text=new game.Text(text,style);
			text.position.set(0,7);
			this.addChild(text);
			this.bsize=text.getBounds();
			this.lineStyle(5,'0x000000',1);
			this.beginFill('0xFFFFFF',1);
			this.drawRect(this.bsize.x,this.bsize.y,this.bsize.width,this.bsize.height);
			this.updateLocalBounds();
		}
	});
	/**Class aggregating buttons to a Menu
	* @constructor Menu
	* @augments Container
	* @param {Button[]} buttons - List of buttons which should be aggregated in the Menu
	* @param {Style} style - Style object
	*/
	game.createClass("Menu","Container",{
		init: function(buttons,style){
			this._super();
			this.maxRect={width:0,height:0};
			for(var x=0,cb=buttons.length;x<cb;x++){
				this.maxRect.width=buttons[x].bsize.width > this.maxRect.width ? buttons[x].bsize.width : this.maxRect.width;
				this.maxRect.height=buttons[x].bsize.height > this.maxRect.height ? buttons[x].bsize.height : this.maxRect.height;
			}
			for(var x=0,cb=buttons.length;x<cb;x++){
				buttons[x].clear();
				buttons[x].lineStyle(style.lineWidth,style.lineColor,style.lineAlpha);
				buttons[x].beginFill(style.fillColor,style.fillAlpha);
				buttons[x].drawRect(0,0,this.maxRect.width,this.maxRect.height);
				buttons[x].position.set(0,x*this.maxRect.height+x*15);
				this.addChild(buttons[x]);
			}
		}
	});
	/**This graphics element is used to edit some graphics elements. Therefore at every vertex of an geometry an EditHandel is
	* drawn. The EditHandel is represented by an circle. Beside that this class provides functions for the interaction with the EditHandel
	* @constructor EditHandel
	* @augments game.Graphics
	* @param {position} coord - position where the EditHandel should be drawn
	* @param {float} radius - Radius of the EditHandel
	* @param {Layer} controller - Layer
	* @param {GisData} model - GisData
	*/
	game.createClass("EditHandel","Graphics",{
		init: function(coord,radius,controller,model){
			this._super();
			this.controller=controller;
			this.model=model;
			this.interactive=true;
			this.offset={x:0,y:0}
			this.draggable=false;
			this.lineStyle(0.0001,0x00FF00,1);
			this.beginFill(0x00ff00,1);
			this.drawCircle(coord[0],coord[1],radius)
		},

		/**Callback mouseover; change color
		* @function EditHandel#mouseover
		*/
		mouseover : function(){
			this.graphicsData[0].lineColor=0xFF00FF;
			this.graphicsData[0].fillColor=0xFF00FF;
			this.dirty=true;
			this.clearDirty=true;
		},

		/**Callback mouseout; change color back
		* @function EditHandel#mouseout
		*/
		mouseout : function(){
			this.graphicsData[0].lineColor=0x00FF00;
			this.graphicsData[0].fillColor=0x00FF00;
			this.dirty=true;
			this.clearDirty=true;
		},

		/**Callback mousedown;Gets the currend position and activates the draggable model
		* @function EditHandel#mousedown
		* @param {Event} e - Interaction event containing information about the current position
		*/
		mousedown : function(e){
			console.dir(e);
			console.log(e.global.x);
			console.log(e.global.y);
			this.offset.x = this.position.x - e.global.x;
			this.offset.y = this.position.y - e.global.y;
			console.log("e.x "+e.global.x+"e.y "+e.global.y);
			this.draggable = true;
		},

		/**Callback mousemove; Keeps the position up to date
		* @function EditHandel#mousemove
		* @param {Event} e - Interaction event
		*/
		mousemove : function(e){
				if (this.draggable) {
				this.position.x=e.global.x + this.offset.x;
				this.position.y=e.global.y + this.offset.y;
				this.dirty=true;
				this.clearDirty=true;
				}
		},

		/**Callback mousup; save movement to model
		* @function EditHandel#mousup
		*/
		mouseup : function(e){
			console.log(e.getLocalPosition(this)); //
			this.controller.disp2coord(this);
			console.log("Draggged");
			console.log(this.position);
			this.draggable = false;
		},

		/**Callback mouseupoutside
		* @function EditHandel#mouseupoutside
		*/
		 mouseupoutside : function(e){
			this.mouseup(e);
		},
		
		update: function(){}
	})
});
