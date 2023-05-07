const dgram = require('dgram');
const huffman = require('./huffman');
const iso = require('iso-3166-1');
const fs = require('fs');

const SQF_NAME = 0x00000001;
const SQF_URL = 0x00000002;
const SQF_EMAIL = 0x00000004;
const SQF_MAPNAME = 0x00000008;
const SQF_MAXCLIENTS = 0x00000010;
const SQF_MAXPLAYERS = 0x00000020;
const SQF_PWADS = 0x00000040;
const SQF_GAMETYPE = 0x00000080;
const SQF_GAMENAME = 0x00000100;
const SQF_IWAD = 0x00000200;
const SQF_FORCEPASSWORD = 0x00000400;
const SQF_FORCEJOINPASSWORD = 0x00000800;
const SQF_GAMESKILL = 0x00001000;
const SQF_BOTSKILL = 0x00002000;
const SQF_DMFLAGS = 0x00004000;
const SQF_LIMITS = 0x00010000;
const SQF_TEAMDAMAGE = 0x00020000;
const SQF_TEAMSCORES = 0x00040000;
const SQF_NUMPLAYERS = 0x00080000;
const SQF_PLAYERDATA = 0x00100000;
const SQF_TEAMINFO_NUMBER = 0x00200000;
const SQF_TEAMINFO_NAME = 0x00400000;
const SQF_TEAMINFO_COLOR = 0x00800000;
const SQF_TEAMINFO_SCORE = 0x01000000;
const SQF_TESTING_SERVER = 0x02000000;
const SQF_DATA_MD5SUM = 0x04000000;
const SQF_ALL_DMFLAGS = 0x08000000;
const SQF_SECURITY_SETTINGS = 0x10000000;
const SQF_OPTIONAL_WADS = 0x20000000;
const SQF_DEH = 0x40000000;
const SQF_EXTENDED_INFO = 0x80000000;

const SQF2_PWAD_HASHES = 0x00000001;
const SQF2_COUNTRY = 0x00000002;
const SQF2_GAMEMODE_NAME = 0x00000004;
const SQF2_GAMEMODE_SHORTNAME = 0x00000008;
const SQF2_SEGMENTED_RESPONSE = 0x00000010;

const SQF_ALL = ( SQF_NAME|SQF_URL|SQF_EMAIL|SQF_MAPNAME|SQF_MAXCLIENTS|SQF_MAXPLAYERS| 
    SQF_PWADS|SQF_GAMETYPE|SQF_GAMENAME|SQF_IWAD|SQF_FORCEPASSWORD|SQF_FORCEJOINPASSWORD|SQF_GAMESKILL| 
    SQF_BOTSKILL|SQF_LIMITS|SQF_TEAMDAMAGE|SQF_NUMPLAYERS|SQF_PLAYERDATA|SQF_TEAMINFO_NUMBER|SQF_TEAMINFO_NAME|SQF_TEAMINFO_COLOR|SQF_TEAMINFO_SCORE| 
    SQF_TESTING_SERVER|SQF_ALL_DMFLAGS|SQF_SECURITY_SETTINGS|SQF_OPTIONAL_WADS|SQF_DEH|SQF_EXTENDED_INFO );

const SQF2_ALL = ( SQF2_PWAD_HASHES|SQF2_COUNTRY|SQF2_GAMEMODE_NAME|SQF2_GAMEMODE_SHORTNAME|SQF2_SEGMENTED_RESPONSE );

const SQF_DS = SQF_NAME | SQF_URL | SQF_EMAIL | SQF_MAPNAME | SQF_MAXCLIENTS |
			SQF_MAXPLAYERS | SQF_PWADS | SQF_GAMETYPE | SQF_IWAD |
			SQF_FORCEPASSWORD | SQF_FORCEJOINPASSWORD | SQF_LIMITS |
			SQF_NUMPLAYERS | SQF_PLAYERDATA | SQF_TEAMINFO_NUMBER |
			SQF_TEAMINFO_NAME | SQF_TEAMINFO_SCORE | SQF_GAMESKILL |
			SQF_TESTING_SERVER | SQF_ALL_DMFLAGS | SQF_SECURITY_SETTINGS |
			SQF_OPTIONAL_WADS | SQF_DEH | SQF_EXTENDED_INFO;
            
const SQF2_DS = SQF2_PWAD_HASHES|SQF2_COUNTRY;

const SQF_DEMO = SQF_NAME|SQF_PLAYERDATA|SQF_TEAMINFO_NUMBER|SQF_TESTING_SERVER|SQF_EXTENDED_INFO;
const SQF2_DEMO = SQF2_COUNTRY|SQF2_GAMEMODE_NAME;

