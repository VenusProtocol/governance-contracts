import mainnetAddress from "@venusprotocol/venus-protocol/networks/mainnet.json";
import testnetAddress from "@venusprotocol/venus-protocol/networks/testnet.json";

// @todo update once network deployment summary JSON is added
import governorBravoDelegatorMainnet from "../../deployments/bscmainnet/GovernorBravoDelegator.json";
import governorBravoDelegatorTestnet from "../../deployments/bsctestnet/GovernorBravoDelegator.json";

export enum SUPPORTED_NETWORKS {
  BSCTESTNET = "bsctestnet",
  BSCMAINNET = "bscmainnet",
  SEPOLIA = "sepolia",
  ETHERUEM = "ethereum",
  HARDHAT = "hardhat",
}

export const LZ_ENDPOINTS = {
  ethereum: "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
  bsc: "0x3c2269811836af69497E5F486A85D7316753cf62",

  goerli: "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23",
  sepolia: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1",
  bsctestnet: "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1",
  hardhat: "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1",
};

export const AddressConfig = {
  bsctestnet: {
    NormalTimelock: testnetAddress.Contracts.Timelock,
    FastTrackTimelock: "0x3CFf21b7AF8390fE68799D58727d3b4C25a83cb6",
    CriticalTimelock: "0x23B893a7C45a5Eb8c8C062b9F32d0D2e43eD286D",
    AccessControlManager: "0x45f8a08F534f34A97187626E05d4b6648Eeaa9AA",
    GovernorDelegator: governorBravoDelegatorTestnet.address,
  },
  bscmainnet: {
    NormalTimelock: mainnetAddress.Contracts.Timelock,
    FastTrackTimelock: "0x555ba73dB1b006F3f2C7dB7126d6e4343aDBce02",
    CriticalTimelock: "0x213c446ec11e45b15a6E29C1C1b402B8897f606d",
    AccessControlManager: "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555",
    GovernorDelegator: governorBravoDelegatorMainnet.address,
  },
  sepolia: {
    AccessControlManager: "0xbf705C00578d43B6147ab4eaE04DBBEd1ccCdc96",
    NormalTimelock: "",
    FastTrackTimelock: "",
    CriticalTimelock: "",
    GovernorDelegator: "",
  },
  ethereum: {
    // TODO
    AccessControlManager: "",
    NormalTimelock: "",
    FastTrackTimelock: "",
    CriticalTimelock: "",
    GovernorDelegator: "",
  },
  hardhat: {
    AccessControlManager: "0x45f8a08F534f34A97187626E05d4b6648Eeaa9AA",
    NormalTimelock: testnetAddress.Contracts.Timelock,
    FastTrackTimelock: testnetAddress.Contracts.Timelock,
    CriticalTimelock: testnetAddress.Contracts.Timelock,
    GovernorDelegator: governorBravoDelegatorTestnet.address,
  },
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default () => {};
