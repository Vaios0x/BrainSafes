# Ejemplos de Uso y Scripts

## Desplegar contratos
```js
const BrainSafes = await ethers.getContractFactory("BrainSafes");
const brainSafes = await BrainSafes.deploy();
await brainSafes.deployed();
```

## Registrar usuario
```js
await brainSafes.registerUser("Alice");
```

## Aplicar a beca
```js
await scholarshipManager.applyForScholarship("Data Science");
```

## Mint de NFT
```js
await certificateNFT.mint(user.address, "ipfs://metadata");
```

## Transferencia de tokens
```js
await eduToken.transfer(destino, 1000);
``` 