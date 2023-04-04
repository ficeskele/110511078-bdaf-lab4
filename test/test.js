const { expect } = require("chai");
const { ethers } = require("hardhat")
const { artifacts } = require('hardhat');

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const SafeFactory = artifacts.require("SafeFactory");
const NewSimplesafe = artifacts.require("NewSimplesafe");

describe("Token contract", function () {

  async function deployTokenFixture() {

    const Token = await ethers.getContractFactory("myToken");
    const [owner, addr_first, addr_Second] = await ethers.getSigners();
    const hardhatToken = await Token.deploy();

    await hardhatToken.deployed();

    return { Token, hardhatToken, owner, addr_first, addr_Second };
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
      expect(await hardhatToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { hardhatToken, owner, addr_first, addr_Second } = await loadFixture(
        deployTokenFixture
      );
      // Transfer 50 tokens from owner to addr_first
      await expect(
        hardhatToken.transfer(addr_first.address, 50)
      ).to.changeTokenBalances(hardhatToken, [owner, addr_first], [-50, 50]);

      // Transfer 50 tokens from addr_first to addr_Second
      // We use .connect(signer) to send a transaction from another account
      await expect(
        hardhatToken.connect(addr_first).transfer(addr_Second.address, 50)
      ).to.changeTokenBalances(hardhatToken, [addr_first, addr_Second], [-50, 50]);
    });

    it("Should emit Transfer events", async function () {
      const { hardhatToken, owner, addr_first, addr_Second } = await loadFixture(
        deployTokenFixture
      );

      // Transfer 50 tokens from owner to addr_first
      await expect(hardhatToken.transfer(addr_first.address, 50))
        .to.emit(hardhatToken, "Transfer")
        .withArgs(owner.address, addr_first.address, 50);

      // Transfer 50 tokens from addr_first to addr_Second
      // We use .connect(signer) to send a transaction from another account
      await expect(hardhatToken.connect(addr_first).transfer(addr_Second.address, 50))
        .to.emit(hardhatToken, "Transfer")
        .withArgs(addr_first.address, addr_Second.address, 50);
    });

    it("fail if sender doesn't have enough tokens", async function () {
      const { hardhatToken, owner, addr_first } = await loadFixture(
        deployTokenFixture
      );
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);
      
      // Try to send 1 token from addr_first (0 tokens) to owner.
      // Owner balance shouldn't have changed.
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });



});

