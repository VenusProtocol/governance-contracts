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

    function d() external {
        ensureAllowed("_setCollateralFactor(address,uint256)");
    }

    // The gate's own declaration (as in FacetBase.sol). Its revert string must never be
    // scraped as a signature.
    function ensureAllowed(string memory functionSig) internal view {
        require(acm.isAllowedToCall(msg.sender, functionSig), "access denied");
    }
}
