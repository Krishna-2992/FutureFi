const {ethers} = require('hardhat')

async function main() {
    const Counter = await ethers.getContractFactory('SimpleCounter')
    const counter = await Counter.deploy()

    console.log(counter);
}

main().catch((err)=>{
    console.log('error: ', err)
})