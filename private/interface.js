// UI/UX
const $ = function(selector){
  return document.querySelector(selector);
}

const $$ = function(selector){
  return document.querySelectorAll(selector);
}

const $$$ = function(element, selector){
  return element.querySelector(selector)
};


// DOM elements
const output = $("#output");
const logs = $("#logs");
const artistSearchBar = $("#artistSearchBar");
const searchBarDiv = $("#header-center")
// const showResults = $("#showResults");
// const artistId = document.getElementById("artistId");
const main = $("#main");
const addedArtist = $("#addedArtist");
// const artistIdAlbums = document.getElementById("artistIdAlbums");
// const albumId = document.querySelector("#albumId");
const albumRequested = $("#albumRequested");
const artistPoster = $("#artistPoster");
const results = $("#results"); // div containing search bar and search results
const libraryDiv = $("#library");
const libraryTitle = $("#library-title");
// const tracks = $("#tracks");
// const tracksDiv = $("#tracksDiv");
var tracksDiv = 0;
var releasesDiv = 0;
const tracksOutput = $("#tracksOutput");
// const queueDiv = $("#queue");
var queueDiv = 0;
var outputReleasesDiv = releasesDiv;
const mainInfo = $("#main-info");
const mainInfoDiv = $("#main-info-div");
const showalbums = mainInfo;
const showResults = mainInfo;
const audette = $("#audette");
const headerRight = $("#header-right");
const headerRight2 = $("#header-right2");

// used to get back from tracks view
var currentArtist = 0;

// integrates healthCallback
function completeFailure(data){
  window.location.replace("fail.html");
  console.log(data);
  return 0
}


artistSearchBar.addEventListener("keyup", (e) => {
    if(e.key == "Enter"){
      artistLookup();
    }
})

searchBarDiv.addEventListener("click", ()=>{
  artistSearchBar.focus();
})

// audette.addEventListener("click", () => {home()});

headerRight.addEventListener("click", ()=>{
  home();
})

headerRight2.addEventListener("click", ()=>{
  settings();
})

var tracksMode = 0; // 0 for normal, 1 for tracks

function switch2Tracks(){
    main.classList.remove("main");
    main.classList.add("main-tracks-view");
    // mainInfo.style.width = "auto";
    mainInfo.innerHTML = "Tracks";
    // currentArtist = artist;

    let back = document.createElement("button");
    back.classList.add("button-back");
    back.classList.add("material-symbols-outlined");
    back.innerHTML = "chevron_left";
    back.onclick = async() => {
      if(!currentArtist){
        home();
      }
      else{
        switch2Normal();
        await loadLibrary();
        library[currentArtist.libId].showAlbums();
      }
      // tracksMode = 0;
    
    };

    mainInfoDiv.appendChild(back);

    tracksDiv = document.createElement("div");
    tracksDiv.id = "tracksDiv";
    main.appendChild(tracksDiv);

    releasesDiv = document.createElement("div");
    releasesDiv.id = "releasesDiv";
    main.appendChild(releasesDiv);

    outputReleasesDiv = document.createElement("p");
    outputReleasesDiv.id = "outputReleases";
    releasesDiv.appendChild(outputReleasesDiv);


    // libraryTitle.innerHTML = "Overview";
    clearLibrary();

    tracksMode = 1;
}


async function switch2Normal(){
    main.classList.remove("main-tracks-view");
    main.classList.add("main");

    mainInfo.innerHTML = "Releases";
  
    if($$$(main, "#queue")){
      main.removeChild($$$(main, "#queue"));
    }

    let children = mainInfoDiv.children;
    while(children.length > 1){
      mainInfoDiv.removeChild(children[children.length - 1]);
    }  
    // mainInfo.style.width = "100%";
    // clearTracks();
    // library[currentArtist].showAlbums();
    if($$$(main, "#tracksDiv")){
      main.removeChild($$$(main, "#tracksDiv"));
    }

    if($$$(main, "#releasesDiv")){
      main.removeChild($$$(main, "#releasesDiv"));
    }

    libraryTitle.innerHTML = "Library";
    let albumOverview = $("#album-overview");
    if(albumOverview){
      libraryDiv.removeChild(albumOverview);
    }

    if($("#settings")){
      main.removeChild($("#settings"));
      loadLibrary();
    }
    if($("#global-info")){
      libraryDiv.removeChild($("#global-info"));
    }

    // await loadLibrary();
  
    console.log("Switched to normal");
    tracksMode = 0;
}




