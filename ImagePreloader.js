/**
 * Class enabling preloading of HTML images.
 * @see http://www.webreference.com/programming/javascript/gr/column3/index.html
 */
function ImagePreloader(images, callback) {
	// store the callback
	this.callback = callback;

	// initialize internal state.
	this.loaded = 0;
	this.processed = 0;
	this.imageInstances = new Array;

	// record the number of images.
	this.imageCount = images.length;

	// for each image, call preload()
	for (var i = 0; i < images.length; i++)
	 	this.preload(images[i]);
}

ImagePreloader.prototype.preload = function(source) {
	// create new Image object and add to array
	var image = new Image;
	this.imageInstances.push(image);

	// set up event handlers for the Image object
	image.onload = ImagePreloader.prototype.onload;
	image.onerror = ImagePreloader.prototype.onerror;
	image.onabort = ImagePreloader.prototype.onabort;

	// assign pointer back to this.
	image.Preloader = this;
	image.loaded = false;

	// assign the @src attribute of the Image object
	image.src = source;
}

ImagePreloader.prototype.onComplete = function() {
	this.processed++;
	if (this.processed == this.imageCount ) {
		this.callback(this.imageInstances, this.loaded);
	}
}

ImagePreloader.prototype.onload = function() {
	this.loaded = true;
	this.Preloader.loaded++;
	this.Preloader.onComplete();
}

ImagePreloader.prototype.onerror = function() {
	this.error = true;
	this.Preloader.onComplete();
}

ImagePreloader.prototype.onabort = function() {
	this.abort = true;
	this.Preloader.onComplete();
}
