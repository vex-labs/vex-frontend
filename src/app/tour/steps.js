import { X } from "lucide-react";

export const steps = [
  {
    // selector: "main",
    position: "center",
    disableActions: false,
    content: ({ setIsOpen, setCurrentStep }) => (
      <div className="relative">
        <button
          className="close-tour-button"
          onClick={() => {
            setCurrentStep(0);
            setIsOpen(false);
          }}
        >
          <X />
        </button>
        <h2>What is betVEX?</h2>
        <p>
          betVEX is the Community Powered Esports Betting Platform. Bet on your
          favorite esports matches, compete against your friends, share the
          revenue the platform generates, and decide the future of betVEX.
        </p>

        <button
          onClick={() => {
            setCurrentStep(1);
          }}
          className="start-tour-button"
        >
          Start Learning
        </button>
      </div>
    ),
  },
  {
    selector: ".login-button",
    position: "bottom",
    disableActions: true,
    content: (
      <>
        <h2>How to sign up/log in?</h2>
        <p>To sign up or log in click the login button.</p>
      </>
    ),
  },
  {
    selector: ".vex-email-form",
    position: "top",
    content: (
      <>
        <h2>How to sign up/log in?</h2>
        <p>
          Create a new account with an existing email address, google account,
          discord account, twitter account, or wallet. When you first sign up
          you&apos;ll need to select a username
        </p>
      </>
    ),
  },
  {
    selector: ".nav-link-deposit",
    position: "bottom",
    content: (
      <>
        <h2>How to deposit funds?</h2>
        <p>
          Click the deposit button which will allow you to deposit from your
          bank or debit card.
        </p>
      </>
    ),
  },
  {
    selector: "#deposit-modal",
    position: "left",
    mutationObservables: ["#deposit-modal"],
    content: (
      <>
        <h2>How to deposit funds?</h2>
        <p>
          This will convert to digital dollars ($USDC) that are used to bet.
          Alternatively, you can deposit any cryptocurrency which will be
          converted to $USDC to place bets
        </p>
      </>
    ),
  },
  {
    selector: "#sidebar-game-list",
    position: "right",
    content: (
      <>
        <h2>How to place a bet?</h2>
        <p>To place a bet first navigate to your desired game</p>
      </>
    ),
  },
  {
    selector: "#tour-match",
    mutationObservables: [".featured-grid-container"],
    position: "right",
    content: (
      <>
        <h2>How to place a bet?</h2>
        <p>Select which match and team you would like to bet on</p>
      </>
    ),
  },
  {
    selector: ".betting-modal-content",
    position: "left",
    mutationObservables: [".betting-modal"],
    content: (
      <>
        <h2>How to place a bet?</h2>
        <p>
          Enter the amount you would like to bet and click the place bet button.
          betVEX only charges approximately 5% fees, much lower than other
          esports betting platforms, with all the fees being sent back to the
          community.
        </p>
      </>
    ),
  },
  {
    selector: ".nav-item.bets",
    position: "right",
    content: (
      <>
        <h2>How to claim a bet?</h2>
        <p>
          Navigating to the bets page will show you all the bets you&apos;ve
          placed, past and present.
        </p>
      </>
    ),
  },
  {
    selector: ".winning-bet",
    position: "left",
    mutationObservables: [".winning-bet"],
    content: (
      <>
        <h2>How to claim a bet?</h2>
        <p>
          Any successful bets will be highlighted and you can claim your
          winnings by just simply clicking claim bet.
        </p>
      </>
    ),
  },
  {
    position: "center",
    content: ({ setCurrentStep }) => (
      <div className="relative">
        <h2>What are VEX Rewards?</h2>
        <p>
          VEX Rewards enable the community-powered nature of betVEX. With VEX
          Rewards you are able to share in the revenue that the platform
          generates and decide how the platform changes in the future. 70% of
          the revenue betVEX generates is distributed to those who have
          activated their VEX Rewards. The other 30% is sent to the treasury for
          the community to collectively spend.
        </p>
        <button
          onClick={() => {
            setCurrentStep(11);
          }}
          className="start-tour-button"
        >
          Next Step
        </button>
      </div>
    ),
  },
  {
    selector: ".swap-container",
    position: "right",
    mutationObservables: [".swap-container"],
    content: () => {
      return (
        <>
          <h2>How to buy/sell VEX Rewards</h2>
          <p>
            To buy VEX Rewards, enter how much you would like to buy, this will
            display the cost in dollars, and once buy is clicked it will charge
            your account. The value of VEX Rewards is determined by the market
            and its price will fluctuate over time depending on market
            conditions. You can sell your VEX Rewards by clicking the sell
            option. Here you input how much of your $VEX rewards you want to
            sell and a dollar amount will be displayed at what you can sell it
            for.
          </p>
        </>
      );
    },
  },
  {
    selector: ".staking-container",
    position: "left",
    content: () => {
      return (
        <>
          <h2>How to activate VEX Rewards</h2>
          <p>
            By activating VEX Rewards, you provide funds to back platform bets.
            70% of all betting revenue is distributed proportionally to VEX
            Rewards activators—the more you activate, the more you earn. You can
            increase your activation anytime.
            <br />
            In rare cases, betting markets may cause losses to activated
            rewards, though we expect a 5% return per market. When you&apos;re
            done collecting rewards, you can deactivate to stop earning and
            eliminate loss risk. Note: Deactivation is only possible 1 week
            after your last activation to ensure activators properly back bets.
          </p>
        </>
      );
    },
  },
  {
    selector: ".rewards-distribution-container",
    position: "left",
    content: ({ setCurrentStep }) => (
      <>
        <h2>Distributing VEX Rewards</h2>
        <p>
          You, the community, help betVEX run. When VEX Rewards accumulated from
          matches build up above a certain threshold they are ready to be
          distributed to the community. If you ever see the distribute VEX
          Rewards button highlighted, click it to send out the rewards, and you
          will receive 1% of the total rewards just for clicking the button!
        </p>
        <button
          onClick={() => {
            setCurrentStep(14);
          }}
          className="start-tour-button"
        >
          Next Step
        </button>
      </>
    ),
  },
  {
    posistion: "center",
    selector: "community-content",
    mutationObservables: [".community-content"],
    content: ({ setCurrentStep }) => (
      <>
        <h2>Community</h2>
        <p>
          You can not only use VEX Rewards to earn but they are also used to
          decide the future of betVEX. As a community member, you can make
          proposals to add new features, change how the platform operates, or
          decide how to spend the treasury funds. As a VEX Rewards holder, you
          can vote on proposals, the proposal&apos;s outcome will be decided by
          the option with the highest VEX Rewards in votes. Example proposal
          titles may include:
          <ul>
            <li>Become a sponsor of Fnatic.</li>
            <li>Reduce betting fees to 3%.</li>
            <li>
              Spend one million dollars of the betVEX treasury on building
              schools in South Sudan.
            </li>
          </ul>
        </p>
        <button
          onClick={() => {
            setCurrentStep(15);
          }}
          className="start-tour-button"
        >
          Next Step
        </button>
      </>
    ),
  },
  {
    posistion: "center",
    selector: ".leaderboard-content",
    mutationObservables: [".leaderboard-content"],
    content: ({ setCurrentStep, setIsOpen }) => (
      <>
        <h2>Leaderboard</h2>
        <p>
          In betVEX&apos;s competitive nature we pit bettors against each other.
          The leaderboard ranks the all-time highest earners and those who have
          won the most bets. You can choose to click the friends option where
          you can add your friend&apos;s user names to track who is the best
          bettor. You can choose to not appear in the leaderboard by going to
          user settings.
        </p>
        <button
          onClick={() => {
            setIsOpen(false);
            setCurrentStep(0);
          }}
          className="start-tour-button"
        >
          Finish Tour
        </button>
      </>
    ),
  },
];
