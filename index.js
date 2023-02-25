import Web3 from "web3";
import { createRequire } from "module";
import { CONFIG } from "./config.js";

const require = createRequire(import.meta.url);
const abi = require("./abi.json");

const { contractAddress, RPC, accounts, weiCost } = CONFIG;
const web3 = new Web3(new Web3.providers.HttpProvider(RPC));
const contract = new web3.eth.Contract(abi, contractAddress);

async function mintNFT(publicKey, privateKey, amountToMint) {
  const nonce = await web3.eth.getTransactionCount(publicKey, "latest");
  const gasAmount = await contract.methods
    .mint(amountToMint)
    .estimateGas({ from: publicKey, gas: 500000, value: weiCost });
  const gasMargin = Math.round(gasAmount * 0.2);

  const tx = {
    from: publicKey,
    to: contractAddress,
    nonce: nonce,
    gas: gasAmount + gasMargin,
    value: weiCost,
    maxPriorityFeePerGas: 2999999987,
    data: contract.methods.mint(amountToMint).encodeABI(),
    // "mint" is the function name to mint a nft in this contract!
    // if your contract has a different function for minting, change it to it's name
  };

  const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
  await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

  console.log(
    `Account ${publicKey} minted ${amountToMint} NFTs from ${CONFIG.contractAddress}`
  );
}

accounts.forEach(async (account) => {
  const { publicKey, privateKey, amountToMint } = account;

  try {
    await mintNFT(publicKey, privateKey, amountToMint);
  } catch (error) {
    console.log(
      `Something went wrong, it was not possible to mint from ${publicKey}`
    );
    console.log(error);
  }
});
