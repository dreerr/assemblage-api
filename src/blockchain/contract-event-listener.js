const Web3 = require('web3');
require('dotenv').config()

// ENTER A VALID RPC URL!
const web3 = new Web3(process.env.RPC_RINKEBY_URL);

//ENTER SMART CONTRACT ADDRESS BELOW. see abi.js if you want to modify the abi
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = require('../assemblage-dapp/artifacts/contracts/Assemblage.sol/Assemblage.json');
//console.log(CONTRACT_ABI)
const contract = new web3.eth.Contract(CONTRACT_ABI.abi, CONTRACT_ADDRESS);



async function getEvents() {
  let latest_block = await web3.eth.getBlockNumber();
  let historical_block = 0; // you can also change the value to 'latest' if you have a upgraded rpc
  console.log("latest: ", latest_block, "historical block: ", historical_block);
  const events = await contract.getPastEvents(
    'Mint', // change if your looking for a different event
    { fromBlock: `${historical_block}`, toBlock: 'latest' }
  );
  await getTransferDetails(events);
}

async function getTransferDetails(data_events) {
  for (i = 0; i < data_events.length; i++) {
    let from = data_events[i]['returnValues']['from'];
    let to = data_events[i]['returnValues']['to'];
    let amount = data_events[i]['returnValues']['amount'];
    console.log(data_events[i]['returnValues']);
    // let converted_amount = web3.utils.fromWei(amount);
    // if (converted_amount > 32) { //checking for transcations with above 32 eth as an example
    //   console.log("From:", from, "- To:", to, "- Value:", converted_amount);
    // }
  }
}

getEvents(CONTRACT_ABI, CONTRACT_ADDRESS);