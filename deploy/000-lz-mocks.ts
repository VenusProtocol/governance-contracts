import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { onlyHardhat } from "../helpers/deploy/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("LZEndpointMock", {
    from: deployer,
    args: [10102],
    log: true,
    autoMine: true,
  });

  await deploy("EndpointV2Mock", {
    from: deployer,
    contract: {
      abi: require("../node_modules/@layerzerolabs/test-devtools-evm-hardhat/artifacts/contracts/mocks/EndpointV2Mock.sol/EndpointV2Mock.json")
        .abi,
      bytecode:
        require("../node_modules/@layerzerolabs/test-devtools-evm-hardhat/artifacts/contracts/mocks/EndpointV2Mock.sol/EndpointV2Mock.json")
          .bytecode,
    },
    args: [40102],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });
};

func.tags = ["mocks"];

func.skip = onlyHardhat();

export default func;
