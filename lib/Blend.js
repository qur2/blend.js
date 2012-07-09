if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}

define([], function() {

	var Blend = {map: {}, fx: {}, factory: {}};

	Blend.map.Grid2D = function(width, height, data) {
		if (!width) width = data.length / height;
		if (!height) height = data.length / width;
		if (data.length != width*height || Math.floor(height)*Math.floor(width) != width*height)
			throw "given dimensions doesn't match member count";

		this.data = data;
		this.width = width;
		this.height = height;
		this.projectedWidth = 1;
		this.projectedHeight = 1;
	};

	Blend.map.Grid2D.prototype.iterator = function() {
		var current = -1,
			me = this;
		var hasNext = function() {
			return current < this.data.length-1;
		};
		var next = function() {
			return this.cell(++current);
		};
		return function() {
			return hasNext.call(me) ? next.call(me) : false;
		};
	};
	Blend.map.Grid2D.prototype.addRow = function(row, i) {
		this.checkRowLength(row);
		i = ('undefined' == typeof i) ? this.height : Math.max(0, Math.min(i, this.height));
		this.data.slice(i*this.width, 0, row);
		this.height++;
		return this;
	};
	Blend.map.Grid2D.prototype.removeRow = function(i) {
		var row = this.data.splice(i*this.width, this.width);
		this.height--;
		return row;
	};

	Blend.map.Grid2D.prototype.addCol = function(col, i) {
			this.checkColLength(col);
			i = ('undefined' == typeof i) ? this.width: Math.max(0, Math.min(i, this.width));
			for (var j=this.height-1; j>=0; j--)
				this.data.splice(j*this.width+i, 0, col.pop());
			this.width++;
			return this;
		};
	Blend.map.Grid2D.prototype.removeCol = function(i) {
			col = [];
			for (var j=this.height-1; j>=0; j--)
				col.unshift(this.data.splice(j*this.width+i, 1).pop());
			this.width--;
			return col;
		};

	Blend.map.Grid2D.prototype.checkRowLength = function(row) {
			if (row.length != this.width)
				throw "row length doesn't match column number";
		};
	Blend.map.Grid2D.prototype.checkColLength = function(col) {
			if (col.length != this.height)
				throw "column length doesn't match row number";
		};
	Blend.map.Grid2D.prototype.checkGridIndex = function(index) {
			if (index >= this.data.length)
				throw "cell index out of bound";
		};

	Blend.map.Grid2D.prototype.project = function(width, height) {
			this.projectedWidth = width;
			this.projectedHeight = height;
		};

	Blend.map.Grid2D.prototype.cell = function(index) {
		this.checkGridIndex(index);
		var data = this.data[index];
		var i = index%this.width,
			j = Math.floor(index/this.width);
		var areaWidth = this.projectedWidth / this.width,
			areaHeight = this.projectedHeight /this.height;
		var wFloat = Math.floor(areaWidth) != areaWidth,
			hFloat = Math.floor(areaHeight) != areaHeight;
		var wInc = (wFloat && i%this.width == this.width-1) ? 1: 0,
			hInc = (hFloat && Math.floor(i/this.height) == this.height-1) ? 1: 0;
		var area = {
			x: Math.floor(areaWidth * i),
			y: Math.floor(areaHeight * j),
			w: Math.floor(this.projectedWidth / this.width)+wInc,
			h: Math.floor(this.projectedHeight /this.height)+hInc,
			data: data
		};
		return area;
	};

	Blend.map.Grid2D.prototype.toString = function() {
		repr = [];
		for (var i=0; i<this.height; i++)
			repr.push(this.data.slice(i*this.width, (i+1)*this.width).join(' '));
		return '[' + repr.join('\n ') + ']';
	};

	Blend.fx.average = function(pixels, amount) {
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

	Blend.fx.desaturate = function(pixels, amount) {
		for (var i=0; i<pixels.data.length; i+=4) {
			var avg = (pixels.data[i] + pixels.data[i+1] + pixels.data[i+2]) * 1/3;
			pixels.data[i] += (avg - pixels.data[i]) * amount;
			pixels.data[i+1] += (avg - pixels.data[i+1]) * amount;
			pixels.data[i+2] += (avg - pixels.data[i+2]) * amount;
		}
		return pixels;
	};
	Blend.fx.invert = function(pixels, amount) {
		for (var i=0; i<pixels.data.length; i+=4) {
			pixels.data[i] = 255 - pixels.data[i];
			pixels.data[i+1] = 255 - pixels.data[i+1];
			pixels.data[i+2] = 255 - pixels.data[i+2];
		}
		return pixels;
	};
	Blend.fx.alpha = function(pixels, amount) {
		for (var i=0, imax=pixels.data.length; i<imax; i+=4)
			pixels.data[i+3] = Math.min(pixels.data[i+3], (1-amount) * 255);
		return pixels;
	};
	Blend.fx.border = function(ctx, amount) {
		var w = ctx.canvas.width,
			h = ctx.canvas.height,
			thickness = 5;
		ctx.strokeStyle = '#FF2356';
		for (var i=0; i<thickness; i++)
			ctx.strokeRect(i, i, w-2*i, h-2*i);
		return ctx;
	};
	Blend.fx.circleMask = function(ctx, amount) {
		var w = ctx.canvas.width,
			h = ctx.canvas.height;
		// keep the original image with alpha = 0
		var pixels = ctx.getImageData(0, 0, w, h);
		Blend.fx.alpha(pixels, 1);
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
	Blend.fx.neutralize = function(pixels, amount) {
		var tmpCanvas = Blend.factory.canvas(pixels.width, pixels.height);
		var tmpContext = tmpCanvas.getContext('2d');
		var tmpPixels = tmpContext.getImageData(0, 0, pixels.width, pixels.height);
		for (var i=0, imax=pixels.data.length; i<imax; i+=4) {
			tmpPixels.data[i] = (pixels[i] + pixels[i+4]) / 2;
			tmpPixels.data[i+1] = (pixels[i+1] + pixels[i+5]) / 2;
			tmpPixels.data[i+2] = (pixels[i+2] + pixels[i+6]) / 2;
		}
		return tmpPixels;
	};

	Blend.factory.fx = function(type, effect) {
		if ('context' == type)
			return function(x, y, w, h, data) {
				var tmpCanvas = Blend.factory.canvas(w, h);
				var tmpContext = tmpCanvas.getContext('2d');
				tmpContext.drawImage(this.canvas, x, y, w, h, 0, 0, w, h);
				effect.call(this, tmpContext, data);
				var pixels = tmpContext.getImageData(0, 0, w, h);
				this.context.putImageData(pixels, x, y);
			};
		else if ('pixels' == type)
			return function(x, y, w, h, data) {
				var pixels = this.context.getImageData(x, y, w, h);
				effect.call(this, pixels, data);
				this.context.putImageData(pixels, x, y);
			};
	};
	Blend.factory.canvas = function(width, height) {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		return canvas;
	};

	Blend.blender = function(img, map) {
		this.setImage(img);
		this.setMap(map);
	};

	// handle effect queue
	Blend.blender.prototype.fx = function(effect, cells) {
		var area;
		if (!cells)
			for (area, next=this.map.iterator(); (area=next());)
				effect.call(this, area.x, area.y, area.w, area.h, area.data);
		else
			for (var i=0, bound=cells.length; i<bound; i++) {
				area = this.map.cell(cells[i]);
				effect.call(this, area.x, area.y, area.w, area.h, area.data);
			}
		return this;
	};
	Blend.blender.prototype.setMap = function(map) {
		map.project(this.img.width, this.img.height);
		this.map = map;
		return this;
	};
	Blend.blender.prototype.setImage = function(img) {
		var canvas = Blend.factory.canvas(img.width, img.height);
		var context = canvas.getContext('2d');
		context.drawImage(img, 0, 0);
		this.img = img;
		this.canvas = canvas;
		this.context = context;
		return this;
	};
	Blend.blender.prototype.update = function() {
		this.img.src = this.canvas.toDataURL();
		return this;
	};

	return Blend;
});
