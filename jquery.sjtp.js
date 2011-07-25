/**
 * Simple Javascript Template Parser
 * @author McFog <wxyuan90@gmail.com>
 * @license MIT License
 */
(function($) {

	/* Cross-Browser Split 1.0.1
	(c) Steven Levithan <stevenlevithan.com>; MIT License
	An ECMA-compliant, uniform cross-browser split method */
	var cbSplit;if(!cbSplit){cbSplit=function(a,b,c){if(Object.prototype.toString.call(b)!=="[object RegExp]"){return cbSplit._nativeSplit.call(a,b,c)}var d=[],lastLastIndex=0,flags=(b.ignoreCase?"i":"")+(b.multiline?"m":"")+(b.sticky?"y":""),b=RegExp(b.source,flags+"g"),separator2,match,lastIndex,lastLength;a=a+"";if(!cbSplit._compliantExecNpcg){separator2=RegExp("^"+b.source+"$(?!\\s)",flags)}if(c===undefined||+c<0){c=Infinity}else{c=Math.floor(+c);if(!c){return[]}}while(match=b.exec(a)){lastIndex=match.index+match[0].length;if(lastIndex>lastLastIndex){d.push(a.slice(lastLastIndex,match.index));if(!cbSplit._compliantExecNpcg&&match.length>1){match[0].replace(separator2,function(){for(var i=1;i<arguments.length-2;i++){if(arguments[i]===undefined){match[i]=undefined}}})}if(match.length>1&&match.index<a.length){Array.prototype.push.apply(d,match.slice(1))}lastLength=match[0].length;lastLastIndex=lastIndex;if(d.length>=c){break}}if(b.lastIndex===match.index){b.lastIndex++}}if(lastLastIndex===a.length){if(lastLength||!b.test("")){d.push("")}}else{d.push(a.slice(lastLastIndex))}return d.length>c?d.slice(0,c):d};cbSplit._compliantExecNpcg=/()??/.exec("")[1]===undefined;cbSplit._nativeSplit=String.prototype.split}String.prototype.split=function(a,b){return cbSplit(this,a,b)};

	var SJTP = {
		/**
		 * jQuery接口
		 * 解析并根据context渲染模板后置入当前jQuery对象内
		 * @param  mixed  templateCode 模板代码，可以是字符串或者DOM对象或者jQuery对象 
		 * @param  object context      上下文对象，其中的属性可以在模板内直接访问
		 * @param  object option       选项
		 * @return mixed  渲染失败返回false，否则继续返回当前jQuery对象支持链式操作
		 */
		'render':function(templateCode, context, option)
		{
			var $container = this;
			option = $.extend({
				//默认定界符为<< >>
				tagRE: /(<<([\s\S]+?)>>)/
			}, option||{});

			if('string' !== typeof templateCode) {
				templateCode = $(templateCode).html();
			}

			return $container.html(SJTP.parse(templateCode, option).call($container, context));
		},

		'parse':function(templateCode, option)
		{
			var tokens = templateCode.split(option.tagRE);
			var codes = ['var $container=this,htm=[],echo=function(){htm.push.apply(htm, arguments)};with(context){'];
			var _if = 0, _loop = 0, curTag = [];//记录当前标签和各标签嵌套深度
			while(tokens.length > 0)
			{
				var token = tokens.shift();
				if(token.length==0) continue;
				if(option.tagRE.test(token))
				{
					token = tokens.shift();
					var t = token.substr(0,1);
					if(t == ':')
					{//:exp
						var tk = token.substr(1);
						codes.push('echo('+tk+');');
						continue;
					} else if(t == '~')
					{//~statements
						var tk = token.substr(1);
						codes.push(tk+';');
						continue;
					}

					var tk = /^\s*?([\/\w]+)(?:\s+(.*))?$/g.exec(token);
					switch(tk[1])
					{
					case 'if':
						_if += 1;
						curTag.unshift('if');

						codes.push('if('+tk[2]+'){');
					break;
					case 'elif':
						codes.push('}else if('+tk[2]+'){');
					break;
					case 'else':
						switch(curTag[0])
						{
						case 'if':
							codes.push('}else{');
						break;
						default:
							return false;
						}
					break;
					case '/if':
						_if -= 1;
						if(_if<0) return false;
						if('if' != curTag.shift()) return false;

						codes.push('}');
					break;
					case 'loop':
						_loop += 1;
						curTag.unshift('loop');

						tk = tk[2].split(/\s+/);
						//codes.push('if($.isArray('+tk[0]+' ) && '+tk[0]+'.length>0) {');
						if(tk.length < 2)
						{
							return false;
						} else if(tk.length == 2) //loop OBJ val
						{
							codes.push('for(k in '+tk[0]+') {if(!'+tk[0]+'.hasOwnProperty(k))continue;var '+tk[1]+'='+tk[0]+'[k];');
						} else if(tk.length == 3) //loop OBJ key val
						{
							codes.push('for('+tk[1]+' in '+tk[0]+') {if(!'+tk[0]+'.hasOwnProperty('+tk[1]+'))continue;var '+tk[2]+'='+tk[0]+'['+tk[1]+'];');
						} else {
							return false;
						}
					break;
					case '/loop':
						_loop -= 1;
						if('loop' != curTag.shift()) return false;

						if(_loop<0) return false;
						codes.push('}');
					break;
					default:
						return false;
					}//switch
				} else {//literal
					codes.push('echo("'+token.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, '\\n')+'");');
				}
			}//while
			codes.push('}return htm.join("");');

			return new Function('context', codes.join(''));
		}
	};//JSTP
	$.fn.render = SJTP.render;
})(jQuery);
