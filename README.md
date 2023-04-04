# 110511078-bdaf-lab4

## Useful Resource

- [https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/basic-proxies](https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/basic-proxies)
- [https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/initializing-upgradeable-contracts](https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/initializing-upgradeable-contracts)

## Modify the Safe contract

- The contract should have an owner.
- The contract now takes a 0.1% tax. That means, if an address deposited 1000 ATokens, the address can only withdraw 999 ATokens. The remaining 1 AToken will be kept in the contract and ready to be withdrawn by the owner.
- Implement a `function takeFee(address token)` and only the owner of the contract can call it. The owner should get the token fees that are accumulated in the contract.

## Write 3 contracts:

- A **SafeUpgradeable** implementation contract, but **in Proxy pattern**.
    - Constructor needs to become a separate callable function.
- A **proxy contract** ([ref](https://fravoll.github.io/solidity-patterns/proxy_delegate.html)1, [ref](https://solidity-by-example.org/app/upgradeable-proxy/)2) with a few important specifications:
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

## Write tests

- Make sure the tax calculations are done correctly in the modified Safe contract.
- the tests should indicate that the system works as intended. E.g.
    - the caller of deploySafe is the owner of the deployed Safe contract
    - the caller of deploySafeProxy is the owner of the deployed Proxy.
    - After `updateImplementation` is being called, a newly deployed proxy with `deploySafeProxy()` points to the new implementation instead of the old one.


## Coverage
![image](https://user-images.githubusercontent.com/124324882/229807203-2b0af9e2-bb9e-4ee4-91ce-5f3786863384.png)


## Gas Report
![image](https://user-images.githubusercontent.com/124324882/229808269-62c3ced2-aaf0-4d43-837d-44611b70d88a.png)


## Test Report 
![image](https://user-images.githubusercontent.com/124324882/229809299-9d7c616e-fe91-4321-8275-52a67ba730b1.png)
