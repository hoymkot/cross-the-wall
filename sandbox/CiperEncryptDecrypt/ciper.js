// (async function () {
// 	const {
// 	  scrypt,
// 	  randomFill,
// 	  createCipheriv,
// 	} = await import('crypto');

// 	const { subtle, getRandomValues } = require('crypto').webcrypto;


// 	async function generateAesKey(length = 256) {
// 	  const key = await subtle.generateKey({
// 	    name: 'AES-CBC',
// 	    length
// 	  }, true, ['encrypt', 'decrypt']);

// 	  return key;
// 	}

// 	async function aesEncrypt(plaintext) {
// 	  const ec = new TextEncoder();
// 	  const key = await generateAesKey();
// 	  const iv = getRandomValues(new Uint8Array(16));

// 	  const ciphertext = await subtle.encrypt({
// 	    name: 'AES-CBC',
// 	    iv,
// 	  }, key, ec.encode(plaintext));

// 	  return {
// 	    key : key ,
// 	    iv : iv,
// 	    name : 'AES-CBC',
// 	    ciphertext: ciphertext
// 	  };
// 	}


// 	obj = await aesEncrypt("Hello World")
// 	console.log(obj)

// 	async function aesDecrypt(ciphertext, key, iv) {
// 	  const dec = new TextDecoder();
// 	  const plaintext = await subtle.decrypt({
// 	    name: 'AES-CBC',
// 	    iv,
// 	  }, key, ciphertext);

// 	  return dec.decode(plaintext);
// 	}

// 	obj = await aesDecrypt(obj.ciphertext, obj.key, obj.iv)
// 	console.log(obj)





















// })();




// const algorithm = 'aes-192-cbc';
// const password = 'Password used to generate key';

// // First, we'll generate the key. The key length is dependent on the algorithm.
// In this case for aes192, it is 24 bytes (192 bits).
(async function () {
	const {
	  scryptSync,
	  randomFillSync,
	  createCipheriv,
	  createDecipheriv,
	} = await import('crypto');

	const { getRandomValues } = require('crypto').webcrypto;

	var password = getRandomValues(new Uint8Array(16));
	var salt = getRandomValues(new Uint8Array(16));

	const algorithm = 'aes-192-cbc';
	var encrypted = '';

	var init_vector ; 
	var secret_key ; 
	var key = scryptSync(salt, salt, 24)

	var iv = randomFillSync(Buffer.alloc(16))
	const cipher = createCipheriv(algorithm, key, iv);
	cipher.setEncoding('hex');
	cipher.on('data', (chunk) => encrypted += chunk);
	cipher.on('end', () => console.log(encrypted));
	cipher.write('some clear text data');
	cipher.end();






	keyHex = key.toString('hex');
	ivHex = iv.toString('hex');

	key = Buffer.from(keyHex, 'hex')
	iv = (Buffer.from(ivHex, 'hex'))
	const decipher = createDecipheriv(algorithm, key, iv);

	let decrypted = '';
	decipher.on('readable', () => {
	  while (null !== (chunk = decipher.read())) {
		decrypted += chunk.toString('utf8');
	  }
	});
	decipher.on('end', () => {
	  console.log(decrypted);
	  // Prints: some clear text data
	});

	decipher.write(encrypted, 'hex');
	decipher.end();


})();