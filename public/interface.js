// UI/UX

const $$$ = function(element, selector){
  return element.querySelector(selector)
};

const $ = function(selector){
  return document.querySelector(selector);
}

const $$ = function(selector){
  return document.querySelectorAll(selector);
}

// DOM elements
const output = $("#output");
const logs = $("#logs");
const artistSearchBar = $("#artistSearchBar");
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
// const tracks = $("#tracks");
// const tracksDiv = $("#tracksDiv");
var tracksDiv = main;
var releasesDiv = main;
const tracksOutput = $("#tracksOutput");
// const queueDiv = $("#queue");
var queueDiv = 0;
const mainInfo = $("#main-info");
const mainInfoDiv = $("#main-info-div");
const showalbums = mainInfo;
const showResults = mainInfo;
const audette = $("#audette");

// used to get back from tracks view
var currentArtist = 0;

// integrates healthCallback
function completeFailure(){
  // window.location.replace("./fail.html");
  return 0
}


function healthUI(){
  
}



artistSearchBar.addEventListener("keyup", (e) => {
  if(e.key == "Enter"){
    artistLookup();
  }
})


audette.addEventListener("click", () => {home()});



function switch2Tracks(){
  main.classList.remove("main");
  main.classList.add("main-tracks-view");
  // mainInfo.style.width = "auto";
  mainInfo.innerHTML = "Tracks";
  // currentArtist = artist;

  let back = document.createElement("button");
  back.innerHTML = "<";
  back.onclick = () => {
    switch2Normal();
    library[currentArtist.libId].showAlbums();
    
  };

  // let children = mainInfo.children;
  // while(children.length > 1){
  //   mainInfo.removeChild(children[children.length-1]);
  // }

  
  // children = releasesDiv.children;
  // while(children.length > 1){
  //   releasesDiv.removeChild(children[children.length-1]);
  // }


  mainInfoDiv.appendChild(back);

  tracksDiv = document.createElement("div");
  tracksDiv.id = "tracksDiv";
  main.appendChild(tracksDiv);

  releasesDiv = document.createElement("div");
  releasesDiv.id = "releasesDiv";
  main.appendChild(releasesDiv);

  // return tracksDiv;
  // tracks = tracksDiv;

  // let releases = document.createElement("div");
  // releases.id = "releasesDiv";
  // main.appendChild(releasesDiv);
  // releasesDiv = releases;
   
}

function switch2Normal(){
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

  console.log("Switched to normal")
}




function home(){
  let children = main.children;
  while(children.length > 1){
    main.removeChild(children[children.length - 1]);
  }
  
  queueDiv = document.createElement("div");
  queueDiv.id = "queue";
  main.appendChild(queueDiv);
  getQueue();

  let title = document.createElement("h3");
  title.innerHTML = "Recent requests";
  title.classList.add("queueTitle");
  queueDiv.appendChild(title);

  loadLibrary();

}



function switch2NormalFromAlbum(){
  main.classList.remove("main-tracks-view");
  main.classList.add("main");


  // mainInfo.style.width = "100%";
  // clearTracks();
  // library[currentArtist].showAlbums();
  if(tracksDiv != main){
    main.removeChild(tracksDiv);
  }

  if(releasesDiv != main){
    main.removeChild(releasesDiv);
  }

  tracksDiv = main;
  releasesDiv = main;
  
}
