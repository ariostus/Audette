// Useful classes to display search results, artists, albums and so on
// (In a different file cause I like it like that)


// const albumRequested = document.querySelector("#albumRequested");


//**************************************************************//
//********************** ARTIST *********************************//
//**************************************************************//
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
        this.poster = "";
        this.libraryDom = 0;

        // this appens if artist is in library
        if(Object.keys(params).includes("id")){
            this.libId = params["id"];
            this.remotePoster = params["remotePoster"];
        }
    }

    // speaks for itself
    getPoster(){
        let images = this.images;
        console.log("images", images)
        if(!images.length){
            return "unknown.png" // it's a static-served image 
        }

        else{
            let i = 0;
            // cycle through images to find the poster and return its url
            while(images[i]["coverType"] != "poster"){
                i++;
            }
            return images[i]["remoteUrl"];
        }
    }

    // show Artist as a serch result
    lookupView(){
        let result = document.createElement("div");
        result.id = this.id;
        result.classList.add("artistPreview");

        let img = document.createElement("img");
        img.src = this.getPoster(); // use the external source, as lidarr does not have it yet
        // img.src = this.poster;
        img.alt = `[ ${this.name} poster ]`;
        img.classList.add("artistPreviewPoster");
        result.appendChild(img);

        let text = document.createElement("div");
        result.appendChild(text);
        
        let title = document.createElement("h3");
        title.innerHTML = this.name;
        text.appendChild(title);
        // let btn = document.createElement("button");
        // btn.onclick = () => { this.addArtist() };
        // btn.innerHTML = "View"
        // result.appendChild(btn)

        result.addEventListener("click",
            () => this.addArtist()
        )


        // ... sometimes may be good, sometimes may be shit
        if(this.overview){
            let info = document.createElement("p");
            info.innerHTML = this.overview;
            text.appendChild(info)
        }

        return result
    }


    // show artist inside library    
    libraryView(){
        let result = document.createElement("div");
        result.innerHTML = this.name;
        result.classList.add("artistLibraryPreview");

        let img = document.createElement("img");
        img.src = this.poster; // this will be set by loadLibrary
        img.alt = `[ ${this.name} poster ]`;
        img.classList.add("artistLibraryPoster");
        result.appendChild(img);

        // let btn = document.createElement("button");
        // btn.onclick = () => { this.showAlbums() };
        // btn.innerHTML = "View"
        // result.appendChild(btn)

        result.addEventListener("click",
            () => this.showAlbums()
        )

        this.libraryDom = result;
        return result
        
        
    }


    // show artist which is already in library, as a search result
    lookupFromLibraryView(){
        let result = document.createElement("div");
        // result.innerHTML = this.name;
        result.classList.add("artistPreviewFromLibrary");

        let img = document.createElement("img");
        img.src = this.poster; // this was set by loadLibrary on first load
        img.alt = `[ ${this.name} poster ]`;
        img.classList.add("artistPreviewPoster");
        result.appendChild(img);

        result.addEventListener("click",
            () => this.showAlbums()
        )

        // ... sometimes may be good, sometimes may be shit
        if(this.overview){
            let info = document.createElement("p");
            info.innerHTML = this.overview;
            text.appendChild(info)
        }


        let text = document.createElement("div");
        result.appendChild(text);
        
        let title = document.createElement("h3");
        title.innerHTML = this.name;
        text.appendChild(title);

        return result
    }

    async addArtist(){
        console.log("adding")
        switch2Normal();
        clearResults();
        let p = document.createElement("p");
        p.id = "loading";
        p.innerHTML = "Loading...";
        main.appendChild(p);
        // innerHTML = "Loading...";
        let url = "/addartist";
        let folder = this.name.replace(" ", "");
        let dictBody = {
                "artistName": this.name, 
                "foreignArtistId": this.id,
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

        console.log(request, this)
        let libId =  await fetch(request).then( async(response) => {return await addArtistCallback(response)} ); // I need to return library id for the artist,
        this.libId = libId;// storing it inside the Artist instance
        return libId;                                                                                             
        //console.log(request)
    }


    async showAlbums(){
        // tracksDiv = main;
        // releasesDiv = main;
        switch2Normal();
        clearResults();
        clearAlbums();

        // set global value
        currentArtist = this;
        
        // showalbums.innerHTML = "Loading..."
        
        // let url = lidarr + "album" + auth + "&artistId=" + this.libId + "&includeAllArtistAlbums=true";
        let url = "/showalbums" + `?libId=${this.libId}`;
        let request = new Request(url, {
            method: "GET",
            headers: basicHeaders
        });

        await fetch(request).then( (response) => showAlbumsCallback(response, this) );  

    }


    
    async reloadPoster(){
        let img = this.libraryDom.querySelector(".artistLibraryPoster"); 
        // let url = img.src;
        let url = this.poster;
        let request = new Request(url, {
            method: "GET",
            headers: {
                "accept": "*/*"
            }
        }); // crafting query to mediacover api (just using images' own sources)
        console.log(`\n\n\n Reloadin poster for ${this.name}\n\n\n`)
        // console.log(request);
        let response = await fetch(request);
        console.log(response, response.ok)
        let retries = 0; // now wait for a 200 response - retrying once a sec
        while(!response.ok && retries < MAXRETRY){
            retries++;
            await sleep(10000);
            response = await fetch(request);
            console.log("retyring...")
        }
        if(retries >= MAXRETRY){
            url = "unknown.png"
        }
        // finally reload image: changing src fooling the cache
        img.setAttribute("src", url + "#" + new Date().getTime());
    }



}





