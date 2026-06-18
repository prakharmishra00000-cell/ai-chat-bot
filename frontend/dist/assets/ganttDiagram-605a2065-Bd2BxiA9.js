import{c as _t,g as Dt,l as se,k as ne,V as ie,W as re,n as ae,u as oe,v as at,s as kt,a1 as ce,m as le,h as ue,x as de,a2 as fe,a3 as he,a4 as B,w as pt,a5 as me,a6 as Wt,a7 as Vt,a8 as ke,a9 as ye,aa as ge,ab as pe,ac as xe,ad as ve,ae as Te,af as Ot,ag as Pt,ah as zt,ai as Nt,aj as Rt,ak as be,E as we,C as _e,X as De,S as Ce}from"./mermaid-CE0ZNx7I.js";var Ht={exports:{}};(function(t,n){(function(i,r){t.exports=r()})(_t,function(){var i="day";return function(r,a,h){var f=function(E){return E.add(4-E.isoWeekday(),i)},b=a.prototype;b.isoWeekYear=function(){return f(this).year()},b.isoWeek=function(E){if(!this.$utils().u(E))return this.add(7*(E-this.isoWeek()),i);var p,S,V,O,N=f(this),C=(p=this.isoWeekYear(),S=this.$u,V=(S?h.utc:h)().year(p).startOf("year"),O=4-V.isoWeekday(),V.isoWeekday()>4&&(O+=7),V.add(O,i));return N.diff(C,"week")+1},b.isoWeekday=function(E){return this.$utils().u(E)?this.day()||7:this.day(this.day()%7?E:E-7)};var F=b.startOf;b.startOf=function(E,p){var S=this.$utils(),V=!!S.u(p)||p;return S.p(E)==="isoweek"?V?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):F.bind(this)(E,p)}}})})(Ht);var Ee=Ht.exports;const Se=Dt(Ee);var Xt={exports:{}};(function(t,n){(function(i,r){t.exports=r()})(_t,function(){var i={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},r=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,a=/\d/,h=/\d\d/,f=/\d\d?/,b=/\d*[^-_:/,()\s\d]+/,F={},E=function(x){return(x=+x)+(x>68?1900:2e3)},p=function(x){return function(D){this[x]=+D}},S=[/[+-]\d\d:?(\d\d)?|Z/,function(x){(this.zone||(this.zone={})).offset=function(D){if(!D||D==="Z")return 0;var L=D.match(/([+-]|\d\d)/g),Y=60*L[1]+(+L[2]||0);return Y===0?0:L[0]==="+"?-Y:Y}(x)}],V=function(x){var D=F[x];return D&&(D.indexOf?D:D.s.concat(D.f))},O=function(x,D){var L,Y=F.meridiem;if(Y){for(var G=1;G<=24;G+=1)if(x.indexOf(Y(G,0,D))>-1){L=G>12;break}}else L=x===(D?"pm":"PM");return L},N={A:[b,function(x){this.afternoon=O(x,!1)}],a:[b,function(x){this.afternoon=O(x,!0)}],Q:[a,function(x){this.month=3*(x-1)+1}],S:[a,function(x){this.milliseconds=100*+x}],SS:[h,function(x){this.milliseconds=10*+x}],SSS:[/\d{3}/,function(x){this.milliseconds=+x}],s:[f,p("seconds")],ss:[f,p("seconds")],m:[f,p("minutes")],mm:[f,p("minutes")],H:[f,p("hours")],h:[f,p("hours")],HH:[f,p("hours")],hh:[f,p("hours")],D:[f,p("day")],DD:[h,p("day")],Do:[b,function(x){var D=F.ordinal,L=x.match(/\d+/);if(this.day=L[0],D)for(var Y=1;Y<=31;Y+=1)D(Y).replace(/\[|\]/g,"")===x&&(this.day=Y)}],w:[f,p("week")],ww:[h,p("week")],M:[f,p("month")],MM:[h,p("month")],MMM:[b,function(x){var D=V("months"),L=(V("monthsShort")||D.map(function(Y){return Y.slice(0,3)})).indexOf(x)+1;if(L<1)throw new Error;this.month=L%12||L}],MMMM:[b,function(x){var D=V("months").indexOf(x)+1;if(D<1)throw new Error;this.month=D%12||D}],Y:[/[+-]?\d+/,p("year")],YY:[h,function(x){this.year=E(x)}],YYYY:[/\d{4}/,p("year")],Z:S,ZZ:S};function C(x){var D,L;D=x,L=F&&F.formats;for(var Y=(x=D.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(v,g,s){var u=s&&s.toUpperCase();return g||L[s]||i[s]||L[u].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(d,o,y){return o||y.slice(1)})})).match(r),G=Y.length,H=0;H<G;H+=1){var Z=Y[H],j=N[Z],k=j&&j[0],T=j&&j[1];Y[H]=T?{regex:k,parser:T}:Z.replace(/^\[|\]$/g,"")}return function(v){for(var g={},s=0,u=0;s<G;s+=1){var d=Y[s];if(typeof d=="string")u+=d.length;else{var o=d.regex,y=d.parser,e=v.slice(u),W=o.exec(e)[0];y.call(g,W),v=v.replace(W,"")}}return function(l){var c=l.afternoon;if(c!==void 0){var m=l.hours;c?m<12&&(l.hours+=12):m===12&&(l.hours=0),delete l.afternoon}}(g),g}}return function(x,D,L){L.p.customParseFormat=!0,x&&x.parseTwoDigitYear&&(E=x.parseTwoDigitYear);var Y=D.prototype,G=Y.parse;Y.parse=function(H){var Z=H.date,j=H.utc,k=H.args;this.$u=j;var T=k[1];if(typeof T=="string"){var v=k[2]===!0,g=k[3]===!0,s=v||g,u=k[2];g&&(u=k[2]),F=this.$locale(),!v&&u&&(F=L.Ls[u]),this.$d=function(e,W,l,c){try{if(["x","X"].indexOf(W)>-1)return new Date((W==="X"?1e3:1)*e);var m=C(W)(e),I=m.year,w=m.month,M=m.day,_=m.hours,A=m.minutes,st=m.seconds,nt=m.milliseconds,ft=m.zone,ht=m.week,z=new Date,q=M||(I||w?1:z.getDate()),R=I||z.getFullYear(),$=0;I&&!w||($=w>0?w-1:z.getMonth());var U,tt=_||0,X=A||0,rt=st||0,et=nt||0;return ft?new Date(Date.UTC(R,$,q,tt,X,rt,et+60*ft.offset*1e3)):l?new Date(Date.UTC(R,$,q,tt,X,rt,et)):(U=new Date(R,$,q,tt,X,rt,et),ht&&(U=c(U).week(ht).toDate()),U)}catch{return new Date("")}}(Z,T,j,L),this.init(),u&&u!==!0&&(this.$L=this.locale(u).$L),s&&Z!=this.format(T)&&(this.$d=new Date("")),F={}}else if(T instanceof Array)for(var d=T.length,o=1;o<=d;o+=1){k[1]=T[o-1];var y=L.apply(this,k);if(y.isValid()){this.$d=y.$d,this.$L=y.$L,this.init();break}o===d&&(this.$d=new Date(""))}else G.call(this,H)}}})})(Xt);var Me=Xt.exports;const Ae=Dt(Me);var jt={exports:{}};(function(t,n){(function(i,r){t.exports=r()})(_t,function(){return function(i,r){var a=r.prototype,h=a.format;a.format=function(f){var b=this,F=this.$locale();if(!this.isValid())return h.bind(this)(f);var E=this.$utils(),p=(f||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(S){switch(S){case"Q":return Math.ceil((b.$M+1)/3);case"Do":return F.ordinal(b.$D);case"gggg":return b.weekYear();case"GGGG":return b.isoWeekYear();case"wo":return F.ordinal(b.week(),"W");case"w":case"ww":return E.s(b.week(),S==="w"?1:2,"0");case"W":case"WW":return E.s(b.isoWeek(),S==="W"?1:2,"0");case"k":case"kk":return E.s(String(b.$H===0?24:b.$H),S==="k"?1:2,"0");case"X":return Math.floor(b.$d.getTime()/1e3);case"x":return b.$d.getTime();case"z":return"["+b.offsetName()+"]";case"zzz":return"["+b.offsetName("long")+"]";default:return S}});return h.bind(this)(p)}}})})(jt);var Le=jt.exports;const Ie=Dt(Le);var vt=function(){var t=function(g,s,u,d){for(u=u||{},d=g.length;d--;u[g[d]]=s);return u},n=[6,8,10,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,30,32,33,35,37],i=[1,25],r=[1,26],a=[1,27],h=[1,28],f=[1,29],b=[1,30],F=[1,31],E=[1,9],p=[1,10],S=[1,11],V=[1,12],O=[1,13],N=[1,14],C=[1,15],x=[1,16],D=[1,18],L=[1,19],Y=[1,20],G=[1,21],H=[1,22],Z=[1,24],j=[1,32],k={trace:function(){},yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,dateFormat:19,inclusiveEndDates:20,topAxis:21,axisFormat:22,tickInterval:23,excludes:24,includes:25,todayMarker:26,title:27,acc_title:28,acc_title_value:29,acc_descr:30,acc_descr_value:31,acc_descr_multiline_value:32,section:33,clickStatement:34,taskTxt:35,taskData:36,click:37,callbackname:38,callbackargs:39,href:40,clickStatementDebug:41,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",19:"dateFormat",20:"inclusiveEndDates",21:"topAxis",22:"axisFormat",23:"tickInterval",24:"excludes",25:"includes",26:"todayMarker",27:"title",28:"acc_title",29:"acc_title_value",30:"acc_descr",31:"acc_descr_value",32:"acc_descr_multiline_value",33:"section",35:"taskTxt",36:"taskData",37:"click",38:"callbackname",39:"callbackargs",40:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[34,2],[34,3],[34,3],[34,4],[34,3],[34,4],[34,2],[41,2],[41,3],[41,3],[41,4],[41,3],[41,4],[41,2]],performAction:function(s,u,d,o,y,e,W){var l=e.length-1;switch(y){case 1:return e[l-1];case 2:this.$=[];break;case 3:e[l-1].push(e[l]),this.$=e[l-1];break;case 4:case 5:this.$=e[l];break;case 6:case 7:this.$=[];break;case 8:o.setWeekday("monday");break;case 9:o.setWeekday("tuesday");break;case 10:o.setWeekday("wednesday");break;case 11:o.setWeekday("thursday");break;case 12:o.setWeekday("friday");break;case 13:o.setWeekday("saturday");break;case 14:o.setWeekday("sunday");break;case 15:o.setDateFormat(e[l].substr(11)),this.$=e[l].substr(11);break;case 16:o.enableInclusiveEndDates(),this.$=e[l].substr(18);break;case 17:o.TopAxis(),this.$=e[l].substr(8);break;case 18:o.setAxisFormat(e[l].substr(11)),this.$=e[l].substr(11);break;case 19:o.setTickInterval(e[l].substr(13)),this.$=e[l].substr(13);break;case 20:o.setExcludes(e[l].substr(9)),this.$=e[l].substr(9);break;case 21:o.setIncludes(e[l].substr(9)),this.$=e[l].substr(9);break;case 22:o.setTodayMarker(e[l].substr(12)),this.$=e[l].substr(12);break;case 24:o.setDiagramTitle(e[l].substr(6)),this.$=e[l].substr(6);break;case 25:this.$=e[l].trim(),o.setAccTitle(this.$);break;case 26:case 27:this.$=e[l].trim(),o.setAccDescription(this.$);break;case 28:o.addSection(e[l].substr(8)),this.$=e[l].substr(8);break;case 30:o.addTask(e[l-1],e[l]),this.$="task";break;case 31:this.$=e[l-1],o.setClickEvent(e[l-1],e[l],null);break;case 32:this.$=e[l-2],o.setClickEvent(e[l-2],e[l-1],e[l]);break;case 33:this.$=e[l-2],o.setClickEvent(e[l-2],e[l-1],null),o.setLink(e[l-2],e[l]);break;case 34:this.$=e[l-3],o.setClickEvent(e[l-3],e[l-2],e[l-1]),o.setLink(e[l-3],e[l]);break;case 35:this.$=e[l-2],o.setClickEvent(e[l-2],e[l],null),o.setLink(e[l-2],e[l-1]);break;case 36:this.$=e[l-3],o.setClickEvent(e[l-3],e[l-1],e[l]),o.setLink(e[l-3],e[l-2]);break;case 37:this.$=e[l-1],o.setLink(e[l-1],e[l]);break;case 38:case 44:this.$=e[l-1]+" "+e[l];break;case 39:case 40:case 42:this.$=e[l-2]+" "+e[l-1]+" "+e[l];break;case 41:case 43:this.$=e[l-3]+" "+e[l-2]+" "+e[l-1]+" "+e[l];break}},table:[{3:1,4:[1,2]},{1:[3]},t(n,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:i,13:r,14:a,15:h,16:f,17:b,18:F,19:E,20:p,21:S,22:V,23:O,24:N,25:C,26:x,27:D,28:L,30:Y,32:G,33:H,34:23,35:Z,37:j},t(n,[2,7],{1:[2,1]}),t(n,[2,3]),{9:33,11:17,12:i,13:r,14:a,15:h,16:f,17:b,18:F,19:E,20:p,21:S,22:V,23:O,24:N,25:C,26:x,27:D,28:L,30:Y,32:G,33:H,34:23,35:Z,37:j},t(n,[2,5]),t(n,[2,6]),t(n,[2,15]),t(n,[2,16]),t(n,[2,17]),t(n,[2,18]),t(n,[2,19]),t(n,[2,20]),t(n,[2,21]),t(n,[2,22]),t(n,[2,23]),t(n,[2,24]),{29:[1,34]},{31:[1,35]},t(n,[2,27]),t(n,[2,28]),t(n,[2,29]),{36:[1,36]},t(n,[2,8]),t(n,[2,9]),t(n,[2,10]),t(n,[2,11]),t(n,[2,12]),t(n,[2,13]),t(n,[2,14]),{38:[1,37],40:[1,38]},t(n,[2,4]),t(n,[2,25]),t(n,[2,26]),t(n,[2,30]),t(n,[2,31],{39:[1,39],40:[1,40]}),t(n,[2,37],{38:[1,41]}),t(n,[2,32],{40:[1,42]}),t(n,[2,33]),t(n,[2,35],{39:[1,43]}),t(n,[2,34]),t(n,[2,36])],defaultActions:{},parseError:function(s,u){if(u.recoverable)this.trace(s);else{var d=new Error(s);throw d.hash=u,d}},parse:function(s){var u=this,d=[0],o=[],y=[null],e=[],W=this.table,l="",c=0,m=0,I=2,w=1,M=e.slice.call(arguments,1),_=Object.create(this.lexer),A={yy:{}};for(var st in this.yy)Object.prototype.hasOwnProperty.call(this.yy,st)&&(A.yy[st]=this.yy[st]);_.setInput(s,A.yy),A.yy.lexer=_,A.yy.parser=this,typeof _.yylloc>"u"&&(_.yylloc={});var nt=_.yylloc;e.push(nt);var ft=_.options&&_.options.ranges;typeof A.yy.parseError=="function"?this.parseError=A.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function ht(){var J;return J=o.pop()||_.lex()||w,typeof J!="number"&&(J instanceof Array&&(o=J,J=o.pop()),J=u.symbols_[J]||J),J}for(var z,q,R,$,U={},tt,X,rt,et;;){if(q=d[d.length-1],this.defaultActions[q]?R=this.defaultActions[q]:((z===null||typeof z>"u")&&(z=ht()),R=W[q]&&W[q][z]),typeof R>"u"||!R.length||!R[0]){var mt="";et=[];for(tt in W[q])this.terminals_[tt]&&tt>I&&et.push("'"+this.terminals_[tt]+"'");_.showPosition?mt="Parse error on line "+(c+1)+`:
`+_.showPosition()+`
Expecting `+et.join(", ")+", got '"+(this.terminals_[z]||z)+"'":mt="Parse error on line "+(c+1)+": Unexpected "+(z==w?"end of input":"'"+(this.terminals_[z]||z)+"'"),this.parseError(mt,{text:_.match,token:this.terminals_[z]||z,line:_.yylineno,loc:nt,expected:et})}if(R[0]instanceof Array&&R.length>1)throw new Error("Parse Error: multiple actions possible at state: "+q+", token: "+z);switch(R[0]){case 1:d.push(z),y.push(_.yytext),e.push(_.yylloc),d.push(R[1]),z=null,m=_.yyleng,l=_.yytext,c=_.yylineno,nt=_.yylloc;break;case 2:if(X=this.productions_[R[1]][1],U.$=y[y.length-X],U._$={first_line:e[e.length-(X||1)].first_line,last_line:e[e.length-1].last_line,first_column:e[e.length-(X||1)].first_column,last_column:e[e.length-1].last_column},ft&&(U._$.range=[e[e.length-(X||1)].range[0],e[e.length-1].range[1]]),$=this.performAction.apply(U,[l,m,c,A.yy,R[1],y,e].concat(M)),typeof $<"u")return $;X&&(d=d.slice(0,-1*X*2),y=y.slice(0,-1*X),e=e.slice(0,-1*X)),d.push(this.productions_[R[1]][0]),y.push(U.$),e.push(U._$),rt=W[d[d.length-2]][d[d.length-1]],d.push(rt);break;case 3:return!0}}return!0}},T=function(){var g={EOF:1,parseError:function(u,d){if(this.yy.parser)this.yy.parser.parseError(u,d);else throw new Error(u)},setInput:function(s,u){return this.yy=u||this.yy||{},this._input=s,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},input:function(){var s=this._input[0];this.yytext+=s,this.yyleng++,this.offset++,this.match+=s,this.matched+=s;var u=s.match(/(?:\r\n?|\n).*/g);return u?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),s},unput:function(s){var u=s.length,d=s.split(/(?:\r\n?|\n)/g);this._input=s+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-u),this.offset-=u;var o=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),d.length-1&&(this.yylineno-=d.length-1);var y=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:d?(d.length===o.length?this.yylloc.first_column:0)+o[o.length-d.length].length-d[0].length:this.yylloc.first_column-u},this.options.ranges&&(this.yylloc.range=[y[0],y[0]+this.yyleng-u]),this.yyleng=this.yytext.length,this},more:function(){return this._more=!0,this},reject:function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},less:function(s){this.unput(this.match.slice(s))},pastInput:function(){var s=this.matched.substr(0,this.matched.length-this.match.length);return(s.length>20?"...":"")+s.substr(-20).replace(/\n/g,"")},upcomingInput:function(){var s=this.match;return s.length<20&&(s+=this._input.substr(0,20-s.length)),(s.substr(0,20)+(s.length>20?"...":"")).replace(/\n/g,"")},showPosition:function(){var s=this.pastInput(),u=new Array(s.length+1).join("-");return s+this.upcomingInput()+`
`+u+"^"},test_match:function(s,u){var d,o,y;if(this.options.backtrack_lexer&&(y={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(y.yylloc.range=this.yylloc.range.slice(0))),o=s[0].match(/(?:\r\n?|\n).*/g),o&&(this.yylineno+=o.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:o?o[o.length-1].length-o[o.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+s[0].length},this.yytext+=s[0],this.match+=s[0],this.matches=s,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(s[0].length),this.matched+=s[0],d=this.performAction.call(this,this.yy,this,u,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),d)return d;if(this._backtrack){for(var e in y)this[e]=y[e];return!1}return!1},next:function(){if(this.done)return this.EOF;this._input||(this.done=!0);var s,u,d,o;this._more||(this.yytext="",this.match="");for(var y=this._currentRules(),e=0;e<y.length;e++)if(d=this._input.match(this.rules[y[e]]),d&&(!u||d[0].length>u[0].length)){if(u=d,o=e,this.options.backtrack_lexer){if(s=this.test_match(d,y[e]),s!==!1)return s;if(this._backtrack){u=!1;continue}else return!1}else if(!this.options.flex)break}return u?(s=this.test_match(u,y[o]),s!==!1?s:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},lex:function(){var u=this.next();return u||this.lex()},begin:function(u){this.conditionStack.push(u)},popState:function(){var u=this.conditionStack.length-1;return u>0?this.conditionStack.pop():this.conditionStack[0]},_currentRules:function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},topState:function(u){return u=this.conditionStack.length-1-Math.abs(u||0),u>=0?this.conditionStack[u]:"INITIAL"},pushState:function(u){this.begin(u)},stateStackSize:function(){return this.conditionStack.length},options:{"case-insensitive":!0},performAction:function(u,d,o,y){switch(o){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),28;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),30;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 40;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 38;case 21:this.popState();break;case 22:return 39;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 37;case 26:return 4;case 27:return 19;case 28:return 20;case 29:return 21;case 30:return 22;case 31:return 23;case 32:return 25;case 33:return 24;case 34:return 26;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return"date";case 43:return 27;case 44:return"accDescription";case 45:return 33;case 46:return 35;case 47:return 36;case 48:return":";case 49:return 6;case 50:return"INVALID"}},rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50],inclusive:!0}}};return g}();k.lexer=T;function v(){this.yy={}}return v.prototype=k,k.Parser=v,new v}();vt.parser=vt;const Ye=vt;B.extend(Se);B.extend(Ae);B.extend(Ie);let Q="",Ct="",Et,St="",lt=[],ut=[],Mt={},At=[],xt=[],ct="",Lt="";const qt=["active","done","crit","milestone"];let It=[],dt=!1,Yt=!1,Ft="sunday",Tt=0;const Fe=function(){At=[],xt=[],ct="",It=[],yt=0,wt=void 0,gt=void 0,P=[],Q="",Ct="",Lt="",Et=void 0,St="",lt=[],ut=[],dt=!1,Yt=!1,Tt=0,Mt={},De(),Ft="sunday"},We=function(t){Ct=t},Ve=function(){return Ct},Oe=function(t){Et=t},Pe=function(){return Et},ze=function(t){St=t},Ne=function(){return St},Re=function(t){Q=t},Be=function(){dt=!0},Ge=function(){return dt},He=function(){Yt=!0},Xe=function(){return Yt},je=function(t){Lt=t},qe=function(){return Lt},Ue=function(){return Q},Ze=function(t){lt=t.toLowerCase().split(/[\s,]+/)},Qe=function(){return lt},Je=function(t){ut=t.toLowerCase().split(/[\s,]+/)},Ke=function(){return ut},$e=function(){return Mt},ts=function(t){ct=t,At.push(t)},es=function(){return At},ss=function(){let t=Bt();const n=10;let i=0;for(;!t&&i<n;)t=Bt(),i++;return xt=P,xt},Ut=function(t,n,i,r){return r.includes(t.format(n.trim()))?!1:t.isoWeekday()>=6&&i.includes("weekends")||i.includes(t.format("dddd").toLowerCase())?!0:i.includes(t.format(n.trim()))},ns=function(t){Ft=t},is=function(){return Ft},Zt=function(t,n,i,r){if(!i.length||t.manualEndTime)return;let a;t.startTime instanceof Date?a=B(t.startTime):a=B(t.startTime,n,!0),a=a.add(1,"d");let h;t.endTime instanceof Date?h=B(t.endTime):h=B(t.endTime,n,!0);const[f,b]=rs(a,h,n,i,r);t.endTime=f.toDate(),t.renderEndTime=b},rs=function(t,n,i,r,a){let h=!1,f=null;const b=n.add(1e4,"d");for(;t<=n;){if(h||(f=n.toDate()),h=Ut(t,i,r,a),h&&(n=n.add(1,"d"),n>b))throw new Error("Failed to find a valid date that was not excluded by `excludes` after 10,000 iterations.");t=t.add(1,"d")}return[n,f]},bt=function(t,n,i){i=i.trim();const a=/^after\s+(?<ids>[\d\w- ]+)/.exec(i);if(a!==null){let f=null;for(const F of a.groups.ids.split(" ")){let E=it(F);E!==void 0&&(!f||E.endTime>f.endTime)&&(f=E)}if(f)return f.endTime;const b=new Date;return b.setHours(0,0,0,0),b}let h=B(i,n.trim(),!0);if(h.isValid())return h.toDate();{pt.debug("Invalid date:"+i),pt.debug("With date format:"+n.trim());const f=new Date(i);if(f===void 0||isNaN(f.getTime())||f.getFullYear()<-1e4||f.getFullYear()>1e4)throw new Error("Invalid date:"+i);return f}},Qt=function(t){const n=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return n!==null?[Number.parseFloat(n[1]),n[2]]:[NaN,"ms"]},Jt=function(t,n,i,r=!1){i=i.trim();const h=/^until\s+(?<ids>[\d\w- ]+)/.exec(i);if(h!==null){let p=null;for(const V of h.groups.ids.split(" ")){let O=it(V);O!==void 0&&(!p||O.startTime<p.startTime)&&(p=O)}if(p)return p.startTime;const S=new Date;return S.setHours(0,0,0,0),S}let f=B(i,n.trim(),!0);if(f.isValid())return r&&(f=f.add(1,"d")),f.toDate();let b=B(t);const[F,E]=Qt(i);if(!Number.isNaN(F)){const p=b.add(F,E);p.isValid()&&(b=p)}return b.toDate()};let yt=0;const ot=function(t){return t===void 0?(yt=yt+1,"task"+yt):t},as=function(t,n){let i;n.substr(0,1)===":"?i=n.substr(1,n.length):i=n;const r=i.split(","),a={};ee(r,a,qt);for(let f=0;f<r.length;f++)r[f]=r[f].trim();let h="";switch(r.length){case 1:a.id=ot(),a.startTime=t.endTime,h=r[0];break;case 2:a.id=ot(),a.startTime=bt(void 0,Q,r[0]),h=r[1];break;case 3:a.id=ot(r[0]),a.startTime=bt(void 0,Q,r[1]),h=r[2];break}return h&&(a.endTime=Jt(a.startTime,Q,h,dt),a.manualEndTime=B(h,"YYYY-MM-DD",!0).isValid(),Zt(a,Q,ut,lt)),a},os=function(t,n){let i;n.substr(0,1)===":"?i=n.substr(1,n.length):i=n;const r=i.split(","),a={};ee(r,a,qt);for(let h=0;h<r.length;h++)r[h]=r[h].trim();switch(r.length){case 1:a.id=ot(),a.startTime={type:"prevTaskEnd",id:t},a.endTime={data:r[0]};break;case 2:a.id=ot(),a.startTime={type:"getStartDate",startData:r[0]},a.endTime={data:r[1]};break;case 3:a.id=ot(r[0]),a.startTime={type:"getStartDate",startData:r[1]},a.endTime={data:r[2]};break}return a};let wt,gt,P=[];const Kt={},cs=function(t,n){const i={section:ct,type:ct,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:n},task:t,classes:[]},r=os(gt,n);i.raw.startTime=r.startTime,i.raw.endTime=r.endTime,i.id=r.id,i.prevTaskId=gt,i.active=r.active,i.done=r.done,i.crit=r.crit,i.milestone=r.milestone,i.order=Tt,Tt++;const a=P.push(i);gt=i.id,Kt[i.id]=a-1},it=function(t){const n=Kt[t];return P[n]},ls=function(t,n){const i={section:ct,type:ct,description:t,task:t,classes:[]},r=as(wt,n);i.startTime=r.startTime,i.endTime=r.endTime,i.id=r.id,i.active=r.active,i.done=r.done,i.crit=r.crit,i.milestone=r.milestone,wt=i,xt.push(i)},Bt=function(){const t=function(i){const r=P[i];let a="";switch(P[i].raw.startTime.type){case"prevTaskEnd":{const h=it(r.prevTaskId);r.startTime=h.endTime;break}case"getStartDate":a=bt(void 0,Q,P[i].raw.startTime.startData),a&&(P[i].startTime=a);break}return P[i].startTime&&(P[i].endTime=Jt(P[i].startTime,Q,P[i].raw.endTime.data,dt),P[i].endTime&&(P[i].processed=!0,P[i].manualEndTime=B(P[i].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),Zt(P[i],Q,ut,lt))),P[i].processed};let n=!0;for(const[i,r]of P.entries())t(i),n=n&&r.processed;return n},us=function(t,n){let i=n;at().securityLevel!=="loose"&&(i=_e.sanitizeUrl(n)),t.split(",").forEach(function(r){it(r)!==void 0&&(te(r,()=>{window.open(i,"_self")}),Mt[r]=i)}),$t(t,"clickable")},$t=function(t,n){t.split(",").forEach(function(i){let r=it(i);r!==void 0&&r.classes.push(n)})},ds=function(t,n,i){if(at().securityLevel!=="loose"||n===void 0)return;let r=[];if(typeof i=="string"){r=i.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let h=0;h<r.length;h++){let f=r[h].trim();f.charAt(0)==='"'&&f.charAt(f.length-1)==='"'&&(f=f.substr(1,f.length-2)),r[h]=f}}r.length===0&&r.push(t),it(t)!==void 0&&te(t,()=>{Ce.runFunc(n,...r)})},te=function(t,n){It.push(function(){const i=document.querySelector(`[id="${t}"]`);i!==null&&i.addEventListener("click",function(){n()})},function(){const i=document.querySelector(`[id="${t}-text"]`);i!==null&&i.addEventListener("click",function(){n()})})},fs=function(t,n,i){t.split(",").forEach(function(r){ds(r,n,i)}),$t(t,"clickable")},hs=function(t){It.forEach(function(n){n(t)})},ms={getConfig:()=>at().gantt,clear:Fe,setDateFormat:Re,getDateFormat:Ue,enableInclusiveEndDates:Be,endDatesAreInclusive:Ge,enableTopAxis:He,topAxisEnabled:Xe,setAxisFormat:We,getAxisFormat:Ve,setTickInterval:Oe,getTickInterval:Pe,setTodayMarker:ze,getTodayMarker:Ne,setAccTitle:oe,getAccTitle:ae,setDiagramTitle:re,getDiagramTitle:ie,setDisplayMode:je,getDisplayMode:qe,setAccDescription:ne,getAccDescription:se,addSection:ts,getSections:es,getTasks:ss,addTask:cs,findTaskById:it,addTaskOrg:ls,setIncludes:Ze,getIncludes:Qe,setExcludes:Je,getExcludes:Ke,setClickEvent:fs,setLink:us,getLinks:$e,bindFunctions:hs,parseDuration:Qt,isInvalidDate:Ut,setWeekday:ns,getWeekday:is};function ee(t,n,i){let r=!0;for(;r;)r=!1,i.forEach(function(a){const h="^\\s*"+a+"\\s*$",f=new RegExp(h);t[0].match(f)&&(n[a]=!0,t.shift(1),r=!0)})}const ks=function(){pt.debug("Something is calling, setConf, remove the call")},Gt={monday:Te,tuesday:ve,wednesday:xe,thursday:pe,friday:ge,saturday:ye,sunday:ke},ys=(t,n)=>{let i=[...t].map(()=>-1/0),r=[...t].sort((h,f)=>h.startTime-f.startTime||h.order-f.order),a=0;for(const h of r)for(let f=0;f<i.length;f++)if(h.startTime>=i[f]){i[f]=h.endTime,h.order=f+n,f>a&&(a=f);break}return a};let K;const gs=function(t,n,i,r){const a=at().gantt,h=at().securityLevel;let f;h==="sandbox"&&(f=kt("#i"+n));const b=h==="sandbox"?kt(f.nodes()[0].contentDocument.body):kt("body"),F=h==="sandbox"?f.nodes()[0].contentDocument:document,E=F.getElementById(n);K=E.parentElement.offsetWidth,K===void 0&&(K=1200),a.useWidth!==void 0&&(K=a.useWidth);const p=r.db.getTasks();let S=[];for(const k of p)S.push(k.type);S=j(S);const V={};let O=2*a.topPadding;if(r.db.getDisplayMode()==="compact"||a.displayMode==="compact"){const k={};for(const v of p)k[v.section]===void 0?k[v.section]=[v]:k[v.section].push(v);let T=0;for(const v of Object.keys(k)){const g=ys(k[v],T)+1;T+=g,O+=g*(a.barHeight+a.barGap),V[v]=g}}else{O+=p.length*(a.barHeight+a.barGap);for(const k of S)V[k]=p.filter(T=>T.type===k).length}E.setAttribute("viewBox","0 0 "+K+" "+O);const N=b.select(`[id="${n}"]`),C=ce().domain([le(p,function(k){return k.startTime}),ue(p,function(k){return k.endTime})]).rangeRound([0,K-a.leftPadding-a.rightPadding]);function x(k,T){const v=k.startTime,g=T.startTime;let s=0;return v>g?s=1:v<g&&(s=-1),s}p.sort(x),D(p,K,O),de(N,O,K,a.useMaxWidth),N.append("text").text(r.db.getDiagramTitle()).attr("x",K/2).attr("y",a.titleTopMargin).attr("class","titleText");function D(k,T,v){const g=a.barHeight,s=g+a.barGap,u=a.topPadding,d=a.leftPadding,o=fe().domain([0,S.length]).range(["#00B9FA","#F95002"]).interpolate(he);Y(s,u,d,T,v,k,r.db.getExcludes(),r.db.getIncludes()),G(d,u,T,v),L(k,s,u,d,g,o,T),H(s,u),Z(d,u,T,v)}function L(k,T,v,g,s,u,d){const y=[...new Set(k.map(c=>c.order))].map(c=>k.find(m=>m.order===c));N.append("g").selectAll("rect").data(y).enter().append("rect").attr("x",0).attr("y",function(c,m){return m=c.order,m*T+v-2}).attr("width",function(){return d-a.rightPadding/2}).attr("height",T).attr("class",function(c){for(const[m,I]of S.entries())if(c.type===I)return"section section"+m%a.numberSectionStyles;return"section section0"});const e=N.append("g").selectAll("rect").data(k).enter(),W=r.db.getLinks();if(e.append("rect").attr("id",function(c){return c.id}).attr("rx",3).attr("ry",3).attr("x",function(c){return c.milestone?C(c.startTime)+g+.5*(C(c.endTime)-C(c.startTime))-.5*s:C(c.startTime)+g}).attr("y",function(c,m){return m=c.order,m*T+v}).attr("width",function(c){return c.milestone?s:C(c.renderEndTime||c.endTime)-C(c.startTime)}).attr("height",s).attr("transform-origin",function(c,m){return m=c.order,(C(c.startTime)+g+.5*(C(c.endTime)-C(c.startTime))).toString()+"px "+(m*T+v+.5*s).toString()+"px"}).attr("class",function(c){const m="task";let I="";c.classes.length>0&&(I=c.classes.join(" "));let w=0;for(const[_,A]of S.entries())c.type===A&&(w=_%a.numberSectionStyles);let M="";return c.active?c.crit?M+=" activeCrit":M=" active":c.done?c.crit?M=" doneCrit":M=" done":c.crit&&(M+=" crit"),M.length===0&&(M=" task"),c.milestone&&(M=" milestone "+M),M+=w,M+=" "+I,m+M}),e.append("text").attr("id",function(c){return c.id+"-text"}).text(function(c){return c.task}).attr("font-size",a.fontSize).attr("x",function(c){let m=C(c.startTime),I=C(c.renderEndTime||c.endTime);c.milestone&&(m+=.5*(C(c.endTime)-C(c.startTime))-.5*s),c.milestone&&(I=m+s);const w=this.getBBox().width;return w>I-m?I+w+1.5*a.leftPadding>d?m+g-5:I+g+5:(I-m)/2+m+g}).attr("y",function(c,m){return m=c.order,m*T+a.barHeight/2+(a.fontSize/2-2)+v}).attr("text-height",s).attr("class",function(c){const m=C(c.startTime);let I=C(c.endTime);c.milestone&&(I=m+s);const w=this.getBBox().width;let M="";c.classes.length>0&&(M=c.classes.join(" "));let _=0;for(const[st,nt]of S.entries())c.type===nt&&(_=st%a.numberSectionStyles);let A="";return c.active&&(c.crit?A="activeCritText"+_:A="activeText"+_),c.done?c.crit?A=A+" doneCritText"+_:A=A+" doneText"+_:c.crit&&(A=A+" critText"+_),c.milestone&&(A+=" milestoneText"),w>I-m?I+w+1.5*a.leftPadding>d?M+" taskTextOutsideLeft taskTextOutside"+_+" "+A:M+" taskTextOutsideRight taskTextOutside"+_+" "+A+" width-"+w:M+" taskText taskText"+_+" "+A+" width-"+w}),at().securityLevel==="sandbox"){let c;c=kt("#i"+n);const m=c.nodes()[0].contentDocument;e.filter(function(I){return W[I.id]!==void 0}).each(function(I){var w=m.querySelector("#"+I.id),M=m.querySelector("#"+I.id+"-text");const _=w.parentNode;var A=m.createElement("a");A.setAttribute("xlink:href",W[I.id]),A.setAttribute("target","_top"),_.appendChild(A),A.appendChild(w),A.appendChild(M)})}}function Y(k,T,v,g,s,u,d,o){if(d.length===0&&o.length===0)return;let y,e;for(const{startTime:w,endTime:M}of u)(y===void 0||w<y)&&(y=w),(e===void 0||M>e)&&(e=M);if(!y||!e)return;if(B(e).diff(B(y),"year")>5){pt.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const W=r.db.getDateFormat(),l=[];let c=null,m=B(y);for(;m.valueOf()<=e;)r.db.isInvalidDate(m,W,d,o)?c?c.end=m:c={start:m,end:m}:c&&(l.push(c),c=null),m=m.add(1,"d");N.append("g").selectAll("rect").data(l).enter().append("rect").attr("id",function(w){return"exclude-"+w.start.format("YYYY-MM-DD")}).attr("x",function(w){return C(w.start)+v}).attr("y",a.gridLineStartPadding).attr("width",function(w){const M=w.end.add(1,"day");return C(M)-C(w.start)}).attr("height",s-T-a.gridLineStartPadding).attr("transform-origin",function(w,M){return(C(w.start)+v+.5*(C(w.end)-C(w.start))).toString()+"px "+(M*k+.5*s).toString()+"px"}).attr("class","exclude-range")}function G(k,T,v,g){let s=me(C).tickSize(-g+T+a.gridLineStartPadding).tickFormat(Wt(r.db.getAxisFormat()||a.axisFormat||"%Y-%m-%d"));const d=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(r.db.getTickInterval()||a.tickInterval);if(d!==null){const o=d[1],y=d[2],e=r.db.getWeekday()||a.weekday;switch(y){case"millisecond":s.ticks(Rt.every(o));break;case"second":s.ticks(Nt.every(o));break;case"minute":s.ticks(zt.every(o));break;case"hour":s.ticks(Pt.every(o));break;case"day":s.ticks(Ot.every(o));break;case"week":s.ticks(Gt[e].every(o));break;case"month":s.ticks(Vt.every(o));break}}if(N.append("g").attr("class","grid").attr("transform","translate("+k+", "+(g-50)+")").call(s).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),r.db.topAxisEnabled()||a.topAxis){let o=be(C).tickSize(-g+T+a.gridLineStartPadding).tickFormat(Wt(r.db.getAxisFormat()||a.axisFormat||"%Y-%m-%d"));if(d!==null){const y=d[1],e=d[2],W=r.db.getWeekday()||a.weekday;switch(e){case"millisecond":o.ticks(Rt.every(y));break;case"second":o.ticks(Nt.every(y));break;case"minute":o.ticks(zt.every(y));break;case"hour":o.ticks(Pt.every(y));break;case"day":o.ticks(Ot.every(y));break;case"week":o.ticks(Gt[W].every(y));break;case"month":o.ticks(Vt.every(y));break}}N.append("g").attr("class","grid").attr("transform","translate("+k+", "+T+")").call(o).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}function H(k,T){let v=0;const g=Object.keys(V).map(s=>[s,V[s]]);N.append("g").selectAll("text").data(g).enter().append(function(s){const u=s[0].split(we.lineBreakRegex),d=-(u.length-1)/2,o=F.createElementNS("http://www.w3.org/2000/svg","text");o.setAttribute("dy",d+"em");for(const[y,e]of u.entries()){const W=F.createElementNS("http://www.w3.org/2000/svg","tspan");W.setAttribute("alignment-baseline","central"),W.setAttribute("x","10"),y>0&&W.setAttribute("dy","1em"),W.textContent=e,o.appendChild(W)}return o}).attr("x",10).attr("y",function(s,u){if(u>0)for(let d=0;d<u;d++)return v+=g[u-1][1],s[1]*k/2+v*k+T;else return s[1]*k/2+T}).attr("font-size",a.sectionFontSize).attr("class",function(s){for(const[u,d]of S.entries())if(s[0]===d)return"sectionTitle sectionTitle"+u%a.numberSectionStyles;return"sectionTitle"})}function Z(k,T,v,g){const s=r.db.getTodayMarker();if(s==="off")return;const u=N.append("g").attr("class","today"),d=new Date,o=u.append("line");o.attr("x1",C(d)+k).attr("x2",C(d)+k).attr("y1",a.titleTopMargin).attr("y2",g-a.titleTopMargin).attr("class","today"),s!==""&&o.attr("style",s.replace(/,/g,";"))}function j(k){const T={},v=[];for(let g=0,s=k.length;g<s;++g)Object.prototype.hasOwnProperty.call(T,k[g])||(T[k[g]]=!0,v.push(k[g]));return v}},ps={setConf:ks,draw:gs},xs=t=>`
  .mermaid-main-font {
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor||t.textColor};
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }
`,vs=xs,bs={parser:Ye,db:ms,renderer:ps,styles:vs};export{bs as diagram};
