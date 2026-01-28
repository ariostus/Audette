const lidarr = "http://127.0.0.1:8686/api/v1/";
// var suffix = "/api/v1/artist/lookup?term=elvis&apikey=bd0bdb44e461412291ee23a026d71744"
var apikey = "bd0bdb44e461412291ee23a026d71744";
var auth = "?apikey=" + apikey;

// Basic DOM elements
const output = document.getElementById("output");
const logs = document.getElementById("logs");
const artistSearchBar = document.getElementById("artistSearchBar")
const showResults = document.getElementById("showResults");
const artistId = document.getElementById("artistId");
const albums = document.getElementById("albums");
const addedArtist = document.getElementById("addedArtist");
const artistIdAlbums = document.getElementById("artistIdAlbums");





// Performs first HEALTH CHECKS and sets Root path
function healthCheck(){
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        healthCallback(request)
    }
    request.open("GET", lidarr+"health"+auth, true);
    request.send()

    // setRoot();
    return request
}

// Callback for healtCheck, displays api/health response and errors
function healthCallback(request){
    let data = request.responseText;
    if (request.readyState == 4 && request.status == 200){
            if( !data.includes("error") ){
                output.innerHTML = "All good to go!"
                logs.innerHTML = "";
                setRoot();
            }
            else {
                output.innerHTML = "An error occured."
                logs.innerHTML = errorParser(data);
            }
        }
    else {
        output.innerHTML = "Service temporarily unavailable. Please try again in a few minutes or contact support."
        // logs.innerHTML = request.responseText;
    }

    return data
}

// Parse and clean healthCheck response - showing verbose errors
function errorParser(data){
    response = JSON.parse(data);
    htmlText = "";
    for(let i=0; i<response.length; i++){
        htmlText += response[i]["message"] + "<br>";
    }
    return htmlText
}

var rootPath = "";
function setRoot(){
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        setRootCallback(request);       
    }

    request.open("GET", lidarr+"rootfolder"+auth);
    request.setRequestHeader("accept", "application/json");
    request.send()
}

function setRootCallback(request){
    console.log(request.responseText)
    // console.log(JSON.parse(request.responseText)[0]["path"])
    rootPath = JSON.parse(request.responseText)[0]["path"];
}












// ARTIST SEARCH
function artistLookup(){
    let term = artistSearchBar.value;
    term = "&term=" + term.replace(" ", "%20") // include spaces in url
    
    let suffix = "artist/lookup";
    let url = lidarr + suffix + auth + term;

    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        artistLookupCallback(request)
    }
    
    request.open("GET", url);
    request.setRequestHeader("accept", "application/json");
    request.send();

}

function artistLookupCallback(request){
    if ( request.status == 200 && request.readyState == 4 ){
        let data = artistLookupParser(request.responseText);
        showResults.innerHTML = data;
    }

    else{
        showResults.innerHTML = "Error"
    }
}

function artistLookupParser(data){
    let json = JSON.parse(data);
    let htmlText = "";

    for(let i=0; i<json.length; i++){
        htmlText += json[i]["artistName"] + " - " + json[i]["foreignArtistId"] + "<br>";
    }

    return htmlText

}
 // ADD ARTIST TO LIBRARY

 // tiny helper to retrieve artist's info from text field
 function getArtistInfo(){
    let value = artistId.value;
    let name = value.split(" - ")[0];
    let id = value.split(" - ")[1];
    return {"name": name, "id": id}
 }

 function addArtist(artist){
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        addArtistCallback(request.responseText);
    }

    let url = lidarr + "artist" + auth;
    request.open("POST", url);
    request.setRequestHeader('accept', 'application/json');
    request.setRequestHeader('Content-Type', 'application/json');

    request.onreadystatechange = function(){
        addArtistCallback(request);
    }

    let folder = artist["name"].replace(" ", "");
    dictBody = {
        "artistName": artist["name"], // irrelevant, but needed
        "foreignArtistId": artist["id"], // the actual identifier
        "qualityProfileId": 1, // 1 for default
        "metadataProfileId": 1, // 1 for default
        "monitored": false, // default to false for one-time downloads
        "monitorNewItems": "all",
        "rootFolderPath": rootPath, 
        "folder": folder, // cleaner folder name
        "path": rootPath + "/" + folder
    }
    request.send(JSON.stringify(dictBody));
}

// Callback for addArtist - checks if everything's ok and the artist has been added
function addArtistCallback(request){
    console.log((request.status))
    if (request.status.toString()[0] == "2"){
        let parsed = JSON.parse(request.responseText);
        addedArtist.innerHTML = parsed["artistName"] + "(" + parsed["id"] +
        ")" + " was added successfully to the library";
    }
    else {
        addArtist.innerHTML = "An error occured. Please try again."
    }
}



// Show all available ARTIST'S ALBUMS 
// In order to retrieve an artist's album, we need to add them to the library:
// we can access info once Lidarr has downloaded metadata

function showAlbums(){
    let id = artistIdAlbums.value;
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        showAlbumsCallback(request);
    }

    let url = lidarr + "album" + auth + "&artistId=" + id + "&includeAllArtistAlbums=true";
    request.open("GET", url);
    request.setRequestHeader("accept", "application/json");
    request.send()

}

function showAlbumsCallback(request){
    // console.log(request)
    if ( request.status == 200 && request.readyState == 4 ){
        let data = showAlbumsParser(request.responseText);
        albums.innerHTML = data;
    }

    else{
        albums.innerHTML = "Error"
    }
}

function showAlbumsParser(text){
    let htmlText = "";
    let json = JSON.parse(text);

    for(let i=0; i<json.length; i++){
        htmlText += json[i]["title"] + " (" + json[i]["id"] + ")" + "<br>";
    }

    return htmlText
}




