// Useful classes to display search results, artists, albums and so on
// (In a different file cause I like it like that)

class ArtistLookup(){

  function constructor(params){
    this.name = params["artistName"];
    this.id = params["foreignArtistId"];
    this.status = params["status"];
    this.links = params["links"];
    this.images = params["images"];
    this.overview = params["overview"];
    this.genres = params["genres"];
    this.ratings = params["ratings"];
    this.statistics = params["statistics"];
  }


  function poster(){
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

}


export {ArtistLookup}
