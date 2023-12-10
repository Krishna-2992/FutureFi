const {ethers} = require('hardhat')

async function main() {
  const USDCToken = await ethers.getContractFactory('USDCToken')
  const usdcToken = await USDCToken.deploy()

  const AvalanchePriceFeed = '0x86d67c3D38D2bCeE722E601025C25a575021c6EA'

  const FuturesExchange = await ethers.getContractFactory('FutureExchange') 
  const futuresExchange = await FuturesExchange.deploy(AvalanchePriceFeed, usdcToken.target)
  console.log('usdc address is', usdcToken.target)
  console.log('address is : ', futuresExchange.target)  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});