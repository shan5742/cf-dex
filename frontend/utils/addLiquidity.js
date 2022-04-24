import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

export const addLiquidity = async (
  signer,
  addCFAmountWei,
  addEtherAmountWei
) => {
  try {
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer
    );
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );
    let tx = await tokenContract.approve(
      EXCHANGE_CONTRACT_ADDRESS,
      addCFAmountWei.toString()
    );
    await tx.wait();
    tx = await exchangeContract.addLiquidity(addCFAmountWei, {
      value: addEtherAmountWei,
    });
    await tx.wait();
  } catch (err) {
    console.error(err);
  }
};

export const calculateCF = async (
  _addEther = "0",
  etherBalanceContract,
  cfTokenReserve
) => {
  const _addEtherAmountWei = utils.parseEther(_addEther);
  const cryptoFrenchieTokenAmount = _addEtherAmountWei
    .mul(cfTokenReserve)
    .div(etherBalanceContract);
  return cryptoFrenchieTokenAmount;
};
