// dmaster: A web-based Doom server browser and REST API.
// Copyright (C) 2013  Alex Mayfield
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

exports.huffmanFreqs = [
	0.14473691, 0.01147017, 0.00167522, 0.03831121, 0.00356579, 0.03811315, 0.00178254, 0.00199644,
	0.00183511, 0.00225716, 0.00211240, 0.00308829, 0.00172852, 0.00186608, 0.00215921, 0.00168891,
	0.00168603, 0.00218586, 0.00284414, 0.00161833, 0.00196043, 0.00151029, 0.00173932, 0.00218370,
	0.00934121, 0.00220530, 0.00381211, 0.00185456, 0.00194675, 0.00161977, 0.00186680, 0.00182071,
	0.06421956, 0.00537786, 0.00514019, 0.00487155, 0.00493925, 0.00503143, 0.00514019, 0.00453520,
	0.00454241, 0.00485642, 0.00422407, 0.00593387, 0.00458130, 0.00343687, 0.00342823, 0.00531592,
	0.00324890, 0.00333388, 0.00308613, 0.00293776, 0.00258918, 0.00259278, 0.00377105, 0.00267488,
	0.00227516, 0.00415997, 0.00248763, 0.00301555, 0.00220962, 0.00206990, 0.00270369, 0.00231694,
	0.00273826, 0.00450928, 0.00384380, 0.00504728, 0.00221251, 0.00376961, 0.00232990, 0.00312574,
	0.00291688, 0.00280236, 0.00252436, 0.00229461, 0.00294353, 0.00241201, 0.00366590, 0.00199860,
	0.00257838, 0.00225860, 0.00260646, 0.00187256, 0.00266552, 0.00242641, 0.00219450, 0.00192082,
	0.00182071, 0.02185930, 0.00157439, 0.00164353, 0.00161401, 0.00187544, 0.00186248, 0.03338637,
	0.00186968, 0.00172132, 0.00148509, 0.00177749, 0.00144620, 0.00192442, 0.00169683, 0.00209439,
	0.00209439, 0.00259062, 0.00194531, 0.00182359, 0.00159096, 0.00145196, 0.00128199, 0.00158376,
	0.00171412, 0.00243433, 0.00345704, 0.00156359, 0.00145700, 0.00157007, 0.00232342, 0.00154198,
	0.00140730, 0.00288807, 0.00152830, 0.00151246, 0.00250203, 0.00224420, 0.00161761, 0.00714383,
	0.08188576, 0.00802537, 0.00119484, 0.00123805, 0.05632671, 0.00305156, 0.00105584, 0.00105368,
	0.00099246, 0.00090459, 0.00109473, 0.00115379, 0.00261223, 0.00105656, 0.00124381, 0.00100326,
	0.00127550, 0.00089739, 0.00162481, 0.00100830, 0.00097229, 0.00078864, 0.00107240, 0.00084409,
	0.00265760, 0.00116891, 0.00073102, 0.00075695, 0.00093916, 0.00106880, 0.00086786, 0.00185600,
	0.00608367, 0.00133600, 0.00075695, 0.00122077, 0.00566955, 0.00108249, 0.00259638, 0.00077063,
	0.00166586, 0.00090387, 0.00087074, 0.00084914, 0.00130935, 0.00162409, 0.00085922, 0.00093340,
	0.00093844, 0.00087722, 0.00108249, 0.00098598, 0.00095933, 0.00427593, 0.00496661, 0.00102775,
	0.00159312, 0.00118404, 0.00114947, 0.00104936, 0.00154342, 0.00140082, 0.00115883, 0.00110769,
	0.00161112, 0.00169107, 0.00107816, 0.00142747, 0.00279804, 0.00085922, 0.00116315, 0.00119484,
	0.00128559, 0.00146204, 0.00130215, 0.00101551, 0.00091756, 0.00161184, 0.00236375, 0.00131872,
	0.00214120, 0.00088875, 0.00138570, 0.00211960, 0.00094060, 0.00088083, 0.00094564, 0.00090243,
	0.00106160, 0.00088659, 0.00114514, 0.00095861, 0.00108753, 0.00124165, 0.00427016, 0.00159384,
	0.00170547, 0.00104431, 0.00091395, 0.00095789, 0.00134681, 0.00095213, 0.00105944, 0.00094132,
	0.00141883, 0.00102127, 0.00101911, 0.00082105, 0.00158448, 0.00102631, 0.00087938, 0.00139290,
	0.00114658, 0.00095501, 0.00161329, 0.00126542, 0.00113218, 0.00123661, 0.00101695, 0.00112930,
	0.00317976, 0.00085346, 0.00101190, 0.00189849, 0.00105728, 0.00186824, 0.00092908, 0.00160896
];

