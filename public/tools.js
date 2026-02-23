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
    let children = tracks.children;
    while(children.length > 2){
        tracks.removeChild(children[children.length-1]);
    }
}


// clear artist search results, both from lookup and library
function clearResults(){
    let oldSearchResults = document.querySelectorAll(".artistPreview");
    for(let i=0; i<oldSearchResults.length; i++){
        results.removeChild(oldSearchResults[i])
    }
    let oldSearchResultsLib = document.querySelectorAll(".artistPreviewFromLibrary");
    for(let i=0; i<oldSearchResultsLib.length; i++){
        results.removeChild(oldSearchResultsLib[i])
    }
}


// clear albums and info shown from previous search
function clearAlbums(){
    let oldAlbums = albums.querySelectorAll(".albumPreview") 
    for(let a=0; a<oldAlbums.length; a++){
        albums.removeChild(oldAlbums[a]);
    }
    let oldVersions = albums.querySelectorAll(".versionInfo");
    for(let v=0; v<oldVersions.length; v++){
        albums.removeChild(oldVersions[v]);
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
