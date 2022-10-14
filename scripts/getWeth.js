// This js file is a module to import (i.e. no "main code" to write)
const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig, AMOUNT } = require("../helper-hardhat-config")

async function getWeth() {
    console.log("-> getWeth")
    const { deployer } = await getNamedAccounts()
    // call the "deposit" function on the weth contract
    // hence, the weth contract's abi & address is needed
    const iWeth = await ethers.getContractAt(
        "IWeth",
        networkConfig[network.config.chainId]["wethTokenAddress"],
        deployer
    )
    const tx = await iWeth.deposit({ value: AMOUNT })
    await tx.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log(`Got ${wethBalance.toString()} WETH`)
}

module.exports = { getWeth }
