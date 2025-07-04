Rugs.fun Game Verification
Verification Version:

Version 1 (Original)
How Provably Fair Works
Rugs.fun uses a provably fair system to ensure game outcomes cannot be manipulated:

Before each game: The server generates a random server seed and publishes only its hash (the server seed hash).
During the game: The outcome is determined by combining the server seed with the game ID.
After the game ends: The server reveals the original server seed.
Verification process:
First, you can verify that the revealed server seed matches the pre-published hash by using the SHA-256 algorithm.
Second, you can use this tool to independently calculate the game outcome using the revealed server seed and game ID.
If both checks pass, this proves the game outcome was predetermined and not manipulated.
Why Wait for the Server Seed?
The server keeps the actual server seed secret during the game and only reveals it after the game ends. This prevents anyone (including the operator) from knowing the outcome in advance, while still allowing for verification afterward.

Server Seed:
fedde170f25570df546c5c16de6f571b8253221f9307e977c4f5354a5aa078a4
 This is revealed only after the game ends.
Server Seed Hash (optional):
eda505784c52cba72256771a21db61b4313749fb2675d14d3641bf5de589da42
 This hash is published before the game starts to prove the server seed wasn't changed.
Game ID:
20250701-55b97a42871f441f
 The unique identifier for the game.
Verification Result:

Hash Verification: ✓ VERIFIED - The hash matches the server seed
The provided server seed produces the expected hash.

Server Seed: fedde170f25570df546c5c16de6f571b8253221f9307e977c4f5354a5aa078a4
Game ID: 20250701-55b97a42871f441f
Verification Version: v1
Peak Multiplier: 3.8475x
Game Outcome: Rugged

Game Parameters:
- Rug Probability: 0.011
- Drift Range: -0.02 to 0.03
- Big Move Chance: 0.125 (0.15 to 0.25)
Source Code
To ensure transparency, the verification algorithm matches exactly what's used on the server. You can review the key portions of the code below:

// Price drift calculation
function driftPrice(
    price,
    DRIFT_MIN,
    DRIFT_MAX,
    BIG_MOVE_CHANCE,
    BIG_MOVE_MIN,
    BIG_MOVE_MAX,
    randFn,
    version = 'v3',
    GOD_CANDLE_CHANCE = 0.00001,
    GOD_CANDLE_MOVE = 10.0,
    STARTING_PRICE = 1.0
) {
    // v3 adds God Candle feature - rare massive price increase
    if (version === 'v3' && randFn() < GOD_CANDLE_CHANCE && price <= 100 * STARTING_PRICE) {
        return price * GOD_CANDLE_MOVE;
    }
    
    let change = 0;
    
    if (randFn() < BIG_MOVE_CHANCE) {
        const moveSize = BIG_MOVE_MIN + randFn() * (BIG_MOVE_MAX - BIG_MOVE_MIN);
        change = randFn() > 0.5 ? moveSize : -moveSize;
    } else {
        const drift = DRIFT_MIN + randFn() * (DRIFT_MAX - DRIFT_MIN);
        
        // Version difference is in this volatility calculation
        const volatility = version === 'v1' 
            ? 0.005 * Math.sqrt(price)
            : 0.005 * Math.min(10, Math.sqrt(price));
            
        change = drift + (volatility * (2 * randFn() - 1));
    }
    
    let newPrice = price * (1 + change);

    if (newPrice < 0) {
        newPrice = 0;
    }

    return newPrice;
}

// Game verification function
function verifyGame(serverSeed, gameId, version = 'v3') {
    const combinedSeed = serverSeed + '-' + gameId;
    const prng = new Math.seedrandom(combinedSeed);
    
    let price = 1.0;
    let peakMultiplier = 1.0;
    let rugged = false;
    
    for (let tick = 0; tick < 5000 && !rugged; tick++) {
        if (prng() < RUG_PROB) {
            rugged = true;
            continue;
        }
        
        const newPrice = driftPrice(
            price,
            DRIFT_MIN, 
            DRIFT_MAX, 
            BIG_MOVE_CHANCE, 
            BIG_MOVE_MIN, 
            BIG_MOVE_MAX,
            prng.bind(prng),
            version
        );
        
        price = newPrice;
        
        if (price > peakMultiplier) {
            peakMultiplier = price;
        }
    }
    
    return {
        peakMultiplier: peakMultiplier,
        rugged: rugged
    };
}