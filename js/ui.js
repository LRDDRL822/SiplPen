// ui functions
ZenPen = window.ZenPen || {};
ZenPen.ui = (function() {

	// Base elements
	var body, article, uiContainer, overlay, header;

	// Buttons
	var screenSizeElement, colorLayoutElement, targetElement, saveElement;

	// Word Counter
	var wordCountValue, wordCountBox, wordCountElement, wordCounter, wordCounterProgress, counterBar;
	var counterBarUse = 0;
    
	//save support
	var supportsSave, saveFormat, textToWrite;
	
	var expandScreenIcon = '<i class="fa fa-arrows-alt fa-fw" aria-hidden="true"></i>';
	var shrinkScreenIcon = '<i class="fa fa-compress fa-fw" aria-hidden="true"></i>';

	var darkLayout = false;
    
    // flowstateMode
    var flowstateMode = false;
    var remaining_set, expiring_set, total_time, expiring_time , totatal_id , expiring_id ,alpha_step;

	function init() {
		
		supportsSave = !!new Blob()?true:false;
		
		bindElements();

		wordCountActive = false;

		if ( ZenPen.util.supportsHtmlStorage() ) {
			loadState();
		}
		
	}

	function loadState() {

		// Activate word counter
		if ( localStorage['wordCount'] && localStorage['wordCount'] !== "0") {			
			wordCountValue = parseInt(localStorage['wordCount']);
			wordCountElement.value = localStorage['wordCount'];
			//wordCounter.className = "counter-bar active";
            //activeWordCount();
			//updateWordCount();
            setWordCount(parseInt(localStorage['wordCount']));
            updateWordCount();
		}

		// Activate color switch
		if ( localStorage['darkLayout'] === 'true' ) {
			if ( darkLayout === false ) {
				document.body.className = 'yang';
			} else {
				document.body.className = 'yin';
			}
			darkLayout = !darkLayout;
		}

	}

	function saveState() {

		if ( ZenPen.util.supportsHtmlStorage() ) {
			localStorage[ 'darkLayout' ] = darkLayout;
			localStorage[ 'wordCount' ] = wordCountElement.value;
		}
	}

	function bindElements() {

		// Body element for light/dark styles
		body = document.body;

		uiContainer = document.querySelector( '.ui' );

		// UI element for color flip
		colorLayoutElement = document.querySelector( '.color-flip' );
		colorLayoutElement.onclick = onColorLayoutClick;

		// UI element for full screen		
		screenSizeElement = document.querySelector( '.fullscreen' );
		screenSizeElement.onclick = onScreenSizeClick;

		targetElement = document.querySelector( '.target ');
		targetElement.onclick = onTargetClick;
        
        // UI element for flowstateMode
        targetElement = document.querySelector( '.flowstate ');
		targetElement.onclick = onFlowstateClick;
        targetElement = document.querySelector('.startflow');
        targetElement.onclick = function() {
            total_set = document.getElementsByName('total_time')[0].value * 60;
            expiring_set = document.getElementsByName('expiring_time')[0].value * 10;
            total_time = total_set;
            expiring_time = expiring_set;
            alpha_step = 1/expiring_time;
            enterFlowstateMode();
            removeOverlay();
        };
		
		//init event listeners only if browser can save
		if (supportsSave) {

			saveElement = document.querySelector( '.save' );
			saveElement.onclick = onSaveClick;
			
			var formatSelectors = document.querySelectorAll( '.saveselection span' );
			for( var i in formatSelectors ) {
				formatSelectors[i].onclick = selectFormat;
			}
			
			document.querySelector('.savebutton').onclick = saveText;
		} else {
			document.querySelector('.save.useicons').style.display = "none";
		}

		// Overlay when modals are active
		overlay = document.querySelector( '.overlay' );
		overlay.onclick = onOverlayClick;

		article = document.querySelector( '.content' );
		article.onkeyup = onArticleKeyUp;

		wordCountBox = overlay.querySelector( '.wordcount' );
		wordCountElement = wordCountBox.querySelector( 'input' );
		wordCountElement.onchange = onWordCountChange;
		wordCountElement.onkeyup = onWordCountKeyUp;
		
		saveModal = overlay.querySelector('.saveoverlay');

		counterBar = document.querySelector( '.counter-bar' );
		wordCounterProgress = counterBar.querySelector( '.word-progress' );
        
        flowstateBox = overlay.querySelector( '.flowsettings' );
        flowstateFailBox = overlay.querySelector('.flowfailure');
        timeCounterProgress = counterBar.querySelector( '.time-progress' );
        flowingBox=overlay.querySelector( '.flowing' );

		header = document.querySelector( '.header' );
		header.onkeypress = onHeaderKeyPress;
	}

	function onScreenSizeClick( event ) {

		screenfull.toggle();
   		if ( screenfull.enabled ) {
			document.addEventListener( screenfull.raw.fullscreenchange, function () {
				if ( screenfull.isFullscreen ) {
					screenSizeElement.innerHTML = shrinkScreenIcon;
				} else {
					screenSizeElement.innerHTML = expandScreenIcon;	
				}
    		});
    	}
	};

	function onColorLayoutClick( event ) {
		if ( darkLayout === false ) {
			document.body.className = 'yang';
		} else {
			document.body.className = 'yin';
		}
		darkLayout = !darkLayout;

		saveState();
	}

	function onTargetClick( event ) {
		ZenPen.util.fadeIn(overlay);
        //overlay.style.display="block";
		ZenPen.util.fadeIn(wordCountBox);
		wordCountElement.focus();
	}

	function onSaveClick( event ) {
		ZenPen.util.fadeIn(overlay);
		ZenPen.util.fadeIn(saveModal);
	}
	
	function onFlowstateClick(event){
        if ( flowstateMode === false ) {
            ZenPen.util.fadeIn(overlay);
            ZenPen.util.fadeIn(flowstateBox);
            //overlay.style.display = "block";
            //flowstateBox.style.display = "block";
			//ZenPen.editor.enterFlowstateMode ();
		} else {
            ZenPen.util.fadeIn(overlay);
            ZenPen.util.fadeIn(flowingBox);
		}
		darkLayout = !darkLayout;
    }

	function saveText( event ) {

		if (typeof saveFormat != 'undefined' && saveFormat != '') {
			var blob = new Blob([textToWrite], {type: "text/plain;charset=utf-8"});
			/* remove tabs and line breaks from header */
			var headerText = header.innerHTML.replace(/(\t|\n|\r)/gm,"");
			if (headerText === "") {
			    headerText = "ZenPen";
			}
			saveAs(blob, headerText + '.txt');
		} else {
			document.querySelector('.saveoverlay h1').style.color = '#FC1E1E';
		}
	}
	
	/* Allows the user to press enter to tab from the title */
	function onHeaderKeyPress( event ) {

		if ( event.keyCode === 13 ) {
			event.preventDefault();
			article.focus();
		}
	}

	/* Allows the user to press enter to tab from the word count modal */
	function onWordCountKeyUp( event ) {
		
		if ( event.keyCode === 13 ) {
			event.preventDefault();
			
			setWordCount( parseInt(this.value) );

			removeOverlay();

			article.focus();
		}
	}

	function onWordCountChange( event ) {

		setWordCount( parseInt(this.value) );
	}

	function claimCount(){
        counterBarUse += 1;
        counterBar.className = "counter-bar active";
    }
    function unclaimCount(){
        counterBarUse -= 1;
        if (counterBarUse <= 0){
        counterBar.className = "counter-bar";}
    }
    
	function setWordCount( count ) {

		// Set wordcount ui to active
		if ( count > 0) {

			wordCountValue = count;
            claimCount();
			//wordCounter.className = "counter-bar active";
			updateWordCount();

		} else {

			wordCountValue = 0;
            wordCounterProgress.style.width =0;
            unclaimCount();
			//wordCounter.className = "counter-bar";
		}
		
		saveState();
	}

	function onArticleKeyUp( event ) {

		if ( wordCountValue > 0 ) {
			updateWordCount();
		}
	}

	function updateWordCount() {

		var wordCount = ZenPen.editor.getWordCount();
		var percentageComplete = wordCount / wordCountValue;
		wordCounterProgress.style.width = percentageComplete * 100 + '%';

		if ( percentageComplete >= 1 ) {
			wordCounterProgress.className = "word-progress progress complete";
		} else {
			wordCounterProgress.className = "word-progress progress";
		}
	}

	function selectFormat( e ) {
		
		if ( document.querySelectorAll('span.activesave').length > 0 ) {
			document.querySelector('span.activesave').className = '';
		}
		
		document.querySelector('.saveoverlay h1').style.cssText = '';
		
		var targ;
		if (!e) var e = window.event;
		if (e.target) targ = e.target;
		else if (e.srcElement) targ = e.srcElement;
		
		// defeat Safari bug
		if (targ.nodeType == 3) {
			targ = targ.parentNode;
		}
			
		targ.className ='activesave';
		
		saveFormat = targ.getAttribute('data-format');
		
		var header = document.querySelector('header.header');
		var headerText = header.innerHTML.replace(/(\r\n|\n|\r)/gm,"") + "\n";
		
		var body = document.querySelector('article.content');
		var bodyText = body.innerHTML;
			
		textToWrite = formatText(saveFormat,headerText,bodyText);
		
		var textArea = document.querySelector('.hiddentextbox');
		textArea.value = textToWrite;
		textArea.focus();
		textArea.select();

	}

	function formatText( type, header, body ) {
		
		var text;
		switch( type ) {

			case 'html':
				header = "<h1>" + header + "</h1>";
				text = header + body;
				text = text.replace(/\t/g, '');
			break;

			case 'markdown':
				header = header.replace(/\t/g, '');
				header = header.replace(/\n$/, '');
				header = "#" + header + "#";
			
				text = body.replace(/\t/g, '');
			
				text = text.replace(/<b>|<\/b>/g,"**")
					.replace(/\r\n+|\r+|\n+|\t+/ig,"")
					.replace(/<i>|<\/i>/g,"_")
					.replace(/<blockquote>/g,"> ")
					.replace(/<\/blockquote>/g,"")
					.replace(/<p>|<\/p>/gi,"\n")
					.replace(/<br>/g,"\n");
				
				var links = text.match(/<a href="(.+)">(.+)<\/a>/gi);
				
                                if (links !== null) {
                                        for ( var i = 0; i<links.length; i++ ) {
                                                var tmpparent = document.createElement('div');
                                                tmpparent.innerHTML = links[i];
                                                
                                                var tmp = tmpparent.firstChild;
                                                
                                                var href = tmp.getAttribute('href');
                                                var linktext = tmp.textContent || tmp.innerText || "";
                                                
                                                text = text.replace(links[i],'['+linktext+']('+href+')');
                                        }
                                }
				
				text = header +"\n\n"+ text;
			break;

			case 'plain':
				header = header.replace(/\t/g, '');
			
				var tmp = document.createElement('div');
				tmp.innerHTML = body;
				text = tmp.textContent || tmp.innerText || "";
				
				text = text.replace(/\t/g, '')
					.replace(/\n{3}/g,"\n")
					.replace(/\n/,""); //replace the opening line break
				
				text = header + text;
			break;
			default:
			break;
		}
		
		return text;
	}

	function onOverlayClick( event ) {

		if ( event.target.className === "overlay" ) {
			removeOverlay();
		}
	}

	function removeOverlay() {
        ZenPen.util.fadeOut(overlay);
		//overlay.style.display = "none";
        setTimeout(function () {
        //wordCountBox.style.display = "none";
		//descriptionModal.style.display = "none";
        //flowstateFailBox.style.display="none";
		//saveModal.style.display = "none";
        //flowstateBox.style.display= "none"
        childs = overlay.getElementsByClassName( 'modal');
        for(var i = childs.length - 1; i >= 0; i--) {
            childs[i].style.display="none";}
        document.querySelector( '.finishsummary ').style.display="none";
        },500);
        
		
		if ( document.querySelectorAll('span.activesave' ).length > 0) {
			document.querySelector('span.activesave').className = '';
		}
        
		saveFormat='';
	}
	function enterFlowstateMode () {
        console.log("Starting flowstate mode: "+ total_time +" , "+ expiring_time + " , "+alpha_step); 
        resetOpacity();
        targetElement = document.querySelector( '.content');
        targetElement.oninput=function(){
            console.log("Press!");
            expiring_time = expiring_set;
            resetOpacity();
        };
        total_id = setInterval(count_total_down,1000);
        expiring_id = setInterval(count_exp_down,100);
        flowStarted();
    }
    function count_total_down(){
        if (total_time > 0){
            total_time = total_time - 1;
            //updateTimeCount();
        } else {
            console.log("All over");
            flowCompleted();
        }
    }
    function count_exp_down(){
        if (expiring_time > 0){
            expiring_time=expiring_time - 1;
            document.getElementsByClassName("content")[0].style.opacity = document.getElementsByClassName("content")[0].style.opacity - alpha_step;
        } else {
            console.log("Over");
            ZenPen.editor.cls();
            flowCleanWork();
            ZenPen.util.fadeIn(overlay);
            ZenPen.util.fadeIn(flowstateFailBox);
        }
    }
    function flowStarted(){
        flowstateMode===true;
        claimCount();
        timeCounterProgress.style.transition = "width "+total_set+"s";
        timeCounterProgress.style.transitionTimingFunction ="linear";
        timeCounterProgress.style.width="100%"
    }
    function updateTimeCount(){
		var percentageComplete = 1-total_time / total_set;
		timeCounterProgress.style.width = percentageComplete * 100 + '%';

		if ( percentageComplete >= 1 ) {
			timeCounterProgress.className = "time-progress progress complete";
		} else {
			timeCounterProgress.className = "time-progress progress";
		}
    }
    function resetOpacity(){
        document.getElementsByClassName("content")[0].style.opacity =1;
    }
    function flowCleanWork(){
            clearInterval(total_id);
            clearInterval(expiring_id);
            resetOpacity();
            unclaimCount();
            timeCounterProgress.style.transition = "";
            timeCounterProgress.style.width="0px";
            flowstateMode === false;
    }
    function flowCompleted(){
        flowCleanWork();
        ZenPen.util.fadeIn(overlay);
        ZenPen.util.fadeIn(saveModal);
        targetElement = document.querySelector( '.finishsummary ');
        targetElement.innerHTML=targetElement.innerHTML.replace("{s}",total_set/60);
        targetElement.style.display="block";
    }
    
	return {
		init: init,
        //Debug:
        flowCompleted: flowCompleted,
        unclaimCount:unclaimCount
    }

})();
