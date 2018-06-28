(function() {
	/* tokenizer and parser
	Copyright 2017 stolksdorf, 2018 AnyWhichWay, LLC

	Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is
	hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE
	INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE 
	FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
	OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING
	OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
	*/
	/* all other code
	Copyright 2018 AnyWhichWay, LLC

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
	documentation files (the "Software"), to deal in the Software without restriction, including without limitation
	the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
	and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
	Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
	THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
	TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	*/
	const WHITESPACE = /(\s|\t|\n|\r)/g;
	const NUMBERS = /[0-9]/;
	const NAME = /[0-9a-zA-Z_\.]/;

	const tokenize = (input)=>{
		let tokens = [];
		let current = 0;
		let inTag = false;

		while(current < input.length){
			let char = input[current];

			const getToken = function(regex){
				let value = '';
				while(regex.test(char) && current < input.length){
					value += char;
					char = input[++current];
				}
				return value;
			}

			const getCode = ()=>{
				let code = '';
				let braceCount = 1;
				while(braceCount > 0 && current < input.length){
					char = input[++current];
					if(char == '{') braceCount++;
					if(char == '}') braceCount--;
					code += char
				}
				return code.slice(0,-1).trim();
			};
			if(char == "$" && input[current+1]=="{") {
				current++;
				continue;
			}
			if(inTag){
				if(char == '>'){
					inTag = false;
					tokens.push({ type : 'closeTag' })
				}
				else if(char == '/' && input[current+1] == '>'){
					inTag = false;
					tokens.push({ type : 'endTag' })
					current++;
				}
				else if(char == '='){
					tokens.push({ type : 'equals' });
				}
				else if(char == '{'){
					tokens.push({
						type : 'code',
						value : getCode()
					})
				}
				else if(WHITESPACE.test(char)){

				}
				else if(NUMBERS.test(char)){
					tokens.push({
						type : 'number',
						value : Number(getToken(NUMBERS))
					});
					current--;
				}
				else if(NAME.test(char)){
					const word = getToken(NAME);
					if(word == 'true' || word == 'false'){
						tokens.push({
							type : 'boolean',
							value : word == 'true'
						});
					}else{
						tokens.push({
							type : 'word',
							value : word
						});
					}
					current--;
				}
				else if(char == "'"){
					char = input[++current]
					tokens.push({
						type : 'text',
						value : getToken(/[^\']/)
					});
				}
				else if(char == '"'){
					char = input[++current]
					tokens.push({
						type : 'text',
						value : getToken(/[^\"]/)
					});
				}
			}
			//Not tokenizing a tag definition
			else{
				//End tag
				if(char == '<' && input[current+1] == '/'){
					char = input[++current]
					char = input[++current]
					tokens.push({
						type : 'endTag',
						value : getToken(NAME)
					})
				}
				else if(char == '<'){
					inTag = true;
					char = input[++current];
					tokens.push({
						type : 'openTag',
						value : getToken(NAME)
					})
					current--;
				}
				else{
					//Handle slush text
					let value = '';
					while(char != '<' && current < input.length){
						value += char;
						char = input[++current];
					}
					value = value.trim()
					if(value){
						tokens.push({
							type : 'text',
							value : value
						});
					}
					current--;
				}
			}
			current++;
		}
		return tokens;
	}

	const parse = (tokens,options)=>{
		let nodes = [];
		let current = 0;
		let token = tokens[current];
		
		options = Object.assign({useEval:true},options);

		const parseProps = ()=>{
			let props = {};
			let key = null;
			let last = null;

			while(current < tokens.length && token.type != 'endTag' && token.type != 'closeTag'){
				if(token.type!='slashComment' && token.type!=='starComment') {
					if(last && token.type == 'word'){
						props[last] = true;
						last = token.value;
					}else if(!key && token.type == 'word'){
						last = token.value;
					}else if(last && token.type == 'equals'){
						key = last;
						last = null;
					}else if(key && token.type == 'code'){
						if(options.useEval){
							props[key] = eval(`(()=>{ return ${token.value}})()`);
						}else{
							props[key] = token.value;
						}
						key = null;
						last = null;
					}else if(key && (token.type == 'number' || token.type == 'text' || token.type == 'boolean')){
						props[key] = token.value;
						key = null;
						last = null;
					}else{
						throw `Invalid property value: ${key}=${token.value}`;
					}
				}
				token = tokens[++current];
			}
			if(last) props[last] = true;
			return props;
		}

		const genNode = (tagType)=>{
			token = tokens[++current];
			const props = parseProps();
			if(options.env==="React" && !props.key) props.key = props.id || (Math.random()+"").substring(2);
			const node = options.h(tagType,props,getChildren(tagType));
			return node;
		};

		const getChildren = (tagType)=>{
			let children = [];
			while(current < tokens.length){
				if(token.type == 'endTag'){
					if(token.value && token.value != tagType){
						throw `Invalid closing tag: ${token.value}. Expected closing tag of type: ${tagType}`
					}else{
						break;
					}
				}
				if(token.type == 'openTag'){
					children.push(genNode(token.value));
				}else if(token.type == 'text'){
					children.push(token.value);
				}
				token = tokens[++current];
			}
			return children;
		}

		const result = getChildren();
		if(result.length == 1) return result[0];
		return result;
	};
	
	function toScript(vdom,options={},jsx) {
		const prefix = (options.env ? options.env+"." : "");
		let txt = "";
		if(Array.isArray(vdom)) {
			vdom.forEach((item,i) => txt += `${toScript(item,options,jsx)}`);
		} else if(vdom && typeof(vdom)==="object"){
			const anames = Object.keys(vdom.attributes);
			txt += `${prefix}h("${vdom.nodeName}",{${anames.reduce((accum,key) => accum +=`${key}:${vdom.attributes[key][0]==="{" ? "\`$" : "\""}${vdom.attributes[key]}${vdom.attributes[key][0]==="{" ? "\`" : "\""},`,"")}`;
			if(anames.length>0) txt = txt.substring(0,txt.length-1);
			txt += "}";
			if(vdom.children.length>0) txt += ",[].concat(";
			let opened = false,
				open = 0,
				close = false;
			vdom.children.forEach((child,i) => {
				if(typeof(child)==="string") {
					if(child[0]==="{") {
						txt += `\`\$${child}`;
						if(txt[txt.length-1]==="}") txt += "\`";
						else {
							opened = true;
							open++;
						}
					}
					else {
						if(child[child.length-1]==="}" && txt[txt.length-1]===",") txt = txt.substring(0,txt.length-1);
						txt += opened ? child : `"${child}"`;
						if(txt[txt.length-1]==="}") open--;
						if(jsx && opened && open===0) {
							txt += "\`"
							opened = false;
						}
						if(i<vdom.children.length-1) txt += ",";
						else txt += ",";
					}
				}
				else {
					txt += `${toScript(child,options,true)}`;
					if(i<vdom.children.length-1) txt += ",";
				}
			})
			if(txt[txt.length-1]===",") txt = txt.substring(0,txt.length-1);
			if(vdom.children.length>0) txt +=")";
			txt += ")";
		} else {
			txt += vdom;
		}
		return txt;
	}
	const H = (nodeName,attributes={},...children) => {
		const vnode = {nodeName,attributes};
		if(children.length===1) {
			if(Array.isArray(children[0])) children = children[0];
			else children = [children[0]];
		}
		vnode.children = children;
		return vnode;
	}
	let h = H,
		env;
	if(typeof(React)!=="undefined") { env = "React"; React.h = React.createElement; }
	else if(typeof(preact)!=="undefined") { env = "preact"; }
	else if(typeof(hyperapp)!=="undefined") { env = "hyperapp"; }
	const jsx = (string,options={}) => {
		options = Object.assign({},options);
		if(!options.env) options.env = env;
		if(!options.h) options.h = Function("return " + options.env + ".h")() || H;
		return parse(tokenize(string),options);
	}
	jsx.compile = (options,...scripts) => {
		const type = typeof(options);
		if(type==="string" || (options && type==="object" && options instanceof HTMLElement)) {
			scripts.unshift(options);
			options = {};
		} else {
			options = Object.assign({},options);
		}
		if(!options.env) options.env = env;
		if(!options.h) options.h = Function("return " + options.env + ".h")() || H;
		if(typeof(document)==="undefined") document = options.document;
		if(scripts.length===0) {
			scripts = document.querySelectorAll("[type='text/jsx']");
		}
		if(scripts.length===1 && typeof(scripts[0])==="string") {
			const vdom = jsx(scripts[0],{h:H}), // always use default h;
				script = toScript(vdom,options);
			return Function("return " + script)();
		}
		scripts.forEach(el => {
			const vdom = jsx(el.innerHTML,{h:H}), // always use default h;
				script = toScript(vdom,options),
				node = document.createElement("script");
			for(const attr of [].slice.call(el.attributes)) node.setAttribute(attr.name,el.attributes[attr.name]);
			node.type = "text/javascript";
			node.innerHTML = script;
			el.parentElement.replaceChild(node,el);
		});
	}
	if(typeof(module)!=="undefined") module.exports = jsx;
	if(typeof(window)!=="undefined") { (window.jsx || (window.jsx = jsx)); window.jsxdirect = jsx; };
}).call(this);