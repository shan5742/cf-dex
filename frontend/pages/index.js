import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { addLiquidity, calculateCF } from "../utils/addLiquidity";
import {
  getCFTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfCFTokens,
} from "../utils/getAmounts";
import {
  getTokensAfterRemove,
  removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [liquidityTab, setLiquidityTab] = useState(true);
  const zero = BigNumber.from(0);
  const [ethBalance, setEtherBalance] = useState(zero);
  const [reservedCF, setReservedCF] = useState(zero);
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  const [cfBalance, setCFBalance] = useState(zero);
  const [lpBalance, setLPBalance] = useState(zero);
  const [addEther, setAddEther] = useState(zero);
  const [addCFTokens, setAddCFTokens] = useState(zero);
  const [removeEther, setRemoveEther] = useState(zero);
  const [removeCF, setRemoveCF] = useState(zero);
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  const [swapAmount, setSwapAmount] = useState("");
  const [tokenToBeReceivedAfterSwap, setTokenToBeReceivedAfterSwap] =
    useState(zero);
  const [ethSelected, setEthSelected] = useState(true);
  const web3ModalRef = useRef();
  const [walletConnected, setWalletConnected] = useState(false);

  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const _ethBalance = await getEtherBalance(provider, address);
      const _cfBalance = await getCFTokensBalance(provider, address);
      const _lpBalance = await getLPTokensBalance(provider, address);
      const _reservedCF = await getReserveOfCFTokens(provider);
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEtherBalance(_ethBalance);
      setCFBalance(_cfBalance);
      setLPBalance(_lpBalance);
      setReservedCF(_reservedCF);
      setReservedCF(_reservedCF);
      setEtherBalanceContract(_ethBalanceContract);
    } catch (err) {
      console.error(err);
    }
  };

  /**** SWAP FUNCTIONS ****/
  const _swapTokens = async () => {
    try {
      const swapAmountWei = utils.parseEther(swapAmount);
      if (!swapAmountWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await swapTokens(
          signer,
          swapAmountWei,
          tokenToBeReceivedAfterSwap,
          ethSelected
        );
        setLoading(false);
        await getAmounts();
        setSwapAmount("");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setSwapAmount("");
    }
  };

  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
      if (!_swapAmountWEI.eq(zero)) {
        const provider = await getProviderOrSigner();
        const _ethBalance = await getEtherBalance(provider, null, true);
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          reservedCF
        );
        setTokenToBeReceivedAfterSwap(amountOfTokens);
      } else {
        setTokenToBeReceivedAfterSwap(zero);
      }
    } catch (err) {
      console.error(err);
    }
  };
  /*** END ***/

  /**** ADD LIQUIDITY FUNCTIONS ****/
  const _addLiquidity = async () => {
    try {
      const addEtherWei = utils.parseEther(addEther.toString());
      if (!addCFTokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await addLiquidity(signer, addCFTokens, addEtherWei);
        setLoading(false);
        setAddCFTokens(zero);
        await getAmounts();
      } else {
        setAddCFTokens(zero);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setAddCFTokens(zero);
    }
  };
  /**** END ****/

  /**** REMOVE LIQUIDITY FUNCTIONS ****/
  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemoveCF(zero);
      setRemoveEther(zero);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRemoveCF(zero);
      setRemoveEther(zero);
    }
  };

  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      const _ethBalance = await getEtherBalance(provider, null, true);
      const cryptoFrenchieTokenReserve = await getReserveOfCFTokens(provider);
      const { _removeEther, _removeCF } = await getTokensAfterRemove(
        provider,
        removeLPTokenWei,
        _ethBalance,
        cryptoFrenchieTokenReserve
      );
      setRemoveEther(_removeEther);
      setRemoveCF(_removeCF);
    } catch (err) {
      console.error(err);
    }
  };
  /**** END ****/

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }
  });

  /*
      renderButton: Returns a button based on the state of the dapp
  */
  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (liquidityTab) {
      return (
        <div>
          <div className={styles.description}>
            You have:
            <br />
            {utils.formatEther(cfBalance)} Crypto Frenchie Tokens
            <br />
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} Crypto Frenchie LP tokens
          </div>
          <div>
            {utils.parseEther(reservedCF.toString()).eq(zero) ? (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Amount of CryptoFrenchie tokens"
                  onChange={(e) =>
                    setAddCFTokens(
                      BigNumber.from(utils.parseEther(e.target.value || "0"))
                    )
                  }
                  className={styles.input}
                />
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    const _addCFTokens = await calculateCF(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedCF
                    );
                    setAddCFTokens(_addCFTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {`You will need ${utils.formatEther(
                    addCFTokens
                  )} Crypto Frenchie
                  Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
            <div>
              <input
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
                className={styles.input}
              />
              <div className={styles.inputDiv}>
                {`You will get ${utils.formatEther(removeCF)} Crypto
              Frenchie Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
            className={styles.input}
            value={swapAmount}
          />
          <select
            className={styles.select}
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option value="eth">Ethereum</option>
            <option value="cryptoFrenchieToken">Crypto Frenchie Token</option>
          </select>
          <br />
          <div className={styles.inputDiv}>
            {ethSelected
              ? `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Crypto Frenchie Tokens`
              : `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Eth`}
          </div>
          <button className={styles.button1} onClick={_swapTokens}>
            Swap
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Frenchies</title>
        <meta name="description" content="Exchange-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>
            Welcome to Crypto Frenchies Exchange!
          </h1>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; Crypto Frenchies Tokens
          </div>
          <div>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(!liquidityTab);
              }}
            >
              Liquidity
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodev.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Frenchies
      </footer>
    </div>
  );
}
