# jsxdirect

A browser based JSX transpiler supporting entire script blocks, functions, and simple HTML.

# Usage

1) Load your front-end library that uses a virtual DOM.
2) Ensure you have an "h" function available as a property on an object, e.g. `preact.h`.
3) Define your functions in script blocks of type "text/jsx".
4) Compile your script blocks using `jsx.compile` and pass in the variable name associated with the object supporting "h".

The example below can be found in the `examples` directory.

```html
<html>
<head>
<script src="https://cdn.jsdelivr.net/npm/preact/dist/preact.js"></script>
<script src="../index.js"></script>

<script type="text/jsx">
class Clock extends preact.Component {
  render() {
	let time = new Date().toLocaleTimeString();
      return (<div>Time:<span>${ time }</span></div>);
  }
}
</script>

<script>
jsx.compile({env:"preact"});
</script>

</head>
<body>

<div id="clock"></div>
<div id="hello"></div>
<div id="cool"></div>

<script>
preact.render(new Clock().render(),document.getElementById("clock"));

preact.render(jsx(
		`<div id='foo'>
		<span> Hello, world! </span>
		<button onclick={ e => alert('hi!') }>Click Me</button>
		</div>`,{env:"preact"}),document.getElementById("hello"));
		
preact.render(jsx.compile({env:"preact"},"function() { return(<div>Pretty cool, huh?</div>) }")(),document.getElementById("cool"));
</script>

</body>
</html>
```

Or, as you can see above, wrap JSX in `jsx(<jsx string>,<options>)` and pass it directly to a VDOM consumer.

Or, compile functions containing JSX using `jsx.compile(<options>,<function definition string>)`, and pass the result of invoking them to a VDOM consumer.

# Credits

The JSX parser is based on the work of @stolksdorf.

# License

MIT

# Release History (reverse chronological order)

2018-06-25 v0.0.1 Initial public release
