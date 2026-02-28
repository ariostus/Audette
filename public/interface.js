// UI/UX


// DOM elements
const output = document.getElementById("output");
const logs = document.getElementById("logs");
const artistSearchBar = document.getElementById("artistSearchBar");
const showResults = document.getElementById("showResults");
// const artistId = document.getElementById("artistId");
const main = document.getElementById("main");
const addedArtist = document.getElementById("addedArtist");
// const artistIdAlbums = document.getElementById("artistIdAlbums");
// const albumId = document.querySelector("#albumId");
const albumRequested = document.querySelector("#albumRequested");
const artistPoster = document.querySelector("#artistPoster");
const results = document.querySelector("#results"); // div containing search bar and search results
const showalbums = document.querySelector("#main-info");
const libraryDiv = document.querySelector("#library");
const tracks = document.querySelector("#tracks");
const tracksOutput = document.querySelector("#tracksOutput");
const queueDiv = document.querySelector("#queue");


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
