## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## 🚀 Deployed Contracts (Avalanche Fuji Testnet)

✅ **Live Contracts**

```
TicketNFT Implementation: 0x520B9d1C86d2dD58b5929AC159aF06508160aDec
EventManager:             0x5876444b87757199Cd08f44193Bf7741FDA01EAD
Marketplace:              0x072c6707E3fd1Bcc2f2177349402Ad5fdeB82F51
EventFactory:             0x4FC9267E6Ef419be7700e3936Fc51D2835e257D0
QRVerificationSystem:     0x89dABaf2dC7aF4C06AF993E083115952cCd67E86
POAP:                     0x323A6ddC3390192013bfe09Ea7d677c7469078c4
EventBadge:               0xCB3c41286536004dee308520B4D1F64de20157DB
MetadataRegistry:         0xCD2bA7f0941A0A79aC791Fb5D72E493557c37241
```

**View on Snowtrace:** https://testnet.snowtrace.io/

**Supported Tokens:**
- AVAX (native token) - Default
- Any ERC20 token (configurable by organizers)

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
