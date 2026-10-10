const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("  BlockVerify - Ethereum Sepolia Deployer");
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer ? deployer.address : "Default Deployer");

  const BlockVerify = await hre.ethers.getContractFactory("BlockVerify");
  const blockVerify = await BlockVerify.deploy();
  await blockVerify.waitForDeployment();

  const contractAddress = await blockVerify.getAddress();
  console.log("✅ BlockVerify successfully deployed to Sepolia!");
  console.log("📄 Contract Address:", contractAddress);
  console.log("🔍 Sepolia Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);

  // Write deployment output to config file
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contractAddress: contractAddress,
    deployer: deployer ? deployer.address : "",
    deployedAt: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, "..", "contracts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outputDir, "deployed-contract.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Saved deployed contract info to contracts/deployed-contract.json");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
