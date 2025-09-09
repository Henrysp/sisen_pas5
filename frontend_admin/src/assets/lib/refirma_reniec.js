var frameInvoker;
var typeOption;
var invokerDomain = 'https://dsp.reniec.gob.pe/refirma_invoker/invokerstatusclickonce.html';
//var invokerDomain = 'http://localhost:8080/refirma_invoker/invokerstatusclickonce.html';

//window.onload = insertFrame;
window.addEventListener('load', function (e) {    
	insertFrame();
});

function insertFrame() {	
	if (document.getElementById('frameInvoker') == null){
		div = document.createElement('div');
	    div.innerHTML = 
	    	'<style type="text/css">\
		    	.invokerMain {position: fixed;top:0;left:0;right:0;bottom:0;z-index: 20000;overflow: hidden;background:transparent;display: none;}\
		    	.invokerScreen {position: absolute;width: 100% !important;height: 100%;z-index:10000;}\
		    </style>\
		    <div id="invoker" class="invokerMain">\
		    	<div class="invokerScreen">\
		    		<iframe id="frameInvoker" onload="onLoadFrame();" style="height:100%;width:100%; border:none;" src=""></iframe> \
		    	</div>\
	    	</div>';    
	     document.getElementById('addComponent').appendChild(div);
	}    
//     <input type="button" value="-" onclick="removeRow()">
//     function removeRow(input) {
//	    document.getElementById('insertFrameInvoker').removeChild( input.parentNode );
//     }	
}

function initInvoker(srt){
	typeOption=srt;
	document.getElementById('frameInvoker').setAttribute('src', invokerDomain);
	document.getElementById('invoker').style.display = 'inline';		
}

function onLoadFrame(){	
	if (document.getElementById('frameInvoker').src === invokerDomain){		
		frameInvoker = document.getElementById('frameInvoker').contentWindow;		
		postMessageToFrame({init: typeOption});
	}    
}


function postMessageToFrame(message) {	
	frameInvoker.postMessage(message, '*');
}


window.addEventListener('message', function messageFromFrame(e){	
	message = e.data;
	if(message != null && message === 'getArguments'){			
		dispatchEventClient('getArguments', typeOption);
	}else if(message != null && message === 'invokerOk'){
		dispatchEventClient('invokerOk', typeOption);
	}else if(message != null && message === 'invokerCancel'){
		dispatchEventClient('invokerCancel', null);
	}else if(message != null && message === 'close'){
		document.getElementById('invoker').style.display = 'none';		
	}
});


function dispatchEventClient(e, data) {    
	//No funciona en IE11
	//var evt = new CustomEvent(e, {detail: data});
    //window.dispatchEvent(evt);
	//
    params = {bubbles: false, cancelable: false, detail: data};
	evt = document.createEvent('CustomEvent');
	evt.initCustomEvent( e, params.bubbles, params.cancelable, params.detail );
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
    window.dispatchEvent(evt);
}


window.addEventListener('sendArguments', function (e) {    
	message = {arguments: e.detail};    
	frameInvoker.postMessage(message, '*');
});


