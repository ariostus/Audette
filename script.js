const lidarr = "http://127.0.0.1:8686/api/v1/";
const host = "http://127.0.0.1:8686";
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
const albumId = document.querySelector("#albumId");
const albumRequested = document.querySelector("#albumRequested");
const artistPoster = document.querySelector("#artistPoster");


const basicHeaders = {"accept": "application/json"};
const postHeaders = {"accept": "application/json", "Content-Type": "application/json"}



// Performs first HEALTH CHECKS and sets Root path
async function healthCheck(){
    let request = new Request(lidarr+"health"+auth, {  
        method:"GET",
    }
    );
    let response = await fetch(request); // wait for fetch to return response and then put it in variable
    healthCallback(response); // callback to handle response
    // console.log(response.json())

}

// Callback for healtCheck, displays api/health response and errors
async function healthCallback(response){
    let data = await response.text(); // response is a promise, so we have to resolve it first
    // console.log("here", data)
    if (response.ok){
            if( !data.includes("error") ){  // response is 200 even though there are errors: it just means api is up
                output.innerHTML = "All good to go!"
                logs.innerHTML = "";
                setRoot(); // if everything's fine we set root path
                getQualityProfiles(); // set quality profile
                getMetaProfiles(); // set metadata profile
            }
            else {
                output.innerHTML = "An error occured."
                logs.innerHTML = await errorParser(data); // parser returns a promise, it needs to be resolved 
            }
        }
    else {
        output.innerHTML = "Service temporarily unavailable. Please try again in a few minutes or contact support."
    } // this means request completely failed, so api is down
}

// Parse and clean healthCheck response - showing verbose errors
async function errorParser(data){
    response = await JSON.parse(data);
    // console.log("response:", response)
    htmlText = "";
    for(let i=0; i<response.length; i++){
        htmlText += response[i]["message"] + "<br>";
    }
    return htmlText
}

// Retrieve ROOT FOLDER PATH and sets it as global variable
var rootPath = "";
async function setRoot(){
    let request = new Request(lidarr+"rootfolder"+auth, {
        method: "GET",
        headers: basicHeaders
    });
    let response = await fetch(request);
    await response.json().then((json) => {rootPath = json[0]["path"]});
    
}


// Set Metadata and Quality profiles
var metadataProfile = 0;
var qualityProfile = 0;

// get available metadata profiles
async function getMetaProfiles(){
    let url = lidarr + "metadataprofile" + auth;
    let request = new Request(url, {
        headers: basicHeaders
    })

    await fetch(request).then((response) => setMetaProfile(response));
}

// find "Extended" (album, ep, single, studio, live) and set it
async function setMetaProfile(response){
    let json = await response.json();
    let i = 0;
    while(json[i]["name"] != "Extended"){
        i++
    }

    metadataProfile = json[i]["id"];
}



// get available quality profiles
async function getQualityProfiles(){
    let url = lidarr + "qualityprofile" + auth;
    let request = new Request(url, {
        headers: basicHeaders
    })

    await fetch(request).then((response) => setQualityProfile(response));
}

// find "Midquality" and set it 
async function setQualityProfile(response){
    let json = await response.json();
    let i = 0;
    while(json[i]["name"] != "MidQuality"){
        i++
    }

    qualityProfile = json[i]["id"];
    console.log(json)
}


async function getProfiles() {
    return await [metadataProfile, qualityProfile]
}











// ARTIST SEARCH
async function artistLookup(){
    showResults.innerHTML = "Loading..."
    let term = artistSearchBar.value;
    term = "&term=" + term.replace(" ", "%20") // include spaces in url
    let suffix = "artist/lookup";
    let url = lidarr + suffix + auth + term;


    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    })

    await fetch(request).then((response) => artistLookupCallback(response));
    // artistLookupCallback(response)
}

async function artistLookupCallback(response){
    let json = await response.json();
    console.log(json)
    if (response.ok){
        let data = await artistLookupParser(json);
        showResults.innerHTML = data;
        let path = await getMediaCover(json)
        if(path != 0){
            console.log(path)
            artistPoster.src = path
        };
    }

    else{
        showResults.innerHTML = "Error"
    }
}

