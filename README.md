# jsxdirect v0.0.10

A browser based JSX transpiler supporting entire script blocks, functions, and simple HTML. You can also use string literal format `${}` instead of `{}` and compile DOM nodes and their children into render functions.

# Usage

1) Load `preact`,`react` or `hyperapp` (Other virtual DOM renderers are supported through options, see API section).

2) Define your functions in script blocks of type "text/jsx".

3) Compile your script blocks using `jsx.compile`.

4) Render your UI.

The example below can be found in the `examples/react.html`. You can also <a href="https://anywhichway.github.io/jsxdirect/examples/react.html" target="_blank">try it out</a>. Your JSX can use either `{}` or `${}` delimiters. The same examples exist in `preact.html` and `hyperapp.html`.

```html
<html>
<head>
<script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
<script src="../index.js"></script>

<script type="text/jsx">
class Clock extends React.Component {
  render() {
	let time = new Date().toLocaleTimeString();
      return (<div>Time:<span>${ time }</span></div>);
  }
}
</script>

<script>
jsx.compile();
</script>

</head>
<body>
<div id="directions">
	<p>View the source to see how this page works to compile JSX on the fly in the browser.</p>
	<p>Below is dynamically generated content:
		<ul>
			<li>React rendered clock</li>
			<li>React rendered inline JSX</li>
			<li>React rendered function invocation</li>
			<li>The body of this directions div as a function</li>
			<li>The VDOM of this directions div generated by the function</li>
			<li>React rendered repeat of this info</li>
		</ul>
	</p>
</div>
<div id="clock"></div>
<div id="hello"></div>
<div id="cool"></div>
<div><pre id="compiled"></pre></div>
<div><pre id="vdom"><pre></div>
<div id="repeat"></div>

<script>
ReactDOM.render(new Clock().render(),document.getElementById("clock"));


ReactDOM.render(jsx(
		`<div id='foo'>
		<span> Hello, world! </span>
		<button onclick={ e => alert('hi!') }>Click Me</button>
		</div>`),document.getElementById("hello"));
		
ReactDOM.render(jsx.compile("function() { return(<div>Pretty cool, huh?</div>) }")(),document.getElementById("cool"));
	
const compiled = jsx.compile("function() { return jsx(document.getElementById('directions').innerHTML) }");

document.getElementById("compiled").innerText = compiled+"";

document.getElementById("vdom").innerHTML = JSON.stringify({nodeName:"div",attributes:{},children:compiled()},2);

ReactDOM.render(React.createElement("div",{key:"test"},compiled()),document.getElementById("repeat"));

</script>

</body>
</html>
```

Or, as you can see above, wrap JSX in `jsx(<jsx string>,<options>)` and pass it directly to a VDOM consumer.

Or, compile functions containing JSX using `jsx.compile(<options>,<function definition string>)`, and pass the result of invoking them to a VDOM consumer.

# Differences From Standard JSX

`jsxdirect` should parse all standard JSX. It also supports the following:

1) 1) Access to variables inside quoted values via template literal notation, e.g. `<input value={myvalue}>` = `<input value="${myvalue}}">`. This allows for complex resolution like this: `<input value="display:block;float:${floatDirection ? floatDirection : 'normal'}"></div>`.

2) Automatic correction of `class=<value>` to `className=<value>` for React.

# API

`jsx('<jsx code>',options)` - converts the `<jsx code>` to a VDOM using the provided `options`.

`jsx.compile([options:object,][toCompile:string|...toCompile:HTMLScriptElements)` - 

  1) If `options` is not provided, it is infered from the local environment by looking for `preact`, `React`, `hyperapp` etc. The shape of options is `{env:string}`, where `env` is a string that is the same as the variable associated with an object having an `h` function, e.g. `"preact"`. `React` is automatically patched to have `h` equal `createElement`.
  
  ALPHA FEATURE: `options` can take an optional property `ctx` that provides context to the compiled JSX.
  
  2) If a string is provided to compile, only one can be provided. A function that returns a VDOM is then returned.
  
  3) If one or more `HTMLScriptElement` are provided, each is compiled. Script elements can contain regular JSX, there is no need to use `jsx(\`<jsx code>`)`.
  
  4) If no arguments are provided, the document is searched for scripts of type `text/jsx` and they are all compiled.


# License

MIT

# Release History (reverse chronological order)

2018-12-12 v0.0.10 Eliminated lower casing of tag names [issue 4](https://github.com/anywhichway/jsxdirect/issues/4).

2018-12-08 v0.0.9 Partial fix for [issue 3](https://github.com/anywhichway/jsxdirect/issues/3).

2018-12-08 v0.0.8 Patched to address [issue 2](https://github.com/anywhichway/jsxdirect/issues/2). Both `onclick="a => alert(a)"` and `onclick="{a => alert(a)}"` now work.

2018-07-10 v0.0.7 Improved event handler, e.g. onclick, parsing. Adjusted `${` so resolved variables when embedded in string and `{` when not.

2018-07-06 v0.0.6 Removed @stolksdorf parser. Reduced minimized and gzipped size from 1.8K to 1.2K.

2018-06-28 v0.0.4 Documentation updates.

2018-06-28 v0.0.3 Auto-config for `React` and `preact`. `hyperapp` support.

2018-06-27 v0.0.2 Documentation and example enhancements

2018-06-25 v0.0.1 Initial public release
