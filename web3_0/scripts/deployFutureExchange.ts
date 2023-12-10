import { ethers } from "hardhat";

async function main() {
  const [deployer, owner1, owner2, owner3] = await ethers.getSigners()

  const USDCToken = await ethers.getContractFactory('USDCToken')
  const usdcToken = await USDCToken.deploy()

  const AvalanchePriceFeed = '0x86d67c3D38D2bCeE722E601025C25a575021c6EA'

  const FuturesExchange = await ethers.getContractFactory('FutureExchange') 
  const futuresExchange = await FuturesExchange.deploy(AvalanchePriceFeed, usdcToken.target)
  console.log('usdc address is', usdcToken)
  console.log('address is : ', futuresExchange)  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// 0x400b20DeBb06a46A990Fa8e7B65bD424E8274d15