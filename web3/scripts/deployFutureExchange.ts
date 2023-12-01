import { ethers } from "hardhat";


async function main() {
  const FuturesExchange = await ethers.getContractFactory('FuturesExchange') 
  const futuresExchange = await FuturesExchange.deploy()
  
  console.log('address is : ', futuresExchange)

  const price = await futuresExchange.getPrice()
  console.log(price)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