describe ("NewSimplesafe",function(){

  async function deployTokenFixture() {

    const Token = await ethers.getContractFactory("myToken");
    const [owner, addr_first, addr_Second] = await ethers.getSigners();
    
    const hardhatToken = await Token.deploy();
    await hardhatToken.deployed();

    return { Token, hardhatToken, owner, addr_first, addr_Second };
  }

  async function deploySafeFixture() {
    // Get the ContractFactory and Signers here.
    const Simplesafe = await ethers.getContractFactory("NewSimplesafe");
    const [Bank_owner, addr_first, addr_Second] = await ethers.getSigners();

    const hardhatBank = await Simplesafe.deploy(Bank_owner.address);
    await hardhatBank.deployed();

    return { Simplesafe, hardhatBank, Bank_owner, addr_first, addr_Second };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { hardhatBank, Bank_owner } = await loadFixture(deploySafeFixture);
      expect(await hardhatBank.owner()).to.equal(Bank_owner.address);
    });

    it("Should allow valid deposit and withdraw", async function () {

      const { hardhatBank, Bank_owner } = await loadFixture(deploySafeFixture);
      const { hardhatToken, Token_owner, addr_first, addr_Second } = await loadFixture(deployTokenFixture);

      expect(
        (await hardhatBank.balanceOf(addr_first.address)).toString()
      ).to.equal("0");
      
      // Transfer 100 tokens from owner to addr_first
      await hardhatToken.transfer(addr_first.address, 100);
      expect((await hardhatToken.balanceOf(addr_first.address)).toString()).to.equal("100");

      // addr_first should get the approval 100000 allowance of transection
      const erc20WithSigner = hardhatToken.connect(addr_first);
      const approveTx = await erc20WithSigner.approve(hardhatBank.address, "100000");
      await approveTx.wait();

      // addr_first deposit 50 tokens to bank
      const BankWithSigner = hardhatBank.connect(addr_first);
      const depositTx = await BankWithSigner.deposit(hardhatToken.address, 50);
      await depositTx.wait();

      // 50 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("50");

      // 50 tokens in addr_first
      expect(
        (await erc20WithSigner.balanceOf(addr_first.address)).toString()
      ).to.equal("50");     
      
      // addr_first withdraw 50 tokens from bank
      const withdrawTx = await BankWithSigner.withdraw(hardhatToken.address, 50);
      await withdrawTx.wait();

      // 0 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("0");

      // 100 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("100");  
      
    });

    it("Should forbidden invalid deposit and withdraw", async function() {
      const { hardhatBank, Bank_owner} = await loadFixture( deploySafeFixture);

      const { hardhatToken, Token_owner, addr_first, addr_Second } = await loadFixture(deployTokenFixture);

      // Transfer 100 tokens from owner to addr_first
      await hardhatToken.transfer(addr_first.address, 100);
      expect((await hardhatToken.balanceOf(addr_first.address)).toString()).to.equal("100");
      
      // addr_first should get the approval 100000 allowance of transection
      const erc20WithSigner = hardhatToken.connect(addr_first);
      const approveTx = await erc20WithSigner.approve(hardhatBank.address, "100000");
      await approveTx.wait();
      
      // addr_first try to deposit 800 tokens to bank
      const BankWithSigner = hardhatBank.connect(addr_first);
      let err=""
      try{
        await BankWithSigner.deposit(hardhatToken.address, 800);
      }
      catch(e){
        err = e.message;
      }
      expect(err).to.equal("VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds balance'");

      // should be 0 tokens in bank
      expect(
        (await BankWithSigner.balanceOf(hardhatToken.address)).toString()
      ).to.equal("0");

      // should be 100 tokens in addr_first
      expect(
        (await erc20WithSigner.balanceOf(addr_first.address)).toString()
      ).to.equal("100");   
      
      
      // addr_first try to withdraw 50 tokens from bank
      try{
        await BankWithSigner.withdraw(hardhatToken.address, 50);
      }
      catch(e){
        err = e.message;
      }
      expect(err).to.equal("VM Exception while processing transaction: reverted with reason string 'Run out of your money'");

      // 0 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString()).to.equal("0");

      // 100 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString()).to.equal("100");   

    });

  });

  describe("Tax calculations",function(){
    it("Should count correct tax", async function(){
      const { hardhatBank, Bank_owner } = await loadFixture(deploySafeFixture);
      const { hardhatToken, Token_owner, addr_first, addr_Second } = await loadFixture(deployTokenFixture);

      expect( (await hardhatBank.balanceOf(addr_first.address)).toString() ).to.equal("0");
      
      // Transfer 8000 tokens from owner to addr_first
      await hardhatToken.transfer(addr_first.address, 8000);
      expect((await hardhatToken.balanceOf(addr_first.address)).toString()).to.equal("8000");


      // addr_first should get the approval 100000 allowance of transection
      const erc20WithSigner = hardhatToken.connect(addr_first);
      const approveTx = await erc20WithSigner.approve(hardhatBank.address, "100000");
      await approveTx.wait();
      
      // addr_first deposit 50 tokens to bank
      const BankWithSigner = hardhatBank.connect(addr_first);
      const depositTx = await BankWithSigner.deposit(hardhatToken.address, 4000);
      await depositTx.wait();

      // 4000 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("4000");

      // 4000 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("4000");
      
      // addr_first withdraw 4000 tokens from bank
      const withdrawTx = await BankWithSigner.withdraw(hardhatToken.address, 4000);
      await withdrawTx.wait();

      // 0 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("0");

      // 4 tokens fee in bank 
      expect( (await BankWithSigner.Totaltax()).toString() ).to.equal("4");

      // 7996 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("7996");  

    });

    it("Should allow owner to takefee",async function (){
      const { hardhatBank, Bank_owner } = await loadFixture(deploySafeFixture);
      const { hardhatToken, Token_owner, addr_first, addr_Second } = await loadFixture(deployTokenFixture);

      expect(
        (await hardhatBank.balanceOf(addr_first.address)).toString()
      ).to.equal("0");
      
      // Transfer 100 tokens from owner to addr_first
      
      await hardhatToken.transfer(addr_first.address, 8000);
      expect((await hardhatToken.balanceOf(addr_first.address)).toString()).to.equal("8000");


      // addr_first deposit 50 tokens to bank
      const erc20WithSigner = hardhatToken.connect(addr_first);
      const approveTx = await erc20WithSigner.approve(hardhatBank.address, "100000");
      await approveTx.wait();
      
      const BankWithSigner = hardhatBank.connect(addr_first);
      const depositTx = await BankWithSigner.deposit(hardhatToken.address, 4000);
      await depositTx.wait();

      // 50 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("4000");

      // 50 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("4000");
      
      // addr_first withdraw 50 tokens from bank
      const withdrawTx = await BankWithSigner.withdraw(hardhatToken.address, 4000);
      await withdrawTx.wait();

      // 0 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("0");

      // 4 tokens fee in bank 
      expect( (await BankWithSigner.Totaltax()).toString() ).to.equal("4");

      // 7996 tokens in addr_first
      expect(
        (await erc20WithSigner.balanceOf(addr_first.address)).toString()
      ).to.equal("7996");  


      const SafeWithSigner = hardhatBank.connect(Bank_owner);

      const balanceBefore = await erc20WithSigner.balanceOf(Bank_owner.address);
      await SafeWithSigner.takeFee(hardhatToken.address);

      const balanceAfter = await erc20WithSigner.balanceOf(Bank_owner.address);

      const balanceChange = balanceAfter.sub(balanceBefore).toString();
      expect(balanceChange).to.equal("4");


    });

  });

});

