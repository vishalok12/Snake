(function () {
	var canvasId = "game-area";
	var canvas, ctx;
	var WIDTH = 680;
	var HEIGHT = 340;
	var blockWidth = 20;
	var blockHeight = 20;
	var snakeParts = [];
	var food;
	var nextRequestId;
	var key = {
		LEFT	: 37,
		RIGHT	: 39,
		UP		: 38,
		DOWN	: 40
	};
	//Snake direction for moving
	var dir;
	var INVISIBLE_WALL = false;
	var speed = 1;
	var lastUpdateTime;
	var score;
	var paused;

	window.Snake = {
		start: function() {
			$('#main-page').removeClass('active');
			initialiseVariables();
			canvas = document.getElementById(canvasId);
			ctx = canvas.getContext("2d");
			bindKeys();
			paintCanvas();
			$('.score').text(score);
		},
		togglePause: function() {
			if (paused) {
				paused = false;
				paintCanvas();
			} else {
				paused = true;
				cancelAnimationFrame(nextRequestId);
			}
		}
	}

	// RequestAnimationFrame: a browser API for getting smooth animations
	window.requestAnimationFrame = (function() {
		return window.requestAnimationFrame 
			|| window.webkitRequestAnimationFrame 
			|| window.mozRequestAnimationFrame 
			|| window.oRequestAnimationFrame 
			|| window.msRequestAnimationFrame 
			|| function(callback) {
				 	window.setTimeout(callback, 1000 / 60);
				 };
	})();

	window.cancelAnimationFrame = (function() {
		return window.cancelAnimationFrame 
			|| window.webkitCancelAnimationFrame 
			|| window.mozCancelAnimationFrame 
			|| window.oCancelAnimationFrame 
			|| window.msCancelAnimationFrame 
			|| window.clearTimeout
	})();

	function initialiseVariables() {
		speed = 1;
		score = 0;
		dir = key.RIGHT;
		dirQueue.length = 0;
		snakeParts.length = 0;
		paused = false;
	}

	function paintCanvas() {
		clearCanvas();
		generateSnake();	//generate snake
		generateFood();		//create food for snake
		var currentTime = new Date().getTime();
		lastUpdateTime = lastUpdateTime || currentTime;
		if (currentTime - lastUpdateTime > ( 30 + 160 / speed ) ) {
			lastUpdateTime = currentTime;
			updateSnakePosition();
		}
		nextRequestId = requestAnimationFrame(paintCanvas);
	}

	function generateSnake() {
		var block,
			snakeHeadImage,
			headRotation = 0,
			xTranslate = 0, yTranslate = 0;
		if (snakeParts.length == 0) {
			snakeParts.push(new Block(220, 100), new Block(200, 100));
		}

		snakeHeadImage = new Image();
		snakeHeadImage.src = 'images/snake-head.png';
		if (dir == key.UP) {
			headRotation = -(Math.PI / 2);
			xTranslate = 0;
			yTranslate = blockHeight;
		} else if (dir == key.DOWN) {
			xTranslate = blockWidth;
			yTranslate = 0;
			headRotation = Math.PI / 2;
		} else if (dir == key.LEFT) {
			xTranslate = blockWidth;
			yTranslate = blockHeight;
			headRotation = Math.PI;
		}

		block = snakeParts[0];
		ctx.translate(block.x + xTranslate, block.y + yTranslate);
		ctx.rotate(headRotation);
		ctx.drawImage(snakeHeadImage, 0, 0, blockWidth, blockHeight);
		ctx.rotate(-headRotation);
		ctx.translate(-(block.x + xTranslate), -(block.y + yTranslate));

		for (var index = 1,totalSnakeParts = snakeParts.length; index < totalSnakeParts; index++) {
			block = snakeParts[ index ];
			ctx.fillStyle = block.color;
			ctx.fillRect(block.x, block.y, blockWidth, blockHeight);
		}
	}

	function clearCanvas() {
		ctx.clearRect(0,0,WIDTH,HEIGHT);
	}

	function Block(x, y) {
		if (y) {
			this.x = x;
			this.y = y;
		}else if (typeof x == "object" && x.x !== undefined && x.y !== undefined) {
			this.x = x.x;
			this.y = x.y;
		}else{
			console.error('Wrong parameters!');
			return;
		}
		this.color = '#ea4b4b';	
	}

	function generateFood() {
		if (!food) {
			food = new Block( getFoodLocation() );
			food.color = '#393661';
			food.image = new Image();
			food.image.src = 'images/frog.png';
		}
		ctx.drawImage(food.image, food.x, food.y, blockWidth, blockHeight);
	}

	function updateSnakePosition () {
		var newDimension = {};	//Snake's front block's new dimension
		var front = snakeParts[0];			//Snake's front block
		if (dirQueue.length) {
			var newDirection = dirQueue.shift();
			if (!oppositeKeyPressed(newDirection)) { dir = newDirection; }
		}
		switch (dir) {
			case key.UP: //key up pressed
				newDimension.x = front.x;
				newDimension.y = front.y - blockHeight;
				break;
			case key.LEFT: //key left pressed
				newDimension.x = front.x - blockWidth;
				newDimension.y = front.y;
				break;
			case key.RIGHT: //key right pressed
				newDimension.x = front.x + blockWidth;
				newDimension.y = front.y;
				break;
			case key.DOWN: //key down pressed
				newDimension.x = front.x;
				newDimension.y = front.y + blockHeight;
				break;
		}
		if (INVISIBLE_WALL) {
			//Taking two times mod because javascript behaves unusual for negative numbers
			newDimension.x = ((newDimension.x % WIDTH) + WIDTH) % WIDTH;
			newDimension.y = ((newDimension.y % HEIGHT) + HEIGHT) % HEIGHT;
		}
		if ( crossedBorder(newDimension) || hitBody(newDimension) ) {
			killSnake();
			Sound.playHit();
			return;
		}
		if ( foodPicked (newDimension) ) {	// Snake has reached to food
			//code to increase tail of the snake
			snakeParts.unshift(new Block(newDimension));
			food = null;
			updateSpeed();
			Sound.playEat();
			getScore();
		}else{
			var tempBlock, i = 0;
			//now move all the blocks to the position of it's previous block in array
			for (var block = snakeParts[i], snakePartsLength = snakeParts.length; 
				i < snakePartsLength; block = snakeParts[++i]) {
					tempBlockDim = {x: block.x, y: block.y};
					block.x = newDimension.x;
					block.y = newDimension.y;
					newDimension = tempBlockDim;
			}
		}
	}

	function foodPicked (snakePos) {
		if (snakePos.x == food.x && snakePos.y == food.y) {
			return true;
		}
		return false;
	}

	function random (min, max) {
		if (!max) {
			max = min;
			min = 0;
		}
		return Math.round(min + Math.random() * (max - min));
	}

	function getFoodLocation() {
		var randWidth, randHeight;
		randWidth = random(WIDTH - blockWidth);
		randWidth = randWidth - randWidth % blockWidth;
		randHeight = random(HEIGHT - blockHeight);
		randHeight = randHeight - randHeight % blockHeight;
		return foodInSnakeBody(randWidth, randHeight) ? getFoodLocation()
			: {x: randWidth, y: randHeight};
	}

	function foodInSnakeBody(randWidth, randHeight) {
		var blocks = snakeParts.filter(function(snakePart) {
			return snakePart.x == randWidth && snakePart.y == randHeight;
		});
		if (blocks.length) {
			return true;
		}else{
			return false;
		}
	}

	function oppositeKeyPressed(keycode) {
		if( (keycode == key.UP && dir == key.DOWN) 
			|| (keycode == key.DOWN && dir == key.UP)
			|| (keycode == key.LEFT && dir == key.RIGHT)
			|| (keycode == key.RIGHT && dir == key.LEFT) ) {
			return true;
		}
		return false;
	}

	function updateSpeed() {
		if ((snakeParts.length - 2) % 5 == 0) {
			speed += 1;
		}
	}

	function crossedBorder(snakeHeadPosition) {
		if (!INVISIBLE_WALL && (snakeHeadPosition.x >= WIDTH || snakeHeadPosition.y >= HEIGHT
			|| snakeHeadPosition.x < 0 || snakeHeadPosition.y < 0)) {
			return true;
		}
		return false;
	}

	function killSnake() {
		speed = 0;
		cancelAnimationFrame(nextRequestId);
		unbindKeys();
		$('#main-page').addClass('active');
		if( !!localStorage && (localStorage['highestScore'] == undefined 
			|| localStorage['highestScore'] < score) ) {
				localStorage['highestScore'] = score;
		}
	}

	function hitBody(snakeHeadPosition) {
		var commonPart = snakeParts.filter(function(snakePart) {
			return snakePart.x == snakeHeadPosition.x && snakePart.y == snakeHeadPosition.y;
		});
		return commonPart.length ? true : false;
	}

	var getScore = (function() {
		var lastPrizeTime;

		return function () {
			var currentPrizeTime = new Date().getTime();
			if (lastPrizeTime) {
				// console.log( currentPrizeTime - lastPrizeTime );

				score = score + 10;
				$('.score').text(score);
			} else {
				score = 10;
				$('.score').text(10);
			}
			lastPrizeTime = currentPrizeTime;
		}
	})();
})()
