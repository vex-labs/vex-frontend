export const steps = [
  {
    // selector: "body",
    position: "center",
    content: (
      <>
        <h2>What is betVEX?</h2>
        <p>
          betVEX is the Community Powered Esports Betting Platform. Bet on your
          favorite esports matches, compete against your friends, share the
          revenue the platform generates, and decide the future of betVEX.
        </p>
      </>
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
    selector: ".featured-games-section",
    position: "bottom",
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
];
