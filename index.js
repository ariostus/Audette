const env = require("dotenv").config();
const path = require("path");
const express = require('express');
const passport = require("passport");
const session = require("express-session");
const config = require("./private/config.js");
var LdapStrategy = require("passport-ldapauth");



const apikey = process.env.LIDARR_API_KEY;
const auth =  "?apikey="  + apikey;
const lidarr = config.lidarr_address;
const basicHeaders = {"accept": "application/json"};
const postHeaders = {"accept": "application/json", "Content-Type": "application/json"};
const imgHeaders = {"accept": "*/*"};


const app = express();
app.listen(config.port, () => console.log("Connection open"));
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit: '1mb'}))
app.use(session({
    secret: process.env.AUDETTE_SESSION_SECRET,
    resave:false,
    saveUninitialized:false
}));

passport.serializeUser((user, done)=>{
    done(null, user);
})

passport.deserializeUser((user, done)=>{
    done(null, user);
})

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkAuth(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }

    res.redirect("login.html");
}

//---------------------------------------------//
//                  LOGIN                      //
//---------------------------------------------//
passport.use(new LdapStrategy({
        server: {
            url:config.ldap_address,
            bindDN: process.env.AUDETTE_LDAP_BIND_DN,
            bindCredentials: process.env.AUDETTE_LDAP_BIND_CREDENTIALS,
            searchBase: process.env.AUDETTE_LDAP_SEARCH_BASE,
            searchFilter: process.env.AUDETTE_LDAP_SEARCH_FILTER
        }   
}))

app.use(passport.initialize());
app.use(passport.session());
app.use("/private", checkAuth, express.static(path.join(__dirname, "private")));
//***************************************************//
//                    ROUTES                         //
//***************************************************//


app.get("/", checkAuth, (request, response)=>{
        response.cookie("login-error", undefined);
        response.sendFile(path.join(__dirname, "private", "temp.html"));
    }
)

app.get("/loginredirect", (request, response)=>{
    response.sendFile(path.join(__dirname, "public", "login.html"));
})


app.post("/login", (request, response, next) => {
    response.cookie("login-error", undefined);
    passport.authenticate("ldapauth", {session: true, failureMessage: true},
        (err, user, info) => {
            if(err){return response.sendFile(path.join(__dirname, "public", "fail.html"))};
            if(!user){
                let errorMessage = info?info.message:"Login failed";
                response.cookie("login-error", errorMessage);
                return response.redirect("/loginredirect")
            };
            request.logIn(user, (loginErr)=>{
                if(loginErr){return next(loginErr)};
                return response.redirect("/");
            }
        );
        }
    )(request, response, next)}
)


app.post('/logout', (request, response, next)=>{
  request.logout((err)=> {
    if (err) { return next(err); }
    response.cookie("login-error", undefined);
    response.redirect('/');
  });
});

app.get('/health', async(request, response) => {
    // console.log(request)
    let r  = await healthCheck();
    response.send(r);
})


app.get("/setroot", async(request, response) => {
    let r = await setRoot();
    response.send(await r.json());
})

app.get("/metaprofiles", async(request, response) => {
    let r = await getMetaProfiles();
    response.send(await r.json());
})

app.get("/qualityprofiles", async(request, response) => {
    let r = await getQualityProfiles();
    response.send(await r.json());
})

app.get("/library", async(request, response) => {
    let r = await loadLibrary();
    response.send(await r.json());
})


app.get("/artistlookup", async(request, response) => {
    // console.log(request);
    let term = request.query['term'];
    let r = await artistLookup(term);
    response.send(await r.json()); 
    
})

app.post("/addartist", async(request, response) => {
    let dictBody = request.body;
    let r = await addArtist(dictBody);
    response.send(await r.json());
})

app.get("/showalbums", async(request, response) => {
    let libId = request.query["libId"];
    let r = await showAlbums(libId);
    response.send(await r.json());
})

app.get("/deleteprofiles", async(request, response) => {
    await deleteProfiles().then( response.send("profiles deleted") );
})

app.get("/reloadrelease", async(request, response) => {
    let id = request.query["id"];
    let r = await reloadRelease(id);
    response.send(await r.json());
})

