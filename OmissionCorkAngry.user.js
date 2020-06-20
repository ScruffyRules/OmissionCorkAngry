// ==UserScript==
// @name         VRChat Site Enhanced
// @namespace    ScruffyRules
// @version      0.092
// @description  Trying to enchance VRChat's website with extra goodies
// @author       ScruffyRules
// @match        https://vrchat.com/home/*
// @match        https://vrchat.com/home*
// @match        https://www.vrchat.com/home/*
// @match        https://www.vrchat.com/home*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    function setDefaultIfNotFound(key, value) {
        let val = GM_getValue(key);
        if (val == undefined) {
            GM_setValue(key, value);
            return value;
        }
        return val;
    }

    function loadSettings() {
        let settings = {};
        settings["show.sendinv"] = setDefaultIfNotFound("vrcse.show.sendinv", true);
        settings["show.reqinv"] = setDefaultIfNotFound("vrcse.show.reqinv", true);
        settings["show.instancejoin"] = setDefaultIfNotFound("vrcse.show.instancejoin", true);
        settings["show.worldandinstanceowners"] = setDefaultIfNotFound("vrcse.show.worldandinstanceowners", false);
        settings["remove.uppercase"] = setDefaultIfNotFound("vrcse.remove.uppercase", true);
        window.vrcse.settings = settings;
        window.vrcse.settings.list = {
            "show.sendinv":"Send Invite Buttons",
            "show.reqinv":"Request Invite Buttons",
            "show.instancejoin":"Join Buttons",
            "show.worldandinstanceowners":"World and Instance Owners",
            "remove.uppercase":"Remove Uppercase"
        };
    }

    function saveSettings() {
        let keys = Object.keys(window.vrcse.settings.list);
        for (let i = 0; i < keys.length; i++) {
            GM_setValue("vrcse." + keys[i], window.vrcse.settings[keys[i]]);
        }
    }

    function checkIfLoaded() {
        let elem = document.getElementsByClassName("home-content");
        if (elem.length > 0) {
            onceLoaded();
        } else {
            setTimeout(checkIfLoaded, 100);
        }
    }

    function onceLoaded() {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", "/api/1/auth/user");
        xmlhttp.send();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    window.vrcse = {};
                    window.vrcse.userInfo = JSON.parse(this.responseText);
                    window.vrcse.sendinvPromptTimeout = 0;
                    window.vrcse.sendinvUserTimeout = 0;
                    // Later? xd
//                     window.vrcse.privatesTimeout = 0;
//                     window.vrcse.privatesCache = [];
                    window.vrcse.lastPathname = "";
                    window.vrcse.userCache = {};
                    window.vrcse.worldCache = {};
                    window.vrcse.waioStates = {};
                    onceAuthed();
                } else {
                    console.log(this);
                    alert("VRCSE Could not find user account");
                    debugger;
                }
            }
        }
    }

    function onceAuthed() {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", "/api/1/users/" + window.vrcse.userInfo.id);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    window.vrcse.user = JSON.parse(this.responseText);
                    onceRequested();
                }
            }
        }
    }

    function onceRequested() {
        loadSettings();
        //debugger;
        let userInfo = window.vrcse.userInfo;
        console.log(`VRCSE Authed ${userInfo.id} - ${userInfo.username} - ${userInfo.displayName}`);
        let c_div = document.createElement("div");
        c_div.innerHTML = "<h4>VRCSE</h4>";
        if (typeof GM_info !== 'undefined') {
            c_div.innerHTML += "v"+GM_info.script.version;
        }
        c_div.className = "mt-1";
        let goodshit = document.getElementsByClassName("d-none d-lg-block fixed-top bg-gradient-secondary leftbar col-2")[0].getElementsByClassName("usercard")[0].children[0];
        goodshit.insertBefore(c_div, goodshit.children[1]);

        // Settings Button
        let profilelink = document.getElementsByClassName("profile-link")[0];
        profilelink.children[0].classList.remove("d-block");
        let vrcse_settings_btn = profilelink.children[0].cloneNode(true);
        profilelink.children[0].style.width = "49%";
        vrcse_settings_btn.style.width = "49%";
        vrcse_settings_btn.classList.add("float-right");
        vrcse_settings_btn.href = "/home/vrcse";
        //vrcse_settings_btn.removeAttribute("href");
        vrcse_settings_btn.childNodes[1].data = " VRCSE";
        vrcse_settings_btn.onclick = function (event) {
            doSettingsPage();
            event.preventDefault();
            return false;
        }
        profilelink.appendChild(vrcse_settings_btn);
        // The Runs
        settingsBasedGoodies();
        runChecks();
    }

    function getUserData() {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", "/api/1/users/" + window.vrcse.userInfo.id);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    window.vrcse.user = JSON.parse(this.responseText);
                }
            }
        }
    }

    function settingsBasedGoodies() {
        if (window.vrcse.settings["remove.uppercase"]) {
            let styleSheet = document.styleSheets[0];
            for (var i = 0; i < styleSheet.cssRules.length; i++) {
                if (styleSheet.cssRules[i].selectorText != undefined) {
                    if (styleSheet.cssRules[i].selectorText == "h1, h2, h3, h4, h5, h6") {
                        for (var j = 0; j < styleSheet.cssRules[i].style.length; j++) {
                            if (styleSheet.cssRules[i].style[j] == "text-transform") {
                                styleSheet.cssRules[i].style.removeProperty("text-transform");
                            }
                        }
                    }
                }
            }
        } else {
            let styleSheet = document.styleSheets[0];
            styleSheet.insertRule("h1, h2, h3, h4, h5, h6 {text-transform: uppercase}");
        }
        if (!window.vrcse.settings["show.sendinv"]) {
            let sendinvs = document.getElementsByClassName("customSendInvCheckButtonDone");
            for (let i = 0; i < sendinvs.length; i++) {
                let butts = sendinvs[i].getElementsByTagName("button");
                if (butts.length == 1) {
                    butts[0].remove();
                }
            }
            for (let i = 0; i < sendinvs.length; i++) {
                sendinvs[i].classList.remove("customSendInvCheckButtonDone");
            }
        }
        if (!window.vrcse.settings["show.reqinv"]) {
            let reqinvs = document.getElementsByClassName("customReqInvCheckButtonDone");
            for (let i = 0; i < reqinvs.length; i++) {
                let butts = reqinvs[i].children[1].getElementsByTagName("button");
                if (butts.length == 1) {
                    butts[0].remove();
                }
            }
            for (let i = 0; i < reqinvs.length; i++) {
                reqinvs[i].classList.remove("customReqInvCheckButtonDone");
            }
        }
        if (!window.vrcse.settings["show.instancejoin"]) {
            let instancejoins = document.getElementsByClassName("customJoinCheckButtonDone");
            for (let i = 0; i < instancejoins.length; i++) {
                let butts = instancejoins[i].getElementsByTagName("button");
                if (butts.length == 1) {
                    butts[0].remove();
                }
            }
            for (let i = 0; i < instancejoins.length; i++) {
                instancejoins[i].classList.remove("customJoinCheckButtonDone");
            }
        }
        if (!window.vrcse.settings["show.worldandinstanceowners"]) {
            let loccont = document.getElementsByClassName("location-container")[0];
            if (loccont != undefined) {
                let locelems = loccont.getElementsByClassName("location-title");
                for (let i = 0 ; i < locelems.length; i++) {
                    let elem = locelems[i];
                    if (elem.id.startsWith("waio-")) {
                        for (let j = 0 ; j < elem.children.length; j++) {
                            if (elem.children[j].id.startsWith("div-waio-")) {
                                elem.children[j].remove();
                            }
                        }
                        elem.removeAttribute("id");
                    }
                }
            }
        }
    }

    function runChecks() {
        setInterval(contentChecker, 750);
        setInterval(onHrefChange, 750);
        //setInterval(getUserData, 30*1000);
    }

    function onHrefChange() {
        if (window.vrcse.lastPathname == location.pathname) return;
        window.vrcse.lastPathname = location.pathname;
        let pathname = location.pathname;
        if (pathname.startsWith("/home/avatar")) {
            setTimeout(avatarDetails, 500);
        }
        if (pathname == "/home" || pathname == "/home/locations") {
            showPrivatesButton();
        } else {
            hidePrivatesButton();
        }
    }

    checkIfLoaded();

    function sendInv(userId, worldInstance, title) {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", "/api/1/user/" + userId + "/notification");
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(JSON.stringify({"type":"invite","message":"","details":{"worldId":worldInstance, "rsvp":true, "worldName":title}}));
        return false;
    }

    function getQueryVariable(query, variable) {
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
        console.log('Query variable %s not found', variable);
    }

    function onClickJoin() {
        sendInv(window.vrcse.userInfo.id, this.value, this.title);
    }

    function onClickSendInv() {
        if (window.vrcse.user.isFriend && false) { // wanna rewrite this
            sendInv(this.value, window.vrcse.user.location, "here");
        } else {
            if (Date.now() > window.vrcse.sendinvPromptTimeout + 30000) { // should be 30 seconds
                window.vrcse.sendinvPromptWorldInstance = prompt("VRChat Launch Link OR wrld_id:instance_id");
                if (window.vrcse.sendinvPromptWorldInstance == "" || window.vrcse.sendinvPromptWorldInstance == null) return;
                if (window.vrcse.sendinvPromptWorldInstance.startsWith(window.location.origin + "/home/launch")) {
                    let query = window.vrcse.sendinvPromptWorldInstance.split("?")[1];
                    let worldId = getQueryVariable(query, "worldId");
                    let instanceId = getQueryVariable(query, "instanceId");
                    window.vrcse.sendinvPromptWorldInstance = worldId + ":" + instanceId;
                }
                window.vrcse.sendinvPromptMessage = prompt("Message", "here");
                window.vrcse.sendinvPromptTimeout = Date.now();
            }
            sendInv(this.value, window.vrcse.sendinvPromptWorldInstance, window.vrcse.sendinvPromptMessage);
        }
    }

    function onClickSendReqInv() {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", "/api/1/user/" + this.value + "/notification");
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(JSON.stringify({"type":"requestInvite", "message":""}));
    }

    var instanceTypes = ["private", "friends", "hidden"];
    function parseInstance(wrldId) {
        let worldId = wrldId;
        let instanceType = "public";
        let ownerId = undefined;
        if (wrldId.includes(":")) {
            worldId = wrldId.split(":")[0];
            let instance = wrldId.split(":")[1];
            if (instance.includes("~")) {
                let things = instance.split("~");
                let canReqInv = false;
                let inst_type = undefined;
                things.forEach(item => {
                    if (item.includes("(")) {
                        let first = item.split("(")[0];
                        let second = item.split("(")[1];
                        if (instanceTypes.includes(first)) {
                            ownerId = second.substring(0, second.length-1);
                            inst_type = first;
                        }
                        if (first == "canRequestInvite") canReqInv = true;
                    }
                    if (item == "canRequestInvite") canReqInv = true;
                });
                if (inst_type == "hidden") {
                    instanceType = "friendsPlus";
                } else if (inst_type == "friends") {
                    instanceType = "friends";
                } else if (inst_type == "private") {
                    instanceType = canReqInv ? "invitePlus" : "invite";
                }
            }
        }
        return {"worldId":worldId,"instanceType":instanceType,"ownerId":ownerId}
    }

    function contentChecker() {
        let loccont = document.getElementsByClassName("location-container")[0];
        if (loccont != undefined) {
            if (window.vrcse.settings["show.worldandinstanceowners"] || window.vrcse.settings["show.instancejoin"]) {
                let locelems = loccont.getElementsByClassName("location-title");
                for (let i=0; i<locelems.length; i++) {
                    let elem = locelems[i];
                    let atag = null;
                    if (elem.children.length >= 2) {
                        atag = elem.children[1];
                    } else {
                        atag = elem.children[0];
                    }
                    if (atag.tagName != "A") continue;
                    let title = atag.title;
                    let query = atag.href.split("?")[1];
                    let worldId = getQueryVariable(query, "worldId");
                    let instanceId = getQueryVariable(query, "instanceId");

                    if (window.vrcse.settings["show.instancejoin"]) {
                        if (!elem.classList.contains("customJoinCheckButtonDone")) {
                            let btn_c = document.createElement("button");
                            btn_c.className = "btn btn-outline-primary pt-0 pb-0 pl-1 pr-1";
                            btn_c.innerText = "Join";
                            btn_c.value = worldId + ":" + instanceId;
                            btn_c.title = title;
                            btn_c.onclick = onClickJoin;
                            elem.appendChild(btn_c);
                            elem.classList.add("customJoinCheckButtonDone");
                        }
                    }

                    if (window.vrcse.settings["show.worldandinstanceowners"]) {
                        if (!elem.id.startsWith("waio-")) {
                            let randomThing = Math.random().toString(36).substring(2, 15);
                            elem.id = "waio-" + randomThing;
                            window.vrcse.waioStates[elem.id] = {"world":0,"instance":0,"data":{"world":null,"wid":null,"instance":null,"iid":null}};
                            if (!window.vrcse.worldCache.hasOwnProperty(worldId)) {
                                let xmlhttp = new XMLHttpRequest();
                                xmlhttp.open("GET", "/api/1/worlds/" + worldId + "?returnKey=" + elem.id);
                                xmlhttp.send();
                                xmlhttp.onreadystatechange = function () {
                                    if (this.readyState == 4) {
                                        if (this.status == 200) {
                                            let randomThing = this.responseURL.split("?returnKey=")[1];
                                            let world = JSON.parse(this.responseText);
                                            delete world.unityPackages;
                                            delete world.instances;
                                            window.vrcse.worldCache[world.id] = world;
                                            window.vrcse.waioStates[randomThing].data.world = world.authorName;
                                            window.vrcse.waioStates[randomThing].data.wid = world.authorId;
                                            window.vrcse.waioStates[randomThing].world = -1;
                                        }
                                    }
                                }
                            } else {
                                window.vrcse.waioStates[elem.id].data.world = window.vrcse.worldCache[worldId].authorName;
                                window.vrcse.waioStates[elem.id].data.wid = window.vrcse.worldCache[worldId].authorId;
                                window.vrcse.waioStates[elem.id].world = -1;
                            }
                            let parsedInstance = parseInstance("ignoreme:" + instanceId);
                            if (parsedInstance.instanceType != "public") {
                                let ownerId = parsedInstance.ownerId;
                                if (!window.vrcse.userCache.hasOwnProperty(ownerId)) {
                                    let xmlhttp = new XMLHttpRequest();
                                    xmlhttp.open("GET", "/api/1/users/" + ownerId + "?returnKey=" + elem.id);
                                    xmlhttp.send();
                                    xmlhttp.onreadystatechange = function () {
                                        if (this.readyState == 4) {
                                            if (this.status == 200) {
                                                let randomThing = this.responseURL.split("?returnKey=")[1];
                                                let user = JSON.parse(this.responseText);
                                                delete user.tags;
                                                delete user.bio;
                                                window.vrcse.userCache[user.id] = user;
                                                window.vrcse.waioStates[randomThing].data.instance = user.displayName;
                                                window.vrcse.waioStates[randomThing].data.iid = user.id;
                                                window.vrcse.waioStates[randomThing].instance = -1;
                                            }
                                        }
                                    }
                                } else {
                                    window.vrcse.waioStates[elem.id].data.instance = window.vrcse.userCache[ownerId].displayName;
                                    window.vrcse.waioStates[elem.id].data.iid = ownerId;
                                    window.vrcse.waioStates[elem.id].instance = -1;
                                }
                            } else {
                                window.vrcse.waioStates[elem.id].data.instance = "PUBLIC";
                                window.vrcse.waioStates[elem.id].instance = -1;
                            }
                        }
                        if (window.vrcse.waioStates.hasOwnProperty(elem.id)) {
                            let waioState = window.vrcse.waioStates[elem.id];
                            if (waioState.world == -1 && waioState.instance == -1) {
                                let div_c = document.createElement("div");
                                div_c.id = "div-" + elem.id;
                                div_c.className = "d-block font-weight-normal";
                                div_c.innerHTML = `World Owner : <a href="/home/user/${waioState.data.wid}" style="color: #0e9bb1;">${waioState.data.world}</a>`;
                                if (waioState.data.instance != "PUBLIC") {
                                    div_c.innerHTML += ` / Instance Owner : <a href="/home/user/${waioState.data.iid}" style="color: #0e9bb1;">${waioState.data.instance}</a>`;
                                }
                                delete window.vrcse.waioStates[elem.id];
                                elem.appendChild(div_c);
                            }
                        }
                    }
                }
            }
        }
        if (window.vrcse.settings["show.sendinv"]) {
            let userinfos = document.getElementsByClassName("user-info");
            for (let i=0; i<userinfos.length; i++) {
                let elem = userinfos[i];
                if (elem.classList.contains("customSendInvCheckButtonDone")) continue;
                let atag = elem.children[0].children[0];
                let userId = atag.href.replace(window.location.origin + "/home/user/", "");
                let btn_c = document.createElement("button");
                btn_c.className = "btn btn-outline-primary ml-1 mt-n1 pt-0 pb-0 pl-1 pr-1";
                btn_c.innerText = "SendInv";
                btn_c.value = userId;
                btn_c.onclick = onClickSendInv;
                elem.classList.add("customSendInvCheckButtonDone");
                elem.children[0].appendChild(btn_c);
            }
        }
        let frencont = document.getElementsByClassName("friend-container")[0];
        let elems = frencont.getElementsByClassName("usercard");
        for (let i=0; i<elems.length; i++) {
            let elem = elems[i];
            if (elem.children.length == 1) continue; // Offline
            let loctitle = elem.children[1].getElementsByClassName("location-title");
            if (loctitle.length == 1) { // public
                if (!window.vrcse.settings["show.instancejoin"]) continue;
                if (elem.classList.contains("customReqInvCheckButtonDone")) {
                    let butts = elem.children[1].children[0].getElementsByTagName("button");
                    if (butts.length == 1) {
                        butts[0].remove();
                        elem.classList.remove("customReqInvCheckButtonDone");
                    } else {
                        elem.classList.remove("customReqInvCheckButtonDone");
                    }
                }
                let elem2 = loctitle[0];
                let atag = null;
                if (elem2.children.length >= 2) {
                    atag = elem2.children[1];
                } else {
                    atag = elem2.children[0];
                }
                if (atag.tagName != "A") continue;
                let title = atag.title;
                let query = atag.href.split("?")[1];
                let worldId = getQueryVariable(query, "worldId");
                let instanceId = getQueryVariable(query, "instanceId");
                if (elem2.classList.contains("customJoinCheckButtonDone")) {
                    let butts = elem2.getElementsByTagName("button");
                    if (butts.length == 1) {
                        butts[0].value = worldId + ":" + instanceId;
                        butts[0].title = title;
                        continue;
                    }
                }
                let btn_c = document.createElement("button");
                btn_c.className = "btn btn-outline-primary pt-0 pb-0 pl-1 pr-1";
                btn_c.innerText = "Join";
                btn_c.value = worldId + ":" + instanceId;
                btn_c.title = title;
                btn_c.onclick = onClickSendInv;
                if (!elem2.classList.contains("customJoinCheckButtonDone")) {
                    elem2.classList.add("customJoinCheckButtonDone");
                }
                elem2.appendChild(btn_c);
            } else { // private
                if (!window.vrcse.settings["show.reqinv"]) continue;
                if (elem.classList.contains("customReqInvCheckButtonDone")) continue;
                if (elem.getElementsByClassName("fa-spinner").length == 1) continue; // loading?! idk just VRC things
                let btn_c = document.createElement("button");
                btn_c.className = "btn btn-outline-primary ml-1 pt-0 pb-0 pl-1 pr-1";
                btn_c.innerText = "ReqInv";
                let userId = elem.children[0].children[0].children[0].href.replace(window.location.origin + "/home/user/", "");
                btn_c.value = userId;
                btn_c.onclick = onClickSendReqInv;
                elem.classList.add("customReqInvCheckButtonDone");
                if (elem.children[1].children[0] == undefined) {
                    debugger;
                    continue;
                }
                elem.children[1].children[0].appendChild(btn_c);
            }
        }
    }

    function onClickAvatarFavourite() {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", "/api/1/favorites");
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(JSON.stringify({"type":"avatar", "tags":["avatars1"], "favoriteId":this.value}));
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    document.getElementById("_totallyRandomNameForAvatarDetails").innerText = "Avatar Favourited!";
                } else {
                    document.getElementById("_totallyRandomNameForAvatarDetails").innerText = JSON.parse(this.responseText).error.message;
                }
            }
        }
    }

    function onClickAvatarUnfavourite() {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("DELETE", "/api/1/favorites/" + this.value);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    document.getElementById("_totallyRandomNameForAvatarDetails").innerText = "Avatar Unfavourited!";
                } else {
                    document.getElementById("_totallyRandomNameForAvatarDetails").innerText = JSON.parse(this.responseText).error.message;
                }
            }
        }
    }

    function avatarDetails() {
        let atag = document.getElementsByClassName("home-content")[0].getElementsByTagName("A")[1];
        let avatarId = atag.href.replace(window.location.origin + "/home/avatar/", "");
        // Fav
        let btn_c = document.createElement("button");
        btn_c.className = "btn btn-outline-primary p-1 mr-1";
        btn_c.value = avatarId;
        btn_c.innerText = "Favourite";
        btn_c.onclick = onClickAvatarFavourite;
        atag.parentElement.parentElement.appendChild(btn_c);
        // Unfav
        btn_c = document.createElement("button");
        btn_c.className = "btn btn-outline-danger p-1";
        btn_c.value = avatarId;
        btn_c.innerText = "Unfavourite";
        btn_c.onclick = onClickAvatarUnfavourite;
        atag.parentElement.parentElement.appendChild(btn_c);

        // new line goes
        let brrrrrrrrrrrrrrr_c = document.createElement("br");
        atag.parentElement.parentElement.appendChild(brrrrrrrrrrrrrrr_c);
        let span_c = document.createElement("span");
        span_c.id = "_totallyRandomNameForAvatarDetails";
        atag.parentElement.parentElement.appendChild(span_c);
    }

    function getHighestTrustRank(tags) {
        if (tags.includes("admin_moderator")) {
            return "moderator";
        }
        if (tags.includes("system_trust_veteran")) {
            return "trusted";
        }
        if (tags.includes("system_trust_trusted")) {
            return "known";
        }
        if (tags.includes("system_trust_known")) {
            return "user";
        }
        if (tags.includes("system_trust_basic")) {
            return "new";
        }
        return "vistor";
    }

    function onClickPrivates() {
        let content = document.getElementsByClassName("home-content")[0];
        if (content.children.length > 1) {
            let butts = content.getElementsByClassName("vrcse.privates");
            if (butts.length == 1) {
                butts[0].remove();
                return;
            }
        }
        let div_c = document.createElement("div");
        content.insertBefore(div_c, content.children[content.children.length-1]);
        div_c.className = "vrcse.privates";
        div_c.innerHTML += "<h3>Friends in Privates (LOADING...)</h3>";
        let content_c = document.createElement("div");
        content_c.id = "vrcse.privates";
        content_c.className = "css-3ax2ga";
        div_c.appendChild(content_c);

        // caching?
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", "/api/1/auth/user/friends?apiKey=JlE5Jldo5Jibnk5O5hTx6XVqsJu4WJ26");
        xmlhttp.send();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let content = JSON.parse(this.responseText);
                    let privates = document.getElementById("vrcse.privates");
                    for (let i = 0; i < content.length; i++) {
                        let user = content[i];
                        if (user.location != "private") continue;
                        // Yes, I know, this is very bad
                        privates.innerHTML += `<div class="usercard friend-true size-wide state-online level-${getHighestTrustRank(user.tags)} card mb-1">
    <div class="row">
        <div>
            <a title="online" href="/home/user/${user.id}">
                <img class="img-thumbnail user-img ml-0" src="${user.currentAvatarThumbnailImageUrl}">
            </a>
        </div>
        <div class="user-info customSendInvCheckButtonDone">
            <h6>
                <a href="/home/user/${user.id}">
                    <span class="css-1lyllzs">
                        <span class="${user.status.replace(" ", "-")}" title="${user.status}"></span>
                    </span>${user.displayName}
                </a>
                <button class="btn btn-outline-primary ml-1 mt-n1 pt-0 pb-0 pl-1 pr-1 onclickmedaddy" value="${user.id}">ReqInv</button>
            </h6><!--
            <p class="offlineOrOnlineOrWhatever">
                <em>In-World</em>
            </p>-->
            <p class="statusDescription">
                <small>${user.statusDescription}</small>
            </p>
        </div>
    </div>
</div>`;
                    }
                    if (content.length == 100) {
                        let url = this.responseURL;
                        if (url.includes("&offset=")) {
                            let num = url.substring(url.length-3);
                            num = (parseInt(num) + 100).toString();
                            url.substring(0, url.length-3) + num;
                        } else {
                            url += "&offset=100";
                        }
                        this.open("GET", url);
                        this.send();
                    } else {
                        document.getElementById("vrcse.privates").parentElement.children[0].innerText = "Friends in Privates";
                    }
                    let onclickmedaddys = document.getElementsByClassName("onclickmedaddy");
                    for (let i = 0; i < onclickmedaddys.length; i++) {
                        onclickmedaddys[i].onclick = onClickSendReqInv;
                    }
                } else {
                    let privates = document.getElementById("vrcse.privates");
                    privates.innerText = this.responseText;
                }
            }
        }
    }

    function showPrivatesButton() {
        let homecont = document.getElementsByClassName("home-content")[0];
        if (homecont.classList.contains("vrcse-privates-button")) return;
        let btn_c = document.createElement("button");
        btn_c.className = "btn btn-primary float-right p-1";
        btn_c.innerText = "Privates";
        btn_c.title = "Don't spam!";
        btn_c.onclick = onClickPrivates;
        homecont.insertBefore(btn_c, homecont.children[0]);
        homecont.classList.add("vrcse-privates-button");
    }

    function hidePrivatesButton() {
        let homecont = document.getElementsByClassName("home-content")[0];
        if (!homecont.classList.contains("vrcse-privates-button")) return;
        for (let i = 0; i < homecont.children.length; i++) {
            if (homecont.children[i].tagName == "BUTTON") {
                if (homecont.children[i].innerText == "Privates") {
                    homecont.children[i].remove();
                }
            }
        }
        if (homecont.children.length > 1) {
            let butts = homecont.getElementsByClassName("vrcse.privates");
            if (butts.length == 1) {
                butts[0].remove();
            }
        }
        homecont.classList.remove("vrcse-privates-button");
    }

    function doSettingsPage() {
        let content = document.getElementsByClassName("home-content")[0];
        if (content.children.length > 1) {
            let butts = content.getElementsByClassName("vrcse.settings");
            if (butts.length == 1) {
                butts[0].remove();
                return;
            }
        }
        let div_c = document.createElement("div");
        content.insertBefore(div_c, content.children[0]);
        div_c.className = "vrcse.settings";
        div_c.innerHTML += "<h2>VRChat Site Enhanced Settings</h2>";
        div_c.innerHTML += "<h5></h5>";
        let form_c = document.createElement("form");
        form_c.id = "vrcse.form.settings";
        div_c.appendChild(form_c);
        let keys = Object.keys(window.vrcse.settings.list);
        for (let i = 0; i < keys.length;i++) {
            let setting = keys[i];
            let description = window.vrcse.settings.list[setting];
            let val = GM_getValue("vrcse." + setting);
            switch (typeof val) {
                case "boolean":
                    form_c.innerHTML += '<label for="' + setting + '" class="m-0 d-inline">' + description + ' </span>';
                    form_c.innerHTML += '<input id="' + setting + '" name=id="' + setting + '" type="checkbox" ' + (val ? "checked" : "") + ' />';
                    break;
                default:
                    form_c.innerHTML += `<span>${description}</span>`;
                    break;
            }
            form_c.innerHTML += '</br>';
        }
        form_c.innerHTML += '<input id="vrcse.form.settings.submit" type="submit" class="btn btn-primary float-right mt-n4 pb-1 pt-1" value="Save">';
        div_c.innerHTML += "<h5></h5>";
        let submit = document.getElementById("vrcse.form.settings.submit");
        submit.onclick = function (event) {
            let form = document.getElementById("vrcse.form.settings");
            let inputs = form.getElementsByTagName("input");
            let keys = Object.keys(window.vrcse.settings.list);
            for (let i = 0; i < inputs.length; i++) {
                let input = inputs[i];
                if (keys.includes(input.id)) {
                    if (input.type == "checkbox") {
                        window.vrcse.settings[input.id] = input.checked;
                    }
                }
            }
            saveSettings();
            settingsBasedGoodies();
            event.preventDefault();
            return false;
        }
    }
})();