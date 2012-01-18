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
function circleMask(ctx, amount) {
	addCanvasStep.call(this, ctx.canvas);
	return Blend.fx.circleMask(ctx, amount);
}
function desaturate(ctx, amount) {
	addCanvasStep.call(this, ctx.canvas);
	return Blend.fx.desaturate(ctx, amount);
}
function alpha(ctx, amount) {
	addCanvasStep.call(this, ctx.canvas);
	return Blend.fx.alpha(ctx, amount);
}

// callbacks to apply on images after loading
var callbacks = [];

var f1 = function(img) {
	var grid = Blend.map.Grid2D(1, 1, [1/4]);
	var blender = Blend.create(img, grid);
	blender.fx(alpha).fx(circleMask).update();
}
callbacks.push(f1);

var f2 = function(img) {
	var grid = Blend.map.Grid2D(2, 1, [1/2, 1/2]);
	var blender = Blend.create(img, grid);
	blender.fx(circleMask).fx(alpha).update();
}
callbacks.push(f2);

var f3 = function(img) {
	var grid = Blend.map.Grid2D(3, 3, [1/8, 1/4, 1/2, 3/4, 1, 3/4, 1/2, 0, 1/2]);
	var blender = Blend.create(img, grid);
	blender.fx(circleMask).fx(desaturate);
	blender.map.removeCol();
	blender.map.removeCol();
	blender.map.removeRow();
	blender.map.removeRow();
	blender.fx(circleMask).update();
}
callbacks.push(f3);

var f4 = function(img) {
	var tree = Blend.map.Tree2D([
		[										1],
		[					1/2, 									1/2],
		[		undefined, 			undefined, 				1/4, 				1/4],
		[undefined, undefined, undefined, undefined, undefined, undefined, 1/8, 1/8]
	]);
	var blender = Blend.create(img, tree);
	blender.fx(desaturate).fx(circleMask).update();
}
callbacks.push(f4);

// callback handling images after loading
function imgLoadHandler(images) {
	var els = document.getElementById('content').getElementsByTagName('h2');
	for (var i in images) {
		var img = images[i], container = els[i].parentNode, f = callbacks[i];
		insertDomElem(container, 'h4', 'Original and Result :');
		insertDomElem(container, 'img', false, {'src' : 'qur2.jpg'});
		container.appendChild(img);
		insertDomElem(container, 'h4', 'Computation steps :');
		insertDomElem(container, 'div', false, {'className' : 'clear'});
		f(img);
	}
}

// helper function to add an HTML tag more easily
function insertDomElem(parent, tag, inner, attr) {
	var el = document.createElement(tag);
	if (inner)
		el.appendChild(document.createTextNode(inner));
	for (var a in attr)
		el[a] = attr[a];
	parent.appendChild(el)
}

// define vars for preloader
var sources = ['qur2.jpg', 'qur2.jpg', 'qur2.jpg', 'qur2.jpg'];
var ip = null;

// callback handling body after loading
function bodyLoadHandler(sources) {
	var ip = new ImagePreloader(sources, imgLoadHandler);
// 	// if (sources.length == count)
}
