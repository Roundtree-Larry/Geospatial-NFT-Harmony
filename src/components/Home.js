import React, { Component } from 'react';
import Map from './Map';
import Navbar from './Navbar'
import ipfs from "./IPFSUploader";
import Web3 from "web3";
import localisation from "../abis/localisation.json";
import "../App.css"
const BN = require("bn.js");

class Home extends Component {

	async componentWillMount() {
		await this.loadWeb3();
		await this.loadBlockchainData();
	}

	async loadWeb3() {
		if (window.ethereum) {
			window.web3 = new Web3(window.ethereum);
			await window.ethereum.enable();
		} else if (window.web3) {
			window.web3 = new Web3(window.web3.currentProvider);
		} else {
			window.alert(
				"Non-Ethereum browser detected. You should consider trying MetaMask!"
			);
		}
	}
	async loadingMetadata(URL) {
		const resp = await fetch(URL);
		console.log(resp);
		return resp
			.json()
			.then((metadata) => {
				return metadata;
			})
			.catch((error) => {
				console.log(error);
			});
	}
	async loadBlockchainData() {
		navigator.geolocation.getCurrentPosition((position) => {
			const imagePosition = position.coords;
			const latitude = imagePosition.latitude;
			const longitude = imagePosition.longitude;
			this.setState({
				latitude: latitude,
				longitude: longitude,
			});
		});
		let accounts,
			network,
			balance,
			totalSupply,
			contract,
			contract_abi,
			nftbalance,
			web3 = window.web3;
		// Load account
		this.setState({ web3: web3 });
		const networkId = await web3.eth.net.getId();
		console.log(networkId);
		const networkData = "1666700000";
		if (networkData) {
			contract_abi = localisation;
			const contract_address = "0xc1987e8Eac47Ac0E67316646EB27820a48c1eaEA";
			contract = new web3.eth.Contract(contract_abi, contract_address);
			accounts = await web3.eth.getAccounts();
			balance = await web3.eth.getBalance(accounts[0]);
			totalSupply = await contract.methods.totalSupply().call();
			nftbalance = await contract.methods.balanceOf(accounts[0]).call();
			console.log(contract)

			this.setState({
				account: accounts[0],
				balance: balance,
				totalSupply: totalSupply,
				nftbalance: nftbalance,
			});
			this.setState({
				contract: contract,
			});
			console.log(contract)
			for (var i = 1; i <= totalSupply; i++) {
				const URL = await contract.methods.tokenURI(i).call();
				const nftjson = await this.loadingMetadata(URL);
				const Price = await contract.methods.getPrice(i).call();
				console.log("price", Price)
				if (nftjson === undefined) {
					console.log(i + "nftjson is undefined");
				} else {
					const imgURL = "https://ipfs.io/ipfs/" + nftjson.ipfsHash;
					this.setState({
						tokenURL: [...this.state.tokenURL, imgURL],
						nftjson: [...this.state.nftjson, nftjson],
						Price: [...this.state.Price, Price],

					});
				}
			}
		} else {
			window.alert("Smart contract not deployed to detected network.");
		}

		window.ethereum.on("chainChanged", async (chainId) => {
			network = parseInt(chainId, 16);
			if (network !== 1666700000) {
				this.setState({ wrongNetwork: true });
			} else {
				if (this.state.account) {
					balance = await this.state.web3.eth.getBalance(this.state.account);
					totalSupply = await this.state.contract.methods.totalSupply().call();
					this.setState({ balance: balance, totalSupply: totalSupply });
				}
				this.setState({
					network: network,
					loading: false,
					onlyNetwork: false,
					wrongNetwork: false,
				});
			}
		});
	}

