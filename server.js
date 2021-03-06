// Dependencies.
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

//app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Heroku
app.set('port', (process.env.PORT || 5000))

/*app.listen(app.get('port'), function() {
	console.log(`Bot en fonction sur le port ${app.get('port')}`);
})*/

// Routing
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(app.get('port'), function() {
	console.log('Starting server on port 5000');
});

const canvasBound = {
	min_x : 0,
	max_x : 800,
	min_y : 0,
	max_y : 600
};

let players = {};
let projectiles = [];
io.on('connection', function(socket) {

	socket.on('new player', function() {
		players[socket.id] = {
			x: 300,
			y: 300,
			color: getRandomColor()
		};
	});

	socket.on('movement', function(data) {
		let player = players[socket.id] || {};
		if (data.left) {
			player.x -= 5;
		}
		if (data.up) {
			player.y -= 5;
		}
		if (data.right) {
			player.x += 5;
		}
		if (data.down) {
			player.y += 5;
		}

		if (player.x <= canvasBound.min_x - 10){
			player.x = canvasBound.max_x
		}
		if (player.x >= canvasBound.max_x + 10){
			player.x = canvasBound.min_x
		}
		if (player.y <= canvasBound.min_y - 10){
			player.y = canvasBound.max_y;
		}
		if (player.y >= canvasBound.max_y + 10){
			player.y = canvasBound.min_y;
		}
	});

	socket.on('projectile', function(data) {
		console.log(data);
		projectiles.push({
			pX: players[socket.id].x,
			pY: players[socket.id].y,
      deltaX: data.x - players[socket.id].x,
      deltaY: data.y - players[socket.id].y
		});
	});

	socket.on('rm-all-proj', function() {
		projectiles = [];
	});

	socket.on('disconnect', function(data) {
		console.log('Got disconnect!');
		console.log(players);
		delete players[socket.id];
		console.log(players);
	});


}); // end io connection


setInterval(function() {
	io.sockets.emit('state', players);

	for (let p in projectiles) {
    let magnitude = Math.sqrt(projectiles[p].deltaX * projectiles[p].deltaX + projectiles[p].deltaY * projectiles[p].deltaY);
    projectiles[p].pX += projectiles[p].deltaX * (4 / magnitude);
    projectiles[p].pY += projectiles[p].deltaY * (4 / magnitude);
	}
	io.sockets.emit('projectiles', projectiles);
}, 1000 / 60);


function getRandomColor() {
	let letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}
