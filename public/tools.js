// tiny useful functions which don't involve handling main workflow
// slim commentary provided, as they're quite self-describing


function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}


function cleanDuplicates(self){
    let unique = [];
    let copy = [];
    let output = [];

    for(let s = 0; s<self.length; s++){
      if(!copy.includes(s)){
        unique.push(s);
        for(let c = s+1; c<self.length; c++){
            if(self[c]["disambiguation"] == self[s]["disambiguation"]){   // disambiguation identity is the criterion for flaggin releases as the same
                copy.push(c);
            }
        }
      }
    }
    for(let u=0; u<unique.length; u++){
        output.push(self[unique[u]]);
    }
    return output
}



function returnAlbumCover(album){        
    // let url = lidarr + "mediacover/album/" + album.id + "/cover.jpg" + auth;
    let url = "/returncover" + `?id=${album.id}`;
    return url
}


async function getAlbumFromId(id){
    // let url = lidarr + "album/" + id + auth;
    let url = "/albumfromid"+ `?id=${id}`;
    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    });

    let album = await fetch(request);
    return album.json();
}

function clearTracks(){
    if(!tracksDiv){
        return 0;
    }
    let children = tracksDiv.children;
    while(children.length > 0){
        tracksDiv.removeChild(children[children.length-1]);
    }
}


// clear artist search results, both from lookup and library
function clearResults(){
    let oldSearchResults = document.querySelectorAll(".artistPreview");
    for(let i=0; i<oldSearchResults.length; i++){
        main.removeChild(oldSearchResults[i])
    }
    let oldSearchResultsLib = document.querySelectorAll(".artistPreviewFromLibrary");
    for(let i=0; i<oldSearchResultsLib.length; i++){
        main.removeChild(oldSearchResultsLib[i])
    }
}


// clear albums and info shown from previous search
function clearAlbums(){
    let oldAlbums = main.querySelectorAll(".albumPreview") 
    for(let a=0; a<oldAlbums.length; a++){
        main.removeChild(oldAlbums[a]);
    }
    let oldVersions = main.querySelectorAll(".versionInfo");
    for(let v=0; v<oldVersions.length; v++){
        main.removeChild(oldVersions[v]);
    }
}


function clearLibrary(){
    // clear Library div
    let libArtists = document.querySelectorAll(".artistLibraryPreview");
    for(let l=0; l< libArtists.length; l++){
        libraryDiv.removeChild(libArtists[l]);
    }
}

function clearQueue(){
    let oldQueue = queueDiv.querySelectorAll(".queueElement");
    for(let q=0; q<oldQueue.length; q++){
        queueDiv.removeChild(oldQueue[q]);
    }
}


function clearReleases(){
    let releases = releasesDiv.querySelectorAll(".versionInfo");
    for(let r=0; r<releases.length; r++){
        releasesDiv.removeChild(releases[r]);
    }
}

function clearReleasesDiv(){
    let children = releasesDiv.children;
    while(children.length > 0){
        releasesDiv.removeChild(children[children.length-1]);
    }
}

function addVariants(self){
    let lower = "";
    let expanded = self;
    for(let i=0; i<self.length; i++){
        lower = lower + (self[i].toLowerCase());
    }

    if(lower.includes("remastered")){
        expanded.push("remaster");
    }

    else if(lower.includes("remaster")){
        expanded.push("remastered");
    }
    return expanded
}
