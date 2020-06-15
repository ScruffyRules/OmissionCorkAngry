// ==UserScript==
// @name         VRChat Site Enhanced
// @namespace    ScruffyRules
// @version      0.05
// @description  Trying to enchance VRChat's website with extra goodies
// @author       ScruffyRules
// @match        https://vrchat.com/home/*
// @match        https://vrchat.com/home*
// @match        https://www.vrchat.com/home/*
// @match        https://www.vrchat.com/home*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function checkIfLoaded() {
        let elem = document.getElementsByClassName("home-content");
        if (elem.length > 0) {
            onceLoaded(elem[0]);
        } else {
            setTimeout(checkIfLoaded, 100);
        }
    }

    function onceLoaded(elem) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", "/api/1/auth/user");
        xmlhttp.send();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    window.vrcse = {};
                    window.vrcse.userInfo = JSON.parse(this.responseText);
                    window.vrcse.inv2mePromptTimeout = 0;
                    window.vrcse.lastPathname = "";
                    onceAuthed(elem);
                } else {
                    console.log(this);
                    alert("VRCSE Could not find user account");
                    debugger;
                }
            }
        }
    }

    function onceAuthed(elem) {
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
        runChecks();
    }

    function runChecks() {
        setInterval(runCheckForInvMeButton, 750);
        setInterval(onHrefChange, 750);
    }

    function onHrefChange() {
        if (window.vrcse.lastPathname == location.pathname) return;
        window.vrcse.lastPathname = location.pathname;
        if (location.pathname.startsWith("/home/avatar")) {
            setTimeout(avatarDetails, 500);
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

    function onClickSendInv() {
        sendInv(window.vrcse.userInfo.id, this.value, this.title);
    }

    function onClickSendInv2Me() {
        if (Date.now() > window.vrcse.inv2mePromptTimeout + 30000) { // should be 30 seconds
            window.vrcse.inv2mePromptWorldInstance = prompt("World:Instance?");
            if (window.vrcse.inv2mePromptWorldInstance == "" || window.vrcse.inv2mePromptWorldInstance == null) return;
            window.vrcse.inv2mePromptMessage = prompt("Message", "me?");
            window.vrcse.inv2mePromptTimeout = Date.now();
        }
        sendInv(this.value, window.vrcse.inv2mePromptWorldInstance, window.vrcse.inv2mePromptMessage);
    }

    function onClickSendReqInv() {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", "/api/1/user/" + this.value + "/notification");
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(JSON.stringify({"type":"requestInvite", "message":""}));
    }

    function runCheckForInvMeButton() {
        let loccont = document.getElementsByClassName("location-container")[0];
        if (loccont != undefined) {
            let elems = loccont.getElementsByClassName("location-title");
            for (let i=0; i<elems.length; i++) {
                let elem = elems[i];
                if (elem.className.includes("customInvCheckButtonDone")) continue;
                let atag = null;
                if (elem.children.length == 2) {
                    atag = elem.children[1];
                } else {
                    atag = elem.children[0];
                }
                if (atag.tagName != "A") continue;
                let title = atag.title;
                let query = atag.href.split("?")[1];
                let worldId = getQueryVariable(query, "worldId");
                let instanceId = getQueryVariable(query, "instanceId");
                let btn_c = document.createElement("button");
                btn_c.className = "btn btn-outline-primary p-1";
                btn_c.innerText = "Inv";
                btn_c.value = worldId + ":" + instanceId;
                btn_c.title = title;
                btn_c.onclick = onClickSendInv;
                elem.className += " customInvCheckButtonDone";
                elem.appendChild(btn_c);
            }
        }
        let userinfos = document.getElementsByClassName("user-info");
        for (let i=0; i<userinfos.length; i++) {
            let elem = userinfos[i];
            if (elem.className.includes("customInv2MeCheckButtonDone")) continue;
            let atag = elem.children[0].children[0];
            let userId = atag.href.replace("https://vrchat.com/home/user/", "");
            let btn_c = document.createElement("button");
            btn_c.className = "btn btn-outline-primary ml-1 mt-n1 p-1";
            btn_c.innerText = "Inv2Me";
            btn_c.value = userId;
            btn_c.onclick = onClickSendInv2Me;
            elem.className += " customInv2MeCheckButtonDone";
            elem.children[0].appendChild(btn_c);
        }
        let frencont = document.getElementsByClassName("friend-container")[0];
        let elems = frencont.getElementsByClassName("usercard");
        for (let i=0; i<elems.length; i++) {
            let elem = elems[i];
            if (elem.children.length == 1) continue; // Offline
            let loctitle = elem.children[1].getElementsByClassName("location-title");
            if (loctitle.length == 1) { // public
                if (elem.className.includes("customReqInvCheckButtonDone")) {
                    let butts = elem.children[1].children[0].getElementsByTagName("button");
                    if (butts.length == 1) { // In theory this should never be 0 but uhh somehow it happens!
                        butts[0].remove();
                        elem.className = elem.className.replace("customReqInvCheckButtonDone", "").replace("  ", " ");
                    } else {
                        debugger;
                    }
                }
                elem = loctitle[0];
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
                if (elem.className.includes("customInvCheckButtonDone")) {
                    let butts = elem.getElementsByTagName("button");
                    if (butts.length == 1) {
                        butts[0].value = worldId + ":" + instanceId;
                        butts[0].title = title;
                    } else {
                        debugger;
                    }
                    continue;
                }
                let btn_c = document.createElement("button");
                btn_c.className = "btn btn-outline-primary p-1";
                btn_c.innerText = "Inv";
                btn_c.value = worldId + ":" + instanceId;
                btn_c.title = title;
                btn_c.onclick = onClickSendInv;
                elem.className += " customInvCheckButtonDone";
                elem.appendChild(btn_c);
            } else { // private
                if (elem.className.includes("customReqInvCheckButtonDone")) continue;
                let btn_c = document.createElement("button");
                btn_c.className = "btn btn-outline-primary p-1 ml-1";
                btn_c.innerText = "ReqInv";
                let userId = elem.children[0].children[0].children[0].href.replace("https://vrchat.com/home/user/", "");
                btn_c.value = userId;
                btn_c.onclick = onClickSendReqInv;
                elem.className += " customReqInvCheckButtonDone";
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
        let avatarId = atag.href.replace("https://vrchat.com/home/avatar/", "");
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
})();