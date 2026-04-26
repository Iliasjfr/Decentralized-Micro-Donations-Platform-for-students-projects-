/**
 * migrations/2_deploy_donation.js
 *
 * Deploys Donation.sol after MicroDons (Project.sol) is already on-chain.
 * Reads the Project contract address from the previously deployed artifact.
 *
 * Run AFTER Person A has deployed Project.sol:
 *   truffle migrate --network development --f 2 --to 2
 */

const Donation = artifacts.require("Donation");
const Project = artifacts.require("Project"); // Person A's contract artifact

module.exports = async function (deployer, network, accounts) {
  // Grab the already-deployed MicroDons instance
  const projectInstance = await Project.deployed();
  const projectAddress = projectInstance.address;

  console.log(`\n📋 Project (Project) deployed at: ${projectAddress}`);
  console.log(`🚀 Deploying Donation contract...\n`);

  await deployer.deploy(Donation, projectAddress);

  const donationInstance = await Donation.deployed();
  console.log(`✅ Donation deployed at: ${donationInstance.address}`);
  console.log(`\n📝 Add to your .env file:`);
  console.log(`   REACT_APP_PROJECT_CONTRACT=${projectAddress}`);
  console.log(`   REACT_APP_DONATION_CONTRACT=${donationInstance.address}\n`);
};
