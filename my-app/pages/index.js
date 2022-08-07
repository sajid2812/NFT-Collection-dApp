import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";
export default function Home() {
  const [isOwner, setIsOwner] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numTokensMinted, setNumTokensMinted] = useState("");
  const web3ModalRef = useRef();

  const getNumMintedTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const numTokenIds = await nftContract.tokenIds();
      setNumTokensMinted(numTokenIds.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const presaleMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
      await txn.wait();

      window.alert("You successfully minted a CryptoDev!");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const publicMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const txn = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });

      await txn.wait();

      window.alert("You successfully minted a CryptoDev!");
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };
  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const startPresale = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      if (!presaleStarted) {
        const txn = await nftContract.startPresale();
        await txn.wait();

        setPresaleStarted(true);
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const presaleEndTime = await nftContract.presaleEnded();

      const hasPresaleEnded = presaleEndTime.lt(Math.floor(Date.now() / 1000));

      setPresaleEnded(hasPresaleEnded);
      return hasPresaleEnded;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);
      return isPresaleStarted;
    } catch (error) {
      console.error(error);
      return false;
    }
  };
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please switch to the Rinkeby network");
      throw new Error("Incorrect Network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const onPageLoad = () => {
    connectWallet();
    getOwner();
    const presaleStarted = checkIfPresaleStarted();
    if (presaleStarted) {
      checkIfPresaleEnded();
    }

    getNumMintedTokens();

    // track in real time the number of minted NFTs

    setInterval(async () => {
      await getNumMintedTokens();
    }, 5 * 1000);

    //track in real time the status of presale (started, ended, ongoing)
    const presaleEndedInterval = setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        const presaleEnded = await checkIfPresaleEnded();
        if (presaleEnded) {
          clearInterval(presaleEndedInterval);
        }
      }
    }, 5 * 1000);
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      onPageLoad();
    }
  }, [walletConnected]);

  function renderBody() {
    if (!walletConnected) {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Connect your Wallet
        </button>
      );
    }

    if (loading) {
      return <span className={styles.description}>Loading...</span>;
    }

    if (isOwner && !presaleStarted) {
      // render a button to start the presale

      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );
    }

    if (!presaleStarted) {
      // come back later
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet, Come back later!
          </span>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      // allow to mint in presale
      // whitlisted only
      return (
        <div>
          <span className={styles.description}>
            Presale has started! If your address is whitelisted, you can mint a
            CryptoDev!
          </span>
          <br></br>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if (presaleStarted && presaleEnded) {
      // allow to take part in public sale
      return (
        <div>
          <span className={styles.description}>
            Presale has ended! You can mint a CryptoDev in public sale, if any
            remain.
          </span>
          <br></br>

          <button className={styles.button} onClick={publicMint}>
            Public Mint 🚀
          </button>
        </div>
      );
    }
  }
  return (
    <div>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>

      <div className={styles.main}>
        <div className={styles.info}>
          <h1 className={styles.title}>Welcome to CryptoDevs NFT</h1>
          <div className={styles.description}>
            CryptoDevs NFT is a collection for developers in web3
          </div>
          <div className={styles.description}>
            {numTokensMinted}/20 have been minted already!
          </div>

          {renderBody()}
        </div>
        <img className={styles.image} src="/cryptodevs/0.svg"></img>
      </div>
    </div>
  );
}
