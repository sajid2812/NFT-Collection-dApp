const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

const {
  WHITELIST_CONTRACT_ADDRESS,
  METADATA_URL,
} = require("../constants/index");

async function main() {
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  const metadataURL = METADATA_URL;

  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");
  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadataURL,
    whitelistContract
  );

  await deployedCryptoDevsContract.deployed();

  console.log(
    "Crypto Devs Contract Address: ",
    deployedCryptoDevsContract.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// Crypto Dev Contract Address : 0xC0F3eb3101EbFA30Aa46082671De83ca41BD17e1
