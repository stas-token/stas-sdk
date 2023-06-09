const opCodes = {
  OP_FALSE: "00",
  OP_0: "00",
  OP_PUSHDATA1: "4c",
  OP_PUSHDATA2: "4d",
  OP_PUSHDATA4: "4e",
  OP_1NEGATE: "4f",
  OP_RESERVED: "50",
  OP_TRUE: "51",
  OP_1: "51",
  OP_2: "52",
  OP_3: "53",
  OP_4: "54",
  OP_5: "55",
  OP_6: "56",
  OP_7: "57",
  OP_8: "58",
  OP_9: "59",
  OP_10: "5a",
  OP_11: "5b",
  OP_12: "5c",
  OP_13: "5d",
  OP_14: "5e",
  OP_15: "5f",
  OP_16: "60",
  OP_NOP: "61",
  OP_VER: "62",
  OP_IF: "63",
  OP_NOTIF: "64",
  OP_VERIF: "65",
  OP_VERNOTIF: "66",
  OP_ELSE: "67",
  OP_ENDIF: "68",
  OP_VERIFY: "69",
  OP_RETURN: "6a",
  OP_TOALTSTACK: "6b",
  OP_FROMALTSTACK: "6c",
  OP_2DROP: "6d",
  OP_2DUP: "6e",
  OP_3DUP: "6f",
  OP_2OVER: "70",
  OP_2ROT: "71",
  OP_2SWAP: "72",
  OP_IFDUP: "73",
  OP_DEPTH: "74",
  OP_DROP: "75",
  OP_DUP: "76",
  OP_NIP: "77",
  OP_OVER: "78",
  OP_PICK: "79",
  OP_ROLL: "7a",
  OP_ROT: "7b",
  OP_SWAP: "7c",
  OP_TUCK: "7d",
  OP_CAT: "7e",
  OP_SUBSTR: "7f",
  OP_LEFT: "80",
  OP_RIGHT: "81",
  OP_SIZE: "82",
  OP_INVERT: "83",
  OP_AND: "84",
  OP_OR: "85",
  OP_XOR: "86",
  OP_EQUAL: "87",
  OP_EQUALVERIFY: "88",
  OP_RESERVED1: "89",
  OP_RESERVED2: "8a",
  OP_1ADD: "8b",
  OP_1SUB: "8c",
  OP_2MUL: "8d",
  OP_2DIV: "8e",
  OP_NEGATE: "8f",
  OP_ABS: "90",
  OP_NOT: "91",
  OP_0NOTEQUAL: "92",
  OP_ADD: "93",
  OP_SUB: "94",
  OP_MUL: "95",
  OP_DIV: "96",
  OP_MOD: "97",
  OP_LSHIFT: "99",
  OP_RSHIFT: "9a",
  OP_BOOLAND: "9b",
  OP_BOOLOR: "9c",
  OP_NUMEQUAL: "9d",
  OP_NUMEQUALVERIFY: "9e",
  OP_NUMNOTEQUAL: "9f",
  OP_LESSTHAN: "a0",
  OP_GREATERTHAN: "a1",
  OP_LESSTHANOREQUAL: "a2",
  OP_GREATERTHANOREQUAL: "a3",
  OP_MIN: "a4",
  OP_MAX: "a5",
  OP_WITHIN: "a6",
  OP_RIPEMD160: "a7",
  OP_SHA1: "a8",
  OP_SHA256: "a9",
  OP_HASH160: "aa",
  OP_HASH256: "ab",
  OP_CODESEPARATOR: "ac",
  OP_CHECKSIG: "ac",
  OP_CHECKSIGVERIFY: "ad",
  OP_CHECKMULTISIG: "ae",
  OP_CHECKMULTISIGVERIFY: "af",
  OP_CHECKLOCKTIMEVERIFY: "b1",
  OP_CHECKSEQUENCEVERIFY: "b2",
  OP_CHECKDATASIG: "ba",
  OP_CHECKDATASIGVERIFY: "bb",
  OP_SMALLINTEGER: "fa",
  OP_PUBKEYS: "fb",
  OP_PUBKEYHASH: "fd",
  OP_PUBKEY: "fe",
  OP_INVALIDOPCODE: "ff",
  OP_RESERVED: "50",
  OP_VER: "62",
  OP_VERIF: "65",
  OP_VERNOTIF: "66",
  OP_RESERVED1: "89",
  OP_RESERVED2: "8a",
};

module.exports = { opCodes };