	constructor(state) {
		super(state);
		this.state = {
			latitude: null,
			longitude: null,
			account: null,
			limit: "0",
			Price: [],
			Price0: "0",
			balance: null,
			contract: null,
			event: null,
			loading: false,
			network: null,
			web3: null,
			wrongNetwork: false,
			contractAddress1: null,
			tokenURL: [],
			nftjson: [],
			localisation: [],
			name: "",
			file: null,
			ipfsHash: null,
			jsondata: null,
			addressinfo: null,
		}
		this.handleChange = this.handleChange.bind(this);
		this.handleupload = this.handleupload.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleIpfsData = this.handleIpfsData.bind(this);
	}
	handleChange(event) {
		this.setState({
			[event.target.name]: event.target.value,
		});
	}
	handleupload(event) {
		event.preventDefault();
		const file = event.target.files[0];
		const reader = new window.FileReader();
		reader.readAsArrayBuffer(file);
		reader.onloadend = () => {
			this.setState({ buffer: Buffer(reader.result) });
		};
	}
	handleSubmit = async (event) => {
		event.preventDefault();
		await ipfs.files.add(this.state.buffer, (error, result) => {
			console.log(result[0].hash);
			if (error) {
				console.error(error);
				return;
			}
			return this.setState({ ipfsHash: result[0].hash });
		});
	};

