const lidarr = "http://127.0.0.1:8686/api/v1/";
const host = "http://127.0.0.1:8686";
var apikey = "bd0bdb44e461412291ee23a026d71744";
var auth = "?apikey=" + apikey;

// import {ArtistLookup} from "./classes";

// Basic DOM elements
const output = document.getElementById("output");
const logs = document.getElementById("logs");
const artistSearchBar = document.getElementById("artistSearchBar");
const showResults = document.getElementById("showResults");
// const artistId = document.getElementById("artistId");
const albums = document.getElementById("albums");
const addedArtist = document.getElementById("addedArtist");
// const artistIdAlbums = document.getElementById("artistIdAlbums");
// const albumId = document.querySelector("#albumId");
const albumRequested = document.querySelector("#albumRequested");
const artistPoster = document.querySelector("#artistPoster");
const results = document.querySelector("#results"); // div containing search bar and search results
const showalbums = document.querySelector("#showalbums");
const libraryDiv = document.querySelector("#library");
const tracks = document.querySelector("#tracks");
const tracksOutput = document.querySelector("#tracksOutput");


const basicHeaders = {"accept": "application/json"};
const postHeaders = {"accept": "application/json", "Content-Type": "application/json"};





// tiny useful function
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}



//*************************************************************************************//
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









//*************************************************************************************//
// LOAD LIBRARY
// Get artists already in library and create instances for them
// (Needed for a better search experience)

var library = {}; // List to be filled with Artist instances, to be accessed through ids

// used to get poster url for artist already in library
function returnPoster(id){
    let url = lidarr + "mediacover/artist/" + id + "/poster.jpg" + auth;
    return url
}



async function loadLibrary(){
    let url = lidarr + "artist" + auth;
    let request = new Request(url, {
        method:"GET",
        headers: basicHeaders
        }
    )

    console.log("Library requested")

    let response = await fetch(request);
    let json = await response.json();


    
    for(let j=0; j<json.length; j++){
        let artist = new Artist(json[j]);
        console.log(artist.name, json[j]);
        library[artist.libId] = artist;
        artist.poster = returnPoster(artist.libId);
        console.log(artist.libraryView());
        libraryDiv.appendChild(artist.libraryView());
    }
}















