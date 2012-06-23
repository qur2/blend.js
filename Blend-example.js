function grid2DExample() {
	/*
	1 2 3
	4 5 6
	*/
	var g = Blend.map.Map2D(3, 2, [1, 2, 3, 4, 5, 6]);

	console.log('init : \n', g.toString());
	console.log('+row : \n', g.addRow([7, 8, 9]).toString());
	console.log('+col : \n', g.addCol([7, 8, 9], 1).toString());

	// console.log(g.get(0,0), g.get(0,1), g.get(2, 2), g.get(2,3));

	console.log('-row :', g.removeRow(2));
	console.log(g.toString());
	console.log('-col :', g.removeCol(0));
	console.log(g.toString());

	// for (var i=0; i<g.width; i++)
	// 	console.log(g.colIndexes(i));
	// for (var i=0; i<g.height; i++)
	// 	console.log(g.rowIndexes(i));
}

function tree2DExample() {
	// +---------------+
	// |               |
	// |      0,1      |
	// |               |
	// |-------+-------+
	// |       |  6,3  |
	// |  2,2  +-------+
	// |       |  7,3  |
	// +-------+-------+
	var t = Blend.map.Tree2D([
		[										'0,0'],
		[					'0,1', 									'1,1'],
		[		undefined, 			undefined, 				'2,2', 				'3,2'],
		[undefined, undefined, undefined, undefined, undefined, undefined, '6,3', '7,3']
	]);
	t.project(100, 100);
	console.log(t);
	while (t.iterator.hasNext())
		console.log(t.nextArea());
}

// helper function to insert canvas into the DOM
function addCanvasStep(canvas) {
	this.img.parentNode.insertBefore(canvas, this.img.parentNode.getElementsByTagName('div')[0]);
}

// let overwrite existing FX to insert the canvas into the DOM
var desaturate = Blend.factory.fx('context', function(ctx, amount) {
	Blend.fx.desaturate(ctx, amount);
	addCanvasStep.call(this, ctx.canvas);
});
var circleMask = Blend.factory.fx('context', function(ctx, data) {
	Blend.fx.circleMask(ctx, data);
	addCanvasStep.call(this, ctx.canvas);
});
var alpha = Blend.factory.fx('pixels', function(pixels, data) {
	var canvas = Blend.factory.canvas(pixels.width, pixels.height);
	var ctx = canvas.getContext('2d');
	Blend.fx.alpha(pixels, data);
	ctx.putImageData(pixels, 0, 0);
	addCanvasStep.call(this, ctx.canvas);
});

// callbacks to apply on images after loading
// var f3 = function(img) {
// 	var grid = new Blend.map.Grid2D(3, 3, [1/8, 1/4, 1/2, 3/4, 1, 3/4, 1/2, 0, 1/2]);
// 	var blender = new Blend.create(img, grid);
// 	blender.fx(circleMask).fx(desaturate);
// 	blender.map.removeCol();
// 	blender.map.removeCol();
// 	blender.map.removeRow();
// 	blender.map.removeRow();
// 	blender.fx(circleMask).update();
// }

// var f4 = function(img) {
// 	var tree = Blend.map.Tree2D([
// 		[										1],
// 		[					1/2, 									1/2],
// 		[		undefined, 			undefined, 				1/4, 				1/4],
// 		[undefined, undefined, undefined, undefined, undefined, undefined, 1/8, 1/8]
// 	]);
// 	var blender = Blend.create(img, tree);
// 	blender.fx(desaturate).fx(circleMask).update();
// }

$(document).ready(function() {
	// preload images
	var blends = [{
		source: 'qur2.jpg',
		title: 'Single area & 2 effects',
		grid: new Blend.map.Grid2D(1, 1, [1/4]),
		fxQueue: [alpha, circleMask]
	}, {
		source: 'qur2.jpg',
		title: '2 areas & 2 effects',
		grid: new Blend.map.Grid2D(2, 1, [1/2, 1/2]),
		fxQueue: [circleMask, alpha]
	}, {
		source: 'qur2.jpg',
		title: 'Multiple areas and multiple effects',
		grid: new Blend.map.Grid2D(2, 2, [1/4, 3/4, 3/4, 1/4]),
		fxQueue: [circleMask, desaturate]
	// }, {
	// 	source: 'qur2.jpg',
	// 	title: 'Irregular areas and multiple effects'
	}];

	var blendTpl = $('#blendTpl').template(),
		root = $('ul').parent();

	for (var i=0, bound=blends.length; i<bound; i++) {
		blendHelper(blends[i]);
	}

	function blendHelper(blend) {
		var tpl = $.tmpl(blendTpl, blend).appendTo(root);
		var img = tpl.find('img:last').attr('src', blend.source);
		if (blend.fxQueue && blend.fxQueue.length) {
			img.one('load', function() {
				var fxQueue = blend.fxQueue,
					blender = new Blend.create(img.get(0), blend.grid);
				for (var j=0, jmax=fxQueue.length; j<jmax; j++)
					blender.fx(fxQueue[j]);
				blender.update();
			});
		}
	}
});
