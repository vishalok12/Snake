var SnakeGame = function(canvas){
	var NORTH = 1,
		EAST = 2,
		SOUTH = 4,
		WEST = 8,
		HEAD = 16,
		TAIL = 32,
		CELL_SIZE = 20,
		PI = Math.PI,
		MAX_X = $('#game-area').width() / 20,
		MAX_Y = $('#game-area').height()  / 20,
		FOOD_GROWTH = 5, //Math.round($('#game-area').height() / 100),
		POINT_INTERVAL = 20,
		POINT_INTERVAL_TURBO = 10,
		POINT_INTERVAL_SHAKE = 100,
		CHANGING = false;
	
	//Get the Canvas drawing context	
	var canvas = $(canvas)[0],
		ctx = canvas.getContext('2d');
		
	var snakeBits = [],				//Position of each bit of snake
		heading,					//Current Heading
		bitsToGrow = FOOD_GROWTH,	//Number of bits left to grow
		timer,						//Game Loop
		food,						//Current Food Position
		turbo,						//Current Turbo Position
		shake,						//Current Shake Position
		gameOver,					//Is game over boolean
		gameSpeed = 100,			//Every 100 ms the snake moves one cell
		currentPoints,
		multiplier,
		shakeTime = 0,
		user;
	
	function bit(x,y){
		return {x: x, y: y};
	};
	
	function startGame(name){
		user = name;
		currentPoints = 0;
		multiplier = 1;
		turboActive = false;
		$('#current-score').html(currentPoints);
		$('#current-multiplier').html('x ' + multiplier);
		gameSpeed = 100;
		POINT_INTERVAL = 20;
		heading = EAST;
		snakeBits.unshift(bit(6,6));
		
		placeFood();
		placeTurbo();
		placeShake();
		
		clearInterval(timer);
		timer = setInterval(gameLoop, gameSpeed); //Every 100 ms the snake moves one cell

		$(document).keydown(function(evt){
			if (CHANGING) {return;}
			else {
				CHANGING = true;
				changeDirection(evt.keyCode);
			}
		});
	};
	
	function placeFood(){
		var x = Math.round(Math.random() * (MAX_X - 1)),
			y = Math.round(Math.random() * (MAX_Y - 1));
		if(inSnake(x,y,true)) return placeFood(); //Check to see if food lands on snake
		food = {x:x, y:y};
	};
	
	function placeTurbo(){
		var x = Math.round(Math.random() * (MAX_X - 1)),
			y = Math.round(Math.random() * (MAX_Y - 1));
		if(inSnake(x,y,true)) return placeTurbo(); //Check to see if turbo lands on snake
		turbo = {x:x, y:y};
	};
	
	function placeShake(){
		var x = Math.round(Math.random() * (MAX_X - 1)),
			y = Math.round(Math.random() * (MAX_Y - 1));
		if(inSnake(x,y,true)) return placeShake(); //Check to see if shake lands on snake
		shake = {x:x, y:y};
	};
	
	function inSnake(x, y, includeHead){
		var length = snakeBits.length,
			i = includeHead ? 0 : 1;
			
		for(; i < length; i++){
			if( x == snakeBits[i].x && y == snakeBits[i].y)
				return true;
		}
		return false;
	};
	
	function gameLoop(){
		if(!gameOver){
			advanceSnake();
			clearCanvas();
			drawSnake();
			drawFood();
			checkCollision();
			if( snakeBits.length >= 20 * multiplier){
				if(turbo.y == -50){
					placeTurbo();
					drawTurbo();
				}
				else{
					drawTurbo();
				}
			}
			else{
				turbo = {x:0, y:-50};
			}
			
			if(Math.round(Math.random() * 300) == 150 || shakeTime > 0){
				if(shakeTime <= 60){
					if(shake.y == -50){
						placeShake();
						drawShake();
					}
					else{
						drawShake();
					}
					shakeTime++;
				}
				else{
					shakeTime = 0;
					shake = {x:0, y:-50};
				}
			}
			
		}
		else{
			clearInterval(timer);
			endGame();
		}
	};
	
	function advanceSnake(){
		var head = snakeBits[0];
		switch(heading){
			case NORTH:
				snakeBits.unshift(bit(head.x, head.y - 1));
				break;
			case SOUTH:
				snakeBits.unshift(bit(head.x, head.y + 1));
				break;
			case EAST:
				snakeBits.unshift(bit(head.x + 1, head.y));
				break;
			case WEST:
				snakeBits.unshift(bit(head.x - 1, head.y));
				break;
		}
		if(0 === bitsToGrow){
			snakeBits.pop();
		}
		else{
			bitsToGrow--;
		}
	};
	
	function checkCollision(){
		var head = snakeBits[0];
		var len = snakeBits.length;
		
		if (head.x == food.x && head.y == food.y){ //check collision with food
			bitsToGrow = FOOD_GROWTH;
			currentPoints += POINT_INTERVAL * multiplier;
			$('#current-score').html(currentPoints);
			placeFood();
		}
		
		if (head.x == turbo.x && head.y == turbo.y){ //check collision with turbo
			multiplier += 1;
			currentPoints += POINT_INTERVAL_TURBO * multiplier;
			$('#current-score').html(currentPoints);
			$('#current-multiplier').html('x ' + multiplier);
			clearInterval(timer);
			timer = setInterval(gameLoop, gameSpeed -= 10);
			placeTurbo();
		}
		
		if (head.x == shake.x && head.y == shake.y){ //check collision with shake
			bitsToGrow = FOOD_GROWTH;
			currentPoints += POINT_INTERVAL_SHAKE * multiplier;
			$('#current-score').html(currentPoints);
			shakeTime = 0;
		}
		
		if (head.x >= canvas.width / CELL_SIZE || head.x < 0 || head.y >= canvas.height / CELL_SIZE || head.y < 0){ //check collision with boundaries
			gameOver = true;
		}
		
		for(var i = 1; i < len; i++){
			if(head.x == snakeBits[i].x && head.y == snakeBits[i].y){
				gameOver = true;
			}
		}
	};
	
	function clearCanvas(){
		ctx.clearRect(0,0, canvas.width, canvas.height);
	};
	
	function drawSnake(){
		var i;
		var length = snakeBits.length;
		for(i = 0; i < length; i++){
			drawBit(snakeBits[i]);
		}
		CHANGING = false;
	};
	
	function drawBit(bit){
		drawInCell(bit.x, bit.y, function(){
			if(bit == snakeBits[0]){
				headX = bit.x;
				headY = bit.y;
				var snakeHead = new Image();
				snakeHead.src = "images/snake-head.png";
			
				if(heading == EAST){
					ctx.translate(20,0);
					ctx.rotate(90 * Math.PI / 180);
					ctx.drawImage(snakeHead,0,0);
					
				}
				else if(heading == SOUTH){
					ctx.translate(20,20);
					ctx.rotate(90 * Math.PI / 90);
					ctx.drawImage(snakeHead,0,0);
				}
				else if(heading == WEST){
					ctx.translate(0,20);
					ctx.rotate(-90 * Math.PI / 180);
					ctx.drawImage(snakeHead,0,0);
				}
				else if(heading == NORTH){
					ctx.drawImage(snakeHead,0,0);
				}
			}

			else{
				ctx.fillStyle = '#6387A6';
				ctx.strokeStyle = '#4D628C';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.rect(0,0, CELL_SIZE, CELL_SIZE);
				ctx.fill();
				
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(20, 20);
				ctx.stroke();
			}
			
		});
	};
	
	function drawInCell(cellX, cellY, fn){
		var x = cellX * CELL_SIZE,
			y = cellY * CELL_SIZE;
		ctx.save();
		ctx.translate(x,y);
		fn();
		ctx.restore();
	};
	
	function drawFood(){
		drawInCell(food.x, food.y, function(){
			var snakeFood = new Image();
			snakeFood.src = "images/snake-food.png";
			ctx.drawImage(snakeFood,0,0);
		});
	};
	
	function drawTurbo(){
		drawInCell(turbo.x, turbo.y, function(){
			var jetPack = new Image();
			jetPack.src = "images/jetpack-straps.png";
			ctx.drawImage(jetPack,0,0);
		});
	};
	
	function drawShake(){
		drawInCell(shake.x, shake.y, function(){
			var milkShake = new Image();
			milkShake.src = "images/milk-shake.png";
			ctx.drawImage(milkShake,0,0);
		});
	};
	
	function changeDirection(key){
		if(key == 37 && heading != EAST){
			heading = WEST;
		}
		else if(key == 38 && heading != SOUTH){
			heading = NORTH;
		}
		else if(key == 39 && heading != WEST){
			heading = EAST;
		}
		else if(key == 40 && heading != NORTH){
			heading = SOUTH;
		};
	};
	
	function endGame(){
		gameOver = false;
		var length = snakeBits.length;
			
		for(i = FOOD_GROWTH; i <= length; i++){
			snakeBits.pop();  //remove all the bits from the snake on game over
		}
		
		$.post("backend.php", {name: user, score: currentPoints},
			function() {
				$.ajax({
					url: "frontend.php",
					success: function(data) {
						$('#high-scores').html(data);
					}
				});		
		});
		
		$('#end-game-score').html(currentPoints);
		$('#end-game-name').html(user);
		$('#game-over').animate({opacity: 1}, 500).css('z-index', 100);
	};
	
	function pauseGame(){
		if(timer == undefined){
			console.log('hasnt started');
		}
		else{
			console.log(timer);
			timer.pause();
		}
	}
	
	return{
		start: startGame,
		end: endGame
	};
};