//**************************************************************//
//********************** ALBUM *********************************//
//**************************************************************//
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
        this.releases = params["releases"];
        this.releaseDate = params["releaseDate"];
        this.cover = "";
        this.dom = "";
    }


    // tiny function - separated cause its async and I dont want to mess up the main function
    async setCover(){
        let cover = await returnAlbumCover(this);
        this.cover = cover;
        return cover
    }    



    // returns a DOM element to display its content
    domElement(){
        let preview = document.createElement("div");
        preview.id = this.id;
        preview.classList.add("albumPreview");

        let img = document.createElement("img");
        img.alt = `[ album cover ]`;
        img.src = this.cover;
        img.classList.add("albumPreviewPoster");
        preview.appendChild(img);


        let info = document.createElement("div");
        preview.appendChild(info);


        let h = document.createElement("h3");
        h.classList.add("album-title");
        h.innerHTML = this.title;
        info.appendChild(h);
        
        let t = document.createElement("h4");
        t.classList.add("album-type");
        t.innerHTML = `${this.albumType}`;
        info.appendChild(t);

        let p = document.createElement("p");
        p.classList.add("album-downloaded"); 
        p.innerHTML = `${this.statistics?(this.statistics["percentOfTracks"]?"Downloaded":""):""}`;
        info.appendChild(p);

        // we also seize the opportunity to add this album to the downloaded list
        if(this.statistics["percentOfTracks"]){
            downloaded.push(this.id);
        }

        if(this.releaseDate){
            let d = document.createElement("p");
            d.classList.add("album-releaseDate");
            d.innerHTML = this.releaseDate.split("T")[0];
            info.appendChild(d);         
        }
        // let view = document.createElement("button");
        // view.innerHTML = "View";
        // view.onclick = () => {
        //     showTracks(this);
        // }
        // preview.appendChild(view);
        
        // let view = document.createElement("button");
        // view.innerHTML = "View";
        // view.onclick = () => {
        //     showTracks(this); // no id provided, generic version
        // }
        // anyRel.appendChild(view);

        preview.addEventListener("click", () => {
                // console.log(switch2Tracks(this.artist));
                showTracks(this);
            }
        )

        // let anyRel = document.createElement("p");
        // // anyRel.innerHTML = "Standard - try this if everything else failed";
        // anyRel.innerHTML = "Default";
        // anyRel.id = `standardDownload${this.id}`;
        // anyRel.classList.add("versionInfo");

        
        // let btnDef = document.createElement("button");
        // btnDef.innerHTML = "Request";
        // btnDef.onclick = () => {
        //     this.forceRelease(); // do not perform checks, just try to push it and hope for the best
        // }
        // anyRel.appendChild(btnDef);
        // preview.appendChild(anyRel);

        
        
                // let btn = document.createElement("button");
        // btn.innerHTML = "Fetch other releases";
        // btn.onclick = () => {
        //     this.reloadRelease();
        // }
        // preview.appendChild(btn);

        this.dom = preview;
        return preview
    }


    domElementQueue(){
        
        let preview = document.createElement("div");
        preview.id = this.id;
        preview.classList.add("albumPreviewQueue");

        let img = document.createElement("img");
        img.alt = `[ ${this.title} cover ]`;
        img.src = this.cover;
        img.classList.add("albumPreviewPoster");
        preview.appendChild(img);

        let info = document.createElement("p");
        info.innerHTML = `${this.title} <i>(${this.albumType})</i>`;
        preview.appendChild(info);
        
        // let view = document.createElement("button");
        // view.innerHTML = "View";
        // view.onclick = () => {
        //     showTracks(this); // no id provided, generic version
        // }
        // preview.appendChild(view);
        //
        return preview
    }

 

    // choose the most convenient release(s) to display
    // this means basically digital worlwide releases
    getAlbumRelease(){
        let digitals = [];
        let worldwides = [];
        // let chosenOne = [];
    
        // filter releases for "Digital Media" - the ones you found in spotify (kinda) - first level
        for(let r=0; r<this.releases.length; r++){
            let format = this.releases[r]["format"];
            if(format.includes("Digital")){
                digitals.push(this.releases[r]);
            }
        }

        // sad... just return the first option and go get a drink
        if(digitals.length == 0){
            return [this.releases[0]] // reloadRelease expects an array, so please make her happy
        }

        // prefer Worlwide release - second level 
        for(let d=0; d<digitals.length; d++){
            let country = digitals[d]["country"];
            if(country[0] == ("[Worldwide]")){
                worldwides.push(digitals[d]);
            }
        }

        // if array's empty, back to previous layer
        if(worldwides.length == 0){
            return cleanDuplicates(digitals) // always clean list
        }

        // best scenario 
        return cleanDuplicates(worldwides)
    }

  

    // keeps reloading album's releases to cope with Lidarr's delay
    async reloadRelease(){

        
        //first thing first clear all release profiles (personal bad experience with that)
        await deleteProfiles();
        
        // let url = lidarr + "album/" + this.id + auth;
        let url = "/reloadrelease" + `?id=${this.id}`;
        let request = new Request(url, {
            method: "GET",
            headers: {"accept": "application/json"}
        });
        let response = await fetch(request);
        let releases = (await response.json())["releases"];

        // there might be a delay, as Lidarr itself needs to download metadata
        // so just keep querying until it returns something
        while(releases.length < 1){
            await sleep(1000);
            console.log("Fucking nothing")
            response = await fetch(request);
            releases = (await response.json())["releases"];
            // console.log(releases.length)
        }

        // now we can work on the response to display actual releases
        await releases;
        this.releases = releases; // needed because getRelease() accesses directly the instance's properties

        releases = this.getAlbumRelease(); // cleansed from duplicates - best option available (Digital Media / Worldwide release)
        this.releases = releases; 
        console.log("FUCK OFF", releases);

        
        let tag = (document.createElement("p"));
        tag.innerHTML = "Versions:";
        tag.classList.add("versionInfo"); // class is needed to delete the element afterwards
        this.dom.appendChild(tag); // if this method is called, it means that domElement has had already

        // there's only one versions, definitely not ambiguous
        if(releases.length == 1){
            releases[0]["disambiguation"] = "";
            this.releases[0]["disambiguation"] = "";
            console.log(releases)
        }

        console.log("check check");

        clearReleases();
  
        for(let j=0; j<releases.length; j++){
            console.log(j);
            let relInfo = document.createElement("p"); // relInfo is supposed to stand for RELeaseINFO
            relInfo.innerHTML = releases[j]["title"] + " <i>" + releases[j]["disambiguation"] + "</i>";
            relInfo.classList.add("versionInfo"); // again, used to delete the element
            relInfo.id = `r${this.id}-${j}`;
            releasesDiv.appendChild(relInfo);
            
            let view = document.createElement("button");
            view.innerHTML = "View";
            view.onclick = () => {
                showTracks(this, releases[j]["id"]); // ask for specific release, not just generic
            }
            relInfo.appendChild(view);

            let loading = document.createElement("span");
            loading.innerHTML = " Loading...";
            loading.id = `loading-${this.id}-${j}`;
            relInfo.appendChild(loading);

            // Checks whether there are available downloads for specific release,
            // in which case a button for download is added; otherwise display "Fuck off"
            await this.addRequestButton(j);        
        }

        // actually, if releases.length = 1, that release is the same as the following... whatever
        // if all specific index queries failed, just try for something as generic as possible
    }


    async addRequestButton(j){
        // first of all, if this version's already queued, do not bother to check
        // (and lidarr rejects it anyway)
        
        let test = await this.getTorrentRelease(j); // performs getTorrent and checks its response
        console.log(test);
        // releasesDiv.querySelector(`#r${this.id}-${j}`).querySelector(`loading-${this.id}-${j}`).innerHTML = "";
        // download is available
        let element = releasesDiv.querySelector(`#r${this.id}-${j}`);
        element.querySelector(`#loading-${this.id}-${j}`).innerHTML = " ";

        if(test){
            let btn = document.createElement("button");
            btn.innerHTML = "Request";
            btn.onclick = () => {
              this.requestAlbum(j);
            }
            releasesDiv.querySelector
            element.appendChild(btn);
        }

        // an error occured
        else{
            // none of the downloads was approved
            if(!queued[this.id] && !downloaded.includes(this.id)){
                let no = document.createElement("span");
                no.innerHTML = ` <u>No downloads available</u>`;
                console.log(no);
                console.log(`#r${this.id}-${j}`)
                element.appendChild(no); // that was relInfo created in reloadRelease 
            }

            // the error is due to album being already queued
            else{
                let alreadyQueued = document.createElement("span");
                alreadyQueued.innerHTML = ` <u>Album already queued/downloaded</u>`;
                console.log(alreadyQueued);
                console.log(`#q${this.id}-${j}`)
                element.appendChild(alreadyQueued); // that was relInfo created in reloadRelease 
            }
        }     
    }


    // keeps reloading album covers until the get request returns something good
    async reloadCover(){
        let img = this.dom.querySelector(".albumPreviewPoster"); 
        // let url = img.src;
        let url = this.cover;
        let request = new Request(url, {
            method: "GET",
            headers: {
                "accept": "*/*"
            }
        }); // crafting query to mediacover api (just using images' own sources)
        console.log(`\n\n\n Reloadin cover for ${this.title}\n\n\n`)
        // console.log(request);
        let response = await fetch(request);
        console.log(response, response.ok)
        let retries = 0; // now wait for a 200 response - retrying once a sec
        while(!response.ok && retries < MAXRETRY){
            retries++;
            await sleep(3000);
            response = await fetch(request);
            console.log("retrying...")
        }
        // finally reload image: changing src fooling the cache
        img.setAttribute("src", url + "#" + new Date().getTime());
    }


  
    async getTorrentRelease(id){
        console.log("starting");
        let url;
        let request;
        let response;

                
        // craft a new ReleaseProfile, in order to search for specified release
        // and exclude other versions
  
        // "required" will be version's own disambiguation
        // "ignored" (which is "excluded") is set to other releases' disambiguations
        console.log(`\n\n\n ${this.releases[id]["title"]}, ${this.releases[id]["disambiguation"]}\n\n\n`);

        let required = [];
        
        // a different title usually means a different version
        let diff = this.releases[id]["title"].replace(this.title, "");
        if(diff != ""){
            required.push(diff);
        }

        if(this.releases[id]["disambiguation"] != ""){
            required.push(this.releases[id]["disambiguation"]);
        }

        
        required = addVariants(required);
        // if(reqired[0] == ""){
        //     required = []; // api does not accept an empty string
        // }

        let ignored = [];
            for(let r=0; r<this.releases.length; r++){
                if(r != id){
                    let dis = this.releases[r]["disambiguation"];
                    if(dis != ""){
                        ignored.push(dis);
                    }
                }
                console.log(r)
            }


        // if both required and ignored are empty, there's no point in setting up a profile
        // in that case just go for the query with no profile
        if(required.length>0 || ignored.length > 0){
            console.log("going for this");
            // url = lidarr + "releaseprofile" + auth;
            url = "/releaseprofile";
            console.log(url, required, ignored)
            let body = {
                "enabled": true,
                "required":  required,
                "ignored": ignored
                }
            console.log(body)
            request = new Request(url, {
                method: "POST",
                headers: postHeaders,
                body: JSON.stringify(body)
            })
            console.log(request);
            response = await fetch(request);
            // let profileId = (await response.json())["id"]; // used afterwards to delete this profile
            console.log("profile set", response);
        }

    

        // now query indexers
        // url = lidarr + "release" + auth + `&albumId=${this.id}&artistId${this.artist}`;
        url = "/queryindexers" + `?albumId=${this.id}&artistId=${this.artist}`;
        request = new Request(url, {
            method: "GET",
            headers: basicHeaders
        });
        console.log(request);
        response = await fetch(request);
        let json = await response.json();
        console.log(json);
     
        let release = false;
        let message = "Ok";
        console.log("Ok");

        // look for an approved download
        for(let j=0; j<json.length; j++){
            console.log(j);
            if(json[j]["approved"]){
                release = json[j];
                console.log(release);
                return release // as soon as we find a good one, go for it
            }
        }

        // so our requests were too strict, suggest trying with default
        if(!release){
            // release = await forceRelease();
            message = "No downloads found for this release. Please try a different one or go for Standard";
            console.log(message, this.title);
        }

        return 0
    }




    async requestAlbum(choice){
        // albumRequested.innerHTML = 'Please wait...';
        await deleteProfiles();

        // let url = lidarr + "release" + auth;
        let url = "/release";
        // // let releases = await getReleases(artist, album, choice);
        // find a torrent for the specified album (and relative release);
        let release = await this.getTorrentRelease(choice);

        // download found, add it to queue
        if(release){
            console.log(release, JSON.stringify(release));
            let request = new Request(url, {
                method: "POST",
                headers: postHeaders,
                body: JSON.stringify(release)
            });

            console.log("Request:",request);
            // let response = await fetch(request)
            await fetch(request).then(
                async() => {
                clearReleasesDiv();
                let p = document.createElement("p");
                p.innerHTML = "Loading...";
                releasesDiv.appendChild(p);            

                while(!queued[this.id]){
                    await sleep(500);
                    await getQueue(1);
                }
            
                switch2Normal();
                showTracks(this);
             });
            // requestAlbumCallback(response);
        }

        else{
            albumRequested.innerHTML = "No downloads found for this release. Please try a different one or go for Standard"
        }
    }


    // old desperate man:
    // does the work of getTorrent and reloadRelease, but with no restriction at all
    async forceRelease(){
        await deleteProfiles();
        // let url = lidarr + "release" + auth + `&albumId=${this.id}&artistId${this.artist}`;
        // let p = document.createElement("p");
        let p = outputReleasesDiv;
        p.innerHTML = "Loading..."
        releasesDiv.appendChild(p);

        
        let url = "/queryindexers" + `?albumId=${this.id}&artistId=${this.artist}`;
        let request = new Request(url, {
            method: "GET",
            headers: basicHeaders
        });
        let response = await fetch(request);
        let json = await response.json();
        console.log(json)

        let release = false;
        for(let j=0; j<json.length; j++){
            if(json[j]["approved"]){
                release = json[j];
                break
            }
        }

        

        // the ultimate fail
        if(!release){
            p.innerHTML = "No downloads available at all... Sorry";
            return
        }

        // yay we've eventually got something       
        request = new Request("/release", {
            method: "POST",
            headers: postHeaders,
            body: JSON.stringify(release)
        });

        console.log("Request:",request);
        await fetch(request).then(
            async() => {
            clearReleasesDiv();
            p.innerHTML = "Loading...";
            releasesDiv.appendChild(p);            

            while(!queued[this.id]){
                await sleep(500);
                await getQueue(1);
            }
            
            switch2Normal();
            showTracks(this);
         });
    }

}



