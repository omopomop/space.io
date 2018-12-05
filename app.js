 // This file is empty.
 var express = require('express');
 var app = express();
 var serv = require('http').Server(app);
 
 app.get('/',function(req,res){
	 res.sendFile(__dirname+'/client/index.html');
 });
 app.use('/client',express.static(__dirname+'/client'));
 serv.listen(1212);

var SOCKET_LIST = {};

var playerCount = 0;
var starCount = 0;
var rocketCount = 0;

var Entity = function(){
	//simple entity containing x and y coordinates, a unique identifier, and its speed
	var self = {
		x:Math.floor(Math.random()*600)+10,
		y:Math.floor(Math.random()*600)+10,
		spdX:0,
		spdY:0,
		id:"",
	}
	//update the position based off speed
	self.update = function(){
		self.x += self.spdX;
		self.y += self.spdY;
	}
	//returns distance between current entity and the passed in object
	self.getDistance = function(obj){
		return Math.sqrt(Math.pow(self.x-obj.x,2)+Math.pow(self.y-obj.y,2))
	}
	
	return self;
	
}

var Rocket = function(id, x2, y2){
	var self = Entity();
	self.id = id;
	self.accelVert = 7;

	
	var super_update = self.update;
	self.update = function(){
		//updates position in entity
		self.accelVert+=10;
		super_update();
	}

	self.getInitPack = function(){
		return{
			id:self.id,
			x:x2,
			y:y2,
		};
	}

	self.getUpdatePack = function(){
		return{
			x:x2,
			y:y2 - self.accelVert,
			id:self.id,
		};
	}
	
	Rocket.list[id] = self;
	initPack.rocket.push(self.getInitPack());
	return self;


}
Rocket.list = {};
Rocket.update = function(){
	var pack=[];
	for(var i in Rocket.list){
		var rocket = Rocket.list[i];
		rocket.update();
		pack.push(rocket.getUpdatePack());
	}
	return pack;
}

var Player = function(id){
	var self = Entity();

	self.id = id;
	self.score = 0;
	self.number = playerCount;
	self.rb = false;
	self.lb = false;
	self.ub = false;
	self.db = false;
	self.maxSpd = 5;
	self.accelHoriz = .2;
	self.accelVert = .2;
	
	var super_update = self.update;
	self.update = function(){
		//updates speed
		self.updateSpd();
		//updates position in entity
		super_update();
	}
	
	self.updateSpd = function(){
		if(self.rb){
			//console.log("RB IS BEING PRESSED");
			self.spdX=self.accelHoriz;
			if(self.accelHoriz<self.maxSpd)
				self.accelHoriz+=.2;
		}	
		else if(self.lb){
			self.spdX = -self.accelHoriz;
			if(self.accelHoriz<self.maxSpd)
				self.accelHoriz+=.2;
		}
		else
			self.spdX = 0;
		
		//keeping acceleration same as long as vertical keys pressed and both horizontal not pressed
		if(!self.lb && !self.rb){
			self.accelHoriz = self.accelVert;
		}
		
		if(self.ub){
			self.spdY = -self.accelVert;
			if(self.accelVert<self.maxSpd)
				self.accelVert+=.2;
		}
		else if(self.db){
			self.spdY = self.accelVert;
			if(self.accelVert<self.maxSpd)
				self.accelVert+=.2;
		}
		else
			self.spdY=0;
		//keeping acceleration same as long as horizontal keys pressed and both vertical not pressed
		if(!self.ub && !self.db){
			self.accelVert = self.accelHoriz;
		}
		//reset accel if nothing pressed
		if(!self.ub && !self.db && !self.rb && !self.lb){
			self.accelHoriz = .2;
			self.accelVert = .2;
		}
		
	}
	self.getInitPack = function(){
		return{
			id:self.id,
			x:self.x,
			y:self.y,
			number:self.number,
			score:self.score,
		};
	}
	self.getUpdatePack = function(){
		return{
			x:self.x,
			y:self.y,
			id:self.id,
			score:self.score,
		};
	}
	Player.list[id] = self;
	initPack.player.push(self.getInitPack());
	return self;
}
Player.list = {};

