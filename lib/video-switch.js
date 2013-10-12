(function () {
		var requestAnimationFrame = window.requestAnimationFrame 
		|| window.webkitRequestAnimationFrame 
		|| window.mozRequestAnimationFrame 
		|| window.oRequestAnimationFrame 
		|| window.msRequestAnimationFrame 
		|| function (func) {
	    	window.setTimeout(func, 1E3 / 60);
		};
			
		//window.requestAnimationFrame = requestAnimationFrame;

	function VideoSwitch(config, canvasId, videoLists) {
		if (!videoLists || !videoLists.length) return;

		this.config = $.extend({}, config);

		this.videoIndex = 0;
		this.animationId = null;
		this.canvas = $(canvasId);
		this.context = this.canvas.get(0).getContext('2d');
		this.create(videoLists);

		return this;
	};

	VideoSwitch.prototype.init = function () {

	};

	VideoSwitch.prototype.create = function (videoLists) {
		var width = this.config.width;
		var height = this.config.height;

		var html = '';
		for (var i = 0; i < videoLists.length; i++) {
			html += '<video controls loop muted width="' + width + '" height="' + height + '" id="video-' + i + '" style="opacity:0;postion:absolute;left:-999px;" class="video-switch">\
				<source src="' + videoLists[i] + '" type="video/mp4">\
				</video>';
		}

		html += '<canvas width="' + width + '" height="' + height + '" id="video_canvas_hidden" style="position:absolute;left:-999px;"></canvas>';

		$('body').append(html);

		this.videoLists = $('.video-switch');
		this.hiddenCanvas = $('#video_canvas_hidden');
		this.hiddenContext = this.hiddenCanvas.get(0).getContext('2d');

		this.play(0);
	};

	VideoSwitch.prototype.switch = function (previousVideo, nextVideo, prevIndex, nextIndex, type) {
		if (this.animationId) window.cancelAnimationFrame(this.animationId);

		var endIndex = 0;
		switch (type) {
			case '3D':
				this.switch3D(previousVideo, nextVideo, prevIndex, nextIndex, endIndex);
				break;
			default: 
				this.switchOff(previousVideo, nextVideo, prevIndex, nextIndex, endIndex);
		}
	};

	VideoSwitch.prototype.switchOff = function (previousVideo, nextVideo, prevIndex, nextIndex, endIndex) {
		var self = this;
		var context = this.context;
		var width = this.config.width;
		var height = this.config.height;

		if (this.animationId) window.cancelAnimationFrame(this.animationId);

		this.hiddenContext.drawImage(previousVideo, 0, 0, width, height);
		var preImageData = this.hiddenContext.getImageData(0, 0, width, height);
		var self = this;

		this.hiddenContext.drawImage(nextVideo, 0, 0, width, height);
		var nextImageData = this.hiddenContext.getImageData(0, 0, width, height);

		endIndex += 10;
		var data = preImageData.data;
		for (var x = 0; x < preImageData.width; x++) {
			for (var y = 0; y < preImageData.height; y++) {
				var index = (y * preImageData.width + x) * 4;  //calculate index 
        if (x < endIndex) {
	        data[index] = nextImageData.data[index];   // red 
	        data[index + 1] = nextImageData.data[index + 1]; // green 
	        data[index + 2] = nextImageData.data[index + 2]; // blue 
	        data[index + 3] = 255; // force alpha to 100% 
        }
			}
		}

		context.putImageData(preImageData, 0, 0);

		if (endIndex >= width) {
			this.render(nextIndex);
			this.videoIndex = nextIndex;
			return;
		}

		this.animationId = requestAnimationFrame(function () {
			self.switchOff(previousVideo, nextVideo, prevIndex, nextIndex, endIndex);
		});
	};

	VideoSwitch.prototype.switch3D = function (previousVideo, nextVideo, prevIndex, nextIndex, num) {
		var self = this;
		var context = this.context;
		var width = this.config.width;
		var height = this.config.height;

		num++;
		if (num <= 90 && num > 0) {
			self.context.drawImage(previousVideo, 0, 0, width, height);
		} else {
			self.context.drawImage(nextVideo, 0, 0, width, height);
		}
		self.canvas.css('-webkit-transform', 'perspective(' + width + 'px) rotateY(' + num + 'deg)');

		if (num === 90) {
			num = -91;
		} else if (num === 0) {
			self.render(nextIndex);
			self.videoIndex = nextIndex;
			return;
		}
		this.animationId = requestAnimationFrame(function () {
			self.switch3D(previousVideo, nextVideo, prevIndex, nextIndex, num);
		});

	}

	VideoSwitch.prototype.mirror = function (video) {
		var self = this;
		var width = this.config.width;
		var height = this.config.height;

		if(video.paused || video.ended) return false;

    if (this.animationId) window.cancelAnimationFrame(this.animationId);

    this.context.drawImage(video, 0, 0, width, height);

		this.animationId = requestAnimationFrame(function () {
			self.mirror(video);
		});
	};

	VideoSwitch.prototype.play = function (index, type) {
		if (this.videoLists[index]) {
			var self = this;

			if (index === self.videoIndex) {
				this.render(index);
			} else {
				var previousVideo = this.videoLists[this.videoIndex];
				var nextVideo = this.videoLists[index];
				if (nextVideo.paused || nextVideo.ended) {
					nextVideo.play();
				}
				self.switch(previousVideo, nextVideo, this.videoIndex, index, type);
			}
		}
	};

	VideoSwitch.prototype.render = function (index) {
		var self = this;
		if (this.animationId) window.cancelAnimationFrame(this.animationId);
		var videoDom = this.videoLists[index];
		if (videoDom.paused || videoDom.ended) {
			this.videoLists[index].play();		
		}
		this.animationId = requestAnimationFrame(function () {
			self.mirror(videoDom);
		});
	};

	window.VideoSwitch = VideoSwitch;
	
})();