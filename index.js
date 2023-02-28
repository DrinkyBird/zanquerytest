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
const SQF2_GAMEMODE_NAME = 0x4;
const SQF2_GAMEMODE_SHORTNAME = 0x8;

const SQF_ALL = ( SQF_NAME|SQF_URL|SQF_EMAIL|SQF_MAPNAME|SQF_MAXCLIENTS|SQF_MAXPLAYERS| 
    SQF_PWADS|SQF_GAMETYPE|SQF_GAMENAME|SQF_IWAD|SQF_FORCEPASSWORD|SQF_FORCEJOINPASSWORD|SQF_GAMESKILL| 
    SQF_BOTSKILL|SQF_LIMITS|SQF_TEAMDAMAGE|SQF_NUMPLAYERS|SQF_PLAYERDATA|SQF_TEAMINFO_NUMBER|SQF_TEAMINFO_NAME|SQF_TEAMINFO_COLOR|SQF_TEAMINFO_SCORE| 
    SQF_TESTING_SERVER|SQF_ALL_DMFLAGS|SQF_SECURITY_SETTINGS|SQF_OPTIONAL_WADS|SQF_DEH|SQF_EXTENDED_INFO );

const SQF2_ALL = ( SQF2_PWAD_HASHES|SQF2_COUNTRY|SQF2_GAMEMODE_NAME|SQF2_GAMEMODE_SHORTNAME );

const SERVER_LAUNCHER_CHALLENGE = 5660023;
const SERVER_LAUNCHER_IGNORING = 5660024;
const SERVER_LAUNCHER_BANNED = 5660025;

let socket, host, port, encoder, readBuffer, readOffset;

function onMessage(msg, rinfo) {
    let dec = encoder.decode(msg);
    fs.writeFileSync("out_dehuff.bin", dec);

    console.log('Received %d byte response.', dec.length);
    console.log('');


    let off = 0;
    let response = dec.readInt32LE(off); off += 4;
    let time = dec.readInt32LE(off); off += 4;

    if (response == SERVER_LAUNCHER_IGNORING) {
        console.log('Request ignored. Try again later.');
        socket.close();
        return;
    } else if (response == SERVER_LAUNCHER_BANNED) {
        console.log('Your IP is banned from this server.');
        socket.close();
        return;
    } else if (response != SERVER_LAUNCHER_CHALLENGE) {
        console.log('Unknown response %d', response);
        socket.close();
        return;
    }

    readBuffer = dec;
    readOffset = off;

    let version = readString();
    let str = 'Zandronum ' + version + ' Server';

    console.log(str);
    console.log('='.repeat(str.length));
    console.log('');

    let flags = readLong();
    console.log('Return flags: %s', flags.toString(16));

    let wads = [];
    let players = [];
    let teams = [];
    let deh = [];

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
        
        for (let i = 0; i < numWads; i++) {
            let name = readString();
            wads[i] = {
                index: i,
                name: name,
                optional: false
            };
        }
    }

    if (flags & SQF_GAMETYPE) {
        let gamemode = readByte();
        let instagib = readBool();
        let buckshot = readBool();

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

    if (flags & SQF_PLAYERDATA) {
        let numPlayers = readByte();

        for (let i = 0; i < numPlayers; i++) {
            let name = readString();
            let score = readShort();
            let ping = readShort();
            let spectating = readBool();
            let bot = readBool();
            let team = readByte();
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
        }
    }

    let numTeams;
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
        let dmflags = 0, dmflags2 = 02, zadmflags = 0, compatflags = 0, zacompatflags = 0, compatflags2 = 0;

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

        for (let i = 0; i < numIndices; i++) {
            let index = readByte();
            wads[index]['optional'] = true;
        }
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

    if (flags & SQF_EXTENDED_INFO) {
        let flags2 = readLong();
        console.log('Return extended flags: %s', flags2.toString(16));

        if (flags2 & SQF2_PWAD_HASHES) {
            let numHashes = readByte();
            console.log('%d PWAD hashes.', numHashes);
            for (let i = 0; i < numHashes; i++) {
                let hash = readString();

                wads[i]['hash'] = hash;
            }
        }

        if (flags2 & SQF2_COUNTRY) {
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

        if (flags2 & SQF2_GAMEMODE_NAME) {
            const name = readString();
            console.log("Game mode name: %s", name);
        }

        if (flags2 & SQF2_GAMEMODE_SHORTNAME) {
            const shortName = readString();
            console.log("Game mode short name: %s", shortName);
        }
    }

    socket.close();

    console.log('');
    console.log('%d PWAD%s:', wads.length, (wads.length == 1 ? '' : 's'));
    wads.forEach((e, i, a) => {
        console.log('\t%d. %s %s', i, e.name, (e.optional ? '(optional)' : ''))
        console.log('\t   %s', e.hash)
    });
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
    socket = dgram.createSocket('udp4');

    socket.on('message', onMessage);

    host = args[2];
    port = parseInt(args[3]) || 10666;

    console.log('%s:%d', host, port);

    encoder = huffman.create();

    let off = 0;
    let buf = Buffer.alloc(16);
    off = buf.writeInt32LE(199, off);
    off = buf.writeInt32LE(SQF_ALL, off);
    off = buf.writeInt32LE(0, off);
    off = buf.writeInt32LE(SQF2_ALL, off);
    let enc = encoder.encode(buf);

    socket.send(enc, port, host, (err) => {
        if (err) {
            console.log('Error.');
            return;
        }
    });
}

main(process.argv);
