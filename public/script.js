// MAIN LOGIC

// Basic DOM elements
// const  = document.getElementById("output");
// const logs = document.getElementById("logs");
// const artistSearchBar = document.getElementById("artistSearchBar");
// const showResults = document.getElementById("showResults");
// // const artistId = document.getElementById("artistId");
// const albums = document.getElementById("albums");
// const addedArtist = document.getElementById("addedArtist");
// // const artistIdAlbums = document.getElementById("artistIdAlbums");
// // const albumId = document.querySelector("#albumId");
// const albumRequested = document.querySelector("#albumRequested");
// const artistPoster = document.querySelector("#artistPoster");
// const results = document.querySelector("#results"); // div containing search bar and search results
// const showalbums = document.querySelector("#showalbums");
// const libraryDiv = document.querySelector("#library");
// const tracks = document.querySelector("#tracks");
// const tracksOutput = document.querySelector("#tracksOutput");
// const queueDiv = document.querySelector("#queue");


const basicHeaders = {"accept": "application/json"};
const postHeaders = {"accept": "application/json", "Content-Type": "application/json"};




// async function neededForNow(id){
//     let url = lidarr +"album/" + id + auth;
//     let myDict = {
//         "anyReleaseOk": false
//     };
//     let request = new Request(url, {
//         method: "GET",
//         headers: basicHeaders
//     });

//     let resp = await fetch(request);
//     console.log(resp.json(), resp);
// }



// receive a list of releases (for the same album) and evict duplicates 
// function cleanDuplicates(self){
//     let unique = [];
//     let copy = [];
//     let output = [];

//     for(let s = 0; s<self.length; s++){
//       if(!copy.includes(s)){
//         unique.push(s);
//         for(let c = s+1; c<self.length; c++){
//             if(self[c]["disambiguation"] == self[s]["disambiguation"]){   // disambiguation identity is the criterion for flaggin releases as the same
//                 copy.push(c);
//             }
//         }
//       }
//     }
//     for(let u=0; u<unique.length; u++){
//         output.push(self[unique[u]]);
//     }
//     return output
// }




// tiny useful function
// function sleep(ms){
//     return new Promise(resolve => setTimeout(resolve, ms));
// }








//*************************************************************************************//
// Performs first HEALTH CHECKS and sets Root path
async function healthCheck(){
    let request = new Request("/health", {  
        method:"GET",
        }
    );
    let response = await fetch(request); // wait for fetch to return response and then put it in variable
    console.log(response);
    healthCallback(response); // callback to handle response
    // console.log(response.json())

}


healthCheck()

