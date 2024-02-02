const { ethers } = require('ethers');

const RPC_URL = "RPC_URL";
const PRIVATE_KEY = "PRIVATE_KEY";

async function sendTransaction() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        const recipientAddress = "ACCOUNT";
        const value = ethers.parseEther("0.001");

        const tx = {
            to: recipientAddress,
            value: value,
        };

        const txResponse = await wallet.sendTransaction(tx);
        const receipt = await txResponse.wait();

        console.log("Transaction hash:", txResponse.hash);
        console.log("Transaction receipt:", receipt);

        return `Transaction Confirmed. Hash: ${txResponse.hash}`;
    } catch (error) {
        console.error('Error connecting to Ethereum:', error.message);
    }
}

module.exports = {
    sendTransaction
};
