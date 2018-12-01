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
var PLAYER_LIST = {};

var Player = function(id){
	var self = {
		x:Math.floor(Math.random()*300)+10,
		y:Math.floor(Math.random()*300)+10,
		id:id,
		number:""+Math.floor(10*Math.random()),
		rb:false,
		lb:false,
		ub:false,
		db:false,
		maxSpd:10
	}
	self.updatePosition = function(){
		if(self.rb)
			self.x+=self.maxSpd;
		if(self.lb)
			self.x-=self.maxSpd;
		if(self.ub)
			self.y-=self.maxSpd;
		if(self.db)
			self.y+=self.maxSpd;
	}
	
	return self;
}
var io = require('socket.io')(serv,{});
io.sockets.on('connection',function(socket){
	socket.id = Math.random();
	socket.x = 0;
	socket.y = 0;
	SOCKET_LIST[socket.id] = socket;
	
	var player = Player(socket.id);
	PLAYER_LIST[socket.id] = player;
	
	socket.number = ""+Math.floor(10*Math.random());
	
	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
	});
	
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
});

setInterval(function(){
	var pack=[];
	for(var i in PLAYER_LIST){
		var player = PLAYER_LIST[i];
		player.updatePosition();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number
		});
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions',pack);
	}
},1000/25);