const SERVER_LAUNCHER_CHALLENGE = 5660023;
const SERVER_LAUNCHER_IGNORING = 5660024;
const SERVER_LAUNCHER_BANNED = 5660025;
const SERVER_LAUNCHER_SEGMENTED_CHALLENGE = 5660031;

let socket, host, port, encoder, readBuffer, readOffset, segmented = false, isTeamMode = false;
let packetNum = 0;

function onMessage(msg, rinfo) {
    const msgSize = msg.length;
    let dec = encoder.decode(msg);
    fs.writeFileSync("data_response " + packetNum + ".bin", dec);

    let off = 0;
    let response = dec.readInt32LE(off); off += 4;
    console.log("");
    console.log('Received %d byte response: %d', dec.length, response);

    if (response == SERVER_LAUNCHER_IGNORING) {
        console.log('Request ignored. Try again later.');
        socket.close();
        return;
    } else if (response == SERVER_LAUNCHER_BANNED) {
        console.log('Your IP is banned from this server.');
        socket.close();
        return;
    } else if (response != SERVER_LAUNCHER_CHALLENGE && response != SERVER_LAUNCHER_SEGMENTED_CHALLENGE) {
        console.log('Unknown response %d', response);
        socket.close();
        return;
    }
    
    readBuffer = dec;
    readOffset = off;
    
    let isEnd = false;
    
    if (response == SERVER_LAUNCHER_CHALLENGE) {
        let time = readLong();
        let version = readString();
        let str = 'Zandronum ' + version + ' Server';

        console.log(str);
        console.log('='.repeat(str.length));
        console.log('');
        
        handleFields();
        isEnd = true;
    } else if (response == SERVER_LAUNCHER_SEGMENTED_CHALLENGE) {
        segmented = true;
        let segmentNumber = readByte();
        const size = readShort();
        
        isEnd = (segmentNumber & (1 << 7));
        
        segmentNumber &= ~(1<<7);
        console.log("Segment %d%s, size %d (%d compressed)", segmentNumber, isEnd ? " (end)" : "", size, msgSize);
        
        if (segmentNumber == 0) {
            const time = readLong();
            const version = readString();

            console.log('Ping time: %s', time);
            console.log('Version: %s', version);
        }
        
        handleFields();
    }
        
    if (isEnd) {
        socket.close();
        console.log('');
        console.log('%d PWAD%s:', wads.length, (wads.length == 1 ? '' : 's'));
        wads.forEach((e, i, a) => {
            console.log('\t%d. %s %s', i, e.name, (e.optional ? '(optional)' : ''))
            console.log('\t   %s', e.hash)
        });
    }
    
    packetNum++;
}

let wads = [];
let players = [];
let teams = [];
let deh = [];
let numTeams;
let numPlayers;

