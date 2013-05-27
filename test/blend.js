function mockImg() {
	var img = document.createElement('img');
	img.src = '/assets/qur2.jpg';
	img.width = 50;
	img.height = 50;
	return img;
}
describe('blend.js', function() {
	describe('grid', function() {
		var grid;
		beforeEach(function(done) {
			grid = blend.grid();
			done();
		});
		it('should have 1 cell', function(done) {
			expect(grid.length).to.equal(1);
			expect(grid.cols).to.equal(1);
			expect(grid.rows).to.equal(1);
			done();
		});
		it('should be resizable: add cols', function(done) {
			grid.addCol(2);
			expect(grid.length).to.equal(3);
			expect(grid.cols).to.equal(3);
			expect(grid.rows).to.equal(1);
			done();
		});
		it('should be resizable: add rows', function(done) {
			grid.addRow(3);
			expect(grid.length).to.equal(4);
			expect(grid.cols).to.equal(1);
			expect(grid.rows).to.equal(4);
			done();
		});
		it('should be resizable: remove cols', function(done) {
			grid.addCol(2).removeCol(1);
			expect(grid.length).to.equal(2);
			expect(grid.cols).to.equal(2);
			expect(grid.rows).to.equal(1);
			done();
		});
		it('should be resizable: remove rows', function(done) {
			grid.addRow(3).removeRow(1);
			expect(grid.length).to.equal(3);
			expect(grid.cols).to.equal(1);
			expect(grid.rows).to.equal(3);
			done();
		});
		it('should have at least 1 cell', function(done) {
			expect(grid.removeRow).to.throw();
			done();
		});
		it('overlays a rectangle', function(done) {
			grid.project(100, 100);
			expect(grid.projectedWidth).to.equal(100);
			expect(grid.projectedHeight).to.equal(100);
			done();
		});
		it('partitions a rectangle', function(done) {
			var cell;
			grid.project(90, 100);
			grid.addRow().addCol();
			cell = grid.cell(0);
			expect(cell.x).to.equal(0);
			expect(cell.y).to.equal(0);
			expect(cell.w).to.equal(45);
			expect(cell.h).to.equal(50);
			cell = grid.cell(1);
			expect(cell.x).to.equal(45);
			expect(cell.y).to.equal(0);
			expect(cell.w).to.equal(45);
			expect(cell.h).to.equal(50);
			cell = grid.cell(2);
			expect(cell.x).to.equal(0);
			expect(cell.y).to.equal(50);
			expect(cell.w).to.equal(45);
			expect(cell.h).to.equal(50);
			cell = grid.cell(3);
			expect(cell.x).to.equal(45);
			expect(cell.y).to.equal(50);
			expect(cell.w).to.equal(45);
			expect(cell.h).to.equal(50);
			done();
		});
		it('handles odd size partition', function(done) {
			var cell;
			grid.project(91, 101);
			grid.addRow().addCol();
			cell = grid.cell(0);
			expect(cell.x).to.equal(0);
			expect(cell.y).to.equal(0);
			expect(cell.w).to.equal(45);
			expect(cell.h).to.equal(50);
			cell = grid.cell(1);
			expect(cell.x).to.equal(45);
			expect(cell.y).to.equal(0);
			expect(cell.w).to.equal(46);
			expect(cell.h).to.equal(50);
			cell = grid.cell(2);
			expect(cell.x).to.equal(0);
			expect(cell.y).to.equal(50);
			expect(cell.w).to.equal(45);
			expect(cell.h).to.equal(51);
			cell = grid.cell(3);
			expect(cell.x).to.equal(45);
			expect(cell.y).to.equal(50);
			expect(cell.w).to.equal(46);
			expect(cell.h).to.equal(51);
			done();
		});
	});
	describe('blend', function() {
		it('can be initialize with a grid', function(done) {
			var grid = blend.grid(1, 1);
			var blender = blend.blend(mockImg(), grid);
			expect(blender.map instanceof grid.constructor).to.equal(true);
			done();
		});
		it('can build a grid at init time', function(done) {
			var blender = blend.blend(mockImg(), 5, 4);
			expect(blender.map instanceof blend.grid().constructor).to.equal(true);
			expect(blender.map.cols).to.equal(5);
			expect(blender.map.rows).to.equal(4);
			done();
		});
		it('calls an fx with region coordinates', function(done) {
			var blender = blend.blend(mockImg(), 2, 2);
			var rawfx = sinon.spy();
			blender.fx(rawfx);
			expect(rawfx.callCount).to.equal(4);
			expect(rawfx.args[0]).to.eql([0, 0, 25, 25]);
			expect(rawfx.args[1]).to.eql([25, 0, 25, 25]);
			expect(rawfx.args[2]).to.eql([0, 25, 25, 25]);
			expect(rawfx.args[3]).to.eql([25, 25, 25, 25]);
			done();
		});
		it('calls an fx with region coordinates and single arg', function(done) {
			var blender = blend.blend(mockImg(), 2, 2);
			var rawfx = sinon.spy();
			blender.fx(rawfx, true);
			expect(rawfx.callCount).to.equal(4);
			expect(rawfx.args[0]).to.eql([0, 0, 25, 25, [true]]);
			expect(rawfx.args[1]).to.eql([25, 0, 25, 25, [true]]);
			expect(rawfx.args[2]).to.eql([0, 25, 25, 25, [true]]);
			expect(rawfx.args[3]).to.eql([25, 25, 25, 25, [true]]);
			done();
		});
		it('calls an fx with region coordinates and single complex arg', function(done) {
			var blender = blend.blend(mockImg(), 2, 2);
			var rawfx = sinon.spy();
			blender.fx(rawfx, [.5, .25]);
			expect(rawfx.callCount).to.equal(4);
			expect(rawfx.args[0][4]).to.eql([.5, .25]);
			expect(rawfx.args[1][4]).to.eql([.5, .25]);
			expect(rawfx.args[2][4]).to.eql([.5, .25]);
			expect(rawfx.args[3][4]).to.eql([.5, .25]);
			done();
		});
		it('calls an fx with region coordinates and multiple args', function(done) {
			var blender = blend.blend(mockImg(), 2, 2);
			var rawfx = sinon.spy();
			blender.fx(rawfx, 1, 2, 3, 4);
			expect(rawfx.callCount).to.equal(4);
			expect(rawfx.args[0]).to.eql([0, 0, 25, 25, [1]]);
			expect(rawfx.args[1]).to.eql([25, 0, 25, 25, [2]]);
			expect(rawfx.args[2]).to.eql([0, 25, 25, 25, [3]]);
			expect(rawfx.args[3]).to.eql([25, 25, 25, 25, [4]]);
			done();
		});
		it('calls an fx with region coordinates and incomplete args', function(done) {
			var blender = blend.blend(mockImg(), 2, 2);
			var rawfx = sinon.spy();
			blender.fx(rawfx, 0, null, false, null);
			expect(rawfx.callCount).to.equal(2);
			expect(rawfx.args[0]).to.eql([0, 0, 25, 25, [0]]);
			expect(rawfx.args[1]).to.eql([0, 25, 25, 25, [false]]);
			done();
		});
	});
	describe('factory', function() {
		it('provide context fx wrapper', function(done) {
			var blender = blend.blend(mockImg(), 2, 2);
			var spy = sinon.spy();
			var fx = blend.cfx(spy);
			blender.fx(fx, Math.PI);
			expect(spy.callCount).to.equal(4);
			expect(spy.args[0].length).to.equal(2);
			expect(spy.args[0][0]).to.equal(Math.PI);
			expect(spy.args[0][1] instanceof CanvasRenderingContext2D).to.equal(true);
			done();
		});
		it('provide pixels data fx wrapper', function(done) {
			var blender = blend.blend(mockImg(), 2, 2);
			var spy = sinon.spy();
			var fx = blend.pfx(spy);
			blender.fx(fx, Math.PI);
			expect(spy.callCount).to.equal(4);
			expect(spy.args[0].length).to.equal(2);
			expect(spy.args[0][0]).to.equal(Math.PI);
			expect(spy.args[0][1] instanceof ImageData).to.equal(true);
			done();
		});
	});
});
