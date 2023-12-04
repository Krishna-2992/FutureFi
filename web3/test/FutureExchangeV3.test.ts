import { expect } from 'chai';
import { ethers } from 'ethers';
import { FutureExchange } from '../contracts/FutureExchange';

describe('FutureExchange', () => {
  it('should create a trader account', async () => {
    const provider = new ethers.providers.Web3Provider('http://localhost:8545');
    const signer = provider.getSigner();

    const factory = new ethers.ContractFactory(FutureExchange.abi, FutureExchange.bytecode, signer);
    const contract = await factory.deploy();
    await contract.deployTransaction.wait();

    const traderAccount = await contract.createTraderAccount();
    await traderAccount.wait();

    expect(await contract.isTrader(signer.address)).to.equal(true);
  });
});