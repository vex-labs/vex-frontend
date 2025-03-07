import React, { useState } from "react";
import { useNear } from "@/app/context/NearContext";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";
import "./LoginModal.css";
import { useTour } from "@reactour/tour";

export const LoginModal = ({ isOpen, onClose, onLoginWithProvider }) => {
  const { wallet } = useNear();
  const { web3auth } = useWeb3Auth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { currentStep, setCurrentStep } = useTour();

  if (!isOpen) return null;
  if (!web3auth) return null;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    if (currentStep === 2) {
      setCurrentStep(3);
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await onLoginWithProvider("email_passwordless", { login_hint: email });
      onClose();
    } catch (error) {
      console.error("Email login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vex-modal">
      <div className="vex-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="vex-modal-header">
          <h3>Log in to your account</h3>
          <button
            type="button"
            className="vex-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="vex-modal-body">
          <div className="vex-login-section">
            <h6 className="vex-section-title">Social Login</h6>
            {/* Google Login - Large Button */}
            <button
              className="vex-btn vex-btn-google vex-btn-lg"
              onClick={() => {
                onLoginWithProvider("google");
                onClose();
              }}
            >
              <svg className="vex-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Social Logins Grid */}
            <div className="vex-social-grid">
              <div className="vex-social-col">
                <button
                  className="vex-btn vex-btn-discord"
                  onClick={() => {
                    onLoginWithProvider("discord");
                    onClose();
                  }}
                >
                  <svg className="vex-icon" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"
                    />
                  </svg>
                  <span>Discord</span>
                </button>
              </div>
              <div className="vex-social-col">
                <button
                  className="vex-btn vex-btn-twitter"
                  onClick={() => {
                    onLoginWithProvider("twitter");
                    onClose();
                  }}
                >
                  <svg className="vex-icon" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    />
                  </svg>
                  <span>Twitter</span>
                </button>
              </div>
              <div className="vex-social-col">
                <button
                  className="vex-btn vex-btn-reddit"
                  onClick={() => {
                    onLoginWithProvider("reddit");
                    onClose();
                  }}
                >
                  <svg className="vex-icon" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
                    />
                  </svg>
                  <span>Reddit</span>
                </button>
              </div>
              <div className="vex-social-col">
                <button
                  className="vex-btn vex-btn-twitch"
                  onClick={() => {
                    onLoginWithProvider("twitch");
                    onClose();
                  }}
                >
                  <svg className="vex-icon" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"
                    />
                  </svg>
                  <span>Twitch</span>
                </button>
              </div>
              <div className="vex-social-col">
                <button
                  className="vex-btn vex-btn-apple"
                  onClick={() => {
                    onLoginWithProvider("apple");
                    onClose();
                  }}
                >
                  <svg className="vex-icon" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.38C2.7 15.55 3.24 7.8 8.27 7.45c1.44.06 2.38.75 3.15.75.77 0 1.97-.75 3.8-.64 6.15.5 7.67 8.88 1.83 12.72zm-5.5-19.4a4.8 4.8 0 0 1-3.8 1.96c-.42-1.96 1.29-4 2.96-4.67 1.8-.73 3.74-.4 4.12 1.54-2.8.14-3.43 1.25-3.29 1.16z"
                    />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
              <div className="vex-social-col">
                <button
                  className="vex-btn vex-btn-facebook"
                  onClick={() => {
                    onLoginWithProvider("facebook");
                    onClose();
                  }}
                >
                  <svg className="vex-icon" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>
            </div>

            {/* Divider before Email Section */}
            <div className="vex-divider">
              <div className="vex-divider-line"></div>
              <div className="vex-divider-text">or</div>
              <div className="vex-divider-line"></div>
            </div>

            {/* Email Section */}
            <h6 className="vex-section-title">Email Login</h6>
            <form onSubmit={handleEmailLogin} className="vex-email-form">
              <div className="vex-form-group">
                <input
                  type="email"
                  className="vex-form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="vex-btn vex-btn-primary vex-btn-full"
                disabled={isLoading}
              >
                <svg className="vex-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.7l-8 5.334L4 8.7V6.297l8 5.333 8-5.333V8.7z"
                  />
                </svg>
                {isLoading ? "Sending..." : "Continue with Email"}
              </button>
            </form>
            {/* Wallet Section - Kept at bottom */}
            <div className="vex-divider">
              <div className="vex-divider-line"></div>
              <div className="vex-divider-text">or</div>
              <div className="vex-divider-line"></div>
            </div>

            <div>
              <h6 className="vex-section-title">Wallet Login</h6>
              <button
                className="vex-btn vex-btn-wallet vex-btn-lg"
                onClick={() => {
                  wallet?.signIn();
                  onClose();
                }}
              >
                <svg className="vex-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M18 4H6C3.79 4 2 5.79 2 8v8c0 2.21 1.79 4 4 4h12c2.21 0 4-1.79 4-4v-1h-4c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2h4V8c0-2.21-1.79-4-4-4zm0 10h-4v-2h4v2z"
                  />
                </svg>
                Connect NEAR Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