$(function(){
	if (!(Modernizr.canvas || Modernizr.multiplebgs || Modernizr.rgba || Modernizr.csstransitions)){ //modern browser detection and re-direction
	   window.location.replace("http://snakesinspace.com/your-browser-sucks.html");
	}
	
	var userName;
	$('#user-name').submit(function(evt){
		evt.preventDefault();
		userName = $('#name').val();
		if(userName == 'undefined' || userName == ''){
			$('#name').css('border-color', '#A3192A');
			return;
		}
		else{
			window.game = SnakeGame('#game-area');
			$('#intro').animate({opacity: 0}, 500).css('z-index', -100);
			game.start(userName);
		}
	});
	
	if($(document).height() <= 720){
		$('#game-area').attr('width', 680);
		$('#game-area').attr('height', 340);
	}
	if($(document).width() <= 1100){
		$('#game-area').attr('width', 680);
		$('#game-area').attr('height', 340);
	}
	
	$(window).resize(function(){
		var height = $(document).height();
		var width = $(document).width();
		if(height <= 720 || width <= 1100){
			$('#game-area').attr('width', 680);
			$('#game-area').attr('height', 340);
		}
		else if(height > 720 && width > 1100){
			$('#game-area').attr('width', 800);
			$('#game-area').attr('height', 500);
		}
	});
	
	$('#try-again').click(function(){
		$('#game-over').animate({opacity: 0}, 500).css('z-index', -100);
		game.start(userName);
	});
	
	/*$('#learn-more').click(function(){
		var learnBtn = $('#learn-more');
		//game.end();
		if (learnBtn.hasClass('show-menu')){
			$('#copyright').animate({opacity: 1}, 200);
			learnBtn.removeClass('show-menu');
		}
		else{
			$('#copyright').animate({opacity: 0}, 200);
			learnBtn.addClass('show-menu');
		}
	});*/
});