//*************************************************************************************//
// ARTIST SEARCH
async function artistLookup(){
    // first thing first clean the page and display loading status
    showResults.innerHTML = "Loading..."

    // clear search results, both from lookup and library
    let oldSearchResults = document.querySelectorAll(".artistPreview");
    for(let i=0; i<oldSearchResults.length; i++){
        results.removeChild(oldSearchResults[i])
    }
    let oldSearchResultsLib = document.querySelectorAll(".artistPreviewFromLibrary");
    for(let i=0; i<oldSearchResultsLib.length; i++){
        results.removeChild(oldSearchResultsLib[i])
    }

    
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
        showResults.innerHTML = "Results:";


        // show new results
        for(let j=0; j<json.length; j++){
            if(json[j]["added"] == "0001-01-01T00:00:00Z"){
                // condition checks if artist is already in library - in that case "added" is an actual date/time value        
                let artist = new Artist(json[j]); // creates new instance to show previews
                results.appendChild(artist.lookupView())
            }

            else{
                let currentId = json[j]["id"]; // this is the library id
                results.appendChild(library[currentId].lookupFromLibraryView()); // call the dom creator method on the already existing artist
            }
            
            
        }   
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


// retrieve image url to display artists and albums covers
// async function getMediaCover(json){
//     let images = json[0]["images"];
//     if(images.length == 0){
//         return 0
//     }

//     else{
//         // let path = json[0]["images"][0]["url"].substring(1).replace('MediaCover', 'mediacover/artist').split('?')[0]
        
//         // let url = lidarr + path + auth
//         // return url}
//         let i = 0;
//         while(json[0]["images"][i]["coverType"] != "poster"){
//             i++;
//         }
//         return json[0]["images"][i]["remoteUrl"];
//     }
// }





//*************************************************************************************//
// ADD ARTIST TO LIBRARY
//  // tiny helper to retrieve artist's info from text field
// function getArtistInfo(){
//     let value = artistId.value;
//     let name = value.split(" - ")[0];
//     let id = value.split(" - ")[1];
//     return {"name": name, "id": id}
// }

async function addArtist(artist){
    addedArtist.innerHTML = "Loading...";
    let name = artist.name;
    let id = artist.id;
    let url = lidarr + "artist" + auth;
    let folder = name.replace(" ", "");
    let dictBody = {
            "artistName": name, 
            "foreignArtistId": id,
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

    let libId =  await fetch(request).then( async(response) => {return await addArtistCallback(response)} ); // I need to return library id for the artist,
    artist.libId = libId;
    return libId;                                                                                             // storing it inside an Artist instance
    //console.log(request)
}



// Callback for addArtist - checks if everything's ok and the artist has been added
async function addArtistCallback(response){
    // console.log((response.text()))
    let id = -1;
    if (response.ok){
        let parsed = await response.json();
        id = parsed["id"];
        addedArtist.innerHTML = "<b>" + parsed["artistName"] + "</b>" + " was added successfully to the library";
        library[id] = new Artist(parsed);

    }
    else {
        if(String(await response.text()).includes("This artist has already been added")){
            addedArtist.innerHTML = "This artist has already been added."
        }
        else{
        addedArtist.innerHTML = "An error occured. Please try again."
        }
        id = -1;
    }

    // setCurrentArtist(await id);
    return id

}




//*************************************************************************************//
// Show all available ARTIST'S ALBUMS 
// In order to retrieve an artist's album, we need to add them to the library:
// we can access info once Lidarr has downloaded metadata


function returnAlbumCover(album){        
    let url = lidarr + "mediacover/album/" + album.id + "/cover.jpg" + auth;
    return url
}


async function showAlbums(artistId){
    showalbums.innerHTML = "Loading..."
        
    let url = lidarr + "album" + auth + "&artistId=" + artistId + "&includeAllArtistAlbums=true";
    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    });


    await fetch(request).then( (response) => showAlbumsCallback(response, artistId) )
    


}

var retry = 0;
const MAXRETRY = 20;
async function showAlbumsCallback(response, id){
    let json = await response.json();
    if(json.length == 0 && retry < MAXRETRY){
        console.log("retry", retry);
        await sleep(1000);
        showAlbums(id); // this is needed, as sometimes it takes too much time for lidarr to load metadata and
        retry++;        // the response is empty. So just try to get info a few times more, before giving up
        return 0
    }
    else{
        console.log(response)
        if (response.ok){
            // let json = await response;
            console.log("ok", json.length, retry, MAXRETRY); 
            showalbums.innerHTML = "Releases:"

            let oldAlbums = document.querySelectorAll(".albumPreview") 
            for(let a=0; a<oldAlbums.length; a++){
                albums.removeChild(oldAlbums[a]);
            } // clear albums shown from previous search

            //sleep(1000);
            for(let i=0; i<json.length; i++){    
                let album = new Album(json[i]); // create a new Album (for display purpose) instance
                album.cover = returnAlbumCover(album);
                albums.appendChild(album.domElement());
                console.log(json[i]);
            }
            reloadCovers(); // start function that tries to reload covers which aren't yet downloaded
        }

        else{
            showalbums.innerHTML = "Error"
        }
    }
    retry = 0;
}


async function reloadCovers(){
    let images = document.querySelectorAll(".albumPreviewPoster"); // get covers to check
    for(let i=0; i<images.length; i++){
        
        let url = images[i].getAttribute("src");
        let request = new Request(url, {
            method: "GET",
            headers: {
                "accept": "*/*"
            }
        }); // crafting query to mediacover api (just using images' own sources)
        let response = await fetch(request);

        let retries = 0; // now wait for a 200 response - retrying once a sec
        while(!response.ok && retries < MAXRETRY){
            console.log("retry")
            retries++;
            await sleep(500);
            response = await fetch(request);
        }

        // finally reload image: changing src fooling the cache
        images[i].setAttribute("src", url + "#" + new Date().getTime());
        console.log(`retried ${retries} times, for image ${url}, loop number ${i}`);
    }
} // keeps reloading album covers until the get request returns something good