describe ("InitSimplesafe",function(){

  async function deployTokenFixture() {

    const Token = await ethers.getContractFactory("myToken");
    const [owner, addr_first, addr_Second] = await ethers.getSigners();
    const hardhatToken = await Token.deploy();

    await hardhatToken.deployed();

    return { Token, hardhatToken, owner, addr_first, addr_Second };
  }

  async function deployInitSafeFixture() {
    // Get the ContractFactory and Signers here.
    const Simplesafe = await ethers.getContractFactory("InitSimplesafe");
    const [Bank_owner, addr_first, addr_Second] = await ethers.getSigners();

    const hardhatBank = await Simplesafe.deploy();

    await hardhatBank.deployed();
    await hardhatBank.initialization(Bank_owner.address);

    return { Simplesafe, hardhatBank, Bank_owner, addr_first, addr_Second };
  }

  describe("Deployment and initialization", function () {
    it("Should set the right owner", async function () {
      const { hardhatBank, Bank_owner } = await loadFixture(deployInitSafeFixture);
      expect(await hardhatBank.owner()).to.equal(Bank_owner.address);
    });

    it("Should allow valid deposit and withdraw", async function () {

      const { hardhatBank, Bank_owner } = await loadFixture(deployInitSafeFixture);
      const { hardhatToken, Token_owner, addr_first, addr_Second } = await loadFixture(deployTokenFixture);

      expect( (await hardhatBank.balanceOf(addr_first.address)).toString() ).to.equal("0");
      
      // Transfer 100 tokens from owner to addr_first
      await hardhatToken.transfer(addr_first.address, 100);
      expect((await hardhatToken.balanceOf(addr_first.address)).toString()).to.equal("100");

      // addr_first should get the approval 100000 allowance of transection
      const erc20WithSigner = hardhatToken.connect(addr_first);
      const approveTx = await erc20WithSigner.approve(hardhatBank.address, "100000");
      await approveTx.wait();

      // addr_first deposit 50 tokens to bank
      const BankWithSigner = hardhatBank.connect(addr_first);
      const depositTx = await BankWithSigner.deposit(hardhatToken.address, 50);
      await depositTx.wait();

      // 50 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("50");

      // 50 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("50");     
      
      // addr_first withdraw 50 tokens from bank
      const withdrawTx = await BankWithSigner.withdraw(hardhatToken.address, 50);
      await withdrawTx.wait();

      // 0 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("0");

      // 100 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("100");  
      
    });

    it("Should forbidden invalid deposit and withdraw", async function() {
      const { hardhatBank, Bank_owner} = await loadFixture(deployInitSafeFixture);
      const { hardhatToken, Token_owner, addr_first, addr_Second } = await loadFixture(deployTokenFixture);

      // Transfer 100 tokens from owner to addr_first
      await hardhatToken.transfer(addr_first.address, 100);
      expect((await hardhatToken.balanceOf(addr_first.address)).toString()).to.equal("100");
      
      // addr_first should get the approval 100000 allowance of transection
      const erc20WithSigner = hardhatToken.connect(addr_first);
      const approveTx = await erc20WithSigner.approve(hardhatBank.address, "100000");
      await approveTx.wait();
      
      // addr_first try to deposit 800 tokens to bank
      const BankWithSigner = hardhatBank.connect(addr_first);
      let err=""
      try{
        await BankWithSigner.deposit(hardhatToken.address, 800);
      }
      catch(e){
        err = e.message;
      }
      expect(err).to.equal("VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds balance'");

      // should be 0 tokens in bank
      expect(
        (await BankWithSigner.balanceOf(hardhatToken.address)).toString()
      ).to.equal("0");

      // should be 100 tokens in addr_first
      expect(
        (await erc20WithSigner.balanceOf(addr_first.address)).toString()
      ).to.equal("100");   
      
      
      // addr_first try to withdraw 50 tokens from bank
      try{
        await BankWithSigner.withdraw(hardhatToken.address, 50);
      }
      catch(e){
        err = e.message;
      }
      expect(err).to.equal("VM Exception while processing transaction: reverted with reason string 'Run out of your money'");


      // 0 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("0");

      // 100 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("100");   

    });
    
    it("Can't be initialize twice", async function(){
      const { hardhatBank, Bank_owner, addr_first, addr_Second } = await loadFixture(deployInitSafeFixture);

      let err=""
      try{
        await hardhatBank.initialization(addr_first.address);
      }
      catch(e){
        err = e.message;
      }
      expect(err).to.equal("VM Exception while processing transaction: reverted with reason string 'Owner can only be changed once.'");

    });
  });

  describe("Tax calculations",function(){
    it("Should count correct tax", async function(){
      const { hardhatBank, Bank_owner } = await loadFixture(deployInitSafeFixture);
      const { hardhatToken, Token_owner, addr_first, addr_Second } = await loadFixture(deployTokenFixture);

      expect( (await hardhatBank.balanceOf(addr_first.address)).toString() ).to.equal("0");
      
      // Transfer 8000 tokens from owner to addr_first
      await hardhatToken.transfer(addr_first.address, 8000);
      expect((await hardhatToken.balanceOf(addr_first.address)).toString()).to.equal("8000");

      // addr_first should get the approval 100000 allowance of transection
      const erc20WithSigner = hardhatToken.connect(addr_first);
      const approveTx = await erc20WithSigner.approve(hardhatBank.address, "100000");
      await approveTx.wait();

      // addr_first deposit 4000 tokens to bank
      const BankWithSigner = hardhatBank.connect(addr_first);
      const depositTx = await BankWithSigner.deposit(hardhatToken.address, 4000);
      await depositTx.wait();

      // 4000 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("4000");

      // 4000 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("4000");
      
      // addr_first withdraw 4000 tokens from bank
      const withdrawTx = await BankWithSigner.withdraw(hardhatToken.address, 4000);
      await withdrawTx.wait();

      // 0 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("0");

      // 4 tokens fee in bank 
      expect( (await BankWithSigner.Totaltax()).toString() ).to.equal("4");

      // 7996 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("7996");  

    });

    it("Should allow owner to takefee",async function (){
      const { hardhatBank, Bank_owner } = await loadFixture(deployInitSafeFixture);
      const { hardhatToken, Token_owner, addr_first, addr_Second } = await loadFixture(deployTokenFixture);

      expect( (await hardhatBank.balanceOf(addr_first.address)).toString() ).to.equal("0");
      
      // Transfer 8000 tokens from owner to addr_first
      await hardhatToken.transfer(addr_first.address, 8000);
      expect((await hardhatToken.balanceOf(addr_first.address)).toString()).to.equal("8000");


      // addr_first should get the approval 100000 allowance of transection
      const erc20WithSigner = hardhatToken.connect(addr_first);
      const approveTx = await erc20WithSigner.approve(hardhatBank.address, "100000");
      await approveTx.wait();

      // addr_first deposit 50 tokens to bank
      const BankWithSigner = hardhatBank.connect(addr_first);
      const depositTx = await BankWithSigner.deposit(hardhatToken.address, 4000);
      await depositTx.wait();

      // 4000 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("4000");

      // 4000 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("4000");
      
      // addr_first withdraw 4000 tokens from bank
      const withdrawTx = await BankWithSigner.withdraw(hardhatToken.address, 4000);
      await withdrawTx.wait();

      // 0 tokens in bank
      expect( (await BankWithSigner.balanceOf(hardhatToken.address)).toString() ).to.equal("0");

      // 4 tokens fee in bank 
      expect( (await BankWithSigner.Totaltax()).toString() ).to.equal("4");

      // 7996 tokens in addr_first
      expect( (await erc20WithSigner.balanceOf(addr_first.address)).toString() ).to.equal("7996");  

      // use owner to call contract
      const SafeWithSigner = hardhatBank.connect(Bank_owner);

      //record the balance before take fee
      const balanceBefore = await erc20WithSigner.balanceOf(Bank_owner.address);

      await SafeWithSigner.takeFee(hardhatToken.address);

      //record the balance after take fee
      const balanceAfter = await erc20WithSigner.balanceOf(Bank_owner.address);

      //the owner get 4 fee
      const balanceChange = balanceAfter.sub(balanceBefore).toString();
      expect(balanceChange).to.equal("4");

    });

  });

});

