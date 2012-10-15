(function abc() {
	var Sound = {};
	var eatSound = new Audio('sounds/eat.mp3');
	var hitSound = new Audio('sounds/hit.mp3');

	var audio = new Audio();

	if ( audio.canPlayType && audio.canPlayType('audio/mpeg; codecs="mp3"') != "" ) {

		Sound.playEat = function () {
			eatSound.currentTime = 0;
			eatSound.play();
		}
		Sound.playHit = function() {
			hitSound.play();
		}
	} else {
		Sound.playEat = function () { return; }
		Sound.playHit = function () {
			return;
		}
	}
	window.Sound = Sound;
})();