	handleIpfsData = async (event) => {
		event.preventDefault();
		const jsondata = {
			ipfsHash: this.state.ipfsHash,
			account: this.state.account,
			city: this.state.addressinfo.city,
			area: this.state.addressinfo.area,
			state: this.state.addressinfo.state,
		};
		var buff = Buffer.from(JSON.stringify(jsondata));
		console.log(buff);
		this.setState({ jsondata: jsondata });

		let metadataCid = await ipfs.files.add(buff);

		console.log(metadataCid[0].hash);

		const gasPrice = new BN(await this.state.web3.eth.getGasPrice()).mul(
			new BN(1)
		);

		const gasLimit = 6721900;
		const url = "https://ipfs.io/ipfs/" + metadataCid[0].hash;
		this.state.contract.methods
			.mintNft(this.state.account, url)
			.send({ from: this.state.account, gasPrice, gasLimit })
			.once("receipt", (receipt) => {
				console.log(receipt);
			});
	};
	localisationdata = (city, area, state) => {
		const addressinfo = { city, area, state }
		this.setState({ addressinfo: addressinfo })
		console.log(addressinfo)
	}
	buyNft = async (itemId) => {
		const gasPrice = new BN(await this.state.web3.eth.getGasPrice()).mul(
			new BN(1)
		);
		console.log(itemId)
		const gasLimit = 6721900;
		this.state.contract.methods
			.buyNft(itemId)
			.send({ from: this.state.account, gasPrice, gasLimit })
			.once("receipt", (receipt) => {
				console.log(receipt);
				window.alert('Done!')
			});
	};
	setPrice = async (itemId, Price) => {
		const Price0 = window.web3.utils.toWei(Price, 'Ether')
		const gasPrice = new BN(await this.state.web3.eth.getGasPrice()).mul(
			new BN(1)
		);

		const gasLimit = 6721900;
		this.state.contract.methods
			.setPrice(itemId, Price0)
			.send({ from: this.state.account, gasPrice, gasLimit })
			.once("receipt", (receipt) => {
				console.log(receipt);
				window.alert('Done!')
			});
	};
	buyNft =(ID) => {
		const Price = this.state.Price[ID]
		const gasLimit = 6721900;
		  this.state.contract.methods
		  .buyNft(ID)
		  .send({value: Price, from: this.state.account, gasLimit })
		  .once("receipt", (receipt) => {
			console.log(receipt);
			window.alert('Done!')
		  });
	  }
	render() {
		return (
			<div>
				<Navbar balance={this.state.balance} account={this.state.account} />


				<div style={{ margin: '0px 100px -80px' }}>
					<Map
						google={this.state.google}
						center={{ lat: 51.5134927, lng: -0.2203475 }}
						height='500px'
						zoom={15}
						localisationdata={this.localisationdata}
					/>

				</div>
				<div >
					<form onSubmit={this.handleSubmit}>
						<div className="text-center" style={{ margin: '90px' }}>
							<div className="form-group row">
								<label className="col-form-label"><b>Your Account :</b> </label>
								<div className=" form-control" readOnly="readOnly">
									{this.state.account}
								</div>
							</div>
							<div className=" ">
								<label htmlFor="file-upload" className="btn custom-file-upload " style={{ width: "160px" }}>
									<i className="fa fa-cloud-upload"></i>  Import Your Image
								</label>
								<input
									name="file"
									type="file"
									id="file-upload"
									aria-describedby="inputGroupFileAddon04"
									aria-label="Upload"
									onChange={this.handleupload}
									className="btn"
								/>
							</div>

							{!this.state.ipfsHash ? (
							<p> Loading ...</p>
							) : (
								<div>
									<img
										src={"https://ipfs.io/ipfs/" + this.state.ipfsHash}
										alt=""
									/>
								</div>
							)}
						</div>
						<div className="text-center">
							<button className="btn btn-outline-secondary " style={{ width: "160px" }}>
								Upload to IPFS
							</button>
						</div>
					</form>
					<br></br>
					<div className="text-center">
						<button
							className="btn btn-outline-secondary"
							type="button"
							id="inputGroupFileAddon04"
							onClick={this.handleIpfsData}
							style={{ width: "160px" }}
						>Create the  NFT</button>
					</div><br></br>
					
					
				</div>


				<hr></hr>
				<div className="container-fluid mt-10 col-m-10">
					<div className="col-sm">
						<main
							role="main"
							className="container-fluid text-monospace text-center"
						>
							<div
								className="container-fluid "
							>
								<br></br><h5 className="card-title"  style={{ fontSize: "26px", textShadow: "0px 0px 18px cyan" }}>List of NFTs</h5>
								<div className="container-fluid mt-10 col-m-10 ">

									<div className="content mr-auto ml-auto cover-container">
										<div className="row text-center flex-row flex-nowrap">
											{this.state.tokenURL.map((tokenURL, key) => {
												return (
													<div key={key} className="col-md-5 mb-3">
														<div className="card-body card hm-gradient mb-3 cover-item container-fluid">
															<img
																src={tokenURL}
																className="rounded card-img-top"
																alt="NFT"
																height="270px"
																width="120px"
															></img>
															<h5 className="card-title">{this.state.nftjson[key].Name}</h5>
															<ul className="list-group list-group-flush list-group-mine my-text">
																<li className="list-group-item"><b>Creator :</b> {this.state.nftjson[key].account}</li>
																<li className="list-group-item"><b>City :</b> {this.state.nftjson[key].city}</li>
																<li className="list-group-item"><b>Area :</b>{this.state.nftjson[key].area} </li>
																<li className="list-group-item"><b>State :</b>{this.state.nftjson[key].state} </li>
																<li className="list-group-item"><b>Price :</b>{this.state.Price[key] / 10 ** 18} <b>ONE</b></li>
																<li className="list-group-item"><b>Item ID :</b>{key + 1} </li>
															</ul>
															<div className="card container-fluid mt-10 col-m-10 background-color: $indigo-900;">

																<form
																	className="form-group row"
																	onSubmit={(event) => {
																		event.preventDefault();
																		this.setPrice(key + 1, this.state.Price0);
																	}}
																>
																	<div className="form-group row">
																		<label htmlFor="name" className="col-sm-2 col-form-label">
																			<h5>Price :</h5>
																		</label>
																		<div className="col-sm-10">
																			<input
																				name="Price0"
																				placeholder="Name"
																				className="form-control"
																				value={this.state.Price0}
																				onChange={this.handleChange}
																			/>
																		</div>
																	</div>

																	<button
																		type="submit"
																		className="btn2 btn-primary btn-block btn-lg"
																	>
																		Set Price
																	</button>
																</form>

																<form
																	className="form-group row"
																	onSubmit={(event) => {
																		event.preventDefault();
																		this.buyNft(key);
																	}}
																>

																	<button
																		type="submit"
																		className="btn btn-primary btn-block btn-lg"
																	>
																		Buy
																	</button>
																</form>
															</div>
														</div>
													</div>
												);
											})}
										</div>
									</div>

								</div>
							</div>

						</main>
					</div>
				</div>
<br></br><br></br>
			</div>

		);
	}
}

export default Home;