describe("TransparentProxy", function(){

  
  async function deployTokenFixture() {

    const Token = await ethers.getContractFactory("myToken");
    const [owner, addr_first, addr_Second] = await ethers.getSigners();
    const hardhatToken = await Token.deploy();

    await hardhatToken.deployed();

    return { Token, hardhatToken, owner, addr_first, addr_Second };
  }
  
  async function deployProxy(){
    const Proxy = await ethers.getContractFactory("Proxy");
    const Imp1 = await ethers.getContractFactory("InitSimplesafe");
    const Imp2 = await ethers.getContractFactory("InitSimplesafe");
    const [_owner, addr_first, addr_Second] = await ethers.getSigners();

    const imp1 = await Imp1.deploy();
    const imp2 = await Imp2.deploy();
    const proxy = await Proxy.deploy(imp1.address , _owner.address);
    await proxy.deployed();
    
    return { Imp1, imp1,Imp2, imp2,Proxy, proxy, _owner, addr_first, addr_Second};
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { proxy,  _owner } = await loadFixture(deployProxy);
      expect(await proxy.OWNER()).to.equal(_owner.address);
    });

  });

  describe("Upgradable", function (){

    it("Can change implementation", async function (){

      const { proxy,  _owner, imp1, imp2 } = await loadFixture(deployProxy);
      const proxywithSigner = proxy.connect(_owner);

      expect(await proxywithSigner.getimplementation()).to.equal(imp1.address);

      // change implementation address to imp2
      await proxywithSigner.upgrade(imp2.address);

      expect(await proxywithSigner.getimplementation()).to.equal(imp2.address); 
    });

  });

});

