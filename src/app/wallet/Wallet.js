// near api js
import { providers } from "near-api-js";

// wallet selector
import { distinctUntilChanged, map } from "rxjs";
import "@near-wallet-selector/modal-ui/styles.css";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { wagmiConfig, web3Modal } from "@/app/wallet/web3modal";
import { setupEthereumWallets } from "@near-wallet-selector/ethereum-wallets";
import { NearRpcUrl } from "../config";

const THIRTY_TGAS = "30000000000000";
const NO_DEPOSIT = "0";

export class Wallet {
  /**
   * @constructor
   * @param {Object} options - the options for the wallet
   * @param {string} options.networkId - the network id to connect to
   * @param {string} options.createAccessKeyFor - the contract to create an access key for
   * @example
   * const wallet = new Wallet({ networkId: 'testnet', createAccessKeyFor: 'contractId' });
   * wallet.startUp((signedAccountId) => console.log(signedAccountId));
   */
  constructor({ networkId = "testnet", createAccessKeyFor = undefined }) {
    this.createAccessKeyFor = createAccessKeyFor;
    this.networkId = networkId;
    this.selector = null; // added this recently
  }

  /**
   * To be called when the website loads
   * @param {Function} accountChangeHook - a function that is called when the user signs in or out#
   * @returns {Promise<string>} - the accountId of the signed-in user
   */
  startUp = async (accountChangeHook) => {
    try {
      // Initialize the wallet selector
      this.selector = await setupWalletSelector({
        network: this.networkId,
        modules: [
          setupMyNearWallet(),
          setupHereWallet(),
          setupMeteorWallet(),
          setupEthereumWallets({
            wagmiConfig,
            web3Modal,
            alwaysOnboardDuringSignIn: true,
          }),
        ],
      });

      const walletSelector = await this.selector;
      const isSignedIn = walletSelector.isSignedIn();

      if (isSignedIn) {
        const accountId = walletSelector.store.getState().accounts[0].accountId;
        console.log("Account Signed In:", accountId);

        // Call the account change hook to update the signedAccountId
        accountChangeHook(accountId);
      }

      // Subscribe to account changes
      walletSelector.store.observable
        .pipe(
          map((state) => state.accounts),
          distinctUntilChanged()
        )
        .subscribe((accounts) => {
          const signedAccount = accounts.find(
            (account) => account.active
          )?.accountId;

          console.log("Active Account Changed:", signedAccount);
          accountChangeHook(signedAccount);
        });
    } catch (error) {
      console.error("Error during wallet startup:", error);
    }
  };

  /**
   * Displays a modal to login the user
   */
  signIn = async () => {
    try {
      // Ensure that selector is properly initialized
      if (!this.selector) {
        this.selector = await setupWalletSelector({
          network: this.networkId,
          modules: [setupMyNearWallet(), setupHereWallet()],
        });
      }

      // Ensure the selector is ready before proceeding
      if (this.selector) {
        const modal = setupModal(this.selector, {
          contractId: this.createAccessKeyFor,
        });
        modal.show();
      } else {
        console.error("Wallet selector is not initialized.");
      }
    } catch (error) {
      console.error("Error during signIn:", error);
    }
  };

  /**
   * Logout the user
   */
  signOut = async (accountChangeHook) => {
    const selectedWallet = await (await this.selector).wallet();
    selectedWallet.signOut();
  };
  /**
   * Makes a read-only call to a contract
   * @param {Object} options - the options for the call
   * @param {string} options.contractId - the contract's account id
   * @param {string} options.method - the method to call
   * @param {Object} options.args - the arguments to pass to the method
   * @returns {Promise<JSON.value>} - the result of the method call
   */
  viewMethod = async ({ contractId, method, args = {} }) => {
    const url = NearRpcUrl;
    const provider = new providers.JsonRpcProvider({ url });

    let res = await provider.query({
      request_type: "call_function",
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    });
    return JSON.parse(Buffer.from(res.result).toString());
  };

  /**
   * Makes a call to a contract
   * @param {Object} options - the options for the call
   * @param {string} options.contractId - the contract's account id
   * @param {string} options.method - the method to call
   * @param {Object} options.args - the arguments to pass to the method
   * @param {string} options.gas - the amount of gas to use
   * @param {string} options.deposit - the amount of yoctoNEAR to deposit
   * @returns {Promise<Transaction>} - the resulting transaction
   */
  callMethod = async ({
    contractId,
    method,
    args = {},
    gas = THIRTY_TGAS,
    deposit = NO_DEPOSIT,
  }) => {
    // Sign a transaction with the "FunctionCall" action
    const selectedWallet = await (await this.selector).wallet();
    const outcome = await selectedWallet.signAndSendTransaction({
      receiverId: contractId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: method,
            args,
            gas,
            deposit,
          },
        },
      ],
    });

    return providers.getTransactionLastResult(outcome);
  };

  /**
   * Retrieves transaction result from the network
   * @param {string} txhash - the transaction hash
   * @returns {Promise<JSON.value>} - the result of the transaction
   */
  getTransactionResult = async (txhash) => {
    const walletSelector = await this.selector;
    const { network } = walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    const transaction = await provider.txStatus(txhash, "unnused");
    return providers.getTransactionLastResult(transaction);
  };
}
