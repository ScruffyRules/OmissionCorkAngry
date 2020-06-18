// ==UserScript==
// @name         VRChat Site Enhanced
// @namespace    ScruffyRules
// @version      0.075
// @description  Trying to enchance VRChat's website with extra goodies
// @author       ScruffyRules
// @match        https://vrchat.com/home/*
// @match        https://vrchat.com/home*
// @match        https://www.vrchat.com/home/*
// @match        https://www.vrchat.com/home*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
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
        settings["remove.uppercase"] = setDefaultIfNotFound("vrcse.remove.uppercase", true);
        window.vrcse.settings = settings;
        window.vrcse.settings.list = {
            "show.sendinv":"Send Invite Buttons",
            "show.reqinv":"Request Invite Buttons",
            "show.instancejoin":"Join Buttons",
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
                    window.vrcse.lastPathname = "";
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
        debugger;
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
    }

    function runChecks() {
        setInterval(buttonChecker, 750);
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

    function buttonChecker() {
        let loccont = document.getElementsByClassName("location-container")[0];
        if (window.vrcse.settings["show.instancejoin"] && loccont != undefined) {
            let elems = loccont.getElementsByClassName("location-title");
            for (let i=0; i<elems.length; i++) {
                let elem = elems[i];
                if (elem.classList.contains("customJoinCheckButtonDone")) continue;
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
                btn_c.className = "btn btn-outline-primary pt-0 pb-0 pl-1 pr-1";
                btn_c.innerText = "Join";
                btn_c.value = worldId + ":" + instanceId;
                btn_c.title = title;
                btn_c.onclick = onClickJoin;
                elem.appendChild(btn_c);
                elem.classList.add("customJoinCheckButtonDone");
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
                    } else {
                        debugger;
                    }
                    continue;
                }
                let btn_c = document.createElement("button");
                btn_c.className = "btn btn-outline-primary p-1";
                btn_c.innerText = "Join";
                btn_c.value = worldId + ":" + instanceId;
                btn_c.title = title;
                btn_c.onclick = onClickSendInv;
                elem2.classList.add("customJoinCheckButtonDone");
                elem2.appendChild(btn_c);
            } else { // private
                if (!window.vrcse.settings["show.reqinv"]) continue;
                if (elem.classList.contains("customReqInvCheckButtonDone")) continue;
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

    function cleanSettingKey(setting) {
        let ret = setting;
        ret = ret.replace("vrcse.", "");
        ret = ret.toLowerCase().split(".").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        return ret;
    }

    function doSettingsPage() {
        let content = document.getElementsByClassName("home-content")[0];
        if (content.children.length > 1) {
            let butts = content.getElementsByClassName("vrcse");
            if (butts.length == 1) {
                butts[0].remove();
                return;
            }
        }
        let div_c = document.createElement("div");
        content.insertBefore(div_c, content.children[0]);
        div_c.className = "vrcse";
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
        form_c.innerHTML += '<input id="vrcse.form.settings.submit" type="submit" class="btn btn-primary float-right mt-n5" value="Save">';
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