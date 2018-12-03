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
var Player = function(id){
	var self = Entity();

	self.id = id;
	self.number = playerCount;
	self.rb = false;
	self.lb = false;
	self.ub = false;
	self.db = false;
	self.maxSpd = 10;
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
	Player.list[id] = self;
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
		}
	});
}
Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
	playerCount--;
}
Player.update = function(){
	var pack=[];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number
		});
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
	var super_update = self.update;
	
	self.update = function(){
		self.updateSpd();
		if(self.timer++>200){
			self.pointmultiplier+=1;
			self.timer = 0;
		}
		super_update();
		
		for(var i in 
	}
		
	//gives stars a small jitter
	self.updateSpd = function(){
		var plusOrMinus = Math.round(Math.random()) * 2 - 1;
		self.spdX = plusOrMinus*((Math.random()));
		plusOrMinus = Math.random() < 0.5 ? -1 : 1;
		self.spdY = plusOrMinus *((Math.random()));
	}
	Star.list[self.id] = self;
	return self;
}
Star.list = {};
Star.update = function(){
	if(Math.random() < .02){
		Star();
	}
	var pack = [];
	for(var i in Star.list){
		var star = Star.list[i];
		star.update();
		pack.push({
			x:star.x,
			y:star.y,
		});
	}
	return pack;
}
setInterval(function(){
	var pack = {
		player:Player.update(),
		star:Star.update(),
		
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions',pack);
	}
},1000/25);


