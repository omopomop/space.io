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
	var self = {
		x:Math.floor(Math.random()*300)+10,
		y:Math.floor(Math.random()*300)+10,
		spdX:0,
		spdY:0,
		id:"",
	}
	self.update = function(){
		self.x += self.spdX;
		self.y += self.spdY;
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

setInterval(function(){
	var pack = Player.update();
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions',pack);
	}
},1000/25);