async function artistLookupParser(json){
    let htmlText = "";
    for(let i=0; i<json.length; i++){
        htmlText += json[i]["artistName"] + " - " + json[i]["foreignArtistId"] + "<br>";
    }
    return htmlText

}



// retrieve accessible image url to display artists and albums covers
async function getMediaCover(json){
    let images = json[0]["images"];
    if(images.length == 0){
        return 0
    }

    else{
        let path = json[0]["images"][0]["url"].substring(1).replace('MediaCover', 'mediacover/artist').split('?')[0]
        
        let url = lidarr + path + auth
        return url}
}




 // ADD ARTIST TO LIBRARY

 // tiny helper to retrieve artist's info from text field
function getArtistInfo(){
    let value = artistId.value;
    let name = value.split(" - ")[0];
    let id = value.split(" - ")[1];
    return {"name": name, "id": id}
}

async function addArtist(artist){
    let url = lidarr + "artist" + auth;
    let folder = artist["name"].replace(" ", "");
    let dictBody = {
            "artistName": artist["name"], 
            "foreignArtistId": artist["id"],
            "qualityProfileId": qualityProfile,
            "metadataProfileId": metadataProfile, 
            "monitored": false, 
            "monitorNewItems": "all",
            "rootFolderPath": rootPath, 
            "folder": folder,
            "path": rootPath + "/" + folder
        };


    let request = new Request(url, {
        method: "POST",
        headers: postHeaders,
        body: JSON.stringify(dictBody)
    })  

    await fetch(request).then((response) => (addArtistCallback(response)));
    //console.log(request)
}

// Callback for addArtist - checks if everything's ok and the artist has been added
async function addArtistCallback(response){
    // console.log((response.text()))
    if (response.ok){
        let parsed = await response.json();
        addedArtist.innerHTML = parsed["artistName"] + "(" + parsed["id"] +
        ")" + " was added successfully to the library";
    }
    else {
        if(String(await response.text()).includes("This artist has already been added")){
            addedArtist.innerHTML = "This artist has already been added."
        }
        else{
        addedArtist.innerHTML = "An error occured. Please try again."
        }
    }
}



// Show all available ARTIST'S ALBUMS 
// In order to retrieve an artist's album, we need to add them to the library:
// we can access info once Lidarr has downloaded metadata

async function showAlbums(){
    albums.innerHTML = "Loading..."
    let id = artistIdAlbums.value;
    
    let url = lidarr + "album" + auth + "&artistId=" + id + "&includeAllArtistAlbums=true";
    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    });

    await fetch(request).then((response) => showAlbumsCallback(response));


}

async function showAlbumsCallback(request){
    // console.log(request)
    if (request.ok){
        albums.innerHTML = await showAlbumsParser(await request.json());;
    }

    else{
        albums.innerHTML = "Error"
    }
}

async function showAlbumsParser(json){
    let htmlText = "";
    for(let i=0; i<json.length; i++){
        htmlText += json[i]["title"] + " (" + json[i]["id"] + ") <i>" + json[i]["albumType"] +  "</i><br>";
        // console.log(json[i])
    }

    return htmlText
}



// Request specific ALBUM DOWNLOAD 
// We actually need to GET available releases and POST to one of them 

// fetch available releases for specific album
async function getReleases(artist, album){
    let url = lidarr + "release" + auth + `&albumId=${album}&artistId${artist}`;
    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    })

    // select release suitable for download
    let response = await fetch(request);
    let json = await response.json();
    console.log(json)
    let i=0;
    while(!json[i]["approved"]){
        i++
    }
    return json[i]

    
}




async function requestAlbum(){
    let raw = albumId.value;
    let albumNum = raw.split("-")[1];
    let artistNum = raw.split("-")[0];

    let url = lidarr + "release" + auth;
    let release = await getReleases(artistNum, albumNum);
    console.log(release)

    let request = new Request(url, {
        method: "POST",
        headers: postHeaders,
        body: JSON.stringify(release)
    })

    console.log(request)

    await fetch(request).then((response) => { requestAlbumCallback(response) });
}

async function requestAlbumCallback(response){
      // console.log((response.text()))
    if (response.ok){
        let parsed = await response.json();
        albumRequested.innerHTML = parsed["albumTitle"] + " was successfully requested";
    }
    else {
        albumRequested.innerHTML = "An error occured. Please try again."
    }
}



