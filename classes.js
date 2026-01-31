// Useful classes to display search results, artists, albums and so on
// (In a different file cause I like it like that)

// ARTIST instance to be used when displaying search results - equipped with most relevant metadata
// provides a ready-to-use dom element, also linked to main functions

class Artist {

  constructor(params){
    this.name = params["artistName"];
    this.id = params["foreignArtistId"];
    this.status = params["status"];
    this.links = params["links"];
    this.images = params["images"];
    this.overview = params["overview"];
    this.genres = params["genres"];
    this.ratings = params["ratings"];
    this.statistics = params["statistics"];
    this.libId = 0;
    this.remotePoster = "";

    if(Object.keys(params).includes("id")){
      this.libId = params["id"];
      this.remotePoster = params["remotePoster"];
    }

    this.poster = "";


  }

  getPoster(){
    let images = this.images;
    if(images.length == 0){
        return 0
    }

    else{
       let i = 0;
       while(images[i]["coverType"] != "poster"){
         i++;
       }
       return images[i]["remoteUrl"];
    }
  }

  lookupView(){
    let result = document.createElement("div");
    result.id = this.id;
    result.innerHTML = this.name;
    result.classList.add("artistPreview");


    let img = document.createElement("img");
    img.src = this.getPoster();
    img.alt = `[ ${this.name} poster ]`;
    img.classList.add("artistPreviewPoster");
    result.appendChild(img);

    let btn = document.createElement("button");
    btn.onclick = async() => { 
      await addArtist(this).then(
        (id) => {showAlbums(id);}
      );
      
         
    };
    btn.innerHTML = "View"
    result.appendChild(btn)

    if(this.overview){
      let info = document.createElement("p");
      info.innerHTML = this.overview;
      result.appendChild(info)
    }


    return result
  }




 libraryView(){
    let result = document.createElement("div");
    result.innerHTML = this.name;
    result.classList.add("artistLibraryPreview");

    let img = document.createElement("img");
    img.src = this.poster;
    img.alt = this.name;
    img.classList.add("artistLibraryPoster");
    result.appendChild(img);

    let btn = document.createElement("button");
    btn.onclick = () => { showAlbums(this.libId)};
    btn.innerHTML = "View"
    result.appendChild(btn)

    return result
  }


  
 lookupFromLibraryView(){
    let result = document.createElement("div");
    result.innerHTML = this.name;
    result.classList.add("artistPreviewFromLibrary");

    let img = document.createElement("img");
    img.src = this.poster;
    img.alt = `[ ${this.name} poster ]`;
    img.classList.add("artistPreviewPoster");
    result.appendChild(img);

    let btn = document.createElement("button");
    btn.onclick = () => { showAlbums(this.libId)};
    btn.innerHTML = "View"
    result.appendChild(btn)

    
    if(this.overview){
      let info = document.createElement("p");
      info.innerHTML = this.overview;
      result.appendChild(info)
    }

    return result
  }





}




// ALBUM instance to be used when displaying artist's albums - equipped with most relevant metadata
// provides a ready-to-use dom element, linked to main functions 

class Album {
  constructor(params){
    this.title = params["title"];
    this.id = params["id"];
    this.duration = params["duration"];
    this.albumType = params["albumType"];
    this.images = params["images"];
    this.overview = params["overview"];
    this.genres = params["genres"];
    this.ratings = params["ratings"];
    this.statistics = params["statistics"];
    this.remotePoster = params["remotePoster"];
    this.artist = params["artist"]["id"];
    this.cover = "";
  }


  domElement(){
    let preview = document.createElement("div");
    preview.id = this.id;
    preview.classList.add("albumPreview");

    let img = document.createElement("img");
    img.alt = `[ ${this.title} cover ]`;
    img.src = this.cover;
    img.classList.add("albumPreviewPoster");
    preview.appendChild(img);


    let info = document.createElement("p");
    info.innerHTML = this.title + "<i> (" + this.albumType + ")</i>";
    preview.appendChild(info);

    let btn = document.createElement("button");
    btn.innerHTML = "Request";
    btn.onclick = () => {
      requestAlbum(this.artist, this.id);
    }
    preview.appendChild(btn);

    let view = document.createElement("button");
    view.innerHTML = "View";
    view.onclick = () => {
      showTracks(this);
    }
    preview.appendChild(view);



    return preview
  }
}


class Track{
  constructor(params){
    this.artist = params["artistId"];
    this.album = params["albumId"];
    this.title = params["title"];
    this.duration = params["duration"];
    this.id = params["id"];
    this.number = params["trackNumber"];
  }

  parseDuration(){
    let d = this.duration/1000;
    if(d/60 > 60){
      let seconds = Math.floor(d%60);
      let minutes = (d-seconds)/60;
      let hours = (minutes-(minutes%60))/60;
      minutes = minutes%60;
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    else{
      let seconds = (d%60);
      let minutes = (d-seconds)/60;
      return `${minutes}m ${parseInt(seconds)}s`;
    }
  }

  domElement(){
    let trackEl = document.createElement("div");
    trackEl.classList.add("trackView");
    trackEl.innerHTML = this.number + ".  " + this.title + "<i> (" + this.parseDuration(this.duration) + "</i>)";

    return trackEl
    
  }

  
}
