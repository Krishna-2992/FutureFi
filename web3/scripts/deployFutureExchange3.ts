import { ethers } from "hardhat";

async function main() {
  const [deployer, owner1, owner2, owner3] = await ethers.getSigners()

  const FuturesExchange = await ethers.getContractFactory('FutureExchange3') 
  const futuresExchange = await FuturesExchange.deploy(deployer.address, owner1.address)
  
  console.log('address is : ', futuresExchange)

  // const price = await futuresExchange.getPrice()
  // console.log(price)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