function handleFields() {
    let fieldsetNum = -1;
    let flags = 0;
    while (readOffset < readBuffer.length) {
        fieldsetNum = segmented ? readByte() : fieldsetNum + 1;
        flags = readLong();
        
        console.log("set: %d  flags: %d", fieldsetNum, flags);
    
        if (fieldsetNum == 0) {
            if (flags & SQF_NAME) {
                let name = readString();
                console.log('Name: %s', name);
            }

            if (flags & SQF_URL) {
                let url = readString();
                console.log('Wad URL: %s', url);
            }

            if (flags & SQF_EMAIL) {
                let email = readString();
                console.log('Email: %s', email);
            }

            if (flags & SQF_MAPNAME) {
                let map = readString();
                console.log('Map: %s', map);
            }

            if (flags & SQF_MAXCLIENTS) {
                let maxClients = readByte();
                console.log('Max clients: %d', maxClients);
            }

            if (flags & SQF_MAXPLAYERS) {
                let maxPlayers = readByte();
                console.log('Max players: %d', maxPlayers);
            }

            if (flags & SQF_PWADS) {
                let numWads = readByte();
                let list = [];
                
                for (let i = 0; i < numWads; i++) {
                    let name = readString();
                    list.push(name);
                    wads[i] = {
                        index: i,
                        name: name,
                        optional: false
                    };
                }
                
                console.log('%d PWAD names: %s', numWads, list.join(', '));
            }

            if (flags & SQF_GAMETYPE) {
                let gamemode = readByte();
                let instagib = readBool();
                let buckshot = readBool();
                
                isTeamMode = (gamemode == 4 || gamemode == 8 || gamemode >= 10);

                console.log('Gamemode: %d', gamemode);
                console.log('Instagib: %s', instagib);
                console.log('Buckshot: %s', buckshot);
            }

            if (flags & SQF_GAMENAME) {
                let gamename = readString();
                console.log('Game: %s', gamename);
            }

            if (flags & SQF_IWAD) {
                let iwad = readString();
                console.log('IWAD: %s', iwad);
            }

            if (flags & SQF_FORCEPASSWORD) {
                let forcePassword = readBool();
                console.log('Password enforced: %s', forcePassword);
            }

            if (flags & SQF_FORCEJOINPASSWORD) {
                let forcePassword = readBool();
                console.log('Join password enforced: %s', forcePassword);
            }

            if (flags & SQF_GAMESKILL) {
                let skill = readByte();
                console.log('Skill: %d', skill);
            }

            if (flags & SQF_BOTSKILL) {
                let skill = readByte();
                console.log('Bot skill: %d', skill);
            }

            if (flags & SQF_LIMITS) {
                let fraglimit = readShort();
                let timelimit = readShort();
                let timeleft = timelimit > 0 ? readShort() : -1;
                let duellimit = readShort();
                let pointlimit = readShort();
                let winlimit = readShort();

                console.log('Frag limit: %d', fraglimit);
                console.log('Time limit: %d (%d minutes left)', timelimit, timeleft);
                console.log('Duel limit: %d', duellimit);
                console.log('Point limit: %d', pointlimit);
                console.log('Win limit: %d', winlimit);
            }

            if (flags & SQF_TEAMDAMAGE) {
                let damage = readFloat();
                console.log('Team damage: %d', damage);
            }
            
            if (flags & SQF_NUMPLAYERS) {
                numPlayers = readByte();
                console.log("%d players", numPlayers);
            }

            if (flags & SQF_PLAYERDATA) {
                let hasTeams = segmented ? readBool() : (flags & SQF_TEAMINFO_NUMBER);
                let str = "";
                for (let i = 0; i < numPlayers; i++) {
                    let name = readString();
                    let score = readShort();
                    let ping = readShort();
                    let spectating = readBool();
                    let bot = readBool();
                    let team = hasTeams ? readByte() : -1;
                    let time = readByte();

                    players[i] = {
                        index: i,
                        name: name,
                        score: score,
                        ping: ping,
                        spectating: spectating,
                        bot: bot,
                        team: team,
                        time: time
                    };
                    
                    str += name;
                    if (i < numPlayers - 1) { str += ", "; }
                    
                    console.log(players[i]);
                }
                
                //console.log("  %s", str);
            }

            if (flags & SQF_TEAMINFO_NUMBER) {
                numTeams = readByte();

                for (let i = 0; i < numTeams; i++) {
                    teams[i] = {
                        index: i
                    };
                }
            }

            if (flags & SQF_TEAMINFO_NAME) {
                for (let i = 0; i < numTeams; i++) {
                    teams[i]['name'] = readString();
                }
            }

            if (flags & SQF_TEAMINFO_COLOR) {
                for (let i = 0; i < numTeams; i++) {
                    teams[i]['color'] = readLong();
                }
            }

            if (flags & SQF_TEAMINFO_SCORE) {
                for (let i = 0; i < numTeams; i++) {
                    teams[i]['score'] = readShort();
                }
            }

            if (flags & SQF_TESTING_SERVER) {
                let isTesting = readBool();
                let testingBuild = readString();

                console.log('Is testing server: %s', isTesting);
                if (isTesting) console.log('Testing build download: %s', testingBuild);
            }

            if (flags & SQF_ALL_DMFLAGS) {
                let numFlags = readByte();
                let dmflags = 0, dmflags2 = 0, zadmflags = 0, compatflags = 0, zacompatflags = 0, compatflags2 = 0;

                if (numFlags >= 1) dmflags = readLong();
                if (numFlags >= 2) dmflags2 = readLong();
                if (numFlags >= 3) zadmflags = readLong();
                if (numFlags >= 4) compatflags = readLong();
                if (numFlags >= 5) zacompatflags = readLong();
                if (numFlags >= 6) compatflags2 = readLong();

                console.log('dmflags: %d', dmflags);
                console.log('dmflags2: %d', dmflags2);
                console.log('zadmflags: %d', zadmflags);
                console.log('compatflags: %d', compatflags);
                console.log('zacompatflags: %d', zacompatflags);
                console.log('compatflags2: %d', compatflags2);
            }

            if (flags & SQF_SECURITY_SETTINGS) {
                let enforcesMasterBans = readBool();

                console.log('Enforces master banlist: %s', enforcesMasterBans);
            }

            if (flags & SQF_OPTIONAL_WADS) {
                let numIndices = readByte();
                let list = [];

                for (let i = 0; i < numIndices; i++) {
                    let index = readByte();
                    list.push(index);
                    wads[index]['optional'] = true;
                }
                
                console.log('%d optional PWADs: %s', numIndices, list.join(', '));
            }

            if (flags & SQF_DEH) {
                let numPatches = readByte();

                for (let i = 0; i < numPatches; i++) {
                    let name = readString();
                    deh[i] = {
                        index: i,
                        name: name
                    };
                }
            }
        } else if (fieldsetNum == 1) {
            if (flags & SQF2_PWAD_HASHES) {
                let numHashes = readByte();
                let list = [];
                for (let i = 0; i < numHashes; i++) {
                    let hash = readString();
                    list.push(hash);
                    if (wads.length >= i + 1) {
                        wads[i]['hash'] = hash;
                    }
                }
                
                console.log('%d PWAD hashes: %s', numHashes, list.join(', '));
            }

            if (flags & SQF2_COUNTRY) {
                let code = 
                    String.fromCharCode(readByte()) +
                    String.fromCharCode(readByte()) +
                    String.fromCharCode(readByte());
                    
                let cdata = iso.whereAlpha3(code);
                let cname = 'Unknown';
                
                if (code == 'XIP') cname = 'Use IP geolocation';
                else if (cdata) cname = cdata.country;
                    
                console.log('Country: %s (%s)', code, cname);
            }

            if (flags & SQF2_GAMEMODE_NAME) {
                const name = readString();
                console.log("Game mode name: %s", name);
            }

            if (flags & SQF2_GAMEMODE_SHORTNAME) {
                const shortName = readString();
                console.log("Game mode short name: %s", shortName);
            }
        }
        
        if (flags & SQF_EXTENDED_INFO) {
            console.log("Ext info");
        } else {
            break;
        }
        
        console.info("handleFields ended after " + readOffset);
    }
}