app.post("/releaseprofile", async(request, response) => {
    let body = request.body;
    let r = await getTorrentRelease(body);
    response.send(await r.json());
})

app.get("/queryindexers", async(request, response) => {
    let albumId = request.query["albumId"];
    let artistId = request.query["artistId"];
    let r = await queryIndexers(albumId, artistId);
    response.send(await r.json());
})

app.post("/release", async(request, response) => {
    let body = request.body;
    console.log(body);
    let r = await requestAlbum(body);
    response.send(await r.json()); 
})

app.get("/tracks", async(request, response) => {
    let albumId = request.query["albumId"];
    let releaseId =request.query["albumReleaseId"];
    console.log(albumId, releaseId, request.query);
    let r = await showTracks(albumId, releaseId);
    response.send(await r.json());
    
})

app.get("/albumfromid", async(request, response) => {
    let id = request.query["id"];
    let r = await getAlbumFromId(id);
    response.send(await r.json());
})


// a bit of a pain in the ass: this thing need to forward the request
// to the actual lidarr api, get a response of type image and pass
// its bytes to express response using Buffer
//
// the final flow is: the client sets every album's cover url, resulting
// in an automatic get request towards this endpoint, which performs
// another request as explained above
app.get("/returncover", async(request, response) => {
    let id = request.query["id"];
    let r = await returnAlbumCover(id);
    let headers = new Headers(r["headers"]);
    let contentType = headers.get("content-type");
    if(!r.ok){
        response.status(404);
    }
    response.contentType(contentType);
    response.send(Buffer.from(await r.bytes(), "binary"));
})


app.get("/returnposter", async(request, response) => {
    let id = request.query["id"];
    let r = await returnArtistPoster(id);
    let headers = new Headers(r["headers"]);
    let contentType = headers.get("content-type");
    response.contentType(contentType);
    if(!r.ok){
        response.status(404);
    }
    response.send(Buffer.from(await r.bytes(), "binary"));
})

app.get("/queue", async(request, response) => {
    let r = await getQueue();
    response.send(await r.json());
})





//*****************************************************//
//                HEALTH AND SETUP
//*****************************************************//

async function healthCheck(){
    let request = new Request(lidarr+"health"+auth, {  
        method:"GET",
    }
    );
    let response = await fetch(request); // wait for fetch to return response and then put it in variable
    // healthCallback(response); // callback to handle response
    // console.log(response.json()) 
    return response
}




// var rootPath = "";
async function setRoot(){
    let request = new Request(lidarr+"rootfolder"+auth, {
        method: "GET",
        headers: basicHeaders
    });
    let response = await fetch(request);
    return response 
}


// Set Metadata and Quality profiles
// var metadataProfile = 0;
// var qualityProfile = 0;

// get available metadata profiles
async function getMetaProfiles(){
    let url = lidarr + "metadataprofile" + auth;
    let request = new Request(url, {
        headers: basicHeaders
    })

    let response = await fetch(request);
    return response
}




// get available quality profiles
async function getQualityProfiles(){
    let url = lidarr + "qualityprofile" + auth;
    let request = new Request(url, {
        headers: basicHeaders
    })

    let response = await fetch(request);
    return response
}




//*****************************************************//
//                LIBRARY
//*****************************************************//
 

async function loadLibrary(){
    let url = lidarr + "artist" + auth;
    let request = new Request(url, {
        method:"GET",
        headers: basicHeaders
        }
    )
    console.log("Library requested")
    let response = await fetch(request);
    return response
}





//*****************************************************//
//                ARTIST
//*****************************************************//

//general
async function artistLookup(term){
    let urlTerm = "&term=" + term.replace(" ", "%20") // include spaces in url
    let suffix = "artist/lookup";
    let url = lidarr + suffix + auth + urlTerm;


    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    });

    let response = await fetch(request);
    return response
}


// dealing with Artist class
async function addArtist(dictBody){
        let url = lidarr + "artist" + auth;
        let request = new Request(url, {
            method: "POST",
            headers: postHeaders,
            body: JSON.stringify(dictBody)
        })  
        console.log(request);
        let response =  await fetch(request);
        return response 
}

