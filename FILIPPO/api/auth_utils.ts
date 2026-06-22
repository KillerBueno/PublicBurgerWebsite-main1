export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const baseKey = await crypto.subtle.importKey(
        'raw',
        data,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        256
    );

    const hashArray = new Uint8Array(derivedBits);
    const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [saltHex, originalHash] = storedHash.split(':');
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const baseKey = await crypto.subtle.importKey(
        'raw',
        data,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        256
    );

    const hashArray = new Uint8Array(derivedBits);
    const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex === originalHash;
}
