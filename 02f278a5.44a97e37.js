(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{123:function(e,n,t){"use strict";t.r(n),t.d(n,"frontMatter",(function(){return c})),t.d(n,"metadata",(function(){return s})),t.d(n,"rightToc",(function(){return i})),t.d(n,"default",(function(){return b}));var o=t(1),r=t(9),a=(t(0),t(146)),c={title:"Sync Pragmas"},s={id:"features/sync-pragmas",title:"Sync Pragmas",description:"Syncify supports per-os, per-host, and per-env inline settings and keybindings by using Sync Pragmas.",source:"@site/docs/features/sync-pragmas.mdx",permalink:"/vscode-syncify/docs/features/sync-pragmas",editUrl:"https://github.com/arnohovhannisyan/syncify-docs/edit/master/docs/features/sync-pragmas.mdx",lastUpdatedBy:"Arno Hovhannisyan",lastUpdatedAt:1578706927,sidebar:"docs",previous:{title:"Custom Extensions",permalink:"/vscode-syncify/docs/features/custom-extensions"},next:{title:"Common Terms",permalink:"/vscode-syncify/docs/common-terms"}},i=[{value:"Ignoring Certain Settings",id:"ignoring-certain-settings",children:[]},{value:"Keywords",id:"keywords",children:[{value:"<code>host</code>",id:"host",children:[]},{value:"<code>os</code>",id:"os",children:[]},{value:"<code>env</code>",id:"env",children:[]}]},{value:"Example Syntax",id:"example-syntax",children:[{value:"<code>settings.json</code>",id:"settingsjson",children:[]},{value:"<code>keybindings.json</code>",id:"keybindingsjson",children:[]}]},{value:"Setup Hostname",id:"setup-hostname",children:[]}],l={rightToc:i};function b(e){var n=e.components,t=Object(r.a)(e,["components"]);return Object(a.b)("wrapper",Object(o.a)({},l,t,{components:n,mdxType:"MDXLayout"}),Object(a.b)("p",null,"Syncify supports per-os, per-host, and per-env inline settings and keybindings by using Sync Pragmas."),Object(a.b)("h2",{id:"ignoring-certain-settings"},"Ignoring Certain Settings"),Object(a.b)("p",null,"You can ignore certain properties in any ",Object(a.b)("inlineCode",{parentName:"p"},"json")," file by placing the ",Object(a.b)("inlineCode",{parentName:"p"},"@sync-ignore")," pragma above it."),Object(a.b)("pre",null,Object(a.b)("code",Object(o.a)({parentName:"pre"},{className:"language-json"}),'// settings.json\n\n{\n  // @sync-ignore\n  "window.zoomLevel": 1 /* won\'t upload to gist */\n}\n')),Object(a.b)("pre",null,Object(a.b)("code",Object(o.a)({parentName:"pre"},{className:"language-json"}),'// keybindings.json\n\n[\n  // @sync-ignore\n  {\n    "key": "alt+v",\n    "command": "workbench.action.closeActiveEditor",\n    "when": "editorTextFocus"\n  } /* won\'t upload to gist */\n]\n')),Object(a.b)("h2",{id:"keywords"},"Keywords"),Object(a.b)("p",null,"There are 3 different keywords that can be used with Sync Pragmas:"),Object(a.b)("ul",null,Object(a.b)("li",{parentName:"ul"},Object(a.b)("inlineCode",{parentName:"li"},"host")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("inlineCode",{parentName:"li"},"os")),Object(a.b)("li",{parentName:"ul"},Object(a.b)("inlineCode",{parentName:"li"},"env"))),Object(a.b)("h3",{id:"host"},Object(a.b)("inlineCode",{parentName:"h3"},"host")),Object(a.b)("p",null,"After ",Object(a.b)("a",Object(o.a)({parentName:"p"},{href:"#setup-hostname"}),"configuring a hostname")," for your computer, you can use the ",Object(a.b)("inlineCode",{parentName:"p"},"host")," keyword to only include certain parts of your configuration on that specific computer."),Object(a.b)("pre",null,Object(a.b)("code",Object(o.a)({parentName:"pre"},{className:"language-json"}),'// settings.json on "home" computer\n\n{\n  // @sync host=home\n  "window.zoomLevel": 1\n}\n')),Object(a.b)("h3",{id:"os"},Object(a.b)("inlineCode",{parentName:"h3"},"os")),Object(a.b)("p",null,"The ",Object(a.b)("inlineCode",{parentName:"p"},"os")," keyword can also be used to only include certain parts of your configuration."),Object(a.b)("p",null,"Currently, there are 3 operating systems supported:"),Object(a.b)("ul",null,Object(a.b)("li",{parentName:"ul"},"windows"),Object(a.b)("li",{parentName:"ul"},"linux"),Object(a.b)("li",{parentName:"ul"},"mac")),Object(a.b)("pre",null,Object(a.b)("code",Object(o.a)({parentName:"pre"},{className:"language-json"}),'// settings.json on linux\n\n{\n  // @sync os=linux\n  "window.zoomLevel": 1\n}\n')),Object(a.b)("h3",{id:"env"},Object(a.b)("inlineCode",{parentName:"h3"},"env")),Object(a.b)("p",null,"Syncify can check for the existence of environmental variables using ",Object(a.b)("a",Object(o.a)({parentName:"p"},{href:"https://nodejs.org/api/process.html#process_process_env"}),Object(a.b)("inlineCode",{parentName:"a"},"process.env"))," to only include certain parts of your configuration."),Object(a.b)("pre",null,Object(a.b)("code",Object(o.a)({parentName:"pre"},{className:"language-json"}),'// settings.json on a computer with the environmental variable "CODE_ZOOM_1" set\n\n{\n  // @sync env=CODE_ZOOM_1\n  "window.zoomLevel": 1\n}\n')),Object(a.b)("h2",{id:"example-syntax"},"Example Syntax"),Object(a.b)("h3",{id:"settingsjson"},Object(a.b)("inlineCode",{parentName:"h3"},"settings.json")),Object(a.b)("pre",null,Object(a.b)("code",Object(o.a)({parentName:"pre"},{className:"language-json"}),'// settings.json on "home" computer running Linux\n\n{\n  // @sync host=home os=linux\n  "window.zoomLevel": 1\n  // @sync host=work os=windows\n  // "window.zoomLevel": "0",\n}\n')),Object(a.b)("pre",null,Object(a.b)("code",Object(o.a)({parentName:"pre"},{className:"language-json"}),'// settings.json on "work" computer running Windows\n\n{\n  // @sync host=home os=linux\n  // "window.zoomLevel": 1,\n  // @sync host=work os=windows\n  "window.zoomLevel": "0"\n}\n')),Object(a.b)("pre",null,Object(a.b)("code",Object(o.a)({parentName:"pre"},{className:"language-json"}),'// settings.json on "work-pc" running Linux\n\n{\n  // @sync os=linux host=work-pc\n  "python.autoComplete.extraPaths": [\n    "/blah/blah/python2.7/site-packages",\n    "/usr/lib/python2.7/site-packages"\n  ]\n  // @sync os=windows host=home-pc\n  // "python.autoComplete.extraPaths": [\n  //   "C:\\\\Program Files\\\\blah\\\\site-packages",\n  // ],\n}\n')),Object(a.b)("h3",{id:"keybindingsjson"},Object(a.b)("inlineCode",{parentName:"h3"},"keybindings.json")),Object(a.b)("pre",null,Object(a.b)("code",Object(o.a)({parentName:"pre"},{className:"language-json"}),'// keybindings.json on "home" computer running macOS\n\n[\n  // @sync host=home os=mac\n  {\n    "key": "alt+v",\n    "command": "workbench.action.closeActiveEditor",\n    "when": "editorTextFocus"\n  }\n  // @sync host=work os=linux env=CODE_WORK\n  // {\n  //   "key": "alt+q",\n  //   "command": "workbench.action.closeActiveEditor",\n  //   "when": "editorTextFocus"\n  // }\n]\n')),Object(a.b)("pre",null,Object(a.b)("code",Object(o.a)({parentName:"pre"},{className:"language-json"}),'// keybindings.json on "work" computer running Linux\n\n[\n  // @sync host=home os=mac\n  // {\n  //   "key": "alt+v",\n  //   "command": "workbench.action.closeActiveEditor",\n  //   "when": "editorTextFocus"\n  // },\n  // @sync host=work os=linux env=CODE_WORK\n  {\n    "key": "alt+q",\n    "command": "workbench.action.closeActiveEditor",\n    "when": "editorTextFocus"\n  }\n]\n')),Object(a.b)("h2",{id:"setup-hostname"},"Setup Hostname"),Object(a.b)("p",null,"Visit the ",Object(a.b)("a",Object(o.a)({parentName:"p"},{href:"../getting-started/configuring#hostname"}),"Settings Guide")," to learn how to configure the hostname."))}b.isMDXComponent=!0},146:function(e,n,t){"use strict";t.d(n,"a",(function(){return p})),t.d(n,"b",(function(){return m}));var o=t(0),r=t.n(o);function a(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function c(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);n&&(o=o.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,o)}return t}function s(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?c(Object(t),!0).forEach((function(n){a(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):c(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function i(e,n){if(null==e)return{};var t,o,r=function(e,n){if(null==e)return{};var t,o,r={},a=Object.keys(e);for(o=0;o<a.length;o++)t=a[o],n.indexOf(t)>=0||(r[t]=e[t]);return r}(e,n);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(o=0;o<a.length;o++)t=a[o],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(r[t]=e[t])}return r}var l=r.a.createContext({}),b=function(e){var n=r.a.useContext(l),t=n;return e&&(t="function"==typeof e?e(n):s({},n,{},e)),t},p=function(e){var n=b(e.components);return r.a.createElement(l.Provider,{value:n},e.children)},u={inlineCode:"code",wrapper:function(e){var n=e.children;return r.a.createElement(r.a.Fragment,{},n)}},d=Object(o.forwardRef)((function(e,n){var t=e.components,o=e.mdxType,a=e.originalType,c=e.parentName,l=i(e,["components","mdxType","originalType","parentName"]),p=b(t),d=o,m=p["".concat(c,".").concat(d)]||p[d]||u[d]||a;return t?r.a.createElement(m,s({ref:n},l,{components:t})):r.a.createElement(m,s({ref:n},l))}));function m(e,n){var t=arguments,o=n&&n.mdxType;if("string"==typeof e||o){var a=t.length,c=new Array(a);c[0]=d;var s={};for(var i in n)hasOwnProperty.call(n,i)&&(s[i]=n[i]);s.originalType=e,s.mdxType="string"==typeof e?e:o,c[1]=s;for(var l=2;l<a;l++)c[l]=t[l];return r.a.createElement.apply(null,c)}return r.a.createElement.apply(null,t)}d.displayName="MDXCreateElement"}}]);