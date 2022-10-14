const networkConfig = {
    // Goerli (chainID = 5)
    5: {
        name: "goerli",
        ethUsdPriceFeedAddress: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
    31337: {
        name: "hardhat",
        // The addresses below are Ethereum addresses because a mainnet fork is used
        lendingPoolAddressesproviderAddress:
            "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        ethUsdPriceFeedAddress: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
        daiEthPriceFeedAddress: "0x773616e4d11a78f511299002da57a0a94577f1f4",
        wethTokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        daiTokenAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
    },
}

const developmentChains = ["hardhat", "localhost"]
const AMOUNT = ethers.utils.parseEther("0.02")

module.exports = {
    networkConfig,
    developmentChains,
    AMOUNT,
}
