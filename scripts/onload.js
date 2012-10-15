var dirQueue = [];

function onload() {
	bindButtons();
	Snake.start();
}

function bindKeys() {
	$('body').keydown(function(e) {
		if (e.keyCode == 80) {
			Snake.togglePause();
		} else if ( [37, 38, 39, 40].indexOf(e.keyCode) != -1 ) {
			dirQueue.push(e.keyCode);
			dirQueue.length = dirQueue.length > 2 ? 2 : dirQueue.length;	//To limit a buffer to 2
		}
	});
}

function unbindKeys() {
	$('body').unbind('keydown');
}

function bindButtons() {
	$('#restart').bind('click', function() {
		Snake.start();
	})
}