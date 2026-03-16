


function calculateRandomSeed() {
    return Math.round(Math.random() * 1000000000)
}


function getUrlParameters() {
    params = {}

    const urlParams = new URLSearchParams(window.location.search)
    params.systemType = urlParams.get('systemType') || "RANDOM"
    params.star1 = urlParams.get('star1') || "RANDOM"
    params.star2 = "NONE"
    if (params.systemType != "SINGLE") {
        params.star2 = urlParams.get('star2') || "RANDOM"
    }
    params.orbits = urlParams.get("orbits") || -1
    params.seed = urlParams.get('seed')  //calculateRandomSeed()

    params.templateBase64 = decodeURIComponent( urlParams.get('templateBase64') ) || btoa(JSON.stringify({}))
    console.log( " params.templateBase64 (decoded):" +  params.templateBase64 )
    return params
}



function setUrl(params) {
    //url = new URL( window.location.href )
    // Remove both query string and hash
    const cleanUrl = new URL(window.location.origin + window.location.pathname);


    for (const [key, value] of Object.entries(params)) {
        cleanUrl.searchParams.set(key, value)
    }
    window.history.replaceState({}, '', cleanUrl.toString())

}



function showWait() {
    const overlay = document.getElementById('waitOverlay');
    overlay.style.display = 'flex';
}



function hideWait() {
    const overlay = document.getElementById('waitOverlay');
    overlay.style.display = 'none';
}



function setGui(params) {

    document.getElementById('systemType').value = params.systemType
    document.getElementById('star1').value = params.star1
    document.getElementById('star2').value = params.star2
    document.getElementById('orbits').value = params.orbits
    document.getElementById('seed').value = params.seed
    //console.log( "setGui template from url: " + params.templateBase64 )
    document.getElementById('template').value = JSON.parse(atob(params.templateBase64))

    document.getElementById('systemType').addEventListener('change', function (event) { valueChange(event, params) })
    document.getElementById('star1').addEventListener('change', function (event) { valueChange(event, params) })
    document.getElementById('star2').addEventListener('change', function (event) { valueChange(event, params) })
    document.getElementById('orbits').addEventListener('change', function (event) { valueChange(event, params) })
    document.getElementById('template').addEventListener('change', function (event) { valueChangeTemplate(event, params) })

}


function valueChange(event, params) {
    const changedElement = event.target
    const elementId = changedElement.id;
    newValue = changedElement.value

    params[elementId] = newValue
    setUrl(params)
}

function valueChangeTemplate(event, params) {
    alert("template changed")
    const changedElement = event.target
    const elementId = changedElement.id;
    newValue = changedElement.value
    //console.log("template value:" + newValue)

    //dont url encode because it will be encoded automatically
    params['templateBase64'] =  /*encodeURIComponent*/(btoa(JSON.stringify(newValue))) 
    //console.log( "params template64 for URL encoded: " + params['templateBase64'] )
    setUrl(params)
}


function openTab(evt, tabName) {
    // 1. Hide all tab content
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].className = contents[i].className.replace(" active", "");
    }

    // 2. Remove active class from all buttons
    const buttons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].className = buttons[i].className.replace(" active", "");
    }

    // 3. Show the current tab and add active class to the button
    document.getElementById(tabName).className += " active";
    if (evt) {
        evt.currentTarget.className += " active";
    }
}	