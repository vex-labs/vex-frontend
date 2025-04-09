# Betvex Frontend

Frontend for BetVex decentralised betting platform on [Near blockchain](https://near.org/) using [Next.js](https://nextjs.org/).
This application acts as a frontend to the BetVex smart contract while implementing additional features.

You need to add a public file with images for the site + teams and games

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Main Pages](#main-pages)
- [Third-Party APIs](#third-party-apis)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Learn More](#learn-more)

## Getting Started

```bash
git clone https://github.com/vex-labs/vex-frontend.git
```

Install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

## Project Structure

```plaintext
.
├── .env
├── jsconfig.json
├── next.config.mjs
├── package.json
├── public/
│   └── icons/
├── README.md
├── src/
│   ├── app/
│   │   ├── context/
│   │   │   ├── GlobalContext.js
│   │   │   └── NearContext.js
│   │   ├── earn/
│   │   │   ├── earn.css
│   │   │   └── page.js
│   │   ├── community/
│   │   │   └── page.js
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── user/
│   │   │   ├── page.js
│   │   │   └── user.css
│   │   ├── wallet/
│   │   │   └── Wallet.js
│   │   └── globals.css
│   ├── components/
│   │   ├── Faq.js
│   │   ├── FeaturedGames.js
│   │   ├── GameCard.js
│   │   ├── NavBar.js
│   │   ├── Sidebar.js
│   │   ├── Sidebar2.js
│   │   ├── Stake.js
│   │   ├── Swap.js
│   │   ├── UpcomingGames.js
│   │   ├── UserBets.js
│   │   └── VexLoginPrompt.js
│   ├── utils/
│   │   ├── accountHandler.js
│   │   ├── fetchMatches.js
│   │   ├── placebet.js
│   │   ├── swapTokens.js
│   │   └── swapTokensWithVexLogin.js
│   └── config.js

```

## Main Pages

- **Betting Page**: Displays the main dashboard with upcoming games and betting options.
- **Earn Page**: Allows users Swap tokens and to stake and unstake their tokens.
- **Community Page**: TBC.
- **View Bets Page**: Shows the user's bets and allows them to claim winnings.

## Third-Party APIs

- **NEAR Protocol**: Used for blockchain interactions and transactions.
- **RefSwap**: Used for swapping between VEX and USDC tokens.
- **NEAR Wallet connector**: used to connect external wallets
- **Relayer**: Used to handle accounts created with login with vex

## Configuration

Create a `.env.local` file in the root directory and add the following environment variables:

```plaintext
RELAYER_ACCOUNT_ID='username.testnet'
RELAYER_PRIVATE_KEY='ed25519:'
NEAR_NETWORK='testnet'
```

## Running the Project

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js and NEAR Protocol, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - An interactive Next.js tutorial.
- [NEAR Protocol Documentation](https://docs.near.org/) - Learn about NEAR Protocol and its features.
- [NEAR API JS](https://github.com/near/near-api-js) - JavaScript library for interacting with NEAR Protocol.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) and [the NEAR Protocol GitHub repository](https://github.com/near/nearcore) for more information.
