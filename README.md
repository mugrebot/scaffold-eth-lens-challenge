# 🏗 Scaffold-ETH + ▲ Next.js + Lens Developer Challenge 🌿

> Lets BUIDL on Lens! 🚀

![image](https://files.readme.io/c2459de-illustration_grow.svg)

🔍 What is Lens?

Lens Protocol is a decentralized social network that has a low carbon footprint and an established web3 team behind it. Each user retains ownership over their profile and the content they create.

[Learn more about Lens here!](https://docs.lens.xyz/docs/what-is-lens)

# 🏄‍♂️ Here we go!

Prerequisites: [Node](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

> clone/fork 🏗 scaffold-eth:

```bash
git clone https://github.com/mugrebot/scaffold-eth-lens-challenge
```

> checkout the `scaffold-nextjs` branch

```bash
cd scaffold-eth-lens-challenge
```

> install and start your 👷‍ Hardhat chain:

```bash
yarn install
yarn chain
```

> in a second terminal window, 🛰 deploy your contract (once you write them!):

```bash

yarn generate 

cd scaffold-eth-lens-challenge

yarn deploy
```

🔏 Edit your smart contract `YourContract.sol` in `packages/hardhat/contracts`

💼 Edit your deployment scripts in `packages/hardhat/deploy`

📱 Open http://localhost:3000 to see the app

# 📚 Lens API

In this challenge you'll use the [Lens API](https://docs.lens.xyz/docs/introduction) to fetch and render a social media feed, navigate to view an individual profile, and fetch and view the user's publications.

The Lens API can be tested at any time [here](https://api.lens.dev/) using any of the GraphQL queries [in the API docs.](https://docs.lens.xyz/docs/introduction)

> Watch this intro video by Nader Dabit on the Lens API.

[![Intro to Lens API](https://i.ytimg.com/vi/mIJKa2-2p8w/hqdefault.jpg)](https://youtu.be/mIJKa2-2p8w)

# 1. 👨🏻‍💻 Install dependancies

> First, change into the services directory and install these dependencies for the GraphQL client into the packages/services folder:

```bash
cd packages/services
yarn add @apollo/client graphql
```


> in a third terminal window, start your 📱 frontend:

```bash
cd ../../
yarn start
```

📝 You will edit your frontend `app.jsx` in `packages/react-app/src`

# 2. 🌐 Create the API

Creating a basic GraphQL API is simple, we can do it in just a couple of lines of code. We'll also define the first GraphQL query we'll be using in our app.

Create a new file named api.js in the packages/react-app/src/helpers and add the following code:

```
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

const API_URL = "https://api-mumbai.lens.dev";

/* create the API client */
export const client = new ApolloClient({
  uri: API_URL,
  cache: new InMemoryCache(),
});

export const authenticate = gql`
  mutation Authenticate($address: EthereumAddress!, $signature: Signature!) {
    authenticate(request: { address: $address, signature: $signature }) {
      accessToken
      refreshToken
    }
  }
`;

export const createProfile = gql`
  mutation createProfile($request: CreateProfileRequest!) {
    createProfile(request: $request) {
      ... on RelayerResult {
        txHash
      }
      ... on RelayError {
        reason
      }
      __typename
    }
  }
`;

The queries we've defined here will allow a user to authenticate (https://docs.lens.xyz/docs/authentication-quickstart), generating an authentication token that is required to perform other queries such as creating a profile, following other users, setting default handle, changing profile picture, etc. 

#3 Authentication 

we can now authenticate using the api, lets add the following code exists in to our app.jsx file, note that the imports should be near the other imports, the state variables with the other state variables, and the functions might be seperated along the app.jsx file as opposed to how you see them below!

```
import {
  authenticate,
  challenge,
  client,
  exploreProfiles,
  profileaddress,
  getPublications,
  createProfile,
} from "./helpers/api.js";


  //lens consts some of these will make more sense as we move along the challenge!
  const [address, setAddress] = useState();
  const [token, setToken] = useState();
  const [profileId, setProfileId] = useState();
  const [user_selected_handle, setUser_selected_handle] = useState();
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalText, setModalText] = useState("Content of the modal");
  const [handle, setHandle] = useState();
  const [signer, setUserSigner] = useState();

 async function Login() {
    try {
      /* first request the challenge from the API server */
      const challengeInfo = await client.query({
        query: challenge,
        variables: { address },
      });
      /* ask the user to sign a message with the challenge info returned from the server */

      const signature = await signer.signMessage(challengeInfo.data.challenge.text);
      console.log(address);
      /* authenticate the user */
      const authData = await client.mutate({
        mutation: authenticate,
        variables: {
          address,
          signature,
        },
      });
      /* if user authentication is successful, you will receive an accessToken and refreshToken */
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

  # 4. 😎 Claiming a handle!

  So far we should be able to "login" and receive an authentication token, it'll be up to you to create the query on app.jsx 

  Since passing something as a header isn't included in the authentication step, we will give that first part to you - write the rest!

  ```
  async function createProfileRequest() {
    if (user_selected_handle === undefined) {
      setOpen(true);
      console.log("modal should open");
    } else {
      try {
        //lets package the request we are going to make! it requires a handle that the user will select via modal, profilePictureUri: null, followModule: null, 
        const request = {
          handle: `${user_selected_handle}`,
          profilePictureUri: null,
          followModule: null,
        };

//this part will model the authentication query
        const createProfile_const = await client.mutate({
          //x-access-token header puts in the request with your authentication token.
          context: {
            headers: {
              "x-access-token": token,
            },
          },

          mutation: /*what mutation do we need to create a profile?*/,
          variables: {
            /* what variable(s) to we need?*/,
          },
        });
        console.log("attempting to createprofile for: ", user_selected_handle);
        if ((/* what does this query return on success? */) != undefined) {
          console.log(
            "create profile successful:",
            `${request.handle}.test`,
            "created at txHash:",
            /* what does this query return on success? */,
          );
          setHandle(`${request.handle}.test`);
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
  }
  ```

### 🎉 Congratulations! You've built your first Lens application!

# 6. 🚀 Lets bundle up our app and Ship it!

First, we need to optimize our build before we deploy it to

```
yarn build
```

Use a file storage like IPFS or Surge to ship your app!

```
yarn surge
```

# 📚 Additional Resources

Documentation, tutorials, challenges, and many more resources, visit: [docs.scaffoldeth.io](https://docs.scaffoldeth.io)

# 🔭 Learning Solidity

📕 Read the docs: https://docs.soliditylang.org

📚 Go through each topic from [solidity by example](https://solidity-by-example.org) editing `YourContract.sol` in **🏗 scaffold-eth**

- [Primitive Data Types](https://solidity-by-example.org/primitives/)
- [Mappings](https://solidity-by-example.org/mapping/)
- [Structs](https://solidity-by-example.org/structs/)
- [Modifiers](https://solidity-by-example.org/function-modifier/)
- [Events](https://solidity-by-example.org/events/)
- [Inheritance](https://solidity-by-example.org/inheritance/)
- [Payable](https://solidity-by-example.org/payable/)
- [Fallback](https://solidity-by-example.org/fallback/)

📧 Learn the [Solidity globals and units](https://solidity.readthedocs.io/en/v0.6.6/units-and-global-variables.html)

# 💬 Support Chat

Join the telegram [support chat 💬](https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA) to ask questions and find others building with 🏗 scaffold-eth!

---

🙏 Please check out our [Gitcoin grant](https://gitcoin.co/grants/2851/scaffold-eth) too!

