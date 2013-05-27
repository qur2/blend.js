# blend.js
The HTML5 image manipulation tool.


## Description
blend.js is a simple JS library used to partition images and let you apply effects on them. It uses a data structure (2D grid) to represent a map on which images are projected. You can then easily apply effects on image areas while the library handles partioning and looping for you.


## How does it work?
Firstly, create a grid for the image we want to blend:
```javascript
// Using jQuery to get an image, for example
var img = $('img')[0];
var blender = blend.blend(img, 2, 2);
```

Secondly, create an effect, which is a custom function that receives either a canvas context, either some pixels data.
In order to abstract this difference, we use one of the 2 factory functions provided:
```javascript
var contextfx = blend.cfx(function(context) {
	// Check HTML5 ImageData documentation to know more.
	return context;
});
var pixelfx = blend.pfx(function(pixels) {
	// Check HTML5 CanvasRenderingContext2D documentation to know more.
	return pixels;
});
```

Now, we're ready to modify the image, zone by zone:
```javascript
// apply the effects on each part (so it's called 4 times with a different context each time):
blender.fx(pixelfx).fx(contextfx);
// update the image
blender.update();
```

For more flexibility, we can pass any custom params:
```javascript
// create some effects that will use additional params
var colorfx = blend.cfx(function(color, context) { return context; });
var anglefx = blend.pfx(function(angle, radius, pixels) { return pixels; });

// one param means it is passed for every zone
blender.fx(colorfx, 'rgb(255, 123, 123)').fx(anglefx, [Math.PI, .25]);

// more than one param means each zone gets its own param
blender.fx(colorfx, '#FFF', '#AAA', '#666', '#111');

// null is used to skip zones
blender.fx(colorfx, '#FFF', null, null, '#111');

// update the image
blender.update();
```

If you're attentive, you see that custom params come first. So if you like to bind params before hand, you can:
```javascript
// bind a value to the first function param
var pianglefx = anglefx.bind(Math.PI);
// apply the fx with only the second param
blender.fx(pianglefx, .25);
// update the image
blender.update();
```


## Where are the effects?
The library provides some basic effects, under the `fx` namespace. You can refer to the `index.html` and the demo to see some of them.


## Any test?
Sure, for the main part (the blender and the grid). The effects are not tested yet.
You can see existing tests at http://qur2.github.com/blend.js/test.html


## Demo
See it working at http://qur2.github.com/blend.js


## License

(The MIT License)

Copyright (c) 2013 Aurélien Scoubeau

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
