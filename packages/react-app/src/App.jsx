//lets disable no unsed vars for now
//lets disable no undefined vars for now
//lets disable no restricted globals for now
//disable undefined functions
//disable unused vars

/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import { Button, Col, Menu, Row, Input, Modal } from "antd";

import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  // useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import "./App.css";
import {
  Account,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { getRPCPollTime, Transactor, Web3ModalSetup } from "./helpers";
import { Home, ExampleUI, Hints, Subgraph } from "./views";
import { useStaticJsonRPC, useGasPrice } from "./hooks";
import {
  authenticate,
  challenge,
  client,
  exploreProfiles,
  profileaddress,
  getPublications,
  createProfile,
  createPostTypedData,
  getProfile,
} from "./helpers/api.js";
import { LENS_ABI, LENS_HUB, MOCK_PROFILE_CREATOR_PROXY, NETWORK, HUB, PROXY } from "./constants";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.mumbai; // <------- select your target frontend network (localhost, goerli, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = true; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;
const web3Modal = Web3ModalSetup();
console.log(web3Modal, "yeet");

// 🛰 providers
const providers = ["https://rpc-mumbai.maticvigil.com/"];

function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = [initialNetwork.name, "mainnet", "goerli", "mumbai"];

  const [injectedProvider, setInjectedProvider] = useState();

  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const location = useLocation();
  const [address, setAddress] = useState();
  //lens consts

  const [token, setToken] = useState();
  const [profileId, setProfileId] = useState();
  const [user_selected_handle, setUser_selected_handle] = useState();
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalText, setModalText] = useState("Content of the modal");
  const [handle, setHandle] = useState();
  const [signer, setUserSigner] = useState();
  const [pubURI, setPubURI] = useState();

  const targetNetwork = NETWORKS[selectedNetwork];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);

  const mainnetProvider = useStaticJsonRPC(providers, localProvider);

  // Sensible pollTimes depending on the provider you are using
  const localProviderPollingTime = getRPCPollTime(localProvider);
  const mainnetProviderPollingTime = getRPCPollTime(mainnetProvider);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider, mainnetProviderPollingTime);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "FastGasPrice", localProviderPollingTime);
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
        setUserSigner(userSigner);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address, localProviderPollingTime);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address, mainnetProviderPollingTime);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  // useOnBlock(mainnetProvider, () => {
  //   console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  // });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(
    mainnetContracts,
    "DAI",
    "balanceOf",
    ["0x34aA3F359A9D614239015126635CE7732c18fDF3"],
    mainnetProviderPollingTime,
  );

  // keep track of a variable from the contract in the local React state:
  const purpose = useContractReader(readContracts, "YourContract", "purpose", [], localProviderPollingTime);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:", addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
    localChainId,
    myMainnetDAIBalance,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    //const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  async function Login() {
    try {
      // first request the challenge from the API server
      const challengeInfo = await client.query({
        query: challenge,
        variables: { address },
      });
      // ask the user to sign a message with the challenge info returned from the server

      const signature = await signer.signMessage(challengeInfo.data.challenge.text);
      console.log(address);
      // AUTHENTICATE THE USER
      const authData = await client.mutate({
        mutation: authenticate,
        variables: {
          address,
          signature,
        },
      });
      // if user authentication is successful, you will receive an accessToken and refreshToken
      const {
        data: {
          authenticate: { accessToken },
        },
      } = authData;
      console.log({ accessToken });
      setToken(accessToken);
    } catch (err) {
      console.log("Error signing in: ", err);
    }
  }

  const handleOk = () => {
    setModalText("The modal will be closed after two seconds");
    setConfirmLoading(true);
    createProfileRequest();
    setTimeout(() => {
      setOpen(false);
      setConfirmLoading(false);
    }, 2000);
  };
  const handleCancel = () => {
    console.log("Clicked cancel button");
    setUser_selected_handle();
    setOpen(false);
  };

  const handleChange = event => {
    setUser_selected_handle(event.target.value);
  };

  //try to create the profile for a given input handle, modal for your input will take in whatever you type and try to mint that handle
  async function createProfileRequest() {
    /*
    if (user_selected_handle === undefined) {
      setOpen(true);
      console.log("modal should open");
    } else {
      try {
        //we
        const request = {
          handle: `${user_selected_handle}`,
          profilePictureUri: null,
          followModule: null,
        };

        const createProfile_const = await client.mutate({
          //x-access-token header put in the request with your authentication token.
          context: {
            headers: {
              "x-access-token": token,
            },
          },

          mutation: createProfile,
          variables: {
            request,
          },
        });
        console.log("attempting to createprofile for: ", user_selected_handle);
        if ((await createProfile_const.data?.createProfile?.txHash) !== undefined) {
          console.log(
            "create profile successful:",
            `${request.handle}.test`,
            "created at txHash:",
            createProfile_const.data?.createProfile?.txHash,
          );
          setHandle(`${request.handle}.test`);
          console.log(handle);
          const Id = await lens_id.getProfileIdByHandle(`${handle}`);
          console.log(Id);
          const profileIds = `${ethers.utils.hexlify(Id)}`;
          setProfileId(profileIds);
          //convert ID to hex
          return createProfile_const;
        } else {
          console.log("create profile failed, try again!:", createProfile_const.data?.createProfile?.reason);
          setOpen(true);
        }
      } catch (err) {
        console.log("Error creating profile: ", err);
        setOpen(true);
      }
    }
    */
  }

  //lets make a post function via the contract ABI
  //describe the things happening below in comments

  //this is creating a post contract using ethers, LENS_HUB (address), the abi of the contract, and the localProvider
  const postContract = new ethers.Contract(LENS_HUB, [LENS_ABI?.children[1].children[30].abi], localProvider);
  //this is connecting the postContract to the user's signer
  const postContractWSigner = postContract.connect(userSigner);

  //this is creating a lens_id contract using ethers, LENS_HUB (address), the abi of the contract, and the localProvider
  const lens_id = new ethers.Contract(LENS_HUB, [LENS_ABI?.children[1].children[50].abi], localProvider);

  async function makePost() {
    /*
    console.log(handle);
    const Id = await lens_id.getProfileIdByHandle(`${handle}`);
    console.log(Id);
    //convert ID to hex
    const profileIds = `${ethers.utils.hexlify(Id)}`;
    setProfileId(profileIds);

    const contentURI = "https://ipfs.io/ipfs/Qmby8QocUU2sPZL46rZeMctAuF5nrCc7eR1PPkooCztWPz";
    const collectModule = "0x0BE6bD7092ee83D44a6eC1D949626FeE48caB30c";
    const collectModuleInitData = "0x0000000000000000000000000000000000000000000000000000000000000001";
    const referenceModule = "0x0000000000000000000000000000000000000000";
    const referenceModuleInitData = "0x00";

    const component = [
      profileId,
      contentURI,
      collectModule,
      collectModuleInitData,
      referenceModule,
      referenceModuleInitData,
    ];

    try {
      const makePost = await tx(postContractWSigner?.post(component));
      console.log(makePost);
    } catch (err) {
      console.log({ err });
    }
    */
  }

  //lets us collect and view posts if they exist - making a reader function based off abi just to show that you can do it without the api but it is tougher
  const lens_Pub = new ethers.Contract(LENS_HUB, [LENS_ABI?.children[1].children[49].abi], localProvider);
  console.log(lens_Pub);
  async function getPub() {
    const pub = await lens_Pub.getPub(await lens_id.getProfileIdByHandle(`${handle}`), "1");
    console.log(pub);
    setPubURI(pub.contentURI);
  }

  const [profile, setProfile] = useState();
  const [publications, setPublications] = useState([]);

  //this is a function that fetches the profile of the user and displays it in /profile

  async function fetchProfile() {
    try {
      console.log("userhandle", handle);
      /* fetch the user profile using their handle */
      const returnedProfile = await client.query({
        query: getProfile,
        variables: { handle: `${handle}` },
      });
      console.log(returnedProfile, "profile");
      const profileData = { ...returnedProfile.data.profile };
      /* format their picture if it is not in the right format */
      const picture = profileData.picture;
      if (picture && picture.original && picture.original.url) {
        if (picture.original.url.startsWith("ipfs://")) {
          let result = picture.original.url.substring(7, picture.original.url.length);
          profileData.avatarUrl = `http://lens.infura-ipfs.io/ipfs/${result}`;
        } else {
          profileData.avatarUrl = profileData.picture.original.url;
        }
      }
      setProfile(profileData);
      /* fetch the user's publications from the Lens API and set them in the state */
      console.log("trying for publications");
      const pubs = await client.query({
        query: getPublications,
        variables: {
          id: profileData?.id,
          limit: 50,
        },
      });
      console.log(pubs);
      setPublications(pubs?.data?.publications?.items);
    } catch (err) {
      console.log("error fetching profile...", err);
    }
  }

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header>
        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flex: 1 }}>
            {USE_NETWORK_SELECTOR && (
              <div style={{ marginRight: 20 }}>
                <NetworkSwitch
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                />
              </div>
            )}
            <Account
              useBurner={USE_BURNER_WALLET}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              mainnetProvider={mainnetProvider}
              price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
          </div>
        </div>
      </Header>
      {yourLocalBalance.lte(ethers.BigNumber.from("0")) && (
        <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
      )}
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />
      <Menu style={{ textAlign: "center", marginTop: 20 }} selectedKeys={[location.pathname]} mode="horizontal">
        <Menu.Item key="/">
          <Link to="/">App Home</Link>
        </Menu.Item>
        <Menu.Item key="/profile">
          <Link to="/profile">Your Lens Profile</Link>
        </Menu.Item>
        <Menu.Item key="/hints">
          <Link to="/hints">Hints</Link>
        </Menu.Item>
        <Menu.Item key="/exampleui">
          <Link to="/exampleui">ExampleUI</Link>
        </Menu.Item>
      </Menu>

      <Switch>
        <Route exact path="/">
          {/* pass in any web3 props to this Home component. For example, yourLocalBalance */}
          {/* if the user has connected their wallet but has not yet authenticated, show them a login button */}
          {address && handle ? (
            <h2>{handle}</h2>
          ) : (
            <div style={{ padding: 20 }} onClick={createProfileRequest}>
              <button>claimProfile</button>
            </div>
          )}

          <div style={{ padding: 5 }} onClick={makePost}>
            <button>post</button>
          </div>

          <Modal
            title="Choose your handle!"
            visible={open}
            onOk={handleOk}
            confirmLoading={confirmLoading}
            onCancel={handleCancel}
          >
            <Input
              style={{
                width: "calc(100% - 200px)",
              }}
              defaultValue=""
              onChange={handleChange}
              onCancel={handleCancel}
              onOk={createProfileRequest}
              destroyOnClose
              value={user_selected_handle}
            />
          </Modal>
        </Route>
        <Route exact path="/profile">
          {profile ? (
            //copy onclick
            <div style={{ padding: 5 }} className="pt-20 flex flex-col justify-center items-center">
              <img className="w-64 rounded-full" src={profile.avatarUrl} alt="Profile not Set" />
              <p className="text-4xl mt-8 mb-8">{profile.handle}</p>
              <p className="text-center text-xl font-bold mt-2 mb-2 w-1/2">{profile.bio}</p>
              {publications.map(pub => (
                <div style={{ padding: 6 }} key={pub.id} className="shadow p-10 rounded mb-8 w-2/3">
                  <p>{pub.metadata.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20 }} onClick={fetchProfile}>
              <button>go claim a handle</button>
            </div>
          )}
        </Route>
        <Route exact path="/debug">
          {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

          <Contract
            name="YourContract"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
        <Route path="/hints">
          <Hints
            address={address}
            yourLocalBalance={yourLocalBalance}
            mainnetProvider={mainnetProvider}
            price={price}
          />
        </Route>
        <Route path="/exampleui">
          <ExampleUI
            address={address}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            localProvider={localProvider}
            yourLocalBalance={yourLocalBalance}
            price={price}
            tx={tx}
            writeContracts={writeContracts}
            readContracts={readContracts}
            purpose={purpose}
          />
        </Route>
        <Route path="/mainnetdai">
          <Contract
            name="DAI"
            customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.DAI}
            signer={userSigner}
            provider={mainnetProvider}
            address={address}
            blockExplorer="https://etherscan.io/"
            contractConfig={contractConfig}
            chainId={1}
          />
          {/*
            <Contract
              name="UNI"
              customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.UNI}
              signer={userSigner}
              provider={mainnetProvider}
              address={address}
              blockExplorer="https://etherscan.io/"
            />
            */}
        </Route>
        <Route path="/subgraph">
          <Subgraph
            subgraphUri={props.subgraphUri}
            tx={tx}
            writeContracts={writeContracts}
            mainnetProvider={mainnetProvider}
          />
        </Route>
      </Switch>

      <ThemeSwitch />

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            {/* once the user has authenticated, show them a success message */}
            {address && token && <h2>Successfully signed in! </h2> && { token } ? (
              <h2>Successfully signed in! </h2>
            ) : (
              <div onClick={Login}>
                <button>login!</button>
              </div>
            )}
          </Col>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default App;
