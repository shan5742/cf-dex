import { Contract, providers, utils, BigNumber } from "ethers";
import { EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS } from "../constants";

export const removeLiquidity = async (signer, removeLPTokensWei) => {
  const exchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    signer
  );
  const tx = await exchangeContract.removeLiquidity(removeLPTokensWei);
  await tx.wait();
};

export const getTokensAfterRemove = async (
  provider,
  removeLPTokenWei,
  _ethBalance,
  cryptoFrenchieTokenReserve
) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const _totalSupply = await exchangeContract.totalSupply();
    // Here we are using the Bignumber methods of multiplication and division
    // The amount of ether that would be sent back to the user after he withdraws the LP token
    // id calculated based on a ratio,
    // Ratio is -> (amount of ether that would be sent back to the user/ Eth reserves) = (LP tokens withdrawn)/(Total supply of LP tokens)
    // By some maths we get -> (amount of ether that would be sent back to the user) = (Eth Reserve * LP tokens withdrawn)/(Total supply of LP tokens)
    // Similariy we also maintain a ratio for the `CD` tokens, so here in our case
    // Ratio is -> (amount of CD tokens sent back to the user/ CD Token reserve) = (LP tokens withdrawn)/(Total supply of LP tokens)
    // Then (amount of CD tokens sent back to the user) = (CD token reserve * LP tokens withdrawn)/(Total supply of LP tokens)
    const _removeEther = _ethBalance.mul(removeLPTokenWei).div(_totalSupply);
    const _removeCF = cryptoFrenchieTokenReserve
      .mul(removeLPTokenWei)
      .div(_totalSupply);
    return {
      _removeEther,
      _removeCF,
    };
  } catch (err) {
    console.error(err);
  }
};
