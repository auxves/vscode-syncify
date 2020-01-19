(window.webpackJsonp=window.webpackJsonp||[]).push([[12],{137:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return a})),n.d(t,"metadata",(function(){return c})),n.d(t,"rightToc",(function(){return s})),n.d(t,"default",(function(){return u}));var r=n(1),i=n(9),o=(n(0),n(148)),a={title:"Prerequisites"},c={id:"getting-started/prerequisites",title:"Prerequisites",description:"## Repo Syncer",source:"@site/docs/getting-started/prerequisites.md",permalink:"/vscode-syncify/docs/getting-started/prerequisites",editUrl:"https://github.com/arnohovhannisyan/syncify-docs/edit/master/docs/getting-started/prerequisites.md",lastUpdatedBy:"Arno Hovhannisyan",lastUpdatedAt:1579474148,sidebar:"docs",previous:{title:"Installation",permalink:"/vscode-syncify/docs/getting-started/installation"},next:{title:"Setup",permalink:"/vscode-syncify/docs/getting-started/setup"}},s=[{value:"Repo Syncer",id:"repo-syncer",children:[{value:"Install Git",id:"install-git",children:[]},{value:"Configure Git",id:"configure-git",children:[]}]}],l={rightToc:s};function u(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(o.b)("wrapper",Object(r.a)({},l,n,{components:t,mdxType:"MDXLayout"}),Object(o.b)("h2",{id:"repo-syncer"},"Repo Syncer"),Object(o.b)("p",null,"These are the prerequisites for using the default ",Object(o.b)("inlineCode",{parentName:"p"},"repo")," syncer. For most people, these steps will be required, but if you plan on using another syncer, you may skip them."),Object(o.b)("h3",{id:"install-git"},"Install Git"),Object(o.b)("p",null,"Navigate to ",Object(o.b)("a",Object(r.a)({parentName:"p"},{href:"https://git-scm.com/downloads"}),"https://git-scm.com/downloads")," to download and install the latest version of Git on your machine. Operating system-specific instructions can be found there."),Object(o.b)("h3",{id:"configure-git"},"Configure Git"),Object(o.b)("p",null,"To use Git, you must first configure it by providing your name and email. To do this, run the following in your terminal, replacing the placeholders with the corresponding values."),Object(o.b)("pre",null,Object(o.b)("code",Object(r.a)({parentName:"pre"},{className:"language-sh"}),'git config --global user.name "<Your Name>"\ngit config --global user.email "<Your Email>"\n')))}u.isMDXComponent=!0},148:function(e,t,n){"use strict";n.d(t,"a",(function(){return p})),n.d(t,"b",(function(){return b}));var r=n(0),i=n.n(r);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var l=i.a.createContext({}),u=function(e){var t=i.a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):c({},t,{},e)),n},p=function(e){var t=u(e.components);return i.a.createElement(l.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},f=Object(r.forwardRef)((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,a=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),p=u(n),f=r,b=p["".concat(a,".").concat(f)]||p[f]||d[f]||o;return n?i.a.createElement(b,c({ref:t},l,{components:n})):i.a.createElement(b,c({ref:t},l))}));function b(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,a=new Array(o);a[0]=f;var c={};for(var s in t)hasOwnProperty.call(t,s)&&(c[s]=t[s]);c.originalType=e,c.mdxType="string"==typeof e?e:r,a[1]=c;for(var l=2;l<o;l++)a[l]=n[l];return i.a.createElement.apply(null,a)}return i.a.createElement.apply(null,n)}f.displayName="MDXCreateElement"}}]);