async function showAlbums(libId){
        let url = lidarr + "album" + auth + "&artistId=" + libId + "&includeAllArtistAlbums=true";
        let request = new Request(url, {
            method: "GET",
            headers: basicHeaders
        });

        let response = await fetch(request);
        return response;  

}



       
//*****************************************************//
//                ALBUM
//*****************************************************//

// Album class manager
async function deleteProfiles(){
    // first get all available profiles
    let url = lidarr + "releaseprofile/" + auth;
    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    })
    let response = await fetch(request);
    let json = await response.json();

    console.log(json, json.length);

    // then delete each one of em
    for(let p=0; p<json.length; p++){
        url = lidarr + "releaseprofile/" + json[p]["id"] + auth;
        request = new Request(url, {
            method: "DELETE",
            headers: postHeaders
        })
        await fetch(request);
    }

    return 1
}


async function reloadRelease(id){
        //first thing first clear all release profiles (personal bad experience with that)
        await deleteProfiles();
        
        let url = lidarr + "album/" + id + auth;
        let request = new Request(url, {
            method: "GET",
            headers: {"accept": "application/json"}
        });
        let response = await fetch(request);
        return response;

}



async function getTorrentRelease(body){
        deleteProfiles(); // clear settings from different release's query
        let url = lidarr + "releaseprofile" + auth;
        console.log(url, body);
        let request = new Request(url, {
            method: "POST",
            headers: postHeaders,
            body: JSON.stringify(body)
        })
        console.log(request);
        response = await fetch(request);
        return response;
}

    
async function queryIndexers(albumId, artistId){
        // now query indexers
        let url = lidarr + "release" + auth + `&albumId=${albumId}&artistId${artistId}`;
        let request = new Request(url, {
            method: "GET",
            headers: basicHeaders
        });
        console.log(request);
        let response = await fetch(request);
        return response;     
}


async function requestAlbum(body){
        // let url = lidarr + "release" + auth;
        let url = lidarr + "release" + auth;
        let request = new Request(url, {
            method: "POST",
            headers: postHeaders,
            body: JSON.stringify(body)
        });
        
        let response = await fetch(request);
        return response;
}


async function returnAlbumCover(id){        
    let url = lidarr + "mediacover/album/" + id + "/cover.jpg" + auth;

    let request = new Request(url, {
                method: "GET",
                headers: imgHeaders
            });
    // console.log(request);
    let response = await fetch(request);


    // let retries = 0; // now wait for a 200 response - retrying once a sec
    // const MAXRETRY = 20;
    // while(!response.ok && retries < MAXRETRY){
    //     retries++;
    //     await sleep(1000);
    //     response = await fetch(request);
    //     console.log("retyring...", id)
    // }
    return response;
}

async function returnArtistPoster(id){
    let url = lidarr + "mediacover/artist/" + id + "/poster.jpg" + auth;
    let request = new Request(url, {
                method: "GET",
                headers: imgHeaders
            });
    console.log(request);
    let response = await fetch(request);
    return response;
}






//*****************************************************//
//                TRACKS
//*****************************************************//
async function showTracks(albumId, releaseId){
    // id is actually optional - it depends on which function is calling it
    let url;
    let id = parseInt(releaseId);
    console.log(id, releaseId, albumId);
    if(id!=0){
        url = lidarr + "track" + auth + "&albumReleaseId=" + releaseId; // specific album release
    }
    else{
        url = lidarr + "track" + auth + "&albumId=" + albumId; // general release
    }
    
    let request = new Request(url, {
        method:"GET",
        headers: basicHeaders
    });

    let response = await fetch(request);
    return response;
}




//*****************************************************//
//                QUEUE/STATUS
//*****************************************************//
// used in tools
async function getAlbumFromId(id){
    let url = lidarr + "album/" + id + auth;
    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    });

    let response = await fetch(request);
    return response;
}


async function getQueue(){
    let url = lidarr + "queue" + auth;
    let request = new Request(url, {
        method: "GET",
        headers: basicHeaders
    });

    console.log(request);
    let response = await fetch(request);
    return response;

}




