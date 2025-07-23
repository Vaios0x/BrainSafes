# API Principal de Contratos BrainSafes

## BrainSafes (Core)
- `registerUser(string name)`
- `enrollCourse(uint256 courseId)`
- `completeCourse(uint256 courseId)`
- `mintCertificate(address user, string metadata)`
- `applyForScholarship(string program)`
- `getUserInfo(address user)`

## ScholarshipManager
- `applyForScholarship(string program)`
- `getApplicationStatus(address user)`
- `disburseScholarship(address user, uint256 amount)`

## JobMarketplace
- `postJob(string title, uint256 reward)`
- `applyForJob(uint256 jobId, string cv)`
- `hireApplicant(uint256 jobId, address applicant)`

## CertificateNFT
- `mint(address to, string metadata)`
- `ownerOf(uint256 tokenId)`
- `verifyCertificate(uint256 tokenId)`

## EDUToken
- `mint(address to, uint256 amount)`
- `burn(uint256 amount)`
- `transfer(address to, uint256 amount)`

## Ejemplo de uso (Hardhat)
```js
const tx = await brainSafes.registerUser("Alice");
await tx.wait();
``` 