// Callback for healtCheck, displays api/health response and errors
async function healthCallback(response){
    let data = await response.text(); // response is a promise, so we have to resolve it first
   // console.log("here", data)
    if (response.ok){
            if( !data.includes("error") ){  // response is 200 even though there are errors: it just means api is up
                // output.innerHTML = "All good to go!"
                setRoot(); // if everything's fine we set root path
                getQualityProfiles(); // set quality profile
                getMetaProfiles(); // set metadata profile
                console.log("All good to go!");
                // loadLibrary();
                home();
            }
            else {
                console.log("An error occured.");
                logs.innerHTML = await errorParser(data); // parser returns a promise, it needs to be resolved 
            }
        }
    else {
        console.log("Service temporarily unavailable. Please try again in a few minutes or contact support.");
        completeFailure();
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
    let request = new Request("/setroot", {
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
    let url = "/metaprofiles";
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
    let url = "/qualityprofiles";
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
    let url = "/returnposter" + `?id=${id}`;
    return url
}


// load/reload library
async function loadLibrary(){
    library = {}; // reset
    clearLibrary();
        
    // let url = lidarr + "artist" + auth;i
    let url = "/library";
    let request = new Request(url, {
        method:"GET",
        headers: basicHeaders
        }
    )

    console.log("Library requested")

    let response = await fetch(request);
    loadLibraryCallback(response);    
    // // fill library with artists     
    // for(let j=0; j<json.length; j++){
    //     let artist = new Artist(json[j]);
    //     console.log(artist.name, json[j]);
    //     library[artist.libId] = artist;
    //     artist.poster = returnPoster(artist.libId); 
    //     console.log(artist.libraryView());
        
    //     libraryDiv.appendChild(artist.libraryView());
    // }
    // 
}



async function loadLibraryCallback(response){
    console.log("coming")
    // fill library with artists
    let json = await response.json();
    console.log(json)  
    for(let j=0; j<json.length; j++){
        let artist = new Artist(json[j]);
         console.log(artist.name, json[j]);
        //
        // when reloading library, lidarr doesnt retrieve overview for artists already added,
        // so try to keep the old one
        if(library[artist.libId]){
            console.log("in library")
            artist.overview = (library[artist.libId]).overview;
            console.log(artist.overview)
        }
        library[artist.libId] = artist;
        artist.poster = returnPoster(artist.libId);
        if(!artist.images.length){
            artist.poster = "unknown.png";
        }
        // console.log(artist.libraryView());
        
        libraryDiv.appendChild(artist.libraryView());
        artist.reloadPoster();
    }

}

// // clear search results, both from lookup and library
// function clearResults(){
//     let oldSearchResults = document.querySelectorAll(".artistPreview");
//     for(let i=0; i<oldSearchResults.length; i++){
//         results.removeChild(oldSearchResults[i])
//     }
//     let oldSearchResultsLib = document.querySelectorAll(".artistPreviewFromLibrary");
//     for(let i=0; i<oldSearchResultsLib.length; i++){
//         results.removeChild(oldSearchResultsLib[i])
//     }
// }


// // clear albums and info shown from previous search
// function clearAlbums(){
//     let oldAlbums = albums.querySelectorAll(".albumPreview") 
//     for(let a=0; a<oldAlbums.length; a++){
//         albums.removeChild(oldAlbums[a]);
//     }
//     let oldVersions = albums.querySelectorAll(".versionInfo");
//     for(let v=0; v<oldVersions.length; v++){
//         albums.removeChild(oldVersions[v]);
//     }
// }




//*************************************************************************************//
// ARTIST SEARCH
// Search for specific artist through GET ArtistLookup schema
async function artistLookup(){
    // first thing first clean the page and display loading status
    showResults.innerHTML = "Loading..."

    clearResults();
    clearAlbums();
    
    let term = artistSearchBar.value;
    console.log("TERM", term)
    term = "?term=" + term.replace(" ", "%20") // include spaces in url
    // let suffix = "artist/lookup";
    // let url = lidarr + suffix + auth + term;
    let url = "/artistlookup" + term


    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    })

    console.log(request);
    await fetch(request).then((response) => artistLookupCallback(response));
    // artistLookupCallback(response)
    return false
}

// callback for artistLookup
async function artistLookupCallback(response){
    let json = await response.json();
    console.log(json)
    if (response.ok){
        showResults.innerHTML = "Results:";
        switch2Normal();

        // show new results
        for(let j=0; j<json.length; j++){
            // condition checks if artist is already in library - in that case "added" is an actual date/time value        
            if(json[j]["added"] == "0001-01-01T00:00:00Z"){
                let artist = new Artist(json[j]); // creates new instance to show previews
                console.log(json[j]);
                main.appendChild(artist.lookupView()) // dom element from Artist class to show the artist as a search result
            }

            else{
                let currentId = json[j]["id"]; // this is the library id
                // library[currentId].overview = json[j]["overview"];
                console.log(library[currentId]);
                main.appendChild(library[currentId].lookupFromLibraryView()); // call the dom creator method on the already existing artist
            } 
        }   
    }

    else{
        // request completely failed
        // that 501 "internal server error - unable to communicate with lidarr" means the query was unsuccessfull
        showResults.innerHTML = "No results. Please try again"
    }
}

// async function artistLookupParser(json){
//     let htmlText = "";
//     for(let i=0; i<json.length; i++){
//         htmlText += json[i]["artistName"] + " - " + json[i]["foreignArtistId"] + "<br>";
//     }
//     return htmlText

// } // deprecated: now it's done through Artist class


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

// function takes an artist as input, to get their metadata and pass it to the POST request,
// profiles and paths are taken from global values set before
// async function addArtist(artist){
//     addedArtist.innerHTML = "Loading...";
//     let name = artist.name;
//     let id = artist.id;
//     let url = lidarr + "artist" + auth;
//     let folder = name.replace(" ", "");
//     let dictBody = {
//             "artistName": name, 
//             "foreignArtistId": id,
//             "qualityProfileId": qualityProfile,
//             "metadataProfileId": metadataProfile, 
//             "monitored": false, 
//             "monitorNewItems": "all",
//             "rootFolderPath": rootPath, 
//             "folder": folder,
//             "path": rootPath + "/" + folder
//         };

//     let request = new Request(url, {
//         method: "POST",
//         headers: postHeaders,
//         body: JSON.stringify(dictBody)
//     })  

//     let libId =  await fetch(request).then( async(response) => {return await addArtistCallback(response)} ); // I need to return library id for the artist,
//     artist.libId = libId;// storing it inside the Artist instance
//     return libId;                                                                                             
//     //console.log(request)
// }



// Callback for addArtist - checks if everything's ok and the artist has been added
async function addArtistCallback(response){
    // console.log((response.text()))
    console.log(`\n\n${response}\n\n`);
    let id = -1;
    main.removeChild($$$(main, "#loading"));
    if (response.ok){
        let parsed = await response.json();
        console.log(parsed)
        id = parsed["id"];
        console.log("\n\n\n", parsed["overview"], "\n\n\n");
        console.log("<b>" + parsed["artistName"] + "</b>" + " added successfully to the library");
        library[id] = new Artist(parsed); // create a new Artist instance and push it in the library
        console.log(library[id])
        library[id].showAlbums();
    }

    // response not ok
    else {
        // maybe the error is due to artist being already in library
        if(String(await response.text()).includes("This artist has already been added")){
            console.log("This artist has already been added.")
        }
        else{
            console.log("An error occured. Please try again.") // just failed
        }
        id = -1;
    }

    // update library with new artist
    loadLibrary();

    // addArtist needs this value to set it as artist.libId
    return id
}




//*************************************************************************************//
// Show all available ARTIST'S ALBUMS 
// In order to retrieve an artist's album, we need to add them to the library:
// we can access info once Lidarr has downloaded metadata


// function returnAlbumCover(album){        
//     let url = lidarr + "mediacover/album/" + album.id + "/cover.jpg" + auth;
//     return url
// }


// async function showAlbums(artistId){
//     clearResults();
//     clearAlbums();
//     showalbums.innerHTML = "Loading..."
        
//     let url = lidarr + "album" + auth + "&artistId=" + artistId + "&includeAllArtistAlbums=true";
//     let request = new Request(url, {
//         method: "GET",
//         headers: basicHeaders
//     });


//     await fetch(request).then( (response) => showAlbumsCallback(response, artistId) )
    


// }

var retry = 0;
const MAXRETRY = 10;

async function showAlbumsCallback(response, artist){
    let json = await response.json();
    
    // this is needed, as sometimes it takes too much time for lidarr to load metadata and
    // the response is empty. So just try to get info a few more times, before giving up
    if(json.length == 0 && retry < MAXRETRY){
        // console.log("retry", retry);
        await sleep(1000);
        artist.showAlbums(); // fetch again
        retry++;
        return 0 // on successfull request, the remaing part of the function will be executed
                 // as a callback for that specific request, so there's no point in doing it again: just return 
    }

    // json is good (or maxretries reached)
    else{
        console.log(response)
        if (response.ok){
            // let json = await response;
            console.log("ok", json.length, retry, MAXRETRY);
            console.log(json) 
            showalbums.innerHTML = "Releases";
            
            // await sleep(1000);
            for(let i=0; i<json.length; i++){    
                let album = new Album(json[i]); // create a new Album (for display purpose) instance
                album.cover = returnAlbumCover(album); // we need to query api to get an actual url for that media
                let element = album.domElement();
                console.log("done");

                // // check whether to display a status widget or not - "queued" is just the global dict of albums involved
                // if(queued[album.id]){
                //     // console.log(queued[album.id]);
                //     let status = new Status(queued[album.id]);                  
                //     element.appendChild(status.domElement());
                // }
                
                main.appendChild(element);
                album.reloadCover(); // to cope with delays
                // console.log("Releases:", album.title, album.getRelease());
            }
        }

        else{
            showalbums.innerHTML = "Error"
        }
    }
    retry = 0;
}


// async function getAlbumFromId(id){
//     let url = lidarr + "album/" + id + auth;
//     let request = new Request(url, {
//         method: "GET",
//         headers: basicHeaders
//     });

//     let album = await fetch(request);
//     return album.json();
// }
// async function reloadCovers(){
//     let images = document.querySelectorAll(".albumPreviewPoster"); // get covers to check
//     for(let i=0; i<images.length; i++){
        
//         let url = images[i].getAttribute("src");
//         let request = new Request(url, {
//             method: "GET",
//             headers: {
//                 "accept": "*/*"
//             }
//         }); // crafting query to mediacover api (just using images' own sources)
//         let response = await fetch(request);

//         let retries = 0; // now wait for a 200 response - retrying once a sec
//         while(!response.ok && retries < MAXRETRY){
//             // console.log("retry")
//             retries++;
//             await sleep(500);
//             response = await fetch(request);
//         }

//         // finally reload image: changing src fooling the cache
//         images[i].setAttribute("src", url + "#" + new Date().getTime());
//         // console.log(`retried ${retries} times, for image ${url}, loop number ${i}`);
//     }
// } // keeps reloading album covers until the get request returns something good


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
// async function getReleases(artist, album, release){
//     console.log(release)
//     let url = lidarr + "release" + auth + `&albumId=${album}&artistId${artist}`;
//     let request = new Request(url, {
//         method: "GET",
//         headers: basicHeaders
//     })

//     // select release suitable for download
//     let response = await fetch(request);
//     let json = await response.json();
//     return json

// }
// now replaced by an Album method



// sometimes release profiles remain stuck
// just want to be sure they're all cleared before
// starting new query
async function deleteProfiles(){
    // first get all available profiles
    // let url = lidarr + "releaseprofile/" + auth;
    // let request = new Request(url, {
    //     method: "GET",
    //     headers: basicHeaders
    // })
    // let response = await fetch(request);
    // let json = await response.json();

    // console.log(json, json.length);

    // // then delete each one of em
    // for(let p=0; p<json.length; p++){
    //     url = lidarr + "releaseprofile/" + json[p]["id"] + auth;
    //     request = new Request(url, {
    //         method: "DELETE",
    //         headers: postHeaders
    //     })
    //     await fetch(request);
    // }
    let request = new Request("/deleteprofiles", {
        method: "GET",
        headers: basicHeaders
    })
    let response = await fetch(request);
    console.log(response);
}




// test releases to check if they're actually available
// actually a wrapper for getTorrentRelease
// async function requestAlbumTest(album, choice){
//     console.log("starting test...", album.title);
//     console.log("waiting for getTorrent");

//     let release = await album.getTorrentRelease(choice);
//     console.log("RELEASE", release);

//     if(release){
//         console.log(release, JSON.stringify(release));
//         return true
//     }

//     else{
//         return false
//     }
// }



// performs POST request needed to add Album to download queue
// function takes artist-album and choice, which is the specific release, provided by Album instance
// called by Album.addRequestButton(choice)
// async function requestAlbum(album, choice){
//     albumRequested.innerHTML = 'Please wait...';
//     await deleteProfiles();

//     let url = lidarr + "release" + auth;
//     // // let releases = await getReleases(artist, album, choice);
//     // find a torrent for the specified album (and relative release);
//     let release = await album.getTorrentRelease(choice);

//     // download found, add it to queue
//     if(release){
//         console.log(release, JSON.stringify(release));
//         let request = new Request(url, {
//             method: "POST",
//             headers: postHeaders,
//             body: JSON.stringify(release)
//         });

//         console.log("Request:",request);
//         await fetch(request).then((response) => { requestAlbumCallback(response) });
//     }

//     else{
//         albumRequested.innerHTML = "No downloads found for this release. Please try a different one or go for Standard"
//     }
// }

// callback for requestAlbum - display query results
async function requestAlbumCallback(response){
      // console.log((response.text()))
    // let info = document.createElement("p");
    let info = outputReleasesDiv;
    if (response.ok){
        let parsed = await response.json();
        console.log(parsed);
        let text = "<i>" + await parsed["albumTitle"] + "</i>" + " was successfully requested";
        console.log(text);
        info.innerHTML = text;
    }
    else {
        info.innerHTML = "An error occured. Please try again."
    }
    releasesDiv.appendChild(info);
}



//***********************************************************************************************//
// TRACKS
// Get album tracks to display them
async function showTracks(album, id){
    // id is actually optional - it depends on which function is calling it
    let url;
    if(id){
        url = "/tracks" + "?albumId=" + album.id + "&albumReleaseId=" + id; // specific album release
    }
    else{
        url = "/tracks" + "?albumId=" + album.id + "&albumReleaseId=0"; // general release
    }
    
    let request = new Request(url, {
        method:"GET",
        headers: basicHeaders
    });

    let albumTracks = await fetch(request);
    showTracksCallback(albumTracks, album);
}

async function showTracksCallback(response, album){
    if(!response.ok){
        mainInfo.innerHTML = "An error occured while fetching tracks." 
        return;
    }

    let json = await response.json(); // suppose everything's fine and parse songs
    console.log(json);
    
    // clear space from old query
    clearTracks();

    // they spawn inside the same div, so just be sure it is empty
    if(!tracksMode){
        clearAlbums();
        switch2Normal();
        switch2Tracks();
    }
    
    // let tracksDiv = document.createElement("div");
    // tracksDiv.id = "tracksDiv";
    // main.appendChild(tracksDiv);
    // create Track instances for retrieved songs
    let discNumber = 1; 
    for(let j=0; j<json.length; j++){
        let track = new Track(json[j]);
        


        // this means it's a different disc - just separate it for cleaner display
        if(track.number == "1"){
            tracksDiv.appendChild(document.createElement("hr"));
            let discInfo = document.createElement("p");
            discInfo.innerHTML = `DISC ${discNumber}`;
            discInfo.classList.add("trackView");
            tracksDiv.appendChild(discInfo);
            tracksDiv.appendChild(document.createElement("hr"));
            discNumber++;
        }
        
        tracksDiv.appendChild(track.domElement());
    }

    // let anyRel = document.createElement("p");
    // // anyRel.innerHTML = "Standard - try this if everything else failed";
    // anyRel.innerHTML = "Default";
    // anyRel.id = `standardDownload${this.id}`;
    // anyRel.classList.add("versionInfo");
    // releasesDiv.appendChild(anyRel);

    
    // releasesDiv.appendChild(anyRel);

    
    // there's no point in trying to load the available releases, if this album has already been requested
    if(!queued[album.id] && !$("#btndef")){
        let btnDef = document.createElement("button");
        btnDef.innerHTML = "Request";
        btnDef.id = "btndef";
        btnDef.onclick = () => {
            album.forceRelease(); // do not perform checks, just try to push it and hope for the best
        }
        releasesDiv.appendChild(btnDef);

        let btn = document.createElement("button");
        btn.innerHTML = "Fetch other releases";
        btn.onclick = () => {
            album.reloadRelease();
        }
        releasesDiv.appendChild(btn);      
    }

    
    // check whether to display a status widget or not - "queued" is just the global dict of albums involved
    if(queued[album.id]){
        // console.log(queued[album.id]);
        let status = new Status(queued[album.id]);                  
        releasesDiv.appendChild(status.domElement());
    }


    // if(!album.statistics){
    //     tracksOutput.innerHTML = "Loading metadata... Please try again in a minute";
    //     console.log("no stats", album.statistics, album)
    // }

    // else{
    //     tracksOutput.innerHTML = `<b>${album.title}</b> - ${json.length} songs found out of ${album.statistics["trackCount"]}`;
    // }
    // tracksOutput.innerHTML = `<b>${album.title}</b> - ${json.length} songs found`;

}


//***********************************************************************************************//
// QUEUE AND STATUS
// Get queue and manage status (imported, failed, downloading...)

var queueResponse = "";
// perform basic GET request
async function getQueue(){
    // let url = lidarr + "queue" + auth;
    if(!$("#queue")){
        return 0
        console.log("Returning zero");
    }
    let url = "/queue";
    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    });

    console.log(request);

    await fetch(request).then( (response) => {manageQueue(response)} );
}



var queued = {}; // used to store albums that are being processed

// callback for getQueue
async function manageQueue(response){
    
    let json  = await response.json();
    // let json = await response;
    console.log(json);
    let records = json["records"]; // it consists of an array containing all information we need
    console.log(records);

    if($$$(main, "#queue")){
        clearQueue();

        for(let r=0; r<records.length; r++){
            let status = new Status(records[r]);
            let display = await status.domElementStandAlone();
            queueDiv.appendChild(display);
            queued[`${status.albumId}`] = status; 
        }

        
    }
}

getQueue();
setInterval(
    () => {getQueue()},
    10000
);

// setInterval(
//     () => {manageQueue(queueResponse)},
//     1000
// )


async function test(text){
    let data = {"bodyText": text};
    let url = '/postman';

    let request = new Request(url, {
        method:"POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    });

    fetch(request).then(
        (response) => console.log(response.json())
    );

}