// async function showAlbumsParser(json){
//     let htmlText = "";
//     for(let i=0; i<json.length; i++){
//         htmlText += json[i]["title"] + " (" + json[i]["id"] + ") <i>" + json[i]["albumType"] +  "</i><br>";
//         // console.log(json[i])
//     }

//     return htmlText
// }// once needed, now I do it through instances and methods







 
//*************************************************************************************//

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
    return json

}



async function requestAlbum(artist, album){
    // let raw = albumId.value;
    // let albumNum = raw.split("-")[1];
    // let artistNum = raw.split("-")[0];
    albumRequested.innerHTML = 'Please wait...';

    let url = lidarr + "release" + auth;
    let releases = await getReleases(artist, album);
    let release = false;

    for(let j=0; j<releases.length; j++){
        if(releases[j]["approved"]){
            release = releases[j];
        }
    }

    if(release){

        console.log(release)

        let request = new Request(url, {
            method: "POST",
            headers: postHeaders,
            body: JSON.stringify(release)
         })

        console.log(request)

        await fetch(request).then((response) => { requestAlbumCallback(response) });
    }

    else{
        albumRequested.innerHTML = "No releases available, sorry."
    }
}

async function requestAlbumCallback(response){
      // console.log((response.text()))
    if (response.ok){
        let parsed = await response.json();
        albumRequested.innerHTML = "<i>" + parsed["albumTitle"] + "</i>" + " was successfully requested";
    }
    else {
        albumRequested.innerHTML = "An error occured. Please try again."
    }
}



//***********************************************************************************************//
// TRACKS
// Get album tracks and request them singularly

async function showTracks(album){
    let url = lidarr + "track" + auth + "&albumId=" + album.id;
    let request = new Request(url, {
        method:"GET",
        headers: basicHeaders
    });

    albumTracks = await fetch(request);
    showTracksCallback(albumTracks, album);
}

async function showTracksCallback(response, album){
    if(!response.ok){
        tracksOutput.innerHTML = "An error occured while fetching tracks." 
        return;
    }

    let json = await response.json(); // suppose everything's fine and parse songs
    console.log(json);
    // first clean page from old query
    // let oldTracks = document.querySelectorAll(".trackView");
    // for(let t=0; t<oldTracks.length; t++){
    //     tracks.removeChild(oldTracks[t]);
    // }


    // clear space from old query
    let children = tracks.children;
    while(children.length > 2){
        tracks.removeChild(children[children.length-1]);
    }

    // create Track instances for retrieved songs
    let discNumber = 1; 
    for(let j=0; j<json.length; j++){
        let track = new Track(json[j]);

         // this means it's a different disc - just separate it for cleanness
        if(track.number == "1"){
            tracks.appendChild(document.createElement("hr"));
            let discInfo = document.createElement("p");
            discInfo.innerHTML = `DISC ${discNumber}`;
            discInfo.classList.add("trackView");
            tracks.appendChild(discInfo);
            tracks.appendChild(document.createElement("hr"));
            discNumber++;
        }
        
        tracks.appendChild(track.domElement());
    }

    // if(!album.statistics){
    //     tracksOutput.innerHTML = "Loading metadata... Please try again in a minute";
    //     console.log("no stats", album.statistics, album)
    // }

    // else{
    //     tracksOutput.innerHTML = `<b>${album.title}</b> - ${json.length} songs found out of ${album.statistics["trackCount"]}`;
    // }
    tracksOutput.innerHTML = `<b>${album.title}</b> - ${json.length} songs found`;

}
