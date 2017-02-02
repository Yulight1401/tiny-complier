'use strict'
function tokenizer(input){
	let current = 0; //a code cursor
	let tokens = []; //a toekn stack
	while(current<input.length){//read all string
		let char = input[current];
		if(char == '('){
			tokens.push({        //push a map of a token
				type:'paren',
				value:'(',
			});
			current++;        //cursor position plus
			continue;
		}
		if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
      });
      current++;
      continue;
    }
		let WHITESPACE = /\s/;//space
    if (WHITESPACE.test(char)) { //if it's space continue
      current++;
      continue;
    }
		let NUMBERS = /[0-9]/ //one of 0-9
		if (NUMBERS.test(char)){
			let value = '';
			while (NUMBERS.test(char)) {
					value += char;
					char = input[++current]; //get all the num
			}
			tokens.push({
				type: 'number',
				value
			});
			continue;
		}
		if (char == '"'){
			let value = '';
			char = input[++current];
			while (char !== '"') {
				value += char ;
				char = input[++current];
			}
			char = input[++current];
			tokens.push({
				type: 'string',
				value
			});
			continue;
		}
		let LETTERS = /[a-z]/i; //ignore case a-z LETTERS
		if (LETTERS.test(char)){
			let value = '';
			white (LETTERS.test(char)){
				value += char;
				char = input[++current];
			}
			tokens.push({
				type: 'name',
				value
			});
			continue;
		}
		throw new TypeError('Unknow character :' + char);
	}
	return tokens;
}
function parser(tokens){
	let current = 0;//array position
	function walk(){ //recursion function to build abstrat sysnatax tree
		let token = tokens[current];
		if (token == 'number'){
			current++;
			return {
        type: 'NumberLiteral',
        value: token.value,
      };
		}
		if (token == 'string'){
			current++;
      return {
        type: 'StringLiteral',
        value: token.value,
      };
		}
		if (
		token.type === 'paren' &&
		token.value === '('
		){
			token = tokens[++current]; // jump the paren
			let node = {
				type: 'CallExpression',
				name: token.value,
				params: [],
			};
			token = tokens[++current];
			while (
				(token.type !== 'paren') ||
				(token.type === 'paren' && token.value !== ')')
			) {
				node.params.push(walk());
				token = tokens[current];
			}
			current++;
			return node;
		}
		throw new TypeError('unknow token type :' + token.type);
	}
	let ast = {
    type: 'Program',
    body: [],
  };
	while (current < tokens.length) {
    ast.body.push(walk());
  }
	return ast;
}
function traverser(ast, visitor) {
	function traverserArray(array, parent) {
		array.forEach(child => {
			traverserNode(child, parent);
		});
	}
	function traverseNode(node, parent) {
    let methods = visitor[node.type];
    if (methods && methods.enter) {
      methods.enter(node, parent);
    }
    switch (node.type) {
      case 'Program':
        traverseArray(node.body, node);
        break;
      case 'CallExpression':
        traverseArray(node.params, node);
        break;
      case 'NumberLiteral':
      case 'StringLiteral':
        break;
      default:
        throw new TypeError(node.type);
    }
    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }
 traverseNode(ast, null);
}
function transformer(ast) {
  let newAst = {
    type: 'Program',
    body: [],
  };
  ast._context = newAst.body;
  traverser(ast, {
    NumberLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'NumberLiteral',
          value: node.value,
        });
      },
    },
    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'StringLiteral',
          value: node.value,
        });
      },
    },
    CallExpression: {
      enter(node, parent) {
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };
        node._context = expression.arguments;
        if (parent.type !== 'CallExpression') {
          expression = {
            type: 'ExpressionStatement',
            expression: expression,
          };
        }
        parent._context.push(expression);
      },
    }
  });
  return newAst;
}
function codeGenerator(node) {
  switch (node.type) {
    case 'Program':
      return node.body.map(codeGenerator)
        .join('\n');
    case 'ExpressionStatement':
      return (
        codeGenerator(node.expression) +
        ';'
      );
    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map(codeGenerator)
          .join(', ') +
        ')'
      );
    case 'Identifier':
      return node.name;
    case 'NumberLiteral':
      return node.value;
    case 'StringLiteral':
      return '"' + node.value + '"';
    default:
      throw new TypeError(node.type);
  }
}
function compiler(input) {
  let tokens = tokenizer(input);
  let ast    = parser(tokens);
  let newAst = transformer(ast);
  let output = codeGenerator(newAst);
  return output;
}
module.exports = {
  tokenizer,
  parser,
  traverser,
  transformer,
  codeGenerator,
  compiler,
};
