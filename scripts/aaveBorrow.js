const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig, AMOUNT } = require("../helper-hardhat-config")
const { getWeth } = require("./getWeth")

const chainId = network.config.chainId

async function main() {
    console.log("MAIN START")
    //---------------------------------------------------
    // Initialization
    //---------------------------------------------------
    // Aave treats everything as an ERC-20 token
    // The reason is that it is much easier that not doing it

    const wethTokenAddress = networkConfig[chainId]["wethTokenAddress"]
    const daiTokenAddress = networkConfig[chainId]["daiTokenAddress"]

    await getWeth()
    const { deployer } = await getNamedAccounts()
    const lendingPool = await getLendingPool(deployer)
    console.log(`Lending Pool address: ${lendingPool.address}`)

    //---------------------------------------------------
    // Depositing
    //---------------------------------------------------

    // ERC-20 contract approval
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("Depositing...")
    // Deposit
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("Deposited")

    //---------------------------------------------------
    // Borrowing
    //---------------------------------------------------

    // How much we have borrowed
    // How much we have in collateral
    // How much we can borrow
    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
        lendingPool,
        deployer
    )

    // DAI/ETH conversion rate
    // Step 1 - Conversion with 0 decimal places
    const daiPrice = await getDaiPrice()
    const amountDaiToBorrow =
        // It is still possible to do maths with strings in JS
        availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    console.log(`You can borrow ${amountDaiToBorrow} DAI`)
    // Step 2 - Conversion with 18 decimal places
    // We need that conversion because the DAI token has 18 decimal places
    // like Ethereum
    const amountDaiToBorrowWei = ethers.utils.parseEther(
        amountDaiToBorrow.toString()
    )

    // Make the borrowing
    await borrowDai(
        daiTokenAddress,
        lendingPool,
        amountDaiToBorrowWei,
        deployer
    )

    // Verify the amount borrowed
    await getBorrowUserData(lendingPool, deployer)
    await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, deployer)
    await getBorrowUserData(lendingPool, deployer)
    console.log("MAIN END")
}

async function repay(amount, daiAddress, lendingPool, account) {
    console.log("-> repay")
    await approveErc20(daiAddress, lendingPool.address, amount, account)
    const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
    await repayTx.wait(1)
    console.log("Repayed!")
}

async function borrowDai(
    daiAddress,
    lendingPool,
    amountDaiToBorrowWei,
    account
) {
    console.log("-> borrowDai")
    const borrowTx = await lendingPool.borrow(
        daiAddress,
        amountDaiToBorrowWei,
        1,
        0,
        account
    )
    await borrowTx.wait(1)
    console.log(`You have borrowed ${amountDaiToBorrowWei} DAI!`)
}

async function getDaiPrice() {
    console.log("-> getDaiPrice")
    // No need to define a signer account since
    // no transaction will be sent here

    const daiEthPriceFeedAddress =
        networkConfig[chainId]["daiEthPriceFeedAddress"]

    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        daiEthPriceFeedAddress
    )
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`The DAI/ETH price is ${price.toString()}`)
    return price
}

async function getBorrowUserData(lendingPool, account) {
    console.log("-> getBorrowUserData")
    // The function called returns many arguments but we only need those 3
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account)
    console.log(`- You have ${totalCollateralETH} worth of ETH deposited.`)
    console.log(`- You have ${totalDebtETH} worth of ETH borrowed.`)
    console.log(`- You can borrow ${availableBorrowsETH} worth of ETH.`)
    return { availableBorrowsETH, totalDebtETH }
}

async function getLendingPool(account) {
    console.log("-> getLendingPool")
    const lendingPoolAddressesproviderAddress =
        networkConfig[chainId]["lendingPoolAddressesproviderAddress"]

    const lendingPoolAddressesprovider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        lendingPoolAddressesproviderAddress,
        account
    )
    const lendingPoolAddress =
        // Here, getLendingPool() comes from the contract's ABI
        await lendingPoolAddressesprovider.getLendingPool()
    const lendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account
    )
    return lendingPool
}

async function approveErc20(
    erc20Address,
    spenderAddress,
    amountToSpend,
    account
) {
    console.log("-> approveErc20")
    const erc20Token = await ethers.getContractAt(
        "IERC20",
        erc20Address,
        account
    )
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    tx.wait(1)
    console.log("Approved!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