describe("SafeFactory", async ()=>{

  describe("Identification", async ()=>{
  
    let _owner,addr_first,addr_Second;
    let factory, Imp1,Imp2;
    let err=""

    before(async ()=>{
    [_owner,addr_first,addr_Second] = await ethers.getSigners();

    const logicV1 = await ethers.getContractFactory("NewSimplesafe");
    Imp1 = await logicV1.deploy(_owner.address);
    await Imp1.deployed();

    const logicV2 = await ethers.getContractFactory("InitSimplesafe");
    Imp2 = await logicV2.deploy();
    await Imp2.deployed();

    const Factory = await ethers.getContractFactory("SafeFactory");
    const FactoryWithSigner = Factory.connect(_owner);
    factory = await FactoryWithSigner.deploy(Imp2.address);
    await factory.deployed();

    });

    it("Should set right owner in factory", async()=>{
      const Owner = await factory.OWNER();
      expect(Owner).to.equal(_owner.address);
    });

    it("the caller of deploySafe is the owner of the deployed Safe contract", async()=>{
    
    const SafeWithSigner = factory.connect(addr_first);
    await SafeWithSigner.deploySafe();
    const safeaddress = await SafeWithSigner.getdeploySafeAddr(0);

    // get the implementation contruct 
    let safe = await ethers.getContractAt("NewSimplesafe",safeaddress);

    // get the owner
    let safeowner = await safe.SAFEOWNER();

    expect(safeowner).to.equal(addr_first.address);
    });

    it("the caller of deploySafeProxy is the owner of the deployed Proxy.", async()=>{
      const ProxyWithSigner = factory.connect(addr_first);
      await ProxyWithSigner.deploySafeProxy();
      const Proxyaddress = await ProxyWithSigner.getdeployProxyAddr(0);

      // get the proxy contruct
      let Proxy = await ethers.getContractAt("Proxy",Proxyaddress);
      // get the owner
      let Proxyowner = await Proxy.OWNER();
      expect(Proxyowner).to.equal(addr_first.address);
    });

  });

  describe("Upgradable", async ()=>{

    let _owner,addr_first,addr_Second;
    let factory, Imp1,Imp2;
    let err=""

    before(async ()=>{
    [_owner,addr_first,addr_Second] = await ethers.getSigners();

    const logicV1 = await ethers.getContractFactory("NewSimplesafe");
    Imp1 = await logicV1.deploy(_owner.address);
    await Imp1.deployed();

    const logicV2 = await ethers.getContractFactory("InitSimplesafe");
    Imp2 = await logicV2.deploy();
    await Imp2.deployed();

    const Factory = await ethers.getContractFactory("SafeFactory");
    const FactoryWithSigner = Factory.connect(_owner);
    factory = await FactoryWithSigner.deploy(Imp1.address);
    await factory.deployed();

    });

    it("Only owner can modify upgrade",async ()=>{
      const UpgradeWithSigner = factory.connect(addr_first);
    
      try{
        await UpgradeWithSigner.updateImplementation(Imp1.address);
      }
      catch(e){
        err = e.message;
      }
      expect(err).to.equal("VM Exception while processing transaction: reverted with reason string 'Only the owner can call this function.'");
    });

    it("Can change implement", async()=>{
      const FactoryWithOwner = factory.connect(_owner);
      const FactoryWithSigner = factory.connect(addr_first);

      await FactoryWithSigner.deploySafeProxy();
      //get the generated proxy address
      const ProxyaddressV1 = await FactoryWithSigner.getdeployProxyAddr(0);

      //get the generated proxy
      let Proxy = await ethers.getContractAt("Proxy",ProxyaddressV1);
      const ProxypointedV1 = await Proxy.getimplementation();

      // change implementation adddress to Imp2
      await FactoryWithOwner.updateImplementation(Imp2.address);

      await FactoryWithSigner.deploySafeProxy();
      //get the generated proxy address
      const ProxyaddressV2 = await FactoryWithSigner.getdeployProxyAddr(1);

      //get the generated proxy
      let newProxy = await ethers.getContractAt("Proxy",ProxyaddressV2);
      const ProxypointedV2 = await newProxy.getimplementation();

      expect(ProxypointedV1).not.to.equal(ProxypointedV2);

    });


  });

});
