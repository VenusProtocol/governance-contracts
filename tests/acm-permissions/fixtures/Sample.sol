contract Sample {
  function a() external {
    _checkAccessAllowed("setTokenConfig(TokenConfig)");
  }

  function b() external {
    acm.checkAccessAllowed(msg.sender, "pause()");
  }

  function c(string memory sig) external {
    _checkAccessAllowed(sig);
  } // dynamic — must be reported
}