function readByte() {
    let v = readBuffer.readUInt8(readOffset);
    readOffset++;
    return v;
}

function readShort() {
    let v = readBuffer.readUInt16LE(readOffset);
    readOffset += 2;
    return v;
}

function readLong() {
    let v = readBuffer.readUInt32LE(readOffset);
    readOffset += 4;
    return v;
}

function readFloat() {
    let v = readBuffer.readFloatLE(readOffset);
    readOffset += 4;
    return v;
}

function readString() {
    if (readBuffer.readUInt8() == 0) {
        return '';
    }

    let i = readOffset;
    while (readBuffer.readUInt8(i++) != 0); i--;
    let str = readBuffer.toString('ascii', readOffset, i);
    readOffset += str.length + 1;
    return str;
}

function readBool() {
    return readByte() != 0;
}

function main(args) {
    const wantedFlags = SQF_ALL;
    const wantedFlags2 = SQF2_ALL;
    const time = 0;
    
    socket = dgram.createSocket('udp4');

    socket.on('message', onMessage);

    host = args[2];
    port = parseInt(args[3]) || 10666;
    let segmented = parseInt(args[4]);

    console.log('%s:%d  flags=%s  time=%d  flags2=%s', host, port, wantedFlags.toString(16), time, wantedFlags2.toString(16));

    encoder = huffman.create();

    let off = 0;
    let buf;

    if (segmented === 1) {
        console.info("Sending LAUNCHER_SERVER_SEGMENTED_CHALLENGE");
        buf = Buffer.alloc(16);
        off = buf.writeInt32LE(200, off);
        off = buf.writeInt32LE(wantedFlags, off);
        off = buf.writeInt32LE(time, off);
        off = buf.writeUInt32LE(wantedFlags2, off);
    } else {
        console.info("Sending LAUNCHER_SERVER_CHALLENGE");
        buf = Buffer.alloc(segmented === 2 ? 17 : 16);
        off = buf.writeInt32LE(199, off);
        off = buf.writeInt32LE(wantedFlags, off);
        off = buf.writeInt32LE(time, off);
        off = buf.writeUInt32LE(wantedFlags2, off);
        if (segmented === 2) {
            off = buf.writeUInt8(1, off);
        }
    }
    fs.writeFileSync("data_request.bin", buf);
    let enc = encoder.encode(buf);

    socket.send(enc, port, host, (err) => {
        if (err) {
            console.log('Error.');
            return;
        }
    });
}

main(process.argv);