//**************************************************************//
//********************** TRACK *********************************//
//**************************************************************//
// Used to show albums' content

class Track{
    constructor(params){
        this.artist = params["artistId"];
        this.album = params["albumId"];
        this.title = params["title"];
        this.duration = params["duration"];
        this.id = params["id"];
        this.number = params["trackNumber"];
    }

    // just convert milliseconds in (hh:)mm:ss
    parseDuration(){
        let d = this.duration/1000;
        if(d/60 > 60){
            let seconds = Math.floor(d%60);
            let minutes = (d-seconds)/60;
            let hours = (minutes-(minutes%60))/60;
            minutes = Math.floor(minutes%60);
            if(minutes < 10){
                minutes = `0${minutes}`;
            }
            if(seconds<10){
                seconds = `0${seconds}`;
            }
            return `${hours}:${minutes}:${seconds}`;
        }

        else{
            let seconds = (d%60);
            let minutes = (d-seconds)/60;
            seconds = Math.floor(seconds);
            if(seconds<10){
                seconds = `0${seconds}`;
            }
            return `${minutes}:${seconds}`;
        }
    }

    domElement(){
        let trackEl = document.createElement("div");
        trackEl.classList.add("trackView");
        trackEl.innerHTML = this.number + ".  " + this.title + "<i> (" + this.parseDuration(this.duration) + "</i>)";

        return trackEl
    }

}