function home(){
    let children = main.children;
    while(children.length > 1){
      main.removeChild(children[children.length - 1]);
    }


    if($("#global-info")){
      libraryDiv.removeChild($("#global-info"));
    }
    
    mainInfo.innerHTML = "Home";

    children = mainInfoDiv.children;
    while(children.length > 1){
      mainInfoDiv.removeChild(children[children.length - 1]);
    }  

    if(!$("#queue")){
      queueDiv = document.createElement("div");
      queueDiv.id = "queue";
      main.appendChild(queueDiv);
    }
    getQueue();

    let title = document.createElement("h3");
    title.innerHTML = "Recent requests";
    title.classList.add("queueTitle");
    queueDiv.appendChild(title);

    libraryTitle.innerHTML = "Library";
    let albumOverview = $("#album-overview");
    if(albumOverview){
      libraryDiv.removeChild(albumOverview);
    }

    loadLibrary();

    tracksMode = 0;

}

function settings(){
  
    let children = main.children;
    while(children.length > 1){
      main.removeChild(children[children.length - 1]);
    }

    clearLibrary();
    if($("#album-overview")){
      libraryDiv.removeChild($("#album-overview"));
    }
    libraryTitle.innerHTML = "Info";

    if(!$("#global-info")){
      let info = document.createElement("div");
      info.id = "global-info";
      const ps = ["Version: 0.8.4", "License: GPL-3", "Last update: March 21, 2026"];
      libraryDiv.appendChild(info);

      let p;
      for(let i=0; i<ps.length; i++){
        p = document.createElement("p");
        p.innerHTML = ps[i];
        info.appendChild(p);
      }
    }


    
    mainInfo.innerHTML = "Settings";

    children = mainInfoDiv.children;
    while(children.length > 1){
      mainInfoDiv.removeChild(children[children.length - 1]);
    }

    let settingsDiv = document.createElement("div");
    settingsDiv.id = "settings";
    main.appendChild(settingsDiv);

    // LOGOUT FORM
    let form = document.createElement("form");
    form.method = "POST";
    form.action = "/logout";
    form.style.display = "flex";
    let submit = document.createElement("button");
    submit.onclick = form.submit();
    submit.innerHTML = "Logout";
    submit.classList.add("glass");
    submit.classList.add("glass-button");
    submit.classList.add("submit");

    let icon = document.createElement("span");
    icon.classList.add("material-symbols-outlined");
    icon.classList.add("inline-icon");
    icon.innerHTML = "logout";
    settingsDiv.appendChild(icon);
    
    form.appendChild(submit);
    settingsDiv.appendChild(form);


    // BUGREPORT
    let report = document.createElement("button");
    report.innerHTML = "Report a bug";
    report.classList.add("glass");
    report.classList.add("glass-button");
    report.style.position = "relative";

    icon = document.createElement("span");
    icon.classList.add("material-symbols-outlined");
    icon.classList.add("inline-icon");
    icon.innerHTML = "bug_report";
    settingsDiv.appendChild(icon);
    
    settingsDiv.appendChild(report);


    
    // SWITCH THEME
    // let theme = document.createElement("button");
    // theme.innerHTML = "Switch theme";
    // theme.classList.add("glass");
    // theme.classList.add("glass-button");
    // theme.style.position = "relative";

    // icon = document.createElement("span");
    // icon.classList.add("material-symbols-outlined");
    // icon.classList.add("inline-icon");
    // icon.innerHTML = "routine";
    // settingsDiv.appendChild(icon);
  
    // settingsDiv.appendChild(theme);
  
    tracksMode = 0;
}


function requestSuccess(album){
  switch2Normal();
  switch2Tracks();
  showTracks(album);
}
