import { Variant } from "protonsdk-variant";
import * as fs from "fs";
import Tank from "./Tank";
const addon = require("./src/build/Release/index");

addon.init("213.179.209.168", 17237, false);
addon.init_server();

let userid: string | undefined = undefined;
let token: string | undefined = undefined;
let lmode: string | undefined = undefined;
let has_redir = false;
let a: Map<string, string>;

const $ = () => {
    return new Promise((resolve) => {
        setImmediate(()=> {
            addon.events(function(p) {
                console.log("[FROM GT SERVER]:", p);
            }, function(p, m) {
                let x = Buffer.from(m);
                console.log(`[FROM GT SERVER]: Received packet type: ${x[0]}`, x[0] === 4 ? new Tank().unpack(x) : "");

                if (x[0] === 4 && new Tank().unpack(x).type === 15 )
                    	console.log("Punch/place packet", x.toString("hex").match(/.{2}|.{1}/g).join(" "))

                //console.log(x[0] === 4 ? (new Tank().unpack(x).type === 14 || new Tank().unpack(x).type === 65549 ? "Drop packet " + x.toString("hex").match(/.{2}|.{1}/g).join(" ") : "") : "\u0000")
                if (x[0] === 3) {
                console.log("received action from gt server", x.toString());
                }

                if (x[4] === 0x10) {
                console.log(`[ITEMS DAT] SAVED TO FILE`)
                    fs.writeFileSync(`${__dirname}/worlds/items_dat.hex`, x.toString("hex").match(/.{2}|.{1}/g).join(" "));
                }

                if (x[4] === 5 && x[0] === 4) {
                    console.log(`[FROM GT SERVER]: Received door/sign update?`, x.toString("hex").match(/.{2}|.{1}/g).join(" "));
                }

                if (x[4] === 17) {
                	console.log(`[FROM GT SERVER]: Effect?`, x.toString("hex").match(/.{2}|.{1}/g).join(" "));
                }

                if (x[4] === 12) {
                	console.log(`[FROM GT SERVER]: Harvest?`, x.toString("hex").match(/.{2}|.{1}/g).join(" "))
                }

                if (x[0] === 4 && x[4] === 3 && x.length >= 60) {
                	console.log(`[FROM GT SERVER]: Placed/Harvested seed`, x.toString("hex").match(/.{2}|.{1}/g).join(" "))
                }

                if (x[0] === 4 && x.length >= 60 && (new Tank().unpack(x).type === 14 || new Tank().unpack(x).type === 11)) {
                	console.log(`[FROM GT SERVER]: Received drop/pickup?`, x.toString("hex").match(/.{2}|.{1}/g).join(" "))
                }

                if (x[0] === 4 && x[4] === 20) {
                	console.log(`[FROM GT SERVER]: Received state update`, x.toString("hex").match(/.{2}|.{1}/g).join(" "))
                }

                if (x[0] === 4 && x[4] === 13) {
                    console.log(`[FROM GT SERVER]: TRADE EFFECT?`, x.toString("hex").match(/.{2}|.{1}/g).join(" "))
                }

                if (x[0] === 4 && x[4] === 19) {
                    console.log(`[FROM GT SERVER]: TRADE EFFECT?`, x.toString("hex").match(/.{2}|.{1}/g).join(" "))
                }

                if (x[0] === 4 && x[4] === 1) {
                    let variant = Variant.from(x);
                    console.log(variant.packet.toString("hex").match(/.{2}|.{1}/g).join(" "))
                    console.log(`Received Variant packet`, variant)
                    if (variant.args[0] === "OnSetPos")
                        console.log(variant.packet.toString("hex").match(/.{2}|.{1}/g).join(" "))
                    if (variant.args[0] === "OnConsoleMessage") {
                        variant.args[1] = "`4[PROXY]`` " + variant.args[1];

                        let varlist = new Variant();
                        return addon.send_client(varlist.call.apply(varlist, variant.args).packet);
                    }
                }

                if (x[4] === 9) {
                	console.log(`Inventory packet:`, x.toString("hex").match(/.{2}|.{1}/g).join(" "))
                }

                if (x.length > 6000) { // found world packet
                    console.log("length of world packet", x.length)
                    fs.writeFileSync(`${__dirname}/worlds/last_joined_world_data.hex`, x.toString("hex").match(/.{2}|.{1}/g).join(" "));
                }
                if (has_redir && a && x[0] === 1) {
                    let pm = a;

                    pm.delete("wk");
                    pm.delete("zf");
                    
                    if (userid)
                        pm.set("user", userid);
                    
                    if (token) {
                        pm.set("token", token);
                    }

                    if (lmode)
                        pm.set("lmode", lmode);

                    let packet = "";

                    for (let [k ,v] of Array.from(pm)) {
                        packet += `${k}|${v}\n`;
                    }

                    addon.send(Buffer.concat([Buffer.from([0x02, 0x00, 0x00, 0x00]), Buffer.from(packet)]))
                } else if (x[0] === 6 || x[0] === 7) {
                } else if (!x.toString().includes("OnSendToServer")) {
                    let varlist = new Variant();
                    addon.send_client(x);
                } else {
                    let redir = Variant.from(x);
                    let varlist = new Variant();

                    if (!token)
                    	token = redir.args[2] as string;
                    	
                    userid = redir.args[3] as string;
                    lmode = redir.args[5] as string;

                    console.log(redir.args)
                    addon.send_client(varlist.call("OnConsoleMessage", "`4[PROXY]`` Switching subserver...").packet)

                    has_redir = true;
                    addon.init((redir.args[4] as string).split("|")[0], redir.args[1])
                };
            });
            resolve();
        });
    });
}

const client_events = async() => {
    while(true)
        await $();
}

const $s = () => {
    return new Promise((resolve) => {
        setImmediate(()=> {
            addon.check_events_server(function(p) {
                console.log("[FROM GT CLIENT]:", p);
                client_events();
            }, function(p, m) {
                let x = Buffer.from(m);
                console.log(`[FROM GT CLIENT]: Received packet type: ${x[0]}`, x[0] === 4 ? new Tank().unpack(x) : "");
                console.log(x[0] === 4 ? (new Tank().unpack(x).state === 48 ? "Pick up packet " + x.toString("hex").match(/.{2}|.{1}/g).join(" ") : "") : "")
                if (x[0] === 2 && x.toString().includes("requestedName")) {
                    let packet = x.toString().slice(4).slice(0, -1);
                    let pm = new Map();

                    for (let a of packet.split("\n")) {
                        pm.set(a.split("|")[0], a.split("|")[1]);
                    }

                    a = pm;
                    
                    addon.send_client(new Variant().call("OnConsoleMessage", "`4[PROXY]`` Sending modified client data to server.").packet)
                }

                if (x[4] === 9) {
                console.log("received packet from client, inventory")
                }
                
                if (x.toString('utf-8', 4).slice(0, -1) === "action|quit") {
                    console.log(`[FROM GT CLIENT]: Disconnecting client & server`);
                    addon.disconnect();
                    addon.disconnect_client();
                } else addon.send(x);
            });
            resolve();
        });
    });
}

const server_events = async() => {
    while(true)
        await $s();
}

server_events(); // listen for client_events