//**************************************************************//
//********************** QUEUE *********************************//
//**************************************************************//
// useful for managing requests' status

class Status{
    constructor(params){
        this.artistId = params["artistId"];
        this.albumId = params["albumId"];
        this.status = params["status"]; // download status e.g. paused, completed 
        this.trackedDownloadStatus = params["trackedDownloadStatus"]; // checks download against actual album - values: ok/warning
        this.trackedDownloadState = params["trackedDownloadState"]; // description of trackedDownloadStatus
        this.statusMessages = params["statusMessages"];
        this.size = params["size"];
        this.sizeleft = params["sizeleft"];

        if(this.size == 0 && this.sizeleft == 0){
            this.percent = 0;
        }
        else{
            this.percent = 1-(this.sizeleft/this.size);
        }
    }

    // to be used in "Recent requests" (or something similar) section
    async domElementStandAlone(){
        let status = document.createElement("div");
        status.innerHTML = `${Math.ceil(this.percent*1000)/10}%  (${this.status}) ${this.statusMessages[0]? " - " + this.statusMessages[0]["title"]:""} \n `;
        status.classList.add("queueElement");
        let parsedAlbum = new Album(await getAlbumFromId(this.albumId));
        await parsedAlbum.setCover();
        let albumEl = parsedAlbum.domElementQueue();
        // albumEl.removeChild(albumEl.querySelector("button"));
        albumEl.id = "";

        status.addEventListener("click", () => {
            console.log("fucking clicked");
            showTracks(parsedAlbum);
        })
        status.appendChild(albumEl);
        return status
        
    }

    // poor version, destined to be a child of Album.domElement()
    domElement(){
        let status = document.createElement("div");
        status.innerHTML = `${Math.ceil(this.percent*1000)/10}%  (${this.status}) ${this.statusMessages[0]? " - "+this.statusMessages[0]["title"]:""} \n `;
        status.classList.add("queueElement-display");
        return status
    }
}