Player.onConnect = function(socket){
	var player = Player(socket.id);
	playerCount++;
	socket.on('keyPress',function(data){
		
		if(data.inputId==='l'){
			player.lb = data.state;
		}
		else if(data.inputId==='r'){
			player.rb = data.state;
		}
		else if(data.inputId==='u'){
			player.ub = data.state;
		}
		else if(data.inputId==='d'){
			player.db = data.state;
		}else if(data.inputId==='f'){
			var rocket = Rocket(socket.id, player.x+25, player.y-15);
			rocketCount++;
		}
	});
	
	
	
	socket.emit('init',{
		player:Player.fullInit(),
		star:Star.fullInit(),
		rocket:Rocket.fullInit(),
	});
}

Rocket.fullInit = function(){
	var rockets = {};
	for(var i in Rocket.list){
		rockets.push(Rocket.list[i].getInitPack());
	}
	return rockets;
}

Rocket.update = function(){
	var pack=[];
	for(var i in Rocket.list){
		var rocket = Rocket.list[i];
		rocket.update();
		pack.push(rocket.getUpdatePack());
	}
	return pack;
}

Player.fullInit = function(){
	var players = [];
	for(var i in Player.list){
		players.push(Player.list[i].getInitPack());
	}
	return players;
}


Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
	deletePack.player.push(socket.id);
	playerCount--;
}
Player.update = function(){
	var pack=[];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push(player.getUpdatePack());
	}
	return pack;
}
var io = require('socket.io')(serv,{});
io.sockets.on('connection',function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	Player.onConnect(socket);
	
	

	
	socket.number = ""+Math.floor(10*Math.random());
	
	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});
	
	
});
var Star = function(){
	var self = Entity();
	
	self.id = Math.random();
	self.pointmultiplier = 1;
	self.timer = 0;
	self.remove = false;
	var super_update = self.update;
	
	self.update = function(){
		self.updateSpd();
		if(self.timer++>200){
			self.pointmultiplier+=1;
			self.timer = 0;
		}
		super_update();
		
		for(var i in Player.list){
			var player = Player.list[i];
			if(self.getDistance(player) < 20){
				self.remove = true;
				player.score+=self.pointmultiplier;
			}
		}
	}
		
	//gives stars a small jitter
	self.updateSpd = function(){
		var plusOrMinus = Math.round(Math.random()) * 2 - 1;
		self.spdX = plusOrMinus*((Math.random()));
		plusOrMinus = Math.random() < 0.5 ? -1 : 1;
		self.spdY = plusOrMinus *((Math.random()));
	}
	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
		};
	}
	self.getUpdatePack = function(){
		return{
			id:self.id,
			x:self.x,
			y:self.y,
		};
	}
	Star.list[self.id] = self;
	initPack.star.push(self.getInitPack());
	return self;
}
Star.list = {};
Star.fullInit = function(){
	var stars = [];
	for(var i in Star.list){
		stars.push(Star.list[i].getInitPack());
	}
	return stars;
}
Star.update = function(){
	if(Math.random() < .02 && starCount < 30){
		Star();
		starCount++;
	}
	var pack = [];
	for(var i in Star.list){
		var star = Star.list[i];
		star.update();
		if(star.remove){
			//console.log("deleting stars");
			delete Star.list[i];
			deletePack.star.push(star.id);
			starCount--;
		}
		else
			pack.push(star.getUpdatePack());
	}
	return pack;
}
var initPack = {player:[], star:[], rocket: []};
var deletePack = {player:[], star:[], rocket: []};


setInterval(function(){
	var pack = {
		player:Player.update(),
		star:Star.update(),
		rocket:Rocket.update(),
		
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('delete',deletePack);
	}
	for(var i in initPack.player){
		console.log("INIT PLAYER IS "+initPack.player[i].number);
	}
	initPack.player = [];
	initPack.star = [];
	initPack.rocket = [];
	deletePack.player = [];
	deletePack.star = [];
	deletePack.rocket = [];
},1000/25);