var Huffman = function(freq) {
	if (!(this instanceof arguments.callee)) {
		throw new Error("Constructor called as a function");
	}

	if (!Array.isArray(freq)) {
		throw new TypeError('First argument must be an array.');
	}

	if (freq.length != 256) {
		throw new TypeError('First argument must be a frequency array of length 256.');
	}

	this.freq = freq;
	this.tree = [];
	this.table = [];

	var self = this;

	// The original C++ code uses floats and Javascript uses doubles.  This
	// epsilon is necessary in order to make sure our float comparisons work.
	const epsilon = 0.0000001;

	// Create starting leaves
	for (var i = 0;i < 256;i++) {
		this.tree[i] = {
			frq: freq[i],
			asc: i
		};
	}

	// Pair leaves and branches based on frequency until there is a single root
	for (var i = 0;i < 255;i++) {
		var minat1 = -1;
		var minat2 = -1;
		var min1 = 1e30;
		var min2 = 1e30;

		// Find two lowest frequencies
		for (var j = 0;j < 256;j++) {
			if (!this.tree[j]) {
				continue;
			}
			if (this.tree[j].frq < min1 - epsilon) {
				minat2 = minat1;
				min2 = min1;
				minat1 = j;
				min1 = this.tree[j].frq;
			} else if (this.tree[j].frq < min2 - epsilon) {
				minat2 = j;
				min2 = this.tree[j].frq;
			}
		}

		// Join the two together under a new branch
		this.tree[minat1] = {
			frq: min1 + min2,
			0: this.tree[minat2],
			1: this.tree[minat1],
		}
		this.tree[minat2] = undefined;
	}

	// Make the root the list
	this.tree = this.tree[minat1];

	// Create a lookup table from the binary tree
	function treeWalker(branch, path) {
		path = path || '';

		// Go through a branch finding leaves while tracking the path taken
		if ('0' in branch) {
			treeWalker(branch[0], path + '0');
			treeWalker(branch[1], path + '1');
			return;
		}

		// Found a leaf, so save the binary path to the table.
		self.table[branch.asc] = path;
	}

	treeWalker(this.tree);
};
Huffman.prototype.encode = function(data) {
	if (!Buffer.isBuffer(data)) {
		throw new TypeError('Argument must be a Buffer.');
	}

	// Huffman-encode data to a binary string
	var binary_string = '';
	for (var i = 0;i < data.length;i++) {
		binary_string += this.table[data.readUInt8(i)];
	}

	// Split binary string into array of strings containing 8 bits
	var sbs = binary_string.match(/.{1,8}/g);

	// If huffman-encoding wouldn't save any space, simply return the original
	// buffer with an 0xff signal in front to show the buffer is not compressed.
	if (sbs.length >= data.length) {
		var encoded = Buffer.alloc(data.length + 1);
		encoded.writeUInt8(0xff, 0);
		data.copy(encoded, 1);
		return encoded;
	}

	// Find value of every byte in binary string
	var ords = [];
	for (var i = 0;i < sbs.length;i++) {
		ords.push(parseInt(sbs[i].split('').reverse().join(''), 2));
	}

	// Write out encoded buffer with padding bit count in front
	var encoded = Buffer.alloc(ords.length + 1);
	encoded.writeUInt8(8 - sbs[sbs.length - 1].length, 0);
	for (var i = 0;i < ords.length;i++) {
		encoded.writeUInt8(ords[i], i + 1);
	}

	return encoded;
};
Huffman.prototype.decode = function(data) {
	if (!Buffer.isBuffer(data)) {
		throw new TypeError('Argument must be a Buffer.');
	}

	var padding = data.readUInt8(0);

	// If the padding bit is set to 0xff, no decoding is necessary.
	if (padding === 0xff) {
		decoded = Buffer.alloc(data.length - 1);
		data.copy(decoded, 0, 1);
		return decoded;
	}

	// Convert ascii string into binary string.
	var bitString = '';
	for (var i = 1;i < data.length;i++) {
		var bin = data[i].toString(2).split('').reverse().join('');
		if (bin.length !== 8) {
			bin += new Array(9 - bin.length).join('0');
		}
		bitString += bin;
	}

	// Remove padding bits from the end.
	var bitString = bitString.substring(0, bitString.length - padding);

	// Repeatedly traverse the huffman tree turning the huffman code
	// into the original byte.
	var decoded = null;
	var pos = 0;
	var node = this.tree;
	for (var i = 0;i < bitString.length;i++) {
		var bit = bitString.charAt(i);
		if (bit in node) {
			node = node[bit];
		} else {
			var b = Buffer.from([node.asc]);
			if (decoded == null) { decoded = b; }
			else { decoded = Buffer.concat([decoded, b]); }
			node = this.tree[bit];
		}
	}
	decoded = Buffer.concat([decoded, Buffer.from([node.asc])]);

	return decoded;
};

exports.Huffman = Huffman;
exports.create = function() {
	return new Huffman(exports.huffmanFreqs);
} 
