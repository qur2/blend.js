Blend = {map: {}, fx: {}, factory: {}};

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


var proto = {
	iterator: function() {
		var current = -1;
		var me = this;
		hasNext = function() {
			return current < this.data.length-1;
		};
		next = function() {
			return this.cell(++current);
		};
		return function() {
			return hasNext.call(me) ? next.call(me) : false;
		};
	},

	addRow: function(row, i) {
		this.checkRowLength(row);
		i = ('undefined' == typeof i) ? this.height : Math.max(0, Math.min(i, this.height));
		this.data.slice(i*this.width, 0, row);
		this.height++;
		return this;
	},
	removeRow: function(i) {
		var row = this.data.splice(i*this.width, this.width);
		this.height--;
		return row;
	},

	addCol: function(col, i) {
		this.checkColLength(col);
		i = ('undefined' == typeof i) ? this.width: Math.max(0, Math.min(i, this.width));
		for (var j=this.height-1; j>=0; j--)
			this.data.splice(j*this.width+i, 0, col.pop());
		this.width++;
		return this;
	},
	removeCol: function(i) {
		col = [];
		for (var j=this.height-1; j>=0; j--)
			col.unshift(this.data.splice(j*this.width+i, 1).pop());
		this.width--;
		return col;
	},

	checkRowLength: function(row) {
		if (row.length != this.width)
			throw "row length doesn't match column number";
	},
	checkColLength: function(col) {
		if (col.length != this.height)
			throw "column length doesn't match row number";
	},
	checkGridIndex: function(index) {
		if (index >= this.data.length)
			throw "cell index out of bound";
	},

	project: function(width, height) {
		this.projectedWidth = width;
		this.projectedHeight = height;
	},

	cell: function(index) {
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
	},

	toString: function() {
		repr = [];
		for (var i=0; i<this.height; i++)
			repr.push(this.data.slice(i*this.width, (i+1)*this.width).join(' '));
		return '[' + repr.join('\n ') + ']';
	}
};

for (var member in proto) {
	Blend.map.Grid2D.prototype[member] = proto[member];
}

/**
 * Binary tree representing a plane split horizontally and vertically.
 * A node always 0 or 2 children.
 * Plane rectangles are represented by the leaves.
 * Internal data are represented by a list of array.
 */
Blend.map.Tree2D = function(data) {
	var treeDim = 2;

	Iterator = function(tree) {
		return {
			tree: tree,
			current: -1,

			hasNext: function() {
				return this.current < this.tree.leaves.length-1;
			},
			/**
			 * Get the next leaf by iterating over the last data rows.
			 * If an element is null (i.e. the leaf lies higher in the tree), then
			 * it goes up in the tree until it finds the ancestor node of the null leaf.
			 * As every node has exactly 2 leaves (but the leaves themselves), when going up 
			 * in the tree, we know some consecutive leaves (i.e. right siblings) can be skipped
			 * as it would lead to the same ancestor.
			 */
			next: function() {
				this.current++;
				// console.log(this.current);
				var i = this.tree.data.length-1;
				var leaf = tree.leaves[this.current];
				if (typeof leaf == 'undefined') {
					var j = this.current;
					for (i=tree.data.length-2; i>=0 && !leaf; --i) {
						j = Math.floor(j/2);
						leaf = tree.data[i][j];
					}
					// some nodes can be skipped as any node has 0 or 2 children
					this.current += (tree.data.length-i-2)*2-1;
					// console.log('up', tree.data.length-i-2, 'right', (tree.data.length-i-2)*2-1, this.current);
					return {x: this.current-1, y: i+1, data: leaf};
				}
				else
					return {x: this.current, y: i, data: leaf};
			},
			reset: function() {
				this.current = -1;
			}
		};
	};

	var tree = {
		dim: treeDim,
		data: data,
		leaves: data[data.length-1],
		projectedWidth: 1,
		projectedHeight: 1,

		project: function(width, height) {
			this.projectedWidth = width;
			this.projectedHeight = height;
		},

		nextArea: function() {
			var node = this.iterator.hasNext() ? this.iterator.next(): false;
			var hSplit = Math.ceil(node.y/2), vSplit = Math.floor(node.y/2);
			var w = this.projectedWidth/Math.pow(2, vSplit), h = this.projectedHeight/Math.pow(2, hSplit);
			var area = {
				// the module adujsts the position if the spitting direction is relevant
				x: w * (hSplit-1 + ((hSplit==vSplit)?node.x%2:0)),
				y: h * (node.y-1 + ((hSplit>vSplit)?node.x%2:0)),
				w: w,
				h: h,
				data: node.data
			};
			// console.log(hSplit, vSplit, node.x, node.y, area);
			return area;
		}
	};
	tree.iterator = Iterator(tree);
	return tree;
};

Blend.fx.desaturate = function(ctx, amount) {
	var pixels = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	for (var i=0; i<pixels.data.length; i+=4) {
		var avg = (pixels.data[i] + pixels.data[i+1] + pixels.data[i+2]) * 1/3;
		pixels.data[i] += (avg - pixels.data[i]) * amount;
		pixels.data[i+1] += (avg - pixels.data[i+1]) * amount;
		pixels.data[i+2] += (avg - pixels.data[i+2]) * amount;
	}
	ctx.putImageData(pixels, 0, 0);
};
Blend.fx.invert = function(ctx, amount) {
	var pixels = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	for (var i=0; i<pixels.data.length; i+=4) {
		pixels.data[i] = 255 - pixels.data[i];
		pixels.data[i+1] = 255 - pixels.data[i+1];
		pixels.data[i+2] = 255 - pixels.data[i+2];
	}
	ctx.putImageData(pixels, 0, 0);
};
Blend.fx.alpha = function(pixels, amount) {
	for (var i=0; i<pixels.data.length; i+=4)
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
}

Blend.create = function(img, map) {
	var canvas = Blend.factory.canvas(img.width, img.height);
	var context = canvas.getContext('2d');
	context.drawImage(img, 0, 0);
	map.project(img.width, img.height);

	this.img = img;
	this.map = map;
	this.canvas = canvas;
	this.context = context;
};

var proto = {
	// handle effect queue
	fx: function(effect, cells) {
		// if (!cells)
			for (var area, next=this.map.iterator(); (area=next());)
				effect.call(this, area.x, area.y, area.w, area.h, area.data);
		// else
		// 	for (var i=0, bound=cells.length; i<bound; i++) {
		// 		var area = this.map.cell(cells[i]);
		// 		effect.call(this, area.x, area.y, area.w, area.h, effect, area.data);
		// 	}
		return this;
	},
	update: function() {
		this.img.src = this.canvas.toDataURL();
		return this;
	}
};
for (var member in proto) {
	Blend.create.prototype[member] = proto[member];
}
