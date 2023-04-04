# Proxies, Proxies everywhere

![image](https://user-images.githubusercontent.com/124324882/229817162-6671c38e-5bb7-4af3-8485-101090e78c18.png)


## Contracts intro:
- A **Mytoken** ： a self-made simple token. 
- A **NewSimplesafe** implementation contract; basically, this contract is a modified version of Simplesafe in Lab3.
    - it can take 0.1 percent tax from every withdrawing, and only owner can take fee accumulated in contract.
- A **InitSimplesafe** implementation contract, but **in Proxy pattern**.
    - Constructor needs to become a separate callable function ; that is , an **initialization** function need to be constructed.
     
 - **Some reasons**： 
 
    ```bash
    1. Because when we use proxy to point to the implementation contract, the original constructer function won't work out and we can't get the initial value.
    2. When we use factory to deploy, it's convenient to initialize the value of new proxy.
     ```
- A **proxy contract** with a few important specifications:
    - Use unstructured storage to store “owner” and “implementation”. As in [here](https://blog.openzeppelin.com/upgradeability-using-unstructured-storage/)
    - The “owner” should be able to update the implementation of the proxy.
- A **SafeFactory contract**: a factory that deploys proxies that point to the **SafeUpgradeable** implementation.
    - Stores the address of the Safe Implementation in a storage.
    - `function updateImplementation(address newImp) external`
        - The Safe implementation address can only be updated by the owner of the Factory contract.
    - `function deploySafeProxy() external`
        - Deploys a proxy, points the proxy to the current Safe Implementation. Initializes the proxy so that the message sender is the owner of the new Safe.
    - `function deploySafe() external`
        - Deploys the original Safe contract. Note that you might need to modify the Safe contract so that the original caller of the `deploySafe` contract will be the owner of the deployed "Safe” contract.


## Useful Resource
- [https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/basic-proxies](https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/basic-proxies)
- [https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/initializing-upgradeable-contracts](https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/initializing-upgradeable-contracts)
- Proxy ([ref](https://fravoll.github.io/solidity-patterns/proxy_delegate.html)1, [ref](https://solidity-by-example.org/app/upgradeable-proxy/)2)


## Coverage Result
![image](https://user-images.githubusercontent.com/124324882/229807203-2b0af9e2-bb9e-4ee4-91ce-5f3786863384.png)


## Gas Report
![image](https://user-images.githubusercontent.com/124324882/229808269-62c3ced2-aaf0-4d43-837d-44611b70d88a.png)


## Test Report 
![image](https://user-images.githubusercontent.com/124324882/229809299-9d7c616e-fe91-4321-8275-52a67ba730b1.png)
