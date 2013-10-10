define([], function() {
	var sign = function(x) { return x ? x < 0 ? -1 : 1 : 0; };

	// Grid class
	var Grid2D = function(cols, rows) {
		if (!cols) cols = rows || 1;
		if (!rows) rows = cols;
		this.length = rows * cols;
		this.cols = cols;
		this.rows = rows;
		this.projectedWidth = 1;
		this.projectedHeight = 1;
	};
	Grid2D.prototype.addRow = function(n) {
		this.rows += n || 1;
		this.length = this.rows * this.cols;
		this.project();
		return this;
	};
	Grid2D.prototype.removeRow = function(n) {
		var rows = this.rows - n || 1;
		this.checkIndex(this.cols * rows);
		this.rows = rows;
		this.length = rows * this.cols;
		this.project();
		return this;
	};

	Grid2D.prototype.addCol = function(n) {
		this.cols += n || 1;
		this.length = this.rows * this.cols;
		this.project();
		return this;
	};
	Grid2D.prototype.removeCol = function(n) {
		var cols = this.cols - n || 1;
		this.checkIndex(cols * this.rows);
		this.cols = cols;
		this.length = this.rows * cols;
		this.project();
		return this;
	};

	Grid2D.prototype.checkIndex = function(index) {
		if (index >= this.length)
			throw "cell index out of bound";
	};

	// Reset projection params (Overall and cell dims).
	Grid2D.prototype.project = function(width, height) {
		// if width and height provided, update the overall size
		if (arguments.length) {
			this.projectedWidth = width;
			this.projectedHeight = height;
		} else {
			width = this.projectedWidth;
			height = this.projectedHeight;
		}
		// update the size of areas
		this.areaWidth = width / this.cols;
		this.areaHeight = height / this.rows;
		// compute cells, with integer dims
		this.cells = [];
		var rows = this.rows, rowAcc = height, rowHeight;
		var cols, colAcc, colWidth;
		for (var i=0, imax=this.rows; i<imax; i++) {
			rowHeight = Math.round(rowAcc / rows);
			colAcc = width;
			cols = this.cols;
			for (var j=0, jmax=this.cols; j<jmax; j++) {
				colWidth = Math.round(colAcc / cols);
				this.cells.push({
					x: width - colAcc,
					y: height - rowAcc,
					w: colWidth,
					h: rowHeight
				});
				colAcc -= colWidth;
				cols--;
			}
			rowAcc -= rowHeight;
			rows--;
		}
	};

	Grid2D.prototype.cell = function(index) {
		this.checkIndex(index);
		return this.cells[index];
	};
	Grid2D.prototype.toString = function() {
		return this.cols + ' x ' + this.rows + ' grid';
	};

	var fx = {};
	fx.average = function(amount, pixels) {
		var avg = [0, 0, 0];
		for (var i=0; i<pixels.data.length; i+=4) {
			avg[0] += pixels.data[i];
			avg[1] += pixels.data[i+1];
			avg[2] += pixels.data[i+2];
		}
		avg[0] /= pixels.data.length / 4;
		avg[1] /= pixels.data.length / 4;
		avg[2] /= pixels.data.length / 4;
		for (i=0; i<pixels.data.length; i+=4) {
			pixels.data[i] = avg[0];
			pixels.data[i+1] = avg[1];
			pixels.data[i+2] = avg[2];
		}
		return pixels;
	};
	// Desaturate the pixels.
	// 1 turns the image to greyscale, 0 has no effect.
	fx.desaturate = function(amount, pixels) {
		for (var i=0; i<pixels.data.length; i+=4) {
			var avg = (pixels.data[i] + pixels.data[i+1] + pixels.data[i+2]) * 1/3;
			pixels.data[i] += (avg - pixels.data[i]) * amount;
			pixels.data[i+1] += (avg - pixels.data[i+1]) * amount;
			pixels.data[i+2] += (avg - pixels.data[i+2]) * amount;
		}
		return pixels;
	};
	fx.invert = function(pixels) {
		for (var i=0; i<pixels.data.length; i+=4) {
			pixels.data[i] = 255 - pixels.data[i];
			pixels.data[i+1] = 255 - pixels.data[i+1];
			pixels.data[i+2] = 255 - pixels.data[i+2];
		}
		return pixels;
	};
	// Changes the opacity of the pixels. Preserves initial opacity if lower.
	// 0 is opaque, 1 is transparent.
	fx.alpha = function(amount, pixels) {
		for (var i=0, imax=pixels.data.length; i<imax; i+=4)
			pixels.data[i+3] = Math.min(pixels.data[i+3], (1-amount) * 255);
		return pixels;
	};
	fx.border = function(color, width, ctx) {
		var w = ctx.canvas.width,
			h = ctx.canvas.height;
		ctx.strokeStyle = color;
		for (var i=0; i<width; i++)
			ctx.strokeRect(i, i, w-2*i, h-2*i);
		return ctx;
	};
	fx.neutralize = function(amount, pixels) {
		var tmpCanvas = factory.canvas(pixels.width, pixels.height);
		var tmpContext = tmpCanvas.getContext('2d');
		var tmpPixels = tmpContext.getImageData(0, 0, pixels.width, pixels.height);
		for (var i=0, imax=pixels.data.length; i<imax; i+=4) {
			tmpPixels.data[i] = (pixels[i] + pixels[i+4]) / 2;
			tmpPixels.data[i+1] = (pixels[i+1] + pixels[i+5]) / 2;
			tmpPixels.data[i+2] = (pixels[i+2] + pixels[i+6]) / 2;
		}
		return tmpPixels;
	};
	fx.circleMask = function(ctx) {
		var w = ctx.canvas.width,
		h = ctx.canvas.height;
		// keep the original image with alpha = 0
		var pixels = ctx.getImageData(0, 0, w, h);
		fx.alpha(pixels, 1);
		var tmpCanvas = Blend.factory.canvas(w, h);
		var tmpContext = tmpCanvas.getContext('2d');
		tmpContext.putImageData(pixels, 0, 0);
		// draw a circle mask
		ctx.globalCompositeOperation = 'destination-in';
		ctx.fillStyle = 'rgba(255, 255, 255, 1)';
		ctx.beginPath();
		ctx.arc(w/2, h/2, Math.min(w, h)/2, 0, Math.PI*2, true);
		ctx.fill();
		// restore transparent pixels around the mask
		ctx.globalCompositeOperation = 'destination-over';
		ctx.drawImage(tmpCanvas, 0, 0);
		return ctx;
	};
	fx.rot = function(angle, ctx) {
		// beware of not square canvas with this one
		ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
		ctx.rotate(angle);
		ctx.drawImage(ctx.canvas, -ctx.canvas.width/2, -ctx.canvas.height/2);
		return ctx;
	};
	fx.randtint = function(rgb, pixels) {
		if (!rgb) return pixels;
		var r = Math.random() * rgb * 255,
			g = Math.random() * rgb * 255,
			b = Math.random() * rgb * 255;
		for (var i=0, imax=pixels.data.length; i<imax; i+=4) {
			pixels.data[i] = pixels.data[i] * (1-rgb) + r;
			pixels.data[i+1] = pixels.data[i+1] * (1-rgb) + g;
			pixels.data[i+2] = pixels.data[i+2] * (1-rgb) + b;
		}
		return pixels;
	};
	fx.vignette = function(irad, orad, ctx) {
		var cx = ctx.canvas.width / 2,
			cy = ctx.canvas.height / 2;
		var grad = ctx.createRadialGradient(cx, cy, irad, cx, cy, orad);
		ctx.globalCompositeOperation = 'source-atop';
		grad.addColorStop(0, 'transparent');
		grad.addColorStop(1, 'black');
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		return ctx;
	};
	fx.contrast = function(amount, pixels) {
		var i, avg, mid,
			imax = pixels.data.length,
			localmult,
			hi = 0, lo = 255;
		for (i=0; i<imax; i+=4) {
			avg = (pixels.data[i] + pixels.data[i+1] + pixels.data[i+2]) * 1/3;
			hi = Math.max(avg, hi);
			lo = Math.min(avg, lo);
		}
		// a,b = 10,80
		// y,z = 0,100
		// c = (10+80)/2 = 45
		// x in a,c -> (x-a) * (c/(c-a))
		// x in c,b -> c + (x-c) * ((z-c)/(b-c))
		mid = (hi + lo) / 2;
		for (i=0; i<imax; i+=4) {
			avg = (pixels.data[i] + pixels.data[i+1] + pixels.data[i+2]) * 1/3;
			if (avg < mid) {
				// linear projection of interval [lo,avg] to [0, avg]
				// amount multiplies the difference to 1
				localmult = 1 - amount * (1 - ((avg-lo) * (mid/(mid-lo))) / avg);
				pixels.data[i] *= localmult;
				pixels.data[i+1] *= localmult;
				pixels.data[i+2] *= localmult;
			} else {
				// linear projection of interval [avg, hi] to [avg, 255]
				// amount multiplies the difference to 1
				localmult = 1 + amount * ((mid + (avg-mid) * ((255-mid)/(hi-mid))) / avg - 1);
				pixels.data[i] *= localmult;
				pixels.data[i+1] *= localmult;
				pixels.data[i+2] *= localmult;
			}
		}
		return pixels;
	};
	// Factory provides some wrappers allowing a unified interface between
	// pixel- and canvas-effects.
	// It passes the pixels or canvas last to be friendly with functions
	// having parameters bound.
	var factory = {};
	// Turn the given function into a canvas effect, meaning that
	// its last argument will be a canvas context.
	factory.cfx = function(fn) {
		return function(x, y, w, h, data) {
			var tmpCanvas = factory.canvas(w, h);
			var tmpContext = tmpCanvas.getContext('2d');
			tmpContext.drawImage(this.canvas, x, y, w, h, 0, 0, w, h);
			fn.apply(this, (data || []).concat([tmpContext]));
			var pixels = tmpContext.getImageData(0, 0, w, h);
			this.context.putImageData(pixels, x, y);
		};
	};
	// Turn the given function into a pixel effect, meaning that
	// its last argument will be an image data object.
	factory.pfx = function(fn) {
		return function(x, y, w, h, data) {
			var pixels = this.context.getImageData(x, y, w, h);
			fn.apply(this, (data || []).concat([pixels]));
			this.context.putImageData(pixels, x, y);
		};
	};
	// Helper function to quickly create a canvas.
	factory.canvas = function(width, height) {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		return canvas;
	};

	var Blender = function(img, map) {
		this.setImage(img);
		this.setMap(map);
	};
	// Apply fx on the image.
	// - With only an effect, the image is fully fx'd. It allows to invoke
	//   functions with bound args.
	// - With one extra arg, the image is fully fx'd with this arg.
	// - With multiple extra args, the image is fx'd and each area gets it
	//   own arg. Null values are skipped, which means that it's possible
	//   to skip areas.
	//
	// Return `this` to allow chaining.
	// > var blend = module.blend(img, 2, 2);
	// > blend.fx(vignette, [100,300])
	// >      .fx(vignette, [100,300], [150,300], null, [150,300])
	// >      .fx(myFx)
	Blender.prototype.fx = function(effect) {
		var area, i, bound, data,
			args = Array.prototype.slice.call(arguments, 1);
		// Args preprocess
		if (!args.length) args = [];
		for (i=0, bound=args.length; i<bound; i++) {
			if (null !== args[i] && !Array.isArray(args[i])) {
				args[i] = [args[i]];
			}
		}
		// Switch over args length to run the right loop
		if (!args.length) {
			for (i=0, bound=this.map.length; i<bound; i++) {
				area = this.map.cell(i);
				effect.call(this, area.x, area.y, area.w, area.h);
			}
		} else if (1 === args.length) {
			for (i=0, bound=this.map.length; i<bound; i++) {
				area = this.map.cell(i);
				effect.call(this, area.x, area.y, area.w, area.h, args[0]);
			}
		} else {
			for (i=0, bound=this.map.length; i<bound; i++) {
				if (args[i]) {
					area = this.map.cell(i);
					effect.call(this, area.x, area.y, area.w, area.h, args[i]);
				}
			}
		}
		return this;
	};
	// Shortcut to pixel effect and apply
	Blender.prototype.pfx = function(effect) {
		effect = factory.pfx(effect);
		return this.fx(effect);
	};
	// Shortcut to canvas effect and apply
	Blender.prototype.cfx = function(effect) {
		effect = factory.cfx(effect);
		return this.fx(effect);
	};
	Blender.prototype.setMap = function(map) {
		map.project(this.img.width, this.img.height);
		this.map = map;
		return this;
	};
	Blender.prototype.setImage = function(img) {
		var canvas = factory.canvas(img.width, img.height);
		var context = canvas.getContext('2d');
		context.drawImage(img, 0, 0);
		this.img = img;
		this.canvas = canvas;
		this.context = context;
		return this;
	};
	Blender.prototype.update = function() {
		this.img.src = this.canvas.toDataURL();
		return this;
	};

	return {
		// grid factory
		grid: function(cols, rows) {
			return new Grid2D(cols, rows);
		},
		// blender factory
		blend: function(img, cols, rows) {
			var grid = cols;
			if (!grid) {
				grid = new Grid2D(cols, rows);
			} else if (typeof grid === 'number') {
				grid = new Grid2D(cols, rows);
			}
			return new Blender(img, grid);
		},
		// bunch of fx readily available
		fx: fx,
		// expose factory helpers
		cfx: factory.cfx,
		pfx: factory.pfx
	};
});
